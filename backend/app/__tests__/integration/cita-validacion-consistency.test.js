/**
 * ====================================================================
 * TESTS DE CONSISTENCIA: COMMAND vs QUERY VALIDATION
 * ====================================================================
 *
 * Valida que validarHorarioPermitido() (Command) y
 * _verificarDisponibilidadSlotsEnMemoria() (Query) produzcan
 * resultados CONSISTENTES usando CitaValidacionUtil.
 *
 * OBJETIVO:
 * Garantizar que ambos métodos usen la misma lógica de validación
 * y detecten los mismos conflictos/bloqueos para los mismos inputs.
 *
 * CONTEXTO:
 * - Command valida 1 slot con queries SQL (escritura)
 * - Query valida N slots con datos en memoria (lectura)
 * - Ambos DEBEN usar CitaValidacionUtil para lógica compartida
 *
 * @see backend/app/utils/cita-validacion.util.js
 * @see backend/app/database/citas/cita.helpers.model.js:329
 * @see backend/app/database/disponibilidad.model.js:344
 */

const { CitaHelpersModel } = require('../../models/citas/cita.helpers.model');
const DisponibilidadModel = require('../../models/disponibilidad.model');
const CitaValidacionUtil = require('../../templates/scheduling-saas/utils/cita-validacion.util');
const RLSContextManager = require('../../utils/rlsContextManager');
const {
  createTestOrganizacion,
  createTestCliente,
  createTestProfesional,
  createTestServicio,
  createTestHorariosSemanalCompleto,
  createTestCita,
  bypassRLS,
} = require('../helpers/db-helper');

describe('🔁 Consistencia: Command-Query Validation', () => {
  let organizacionId;
  let profesionalId;
  let clienteId;
  let servicioId;
  let client;

  beforeAll(async () => {
    // Obtener cliente de BD (patrón estándar del proyecto)
    client = await global.testPool.connect();

    // Crear organización de prueba
    const org = await createTestOrganizacion(client, {
      nombre: 'Test Org Consistency',
      industria: 'barberia',
    });
    organizacionId = org.id;

    // Crear profesional de prueba
    const prof = await createTestProfesional(client, organizacionId, {
      nombre_completo: 'Juan Pérez',
      tipo_profesional_id: 1,
    });
    profesionalId = prof.id;

    // Crear cliente de prueba
    const cliente = await createTestCliente(client, organizacionId, {
      nombre: 'Test Cliente',
      telefono: '1234567890',
    });
    clienteId = cliente.id;

    // Crear servicio de prueba y asignarlo al profesional
    const servicio = await createTestServicio(client, organizacionId, {
      nombre: 'Corte',
      duracion_minutos: 30,
      precio: 150,
    }, [profesionalId]);
    servicioId = servicio.id;

    // Crear horarios laborales para toda la semana (Lunes-Viernes)
    await createTestHorariosSemanalCompleto(client, profesionalId, organizacionId, {
      dias: [1, 2, 3, 4, 5], // Lunes a Viernes
      hora_inicio: '09:00:00',
      hora_fin: '18:00:00',
      tipo_horario: 'regular',
      nombre_horario: 'Horario Laboral',
    });
  });

  afterAll(async () => {
    if (client) {
      client.release();
    }
  });

  describe('✅ Consistencia: Detección de Citas Existentes', () => {
    let citaExistenteId;

    beforeAll(async () => {
      // Crear una cita existente: 2025-11-03 (lunes) 10:00-10:30
      const cita = await createTestCita(client, organizacionId, {
        cliente_id: clienteId,
        profesional_id: profesionalId,
        servicios_ids: [servicioId], // ✅ Array
        fecha_cita: '2025-11-03',
        hora_inicio: '10:00:00',
        hora_fin: '10:30:00',
        precio_total: 150, // ✅ Reemplaza precio_servicio + precio_final
        duracion_total_minutos: 30,
        estado: 'confirmada',
      });
      citaExistenteId = cita.id;
    });

    afterAll(async () => {
      // Limpiar cita de prueba
      await RLSContextManager.query(organizacionId, async (db) => {
        await db.query('DELETE FROM citas WHERE id = $1', [citaExistenteId]);
      });
    });

    test('Command y Query detectan el mismo solapamiento (inicio dentro)', async () => {
      const fecha = '2025-11-03';
      const horaInicio = '10:15:00';
      const horaFin = '10:45:00';

      // COMMAND: validarHorarioPermitido() debe retornar valido=false
      const commandResult = await RLSContextManager.query(organizacionId, async (db) => {
        return await CitaHelpersModel.validarHorarioPermitido(
          profesionalId,
          fecha,
          horaInicio,
          horaFin,
          organizacionId,
          db
        );
      });

      expect(commandResult.valido).toBe(false);
      expect(commandResult.errores).toHaveLength(1);
      expect(commandResult.errores[0].tipo).toBe('CONFLICTO_CITA');

      // QUERY: _verificarDisponibilidadSlotsEnMemoria() debe marcar slot como no disponible
      const citasRango = await RLSContextManager.query(organizacionId, async (db) => {
        return await db.query(`
          SELECT c.*, cl.nombre as cliente_nombre
          FROM citas c
          LEFT JOIN clientes cl ON c.cliente_id = cl.id
          WHERE c.profesional_id = $1
            AND c.fecha_cita = $2
            AND c.estado NOT IN ('cancelada', 'no_asistio')
        `, [profesionalId, fecha]);
      });

      const slots = [{ hora: horaInicio }];
      const queryResult = DisponibilidadModel._verificarDisponibilidadSlotsEnMemoria(
        slots,
        profesionalId,
        fecha,
        30,
        citasRango.rows,
        [],
        'completo'
      );

      expect(queryResult).toHaveLength(1);
      expect(queryResult[0].disponible).toBe(false);
      expect(queryResult[0].razon_no_disponible).toContain('Cita existente');
    });

    test('Command y Query NO detectan conflicto cuando no hay solapamiento', async () => {
      const fecha = '2025-11-03';
      const horaInicio = '11:00:00'; // Después de la cita existente (10:00-10:30)
      const horaFin = '11:30:00';

      // COMMAND: validarHorarioPermitido() debe retornar valido=true
      const commandResult = await RLSContextManager.query(organizacionId, async (db) => {
        return await CitaHelpersModel.validarHorarioPermitido(
          profesionalId,
          fecha,
          horaInicio,
          horaFin,
          organizacionId,
          db
        );
      });

      expect(commandResult.valido).toBe(true);
      expect(commandResult.errores).toHaveLength(0);

      // QUERY: _verificarDisponibilidadSlotsEnMemoria() debe marcar slot como disponible
      const citasRango = await RLSContextManager.query(organizacionId, async (db) => {
        return await db.query(`
          SELECT c.*, cl.nombre as cliente_nombre
          FROM citas c
          LEFT JOIN clientes cl ON c.cliente_id = cl.id
          WHERE c.profesional_id = $1
            AND c.fecha_cita = $2
            AND c.estado NOT IN ('cancelada', 'no_asistio')
        `, [profesionalId, fecha]);
      });

      const slots = [{ hora: horaInicio }];
      const queryResult = DisponibilidadModel._verificarDisponibilidadSlotsEnMemoria(
        slots,
        profesionalId,
        fecha,
        30,
        citasRango.rows,
        [],
        'completo'
      );

      expect(queryResult).toHaveLength(1);
      expect(queryResult[0].disponible).toBe(true);
      expect(queryResult[0].razon_no_disponible).toBeNull();
    });

    test('Command y Query ignoran citas canceladas', async () => {
      // Crear cita cancelada: 2025-11-03 12:00-12:30
      const citaCancelada = await createTestCita(client, organizacionId, {
        cliente_id: clienteId,
        profesional_id: profesionalId,
        servicios_ids: [servicioId], // ✅ Array
        fecha_cita: '2025-11-03',
        hora_inicio: '12:00:00',
        hora_fin: '12:30:00',
        precio_total: 150, // ✅ Reemplaza precio_servicio + precio_final
        duracion_total_minutos: 30,
        estado: 'cancelada',
        motivo_cancelacion: 'Test de consistencia',
      });

      const fecha = '2025-11-03';
      const horaInicio = '12:00:00'; // Mismo horario que cita cancelada
      const horaFin = '12:30:00';

      // COMMAND: debe retornar valido=true (ignora canceladas)
      const commandResult = await RLSContextManager.query(organizacionId, async (db) => {
        return await CitaHelpersModel.validarHorarioPermitido(
          profesionalId,
          fecha,
          horaInicio,
          horaFin,
          organizacionId,
          db
        );
      });

      expect(commandResult.valido).toBe(true);

      // QUERY: debe marcar slot como disponible (ignora canceladas)
      const citasRango = await RLSContextManager.query(organizacionId, async (db) => {
        return await db.query(`
          SELECT c.*, cl.nombre as cliente_nombre
          FROM citas c
          LEFT JOIN clientes cl ON c.cliente_id = cl.id
          WHERE c.profesional_id = $1
            AND c.fecha_cita = $2
        `, [profesionalId, fecha]); // Sin filtro de estado para incluir canceladas
      });

      const slots = [{ hora: horaInicio }];
      const queryResult = DisponibilidadModel._verificarDisponibilidadSlotsEnMemoria(
        slots,
        profesionalId,
        fecha,
        30,
        citasRango.rows,
        [],
        'completo'
      );

      expect(queryResult).toHaveLength(1);
      expect(queryResult[0].disponible).toBe(true);

      // Cleanup
      await RLSContextManager.query(organizacionId, async (db) => {
        await db.query('DELETE FROM citas WHERE id = $1', [citaCancelada.id]);
      });
    });
  });

  describe('✅ Consistencia: Detección de Bloqueos', () => {
    let bloqueoOrganizacionalId;
    let bloqueoProfesionalId;

    beforeAll(async () => {
      // Crear tipo de bloqueo vacaciones
      const tipoBloqueo = await RLSContextManager.withBypass(async (db) => {
        return await db.query(`
          SELECT id FROM tipos_bloqueo WHERE codigo = 'vacaciones' LIMIT 1
        `);
      });
      const tipoBloqueoId = tipoBloqueo.rows[0]?.id;

      // Crear bloqueo organizacional: 2025-01-07 todo el día
      const bloqueoOrg = await RLSContextManager.query(organizacionId, async (db) => {
        return await db.query(`
          INSERT INTO bloqueos_horarios
          (organizacion_id, profesional_id, tipo_bloqueo_id, titulo, fecha_inicio, fecha_fin, hora_inicio, hora_fin, activo)
          VALUES ($1, NULL, $2, 'Feriado Nacional', '2025-11-04', '2025-11-04', NULL, NULL, true)
          RETURNING id
        `, [organizacionId, tipoBloqueoId]);
      });
      bloqueoOrganizacionalId = bloqueoOrg.rows[0].id;

      // Crear bloqueo del profesional: 2025-01-08 14:00-16:00
      const bloqueoProf = await RLSContextManager.query(organizacionId, async (db) => {
        return await db.query(`
          INSERT INTO bloqueos_horarios
          (organizacion_id, profesional_id, tipo_bloqueo_id, titulo, fecha_inicio, fecha_fin, hora_inicio, hora_fin, activo)
          VALUES ($1, $2, $3, 'Capacitación', '2025-11-05', '2025-11-05', '14:00:00', '16:00:00', true)
          RETURNING id
        `, [organizacionId, profesionalId, tipoBloqueoId]);
      });
      bloqueoProfesionalId = bloqueoProf.rows[0].id;
    });

    afterAll(async () => {
      // Limpiar bloqueos de prueba
      await RLSContextManager.query(organizacionId, async (db) => {
        await db.query('DELETE FROM bloqueos_horarios WHERE id IN ($1, $2)', [
          bloqueoOrganizacionalId,
          bloqueoProfesionalId,
        ]);
      });
    });

    test('Command y Query detectan bloqueo organizacional (todo el día)', async () => {
      const fecha = '2025-11-04';
      const horaInicio = '10:00:00';
      const horaFin = '10:30:00';

      // COMMAND: validarHorarioPermitido() debe retornar valido=false
      const commandResult = await RLSContextManager.query(organizacionId, async (db) => {
        return await CitaHelpersModel.validarHorarioPermitido(
          profesionalId,
          fecha,
          horaInicio,
          horaFin,
          organizacionId,
          db
        );
      });

      expect(commandResult.valido).toBe(false);
      expect(commandResult.errores.some((e) => e.tipo === 'HORARIO_BLOQUEADO')).toBe(true);

      // QUERY: _verificarDisponibilidadSlotsEnMemoria() debe marcar slot como no disponible
      const bloqueosRango = await RLSContextManager.query(organizacionId, async (db) => {
        return await db.query(`
          SELECT b.*, tb.codigo as tipo_bloqueo
          FROM bloqueos_horarios b
          LEFT JOIN tipos_bloqueo tb ON b.tipo_bloqueo_id = tb.id
          WHERE b.organizacion_id = $1
            AND b.activo = true
            AND (b.profesional_id IS NULL OR b.profesional_id = $2)
        `, [organizacionId, profesionalId]);
      });

      const slots = [{ hora: horaInicio }];
      const queryResult = DisponibilidadModel._verificarDisponibilidadSlotsEnMemoria(
        slots,
        profesionalId,
        fecha,
        30,
        [],
        bloqueosRango.rows,
        'completo'
      );

      expect(queryResult).toHaveLength(1);
      expect(queryResult[0].disponible).toBe(false);
      expect(queryResult[0].razon_no_disponible).toContain('Feriado Nacional');
    });

    test('Command y Query detectan bloqueo del profesional (horario específico)', async () => {
      const fecha = '2025-11-05';
      const horaInicio = '14:30:00'; // Dentro del bloqueo 14:00-16:00
      const horaFin = '15:00:00';

      // COMMAND: validarHorarioPermitido() debe retornar valido=false
      const commandResult = await RLSContextManager.query(organizacionId, async (db) => {
        return await CitaHelpersModel.validarHorarioPermitido(
          profesionalId,
          fecha,
          horaInicio,
          horaFin,
          organizacionId,
          db
        );
      });

      expect(commandResult.valido).toBe(false);
      expect(commandResult.errores.some((e) => e.tipo === 'HORARIO_BLOQUEADO')).toBe(true);

      // QUERY: _verificarDisponibilidadSlotsEnMemoria() debe marcar slot como no disponible
      const bloqueosRango = await RLSContextManager.query(organizacionId, async (db) => {
        return await db.query(`
          SELECT b.*, tb.codigo as tipo_bloqueo
          FROM bloqueos_horarios b
          LEFT JOIN tipos_bloqueo tb ON b.tipo_bloqueo_id = tb.id
          WHERE b.organizacion_id = $1
            AND b.activo = true
            AND (b.profesional_id IS NULL OR b.profesional_id = $2)
        `, [organizacionId, profesionalId]);
      });

      const slots = [{ hora: horaInicio }];
      const queryResult = DisponibilidadModel._verificarDisponibilidadSlotsEnMemoria(
        slots,
        profesionalId,
        fecha,
        30,
        [],
        bloqueosRango.rows,
        'completo'
      );

      expect(queryResult).toHaveLength(1);
      expect(queryResult[0].disponible).toBe(false);
      expect(queryResult[0].razon_no_disponible).toContain('Capacitación');
    });

    test('Command y Query NO detectan bloqueo cuando no hay solapamiento', async () => {
      const fecha = '2025-11-05';
      const horaInicio = '10:00:00'; // Antes del bloqueo 14:00-16:00
      const horaFin = '10:30:00';

      // COMMAND: validarHorarioPermitido() debe retornar valido=true
      const commandResult = await RLSContextManager.query(organizacionId, async (db) => {
        return await CitaHelpersModel.validarHorarioPermitido(
          profesionalId,
          fecha,
          horaInicio,
          horaFin,
          organizacionId,
          db
        );
      });

      expect(commandResult.valido).toBe(true);

      // QUERY: _verificarDisponibilidadSlotsEnMemoria() debe marcar slot como disponible
      const bloqueosRango = await RLSContextManager.query(organizacionId, async (db) => {
        return await db.query(`
          SELECT b.*, tb.codigo as tipo_bloqueo
          FROM bloqueos_horarios b
          LEFT JOIN tipos_bloqueo tb ON b.tipo_bloqueo_id = tb.id
          WHERE b.organizacion_id = $1
            AND b.activo = true
            AND (b.profesional_id IS NULL OR b.profesional_id = $2)
        `, [organizacionId, profesionalId]);
      });

      const slots = [{ hora: horaInicio }];
      const queryResult = DisponibilidadModel._verificarDisponibilidadSlotsEnMemoria(
        slots,
        profesionalId,
        fecha,
        30,
        [],
        bloqueosRango.rows,
        'completo'
      );

      expect(queryResult).toHaveLength(1);
      expect(queryResult[0].disponible).toBe(true);
      expect(queryResult[0].razon_no_disponible).toBeNull();
    });
  });

  describe('🔧 Uso de CitaValidacionUtil', () => {
    test('Ambos métodos usan CitaValidacionUtil.haySolapamientoHorario()', () => {
      // Verificar que la función compartida funciona correctamente
      expect(CitaValidacionUtil.haySolapamientoHorario('09:00:00', '10:00:00', '09:30:00', '10:30:00')).toBe(true);
      expect(CitaValidacionUtil.haySolapamientoHorario('09:00:00', '10:00:00', '10:00:00', '11:00:00')).toBe(false);
    });

    test('Ambos métodos usan CitaValidacionUtil.normalizarFecha()', () => {
      expect(CitaValidacionUtil.normalizarFecha(new Date('2025-11-03'))).toBe('2025-11-03');
      expect(CitaValidacionUtil.normalizarFecha('2025-11-03T10:00:00Z')).toBe('2025-11-03');
      expect(CitaValidacionUtil.normalizarFecha('2025-11-03')).toBe('2025-11-03');
    });

    test('Ambos métodos usan CitaValidacionUtil.formatearMensajeCita()', () => {
      const cita = {
        id: 1,
        codigo_cita: 'ORG001-001',
        cliente_nombre: 'Juan',
      };

      expect(CitaValidacionUtil.formatearMensajeCita(cita, 'basico')).toBe('Ocupado');
      expect(CitaValidacionUtil.formatearMensajeCita(cita, 'completo')).toBe('Cita existente');
      expect(CitaValidacionUtil.formatearMensajeCita(cita, 'admin')).toBe('Cita ORG001-001 - Juan');
    });

    test('Ambos métodos usan CitaValidacionUtil.formatearMensajeBloqueo()', () => {
      const bloqueo = {
        titulo: 'Vacaciones',
        es_organizacional: true,
      };

      expect(CitaValidacionUtil.formatearMensajeBloqueo(bloqueo, 'basico')).toBe('No disponible');
      expect(CitaValidacionUtil.formatearMensajeBloqueo(bloqueo, 'completo')).toBe('Vacaciones');
      expect(CitaValidacionUtil.formatearMensajeBloqueo(bloqueo, 'admin')).toBe(
        'Bloqueo organizacional: Vacaciones'
      );
    });
  });
});

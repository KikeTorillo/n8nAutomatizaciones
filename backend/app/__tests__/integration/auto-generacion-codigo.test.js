/**
 * Tests de Auto-generación de codigo_cita
 * Valida que el trigger generar_codigo_cita() funciona correctamente
 *
 * CRÍTICO: Backend NO debe enviar codigo_cita
 * Formato esperado: ORG001-20251004-001
 */

const {
  setRLSContext,
  cleanAllTables,
  createTestOrganizacion,
  createTestUsuario,
  createTestCliente,
  createTestProfesional,
  createTestServicio,
  createTestCita
} = require('../helpers/db-helper');

describe('✨ Auto-generación de codigo_cita', () => {
  let client;
  let org1, org2;
  let usuario1;
  let cliente1, cliente2;
  let profesional1, profesional2;
  let servicio1, servicio2;

  // Fechas dinámicas para evitar constraint violations
  const getFechaManana = () => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 1);
    return fecha.toISOString().split('T')[0];
  };

  beforeAll(async () => {
    client = await global.testPool.connect();
    await cleanAllTables(client);

    // Crear 2 organizaciones para probar unicidad
    org1 = await createTestOrganizacion(client, {
      nombre: 'Organización 1'
    });

    org2 = await createTestOrganizacion(client, {
      nombre: 'Organización 2'
    });

    // Setup datos org1
    usuario1 = await createTestUsuario(client, org1.id);
    cliente1 = await createTestCliente(client, org1.id);
    profesional1 = await createTestProfesional(client, org1.id);

    // ⚠️ CRÍTICO: Crear horarios profesionales para profesional1 (Domingo-Sábado 9:00-18:00)
    // Sin esto, validarHorarioPermitido() fallará
    for (let dia = 0; dia <= 6; dia++) { // Domingo (0) a Sábado (6)
      await client.query(`
        INSERT INTO horarios_profesionales (
          organizacion_id, profesional_id, dia_semana,
          hora_inicio, hora_fin, tipo_horario,
          nombre_horario, permite_citas, activo,
          fecha_inicio
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        org1.id,
        profesional1.id,
        dia,
        '09:00:00',
        '18:00:00',
        'regular',
        'Horario Laboral',
        true,
        true,
        '2025-01-01'
      ]);
    }

    servicio1 = await createTestServicio(client, org1.id);

    // Vincular profesional1 con servicio1
    await setRLSContext(client, org1.id);
    await client.query(
      'INSERT INTO servicios_profesionales (servicio_id, profesional_id) VALUES ($1, $2)',
      [servicio1.id, profesional1.id]
    );

    // Setup datos org2
    cliente2 = await createTestCliente(client, org2.id);
    profesional2 = await createTestProfesional(client, org2.id);

    // ⚠️ CRÍTICO: Crear horarios profesionales para profesional2 (Domingo-Sábado 9:00-18:00)
    // Sin esto, validarHorarioPermitido() fallará
    for (let dia = 0; dia <= 6; dia++) { // Domingo (0) a Sábado (6)
      await client.query(`
        INSERT INTO horarios_profesionales (
          organizacion_id, profesional_id, dia_semana,
          hora_inicio, hora_fin, tipo_horario,
          nombre_horario, permite_citas, activo,
          fecha_inicio
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        org2.id,
        profesional2.id,
        dia,
        '09:00:00',
        '18:00:00',
        'regular',
        'Horario Laboral',
        true,
        true,
        '2025-01-01'
      ]);
    }

    servicio2 = await createTestServicio(client, org2.id);

    // Vincular profesional2 con servicio2
    await setRLSContext(client, org2.id);
    await client.query(
      'INSERT INTO servicios_profesionales (servicio_id, profesional_id) VALUES ($1, $2)',
      [servicio2.id, profesional2.id]
    );
  });

  afterAll(async () => {
    await cleanAllTables(client);
    client.release();
  });

  describe('Formato de codigo_cita', () => {
    test('codigo_cita se genera automáticamente', async () => {
      const cita = await createTestCita(client, org1.id, {
        cliente_id: cliente1.id,
        profesional_id: profesional1.id,
        servicios_ids: [servicio1.id], // ✅ Array
        fecha_cita: getFechaManana(),
        hora_inicio: '10:00',
        hora_fin: '11:00',
        precio_total: 100.00, // ✅ Reemplaza precio_servicio + precio_final
        duracion_total_minutos: 60
      });

      // Debe tener codigo_cita generado
      expect(cita.codigo_cita).toBeDefined();
      expect(cita.codigo_cita).not.toBeNull();
    });

    test('codigo_cita tiene formato correcto: ORG###-YYYYMMDD-###', async () => {
      const cita = await createTestCita(client, org1.id, {
        cliente_id: cliente1.id,
        profesional_id: profesional1.id,
        servicios_ids: [servicio1.id], // ✅ Array
        fecha_cita: getFechaManana(),
        hora_inicio: '11:00',
        hora_fin: '12:00',
        precio_total: 100.00, // ✅ Reemplaza precio_servicio + precio_final
        duracion_total_minutos: 60
      });

      // Formato: ORG001-20251010-001
      const formatoEsperado = /^ORG\d{3}-\d{8}-\d{3}$/;
      expect(cita.codigo_cita).toMatch(formatoEsperado);
    });

    test('codigo_cita contiene organizacion_id correcto', async () => {
      const cita = await createTestCita(client, org1.id, {
        cliente_id: cliente1.id,
        profesional_id: profesional1.id,
        servicios_ids: [servicio1.id], // ✅ Array
        fecha_cita: getFechaManana(),
        hora_inicio: '12:00',
        hora_fin: '13:00',
        precio_total: 100.00, // ✅ Reemplaza precio_servicio + precio_final
        duracion_total_minutos: 60
      });

      // Extraer parte de organización (ORG001 -> 001 -> 1)
      const orgPart = cita.codigo_cita.split('-')[0].replace('ORG', '');
      const orgId = parseInt(orgPart);

      expect(orgId).toBe(org1.id);
    });

    test('codigo_cita contiene fecha correcta', async () => {
      const fechaCita = getFechaManana();

      const cita = await createTestCita(client, org1.id, {
        cliente_id: cliente1.id,
        profesional_id: profesional1.id,
        servicio_id: servicio1.id,
        fecha_cita: fechaCita,
        hora_inicio: '13:00',
        hora_fin: '14:00',
        precio_servicio: 100.00,
        precio_final: 100.00
      });

      // Extraer parte de fecha y comparar con fecha enviada
      const fechaPart = cita.codigo_cita.split('-')[1];
      const fechaEsperada = fechaCita.replace(/-/g, ''); // Convertir '2025-10-13' a '20251013'

      expect(fechaPart).toBe(fechaEsperada);
    });
  });

  describe('Unicidad de codigo_cita', () => {
    test('Códigos son únicos para misma organización y fecha', async () => {
      const fechaCita = getFechaManana();

      // Crear 3 citas en la misma fecha y org
      const cita1 = await createTestCita(client, org1.id, {
        cliente_id: cliente1.id,
        profesional_id: profesional1.id,
        servicio_id: servicio1.id,
        fecha_cita: fechaCita,
        hora_inicio: '09:00',
        hora_fin: '10:00',
        precio_servicio: 100.00,
        precio_final: 100.00
      });

      const cita2 = await createTestCita(client, org1.id, {
        cliente_id: cliente1.id,
        profesional_id: profesional1.id,
        servicios_ids: [servicio1.id], // ✅ Array
        fecha_cita: fechaCita,
        hora_inicio: '10:00',
        hora_fin: '11:00',
        precio_total: 100.00, // ✅ Reemplaza precio_servicio + precio_final
        duracion_total_minutos: 60
      });

      const cita3 = await createTestCita(client, org1.id, {
        cliente_id: cliente1.id,
        profesional_id: profesional1.id,
        servicio_id: servicio1.id,
        fecha_cita: fechaCita,
        hora_inicio: '11:00',
        hora_fin: '12:00',
        precio_servicio: 100.00,
        precio_final: 100.00
      });

      // Todos deben ser diferentes
      expect(cita1.codigo_cita).not.toBe(cita2.codigo_cita);
      expect(cita2.codigo_cita).not.toBe(cita3.codigo_cita);
      expect(cita1.codigo_cita).not.toBe(cita3.codigo_cita);

      // Deben tener secuencia incremental
      const seq1 = parseInt(cita1.codigo_cita.split('-')[2]);
      const seq2 = parseInt(cita2.codigo_cita.split('-')[2]);
      const seq3 = parseInt(cita3.codigo_cita.split('-')[2]);

      expect(seq2).toBe(seq1 + 1);
      expect(seq3).toBe(seq2 + 1);
    });

    test('Códigos son independientes entre organizaciones', async () => {
      const fechaCita = getFechaManana();

      // Crear cita en org1
      const citaOrg1 = await createTestCita(client, org1.id, {
        cliente_id: cliente1.id,
        profesional_id: profesional1.id,
        servicio_id: servicio1.id,
        fecha_cita: fechaCita,
        hora_inicio: '14:00',
        hora_fin: '15:00',
        precio_servicio: 100.00,
        precio_final: 100.00
      });

      // Crear cita en org2 (misma fecha)
      const citaOrg2 = await createTestCita(client, org2.id, {
        cliente_id: cliente2.id,
        profesional_id: profesional2.id,
        servicios_ids: [servicio2.id], // ✅ Array
        fecha_cita: fechaCita,
        hora_inicio: '14:00',
        hora_fin: '15:00',
        precio_total: 200.00, // ✅ Reemplaza precio_servicio + precio_final
        duracion_total_minutos: 60
      });

      // Códigos deben ser diferentes
      expect(citaOrg1.codigo_cita).not.toBe(citaOrg2.codigo_cita);

      // Deben tener prefijos de org diferentes
      const org1Prefix = citaOrg1.codigo_cita.split('-')[0];
      const org2Prefix = citaOrg2.codigo_cita.split('-')[0];

      expect(org1Prefix).not.toBe(org2Prefix);
    });

    test('Secuencia reinicia para diferentes fechas', async () => {
      // Crear fechas dinámicas diferentes
      const fecha1 = new Date();
      fecha1.setDate(fecha1.getDate() + 5);
      const fechaCita1 = fecha1.toISOString().split('T')[0];

      const fecha2 = new Date();
      fecha2.setDate(fecha2.getDate() + 6);
      const fechaCita2 = fecha2.toISOString().split('T')[0];

      // Crear cita en fecha 1
      const cita1 = await createTestCita(client, org1.id, {
        cliente_id: cliente1.id,
        profesional_id: profesional1.id,
        servicio_id: servicio1.id,
        fecha_cita: fechaCita1,
        hora_inicio: '09:00',
        hora_fin: '10:00',
        precio_servicio: 100.00,
        precio_final: 100.00
      });

      // Crear cita en fecha 2 (diferente)
      const cita2 = await createTestCita(client, org1.id, {
        cliente_id: cliente1.id,
        profesional_id: profesional1.id,
        servicios_ids: [servicio1.id], // ✅ Array
        fecha_cita: fechaCita2,
        hora_inicio: '09:00',
        hora_fin: '10:00',
        precio_total: 100.00, // ✅ Reemplaza precio_servicio + precio_final
        duracion_total_minutos: 60
      });

      // Secuencia de fecha 2 debe empezar en 001
      const seq2 = parseInt(cita2.codigo_cita.split('-')[2]);
      expect(seq2).toBe(1);
    });
  });

  describe('Constraint de unicidad', () => {
    test('NO se puede insertar cita con codigo_cita duplicado (si se fuerza)', async () => {
      await setRLSContext(client, org1.id);

      const fechaCita = getFechaManana();

      // Crear primera cita
      const cita1 = await createTestCita(client, org1.id, {
        cliente_id: cliente1.id,
        profesional_id: profesional1.id,
        servicios_ids: [servicio1.id], // ✅ Array
        fecha_cita: fechaCita,
        hora_inicio: '10:00',
        hora_fin: '11:00',
        precio_total: 100.00, // ✅ Reemplaza precio_servicio + precio_final
        duracion_total_minutos: 60
      });

      // Intentar insertar segunda cita con codigo_cita duplicado (forzando)
      try {
        await client.query(`
          INSERT INTO citas (
            organizacion_id, cliente_id, profesional_id,
            fecha_cita, hora_inicio, hora_fin, precio_total, duracion_total_minutos,
            codigo_cita
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          org1.id, cliente1.id, profesional1.id,
          fechaCita, '11:00', '12:00', 100.00, 60,
          cita1.codigo_cita  // ❌ Forzar duplicado
        ]);

        // No debe llegar aquí
        fail('Debería haber lanzado error de constraint');
      } catch (error) {
        // Debe fallar con constraint de unicidad
        expect(error.code).toBe('23505'); // Unique violation
      }
    });
  });

  describe('Integración con modelo CitaBaseModel', () => {
    test('CitaBaseModel.crearEstandar NO envía codigo_cita', async () => {
      const CitaModel = require('../../models/citas/cita.base.model');

      const citaData = {
        organizacion_id: org1.id,
        cliente_id: cliente1.id,
        profesional_id: profesional1.id,
        servicios_ids: [servicio1.id], // ✅ Array
        fecha_cita: getFechaManana(),
        hora_inicio: '15:00',
        hora_fin: '16:00'
        // ✅ precio_servicio, precio_final ya no se envían
        // El backend calcula precio_total y duracion_total_minutos automáticamente
      };

      const nuevaCita = await CitaModel.crearEstandar(citaData, usuario1.id);

      // Debe tener codigo_cita generado automáticamente
      expect(nuevaCita.codigo_cita).toBeDefined();
      expect(nuevaCita.codigo_cita).toMatch(/^ORG\d{3}-\d{8}-\d{3}$/);
    });
  });

  describe('Búsqueda por codigo_cita', () => {
    test('Se puede buscar cita por codigo_cita', async () => {
      const cita = await createTestCita(client, org1.id, {
        cliente_id: cliente1.id,
        profesional_id: profesional1.id,
        servicios_ids: [servicio1.id], // ✅ Array
        fecha_cita: getFechaManana(),
        hora_inicio: '16:00',
        hora_fin: '17:00',
        precio_total: 100.00, // ✅ Reemplaza precio_servicio + precio_final
        duracion_total_minutos: 60
      });

      await setRLSContext(client, org1.id);

      const result = await client.query(
        'SELECT * FROM citas WHERE codigo_cita = $1',
        [cita.codigo_cita]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].id).toBe(cita.id);
    });

    test('codigo_cita es único globalmente (constraint)', async () => {
      // Obtener todos los códigos generados
      await setRLSContext(client, org1.id);
      const result1 = await client.query('SELECT codigo_cita FROM citas');

      await setRLSContext(client, org2.id);
      const result2 = await client.query('SELECT codigo_cita FROM citas');

      const todosCodigos = [
        ...result1.rows.map(r => r.codigo_cita),
        ...result2.rows.map(r => r.codigo_cita)
      ];

      // No debe haber duplicados
      const codigosUnicos = new Set(todosCodigos);
      expect(codigosUnicos.size).toBe(todosCodigos.length);
    });
  });
});

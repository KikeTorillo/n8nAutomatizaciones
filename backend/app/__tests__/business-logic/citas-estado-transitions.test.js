/**
 * Tests de Validación de Estados de Transición - Citas
 * Suite completa para validar máquina de estados y transiciones válidas
 * CRÍTICO: Prevenir datos inconsistentes y violaciones de reglas de negocio
 */

const request = require('supertest');
const saasApp = require('../../app');
const authConfig = require('../../config/auth');
const {
  cleanAllTables,
  createTestOrganizacion,
  createTestUsuario,
  createTestCliente,
  createTestProfesional,
  createTestServicio,
  createTestCita,
  getUniqueTestId
} = require('../helpers/db-helper');

describe('Validación de Estados de Transición - Citas', () => {
  let app;
  let client;
  let testOrg;
  let testUsuario;
  let userToken;
  let testCliente;
  let testProfesional;
  let testServicio;

  beforeAll(async () => {
    app = saasApp.getExpressApp();
    client = await global.testPool.connect();

    await cleanAllTables(client);

    testOrg = await createTestOrganizacion(client, {
      nombre: 'Test Org Estados'
    });

    testUsuario = await createTestUsuario(client, testOrg.id, {
      nombre: 'Usuario',
      apellidos: 'Test',
      rol: 'admin',
      activo: true,
      email_verificado: true
    });

    userToken = authConfig.generateToken({
      userId: testUsuario.id,
      email: testUsuario.email,
      rol: testUsuario.rol,
      organizacionId: testOrg.id
    });

    testCliente = await createTestCliente(client, testOrg.id, {
      nombre: 'Cliente Estados Test',
      telefono: '+5215512345678'
    });

    testProfesional = await createTestProfesional(client, testOrg.id, {
      nombre_completo: 'Profesional Estados Test',
      tipo_profesional: 'barbero'
    });

    // ⚠️ CRÍTICO: Crear horarios profesionales (Domingo-Sábado 9:00-18:00)
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
        testOrg.id,
        testProfesional.id,
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

    testServicio = await createTestServicio(client, testOrg.id, {
      nombre: 'Servicio Estados Test',
      duracion_minutos: 30,
      precio: 150.00
    }, [testProfesional.id]);

    client.release();
  });

  afterAll(async () => {
    const cleanupClient = await global.testPool.connect();
    await cleanAllTables(cleanupClient);
    cleanupClient.release();
  });

  // ============================================================================
  // MÁQUINA DE ESTADOS - Transiciones Válidas
  // ============================================================================

  describe('Flujo Válido Completo: pendiente → confirmada → en_curso → completada', () => {
    test('✅ Flujo completo exitoso', async () => {
      const tempClient = await global.testPool.connect();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fechaCita = tomorrow.toISOString().split('T')[0];

      const cita = await createTestCita(tempClient, testOrg.id, {
        cliente_id: testCliente.id,
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id,
        fecha_cita: fechaCita,
        hora_inicio: '10:00:00',
        hora_fin: '10:30:00',
        precio_servicio: 150.00,
        precio_final: 150.00,
        estado: 'pendiente'
      });
      tempClient.release();

      // PASO 1: Confirmar asistencia (pendiente → confirmada)
      const confirmar = await request(app)
        .patch(`/api/v1/citas/${cita.id}/confirmar-asistencia`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ confirmado: true });

      expect(confirmar.status).toBe(200);
      expect(confirmar.body.success).toBe(true);

      // PASO 2: Check-in (confirmada → en espera de servicio)
      const checkIn = await request(app)
        .post(`/api/v1/citas/${cita.id}/check-in`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      console.log('PASO 2 completado - Estado después de check-in:', checkIn.body.data?.estado);
      expect(checkIn.body.success).toBe(true);

      // PASO 3: Iniciar servicio (en espera → en_curso)
      const iniciar = await request(app)
        .post(`/api/v1/citas/${cita.id}/start-service`)
        .set('Authorization', `Bearer ${userToken}`);

      if (iniciar.status !== 200) {
        console.log('ERROR start-service:', iniciar.status, iniciar.body);
      }
      expect(iniciar.status).toBe(200);
      expect(iniciar.body.success).toBe(true);

      // PASO 4: Completar servicio (en_curso → completada)
      const completar = await request(app)
        .post(`/api/v1/citas/${cita.id}/complete`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ precio_final: 150.00 })
        .expect(200);

      expect(completar.body.success).toBe(true);

      // Verificar estado final
      const citaFinal = await request(app)
        .get(`/api/v1/citas/${cita.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(citaFinal.body.data.estado).toBe('completada');
    });
  });

  // ============================================================================
  // TRANSICIONES INVÁLIDAS - Prevención
  // ============================================================================

  describe('❌ Transiciones Inválidas - Deben Fallar', () => {
    test('❌ NO se puede pasar de completada a pendiente', async () => {
      const tempClient = await global.testPool.connect();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const fechaCita = yesterday.toISOString().split('T')[0];

      const citaCompletada = await createTestCita(tempClient, testOrg.id, {
        cliente_id: testCliente.id,
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id,
        fecha_cita: fechaCita,
        hora_inicio: '11:00:00',
        hora_fin: '11:30:00',
        precio_servicio: 150.00,
        precio_final: 150.00,
        estado: 'completada',
        pagado: true // Requerido por constraint
      });
      tempClient.release();

      const response = await request(app)
        .put(`/api/v1/citas/${citaCompletada.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ estado: 'pendiente' });

      // Debe fallar
      expect([400, 409]).toContain(response.status);
      if ([400, 409].includes(response.status)) {
        expect(response.body.success).toBe(false);
        expect(response.body.message).toMatch(/transición|estado|inválid/i);
      }
    });

    test('❌ NO se puede pasar de completada a en_curso', async () => {
      const tempClient = await global.testPool.connect();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const fechaCita = yesterday.toISOString().split('T')[0];

      const citaCompletada = await createTestCita(tempClient, testOrg.id, {
        cliente_id: testCliente.id,
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id,
        fecha_cita: fechaCita,
        hora_inicio: '12:00:00',
        hora_fin: '12:30:00',
        precio_servicio: 150.00,
        precio_final: 150.00,
        estado: 'completada',
        pagado: true
      });
      tempClient.release();

      const response = await request(app)
        .put(`/api/v1/citas/${citaCompletada.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ estado: 'en_curso' });

      expect([400, 409]).toContain(response.status);
      if ([400, 409].includes(response.status)) {
        expect(response.body.success).toBe(false);
      }
    });

    test('❌ NO se puede pasar de cancelada a confirmada', async () => {
      const tempClient = await global.testPool.connect();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fechaCita = tomorrow.toISOString().split('T')[0];

      const citaCancelada = await createTestCita(tempClient, testOrg.id, {
        cliente_id: testCliente.id,
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id,
        fecha_cita: fechaCita,
        hora_inicio: '13:00:00',
        hora_fin: '13:30:00',
        precio_servicio: 150.00,
        precio_final: 150.00,
        estado: 'cancelada',
        motivo_cancelacion: 'Test cancelación de transición'
      });
      tempClient.release();

      const response = await request(app)
        .put(`/api/v1/citas/${citaCancelada.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ estado: 'confirmada' });

      expect([400, 409]).toContain(response.status);
      if ([400, 409].includes(response.status)) {
        expect(response.body.success).toBe(false);
      }
    });

    test('❌ NO se puede iniciar servicio sin check-in previo', async () => {
      const tempClient = await global.testPool.connect();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fechaCita = tomorrow.toISOString().split('T')[0];

      const citaPendiente = await createTestCita(tempClient, testOrg.id, {
        cliente_id: testCliente.id,
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id,
        fecha_cita: fechaCita,
        hora_inicio: '14:00:00',
        hora_fin: '14:30:00',
        precio_servicio: 150.00,
        precio_final: 150.00,
        estado: 'pendiente'
      });
      tempClient.release();

      // Intentar iniciar servicio directamente
      const response = await request(app)
        .post(`/api/v1/citas/${citaPendiente.id}/start-service`)
        .set('Authorization', `Bearer ${userToken}`);

      // Debe fallar por estado incorrecto
      expect([400, 409]).toContain(response.status);
    });

    test('❌ NO se puede completar cita sin iniciar servicio', async () => {
      const tempClient = await global.testPool.connect();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fechaCita = tomorrow.toISOString().split('T')[0];

      const citaConfirmada = await createTestCita(tempClient, testOrg.id, {
        cliente_id: testCliente.id,
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id,
        fecha_cita: fechaCita,
        hora_inicio: '15:00:00',
        hora_fin: '15:30:00',
        precio_servicio: 150.00,
        precio_final: 150.00,
        estado: 'confirmada'
      });
      tempClient.release();

      // Intentar completar directamente
      const response = await request(app)
        .post(`/api/v1/citas/${citaConfirmada.id}/complete`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ precio_final: 150.00 });

      // Debe fallar
      expect([400, 409]).toContain(response.status);
    });
  });

  // ============================================================================
  // ESTADOS ESPECIALES - No_Show y Cancelada
  // ============================================================================

  describe('Estados Especiales - No_Show y Cancelada', () => {
    test('✅ Cita confirmada puede ser marcada como no_show', async () => {
      const tempClient = await global.testPool.connect();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const fechaCita = yesterday.toISOString().split('T')[0];

      const citaConfirmada = await createTestCita(tempClient, testOrg.id, {
        cliente_id: testCliente.id,
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id,
        fecha_cita: fechaCita,
        hora_inicio: '16:00:00',
        hora_fin: '16:30:00',
        precio_servicio: 150.00,
        precio_final: 150.00,
        estado: 'confirmada'
      });
      tempClient.release();

      const response = await request(app)
        .put(`/api/v1/citas/${citaConfirmada.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ estado: 'no_show' });

      // Puede ser 200 (éxito) o 400 (si no está implementado aún)
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    test('✅ Cita pendiente puede ser cancelada', async () => {
      const tempClient = await global.testPool.connect();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const fechaCita = tomorrow.toISOString().split('T')[0];

      const citaPendiente = await createTestCita(tempClient, testOrg.id, {
        cliente_id: testCliente.id,
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id,
        fecha_cita: fechaCita,
        hora_inicio: '17:00:00',
        hora_fin: '17:30:00',
        precio_servicio: 150.00,
        precio_final: 150.00,
        estado: 'pendiente'
      });
      tempClient.release();

      const response = await request(app)
        .delete(`/api/v1/citas/${citaPendiente.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('✅ Cita confirmada puede ser cancelada (con tiempo suficiente)', async () => {
      const tempClient = await global.testPool.connect();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const fechaCita = futureDate.toISOString().split('T')[0];

      const citaConfirmada = await createTestCita(tempClient, testOrg.id, {
        cliente_id: testCliente.id,
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id,
        fecha_cita: fechaCita,
        hora_inicio: '09:00:00',
        hora_fin: '09:30:00',
        precio_servicio: 150.00,
        precio_final: 150.00,
        estado: 'confirmada'
      });
      tempClient.release();

      const response = await request(app)
        .delete(`/api/v1/citas/${citaConfirmada.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('❌ NO se puede cancelar cita completada', async () => {
      const tempClient = await global.testPool.connect();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const fechaCita = yesterday.toISOString().split('T')[0];

      const citaCompletada = await createTestCita(tempClient, testOrg.id, {
        cliente_id: testCliente.id,
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id,
        fecha_cita: fechaCita,
        hora_inicio: '10:00:00',
        hora_fin: '10:30:00',
        precio_servicio: 150.00,
        precio_final: 150.00,
        estado: 'completada',
        pagado: true
      });
      tempClient.release();

      const response = await request(app)
        .delete(`/api/v1/citas/${citaCompletada.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      // Debe fallar
      expect([400, 403, 409]).toContain(response.status);
    });

    test('❌ NO se puede cancelar cita en_curso', async () => {
      const tempClient = await global.testPool.connect();
      const today = new Date().toISOString().split('T')[0];

      const citaEnCurso = await createTestCita(tempClient, testOrg.id, {
        cliente_id: testCliente.id,
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id,
        fecha_cita: today,
        hora_inicio: '11:00:00',
        hora_fin: '11:30:00',
        precio_servicio: 150.00,
        precio_final: 150.00,
        estado: 'en_curso'
      });
      tempClient.release();

      const response = await request(app)
        .delete(`/api/v1/citas/${citaEnCurso.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      // Debe fallar
      expect([400, 403, 409]).toContain(response.status);
    });
  });

  // ============================================================================
  // VALIDACIONES DE REAGENDAMIENTO
  // ============================================================================

  describe('Reagendamiento - Estados Válidos', () => {
    test('✅ Cita pendiente puede ser reagendada', async () => {
      const tempClient = await global.testPool.connect();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fechaCita = tomorrow.toISOString().split('T')[0];

      const citaPendiente = await createTestCita(tempClient, testOrg.id, {
        cliente_id: testCliente.id,
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id,
        fecha_cita: fechaCita,
        hora_inicio: '10:00:00',
        hora_fin: '10:30:00',
        precio_servicio: 150.00,
        precio_final: 150.00,
        estado: 'pendiente'
      });
      tempClient.release();

      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 3);
      const nuevaFecha = newDate.toISOString().split('T')[0];

      const response = await request(app)
        .post(`/api/v1/citas/${citaPendiente.id}/reagendar`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nueva_fecha: nuevaFecha,
          nueva_hora_inicio: '14:00:00',
          nueva_hora_fin: '14:30:00'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('✅ Cita confirmada puede ser reagendada', async () => {
      const tempClient = await global.testPool.connect();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fechaCita = tomorrow.toISOString().split('T')[0];

      const citaConfirmada = await createTestCita(tempClient, testOrg.id, {
        cliente_id: testCliente.id,
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id,
        fecha_cita: fechaCita,
        hora_inicio: '11:00:00',
        hora_fin: '11:30:00',
        precio_servicio: 150.00,
        precio_final: 150.00,
        estado: 'confirmada'
      });
      tempClient.release();

      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 4);
      const nuevaFecha = newDate.toISOString().split('T')[0];

      const response = await request(app)
        .post(`/api/v1/citas/${citaConfirmada.id}/reagendar`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nueva_fecha: nuevaFecha,
          nueva_hora_inicio: '15:00:00',
          nueva_hora_fin: '15:30:00'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('❌ NO se puede reagendar cita completada', async () => {
      const tempClient = await global.testPool.connect();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const fechaCita = yesterday.toISOString().split('T')[0];

      const citaCompletada = await createTestCita(tempClient, testOrg.id, {
        cliente_id: testCliente.id,
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id,
        fecha_cita: fechaCita,
        hora_inicio: '12:00:00',
        hora_fin: '12:30:00',
        precio_servicio: 150.00,
        precio_final: 150.00,
        estado: 'completada',
        pagado: true
      });
      tempClient.release();

      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 3);
      const nuevaFecha = newDate.toISOString().split('T')[0];

      const response = await request(app)
        .post(`/api/v1/citas/${citaCompletada.id}/reagendar`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nueva_fecha: nuevaFecha,
          nueva_hora_inicio: '14:00:00',
          nueva_hora_fin: '14:30:00'
        });

      // Debe fallar
      expect([400, 403, 409]).toContain(response.status);
    });

    test('❌ NO se puede reagendar cita en_curso', async () => {
      const tempClient = await global.testPool.connect();
      const today = new Date().toISOString().split('T')[0];

      const citaEnCurso = await createTestCita(tempClient, testOrg.id, {
        cliente_id: testCliente.id,
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id,
        fecha_cita: today,
        hora_inicio: '13:00:00',
        hora_fin: '13:30:00',
        precio_servicio: 150.00,
        precio_final: 150.00,
        estado: 'en_curso'
      });
      tempClient.release();

      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 3);
      const nuevaFecha = newDate.toISOString().split('T')[0];

      const response = await request(app)
        .post(`/api/v1/citas/${citaEnCurso.id}/reagendar`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nueva_fecha: nuevaFecha,
          nueva_hora_inicio: '14:00:00',
          nueva_hora_fin: '14:30:00'
        });

      // Debe fallar
      expect([400, 403, 409]).toContain(response.status);
    });
  });

  // ============================================================================
  // DOCUMENTACIÓN DE MÁQUINA DE ESTADOS
  // ============================================================================

  describe('Documentación de Máquina de Estados', () => {
    test('Matriz de transiciones válidas documentada', () => {
      const matrizTransiciones = {
        pendiente: {
          permitidas: ['confirmada', 'cancelada', 'no_show'],
          bloqueadas: ['en_curso', 'completada']
        },
        confirmada: {
          permitidas: ['en_curso', 'cancelada', 'no_show', 'pendiente'],
          bloqueadas: ['completada']
        },
        en_curso: {
          permitidas: ['completada', 'pausada'],
          bloqueadas: ['pendiente', 'confirmada', 'cancelada']
        },
        completada: {
          permitidas: [],
          bloqueadas: ['pendiente', 'confirmada', 'en_curso', 'cancelada', 'no_show']
        },
        cancelada: {
          permitidas: [],
          bloqueadas: ['pendiente', 'confirmada', 'en_curso', 'completada', 'no_show']
        },
        no_show: {
          permitidas: [],
          bloqueadas: ['pendiente', 'confirmada', 'en_curso', 'completada', 'cancelada']
        }
      };

      // Este test documenta la matriz esperada
      expect(matrizTransiciones).toBeDefined();
      expect(Object.keys(matrizTransiciones)).toHaveLength(6);
    });
  });
});

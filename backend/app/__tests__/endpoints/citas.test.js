/**
 * Tests de Endpoints de Citas
 * Suite completa para validar endpoints del controller de citas
 * CRÍTICO: Validar auto-generación de codigo_cita y triggers automáticos
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

describe('Endpoints de Citas', () => {
  let app;
  let client;
  let testOrg;
  let testUsuario;
  let userToken;
  let testCliente;
  let testProfesional;
  let testServicio;
  let testCita;

  beforeAll(async () => {
    app = saasApp.getExpressApp();
    client = await global.testPool.connect();

    // Limpiar BD
    await cleanAllTables(client);

    // Crear organización de prueba
    testOrg = await createTestOrganizacion(client, {
      nombre: 'Test Org Citas'
    });

    // Crear usuario de la organización (propietario para evitar restricciones de profesional)
    testUsuario = await createTestUsuario(client, testOrg.id, {
      nombre: 'Usuario',
      apellidos: 'Test',
      rol: 'propietario',
      activo: true,
      email_verificado: true
    });

    // Generar token para el usuario
    userToken = authConfig.generateToken({
      userId: testUsuario.id,
      email: testUsuario.email,
      rol: testUsuario.rol,
      organizacionId: testOrg.id
    });

    // Crear cliente de prueba
    testCliente = await createTestCliente(client, testOrg.id, {
      nombre: 'Cliente Test',
      telefono: '+5215512345678'
    });

    // Crear profesional de prueba
    testProfesional = await createTestProfesional(client, testOrg.id, {
      nombre_completo: 'Profesional Test',
      tipo_profesional: 'barbero'
    });

    // Crear servicio de prueba y asociarlo con el profesional
    testServicio = await createTestServicio(client, testOrg.id, {
      nombre: 'Servicio Test',
      duracion_minutos: 30,
      precio: 150.00
    }, [testProfesional.id]);

    // Crear cita de prueba
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const fechaCita = tomorrow.toISOString().split('T')[0];

    testCita = await createTestCita(client, testOrg.id, {
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

    client.release();
  });

  afterAll(async () => {
    const cleanupClient = await global.testPool.connect();
    await cleanAllTables(cleanupClient);
    cleanupClient.release();
  });

  // ============================================================================
  // Tests de Crear Cita - CRÍTICO: Validar Auto-generación de codigo_cita
  // ============================================================================

  describe('POST /api/v1/citas', () => {
    test('Crear cita exitosamente y validar auto-generación de codigo_cita', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(11, 0, 0, 0);
      const fechaCita = tomorrow.toISOString();

      const citaData = {
        cliente_id: testCliente.id,
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id,
        fecha_cita: fechaCita,
        hora_inicio: '11:00:00',
        hora_fin: '11:30:00',
        precio_servicio: 150.00,
        descuento: 0.00,
        precio_final: 150.00
      };

      const response = await request(app)
        .post('/api/v1/citas')
        .set('Authorization', `Bearer ${userToken}`)
        .send(citaData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();

      // CRÍTICO: Validar que codigo_cita fue auto-generado
      expect(response.body.data).toHaveProperty('codigo_cita');
      expect(response.body.data.codigo_cita).toMatch(/^[A-Z0-9]+-\d{8}-\d{3}$/);

      expect(response.body.data.estado).toBe('pendiente');
      expect(response.body.data.cliente_id).toBe(testCliente.id);
      expect(response.body.data.profesional_id).toBe(testProfesional.id);
      expect(response.body.data.servicio_id).toBe(testServicio.id);
    });

    test('Falla sin autenticación', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      const fechaCita = tomorrow.toISOString();

      const response = await request(app)
        .post('/api/v1/citas')
        .send({
          cliente_id: testCliente.id,
          profesional_id: testProfesional.id,
          servicio_id: testServicio.id,
          fecha_cita: fechaCita,
          hora_inicio: '12:00:00',
          hora_fin: '12:30:00',
          precio_servicio: 150.00,
          descuento: 0.00,
          precio_final: 150.00
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla sin campos requeridos', async () => {
      const response = await request(app)
        .post('/api/v1/citas')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          cliente_id: testCliente.id
          // Faltan campos requeridos
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Listar Citas
  // ============================================================================

  describe('GET /api/v1/citas', () => {
    test('Listar citas de la organización', async () => {
      const response = await request(app)
        .get('/api/v1/citas')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.data || response.body.data.citas || response.body.data)).toBe(true);
    });

    test('Listar citas con filtros de fecha', async () => {
      const today = new Date().toISOString().split('T')[0];

      const response = await request(app)
        .get('/api/v1/citas')
        .query({ fecha_desde: today })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Listar citas con filtro de estado', async () => {
      const response = await request(app)
        .get('/api/v1/citas')
        .query({ estado: 'pendiente' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get('/api/v1/citas')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Obtener Cita por ID
  // ============================================================================

  describe('GET /api/v1/citas/:id', () => {
    test('Obtener cita por ID', async () => {
      const response = await request(app)
        .get(`/api/v1/citas/${testCita.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testCita.id);
      expect(response.body.data).toHaveProperty('codigo_cita');
    });

    test('Falla con ID inexistente', async () => {
      const response = await request(app)
        .get('/api/v1/citas/999999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get(`/api/v1/citas/${testCita.id}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Actualizar Cita
  // ============================================================================

  describe('PUT /api/v1/citas/:id', () => {
    test('Actualizar cita exitosamente', async () => {
      const updateData = {
        notas_cliente: 'Actualización de notas'
      };

      const response = await request(app)
        .put(`/api/v1/citas/${testCita.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .put(`/api/v1/citas/${testCita.id}`)
        .send({ notas_cliente: 'Test' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Buscar Citas por Teléfono (Endpoint IA)
  // ============================================================================

  describe('GET /api/v1/citas/buscar-por-telefono', () => {
    test('Buscar citas por teléfono del cliente', async () => {
      const response = await request(app)
        .get('/api/v1/citas/buscar-por-telefono')
        .query({
          telefono: testCliente.telefono,
          organizacion_id: testOrg.id
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
    });

    test('Falla sin parámetro telefono', async () => {
      const response = await request(app)
        .get('/api/v1/citas/buscar-por-telefono')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Confirmar Asistencia
  // ============================================================================

  describe('PATCH /api/v1/citas/:id/confirmar-asistencia', () => {
    test('Confirmar asistencia a cita', async () => {
      const response = await request(app)
        .patch(`/api/v1/citas/${testCita.id}/confirmar-asistencia`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ confirmado: true })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .patch(`/api/v1/citas/${testCita.id}/confirmar-asistencia`)
        .send({ confirmado: true })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Check-In (Llegada del Cliente)
  // ============================================================================

  describe('POST /api/v1/citas/:id/check-in', () => {
    test('Registrar check-in de cliente', async () => {
      // Crear cita específica para check-in
      const tempClient = await global.testPool.connect();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fechaCita = tomorrow.toISOString().split('T')[0];

      const citaCheckIn = await createTestCita(tempClient, testOrg.id, {
        cliente_id: testCliente.id,
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id,
        fecha_cita: fechaCita,
        hora_inicio: '14:00:00',
        hora_fin: '14:30:00',
        precio_servicio: 150.00,
        precio_final: 150.00,
        estado: 'confirmada'
      });
      tempClient.release();

      const response = await request(app)
        .post(`/api/v1/citas/${citaCheckIn.id}/check-in`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .post(`/api/v1/citas/${testCita.id}/check-in`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Iniciar Servicio
  // ============================================================================

  describe('POST /api/v1/citas/:id/start-service', () => {
    test('Iniciar servicio de cita', async () => {
      // Crear cita específica para iniciar servicio
      const tempClient = await global.testPool.connect();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fechaCita = tomorrow.toISOString().split('T')[0];

      const citaStart = await createTestCita(tempClient, testOrg.id, {
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

      const response = await request(app)
        .post(`/api/v1/citas/${citaStart.id}/start-service`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .post(`/api/v1/citas/${testCita.id}/start-service`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Completar Cita
  // ============================================================================

  describe('POST /api/v1/citas/:id/complete', () => {
    test('Completar cita', async () => {
      // Crear cita específica para completar
      const tempClient = await global.testPool.connect();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fechaCita = tomorrow.toISOString().split('T')[0];

      const citaComplete = await createTestCita(tempClient, testOrg.id, {
        cliente_id: testCliente.id,
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id,
        fecha_cita: fechaCita,
        hora_inicio: '16:00:00',
        hora_fin: '16:30:00',
        precio_servicio: 150.00,
        precio_final: 150.00,
        estado: 'en_curso'
      });
      tempClient.release();

      const response = await request(app)
        .post(`/api/v1/citas/${citaComplete.id}/complete`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ precio_final: 150.00 })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .post(`/api/v1/citas/${testCita.id}/complete`)
        .send({ precio_final: 150.00 })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Reagendar Cita
  // ============================================================================

  describe('POST /api/v1/citas/:id/reagendar', () => {
    test('Reagendar cita', async () => {
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 2);
      const nuevaFecha = newDate.toISOString().split('T')[0];

      const response = await request(app)
        .post(`/api/v1/citas/${testCita.id}/reagendar`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nueva_fecha: nuevaFecha,
          nueva_hora_inicio: '11:00:00',
          nueva_hora_fin: '11:30:00'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .post(`/api/v1/citas/${testCita.id}/reagendar`)
        .send({
          nueva_fecha: '2025-12-31',
          nueva_hora_inicio: '10:00:00',
          nueva_hora_fin: '10:30:00'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Dashboard Today
  // ============================================================================

  describe('GET /api/v1/citas/dashboard/today', () => {
    test('Obtener dashboard del día', async () => {
      const response = await request(app)
        .get('/api/v1/citas/dashboard/today')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get('/api/v1/citas/dashboard/today')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Eliminar Cita
  // ============================================================================

  describe('DELETE /api/v1/citas/:id', () => {
    test('Eliminar cita', async () => {
      // Crear cita temporal para eliminar
      const tempClient = await global.testPool.connect();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fechaCita = tomorrow.toISOString().split('T')[0];

      const tempCita = await createTestCita(tempClient, testOrg.id, {
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
        .delete(`/api/v1/citas/${tempCita.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .delete(`/api/v1/citas/${testCita.id}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});

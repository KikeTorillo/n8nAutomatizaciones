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
  let otherOrg;
  let otherOrgAdmin;
  let otherOrgToken;

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

    // ⚠️ CRÍTICO: Crear horarios profesionales (Domingo-Sábado 00:00-23:59)
    // Horario 24/7 para evitar tests flaky que dependen de hora de ejecución
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
        '00:00:00',
        '23:59:59',
        'regular',
        'Horario Tests 24/7',
        true,
        true,
        '2025-01-01'
      ]);
    }

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

    // Crear segunda organización para tests RLS
    otherOrg = await createTestOrganizacion(client, {
      nombre: 'Other Org RLS Test'
    });

    // Crear admin de la segunda organización
    otherOrgAdmin = await createTestUsuario(client, otherOrg.id, {
      nombre: 'Other Org',
      apellidos: 'Admin',
      rol: 'admin',
      activo: true,
      email_verificado: true
    });

    // Generar token para admin de la segunda org
    otherOrgToken = authConfig.generateToken({
      userId: otherOrgAdmin.id,
      email: otherOrgAdmin.email,
      rol: otherOrgAdmin.rol,
      organizacionId: otherOrg.id
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

  // ============================================================================
  // Tests de Aislamiento RLS Multi-Tenant
  // ============================================================================
  describe('Aislamiento RLS Multi-Tenant', () => {
    test('❌ CRÍTICO: Admin de otra org NO puede ver cita', async () => {
      const response = await request(app)
        .get(`/api/v1/citas/${testCita.id}`)
        .set('Authorization', `Bearer ${otherOrgToken}`);

      // RLS debe bloquear con 403 o 404
      expect([403, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('❌ CRÍTICO: Admin de otra org NO puede actualizar cita', async () => {
      const response = await request(app)
        .put(`/api/v1/citas/${testCita.id}`)
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .send({ notas: 'Intentando modificar' });

      // RLS debe bloquear con 400, 403 o 404
      expect([400, 403, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('❌ CRÍTICO: Listar citas NO muestra citas de otras orgs', async () => {
      const response = await request(app)
        .get('/api/v1/citas')
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .expect(200);

      const citas = response.body.data.citas || response.body.data.data || [];

      // Verificar que no incluye testCita
      const citaDeOtraOrg = citas.find(c => c.id === testCita.id);
      expect(citaDeOtraOrg).toBeUndefined();
    });

    test('✅ Admin SÍ puede ver su propia cita', async () => {
      const response = await request(app)
        .get(`/api/v1/citas/${testCita.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testCita.id);
    });
  });

  // ============================================================================
  // Tests de Walk-In con Auto-Asignación
  // ============================================================================
  describe('POST /api/v1/citas/walk-in - Auto-Asignación', () => {
    let testProfesional2;

    beforeAll(async () => {
      // Crear segundo profesional para tests de auto-asignación
      const tempClient = await global.testPool.connect();
      testProfesional2 = await createTestProfesional(tempClient, testOrg.id, {
        nombre_completo: 'Profesional 2 Test',
        tipo_profesional: 'estilista'
      });

      // Asociar servicio con ambos profesionales
      await tempClient.query(`
        INSERT INTO servicios_profesionales (servicio_id, profesional_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [testServicio.id, testProfesional2.id]);

      // ⚠️ CRÍTICO: Crear horarios profesionales para testProfesional2 (00:00-23:59)
      // Horario 24/7 para evitar tests flaky que dependen de hora de ejecución
      for (let dia = 0; dia <= 6; dia++) { // Domingo (0) a Sábado (6)
        await tempClient.query(`
          INSERT INTO horarios_profesionales (
            organizacion_id, profesional_id, dia_semana,
            hora_inicio, hora_fin, tipo_horario,
            nombre_horario, permite_citas, activo,
            fecha_inicio
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          testOrg.id,
          testProfesional2.id,
          dia,
          '00:00:00',
          '23:59:59',
          'regular',
          'Horario Tests 24/7',
          true,
          true,
          '2025-01-01'
        ]);
      }

      tempClient.release();
    });

    test('Debe crear cita walk-in con cliente existente y auto-asignar profesional', async () => {
      const response = await request(app)
        .post('/api/v1/citas/walk-in')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          cliente_id: testCliente.id,
          // NO enviar profesional_id
          servicio_id: testServicio.id,
          tiempo_espera_aceptado: 5,
          notas_walk_in: 'Test auto-asignación profesional'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('codigo_cita');
      expect(response.body.data.codigo_cita).toMatch(/^[A-Z0-9]+-\d{8}-\d{3}$/);
      expect(response.body.data.cliente_id).toBe(testCliente.id);
      expect(response.body.data.profesional_id).toBeGreaterThan(0); // Auto-asignado
      expect(response.body.data.estado).toBe('en_curso'); // Profesional disponible = empieza inmediatamente
      expect(response.body.data.origen_cita).toBe('presencial');
    });

    test('Debe crear cliente nuevo Y auto-asignar profesional', async () => {
      const telefonoNuevo = '+573111111111';
      const nombreNuevo = 'Juan Walk-in Test';

      const response = await request(app)
        .post('/api/v1/citas/walk-in')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          // NO enviar cliente_id
          nombre_cliente: nombreNuevo,
          telefono: telefonoNuevo,
          // NO enviar profesional_id
          servicio_id: testServicio.id,
          tiempo_espera_aceptado: 10,
          notas_walk_in: 'Test cliente nuevo + auto-asignación'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('codigo_cita');
      expect(response.body.data.cliente_id).toBeGreaterThan(0); // Cliente creado
      expect(response.body.data.profesional_id).toBeGreaterThan(0); // Profesional auto-asignado
      expect(response.body.data.estado).toBe('en_curso'); // Profesional disponible = empieza inmediatamente

      // Verificar que el cliente se creó correctamente
      const tempClient = await global.testPool.connect();
      const clienteCreado = await tempClient.query(
        'SELECT * FROM clientes WHERE telefono = $1 AND organizacion_id = $2',
        [telefonoNuevo, testOrg.id]
      );
      tempClient.release();

      expect(clienteCreado.rows.length).toBe(1);
      expect(clienteCreado.rows[0].nombre).toBe(nombreNuevo);
      expect(clienteCreado.rows[0].como_conocio).toBe('walk_in_pos');
    });

    test('Debe respetar profesional específico si se envía', async () => {
      const response = await request(app)
        .post('/api/v1/citas/walk-in')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          cliente_id: testCliente.id,
          profesional_id: testProfesional2.id, // Específico
          servicio_id: testServicio.id,
          tiempo_espera_aceptado: 0
        });

      expect(response.status).toBe(201);
      expect(response.body.data.profesional_id).toBe(testProfesional2.id); // Mismo que se envió
    });

    test('Debe fallar si no envía cliente_id NI nombre_cliente', async () => {
      const response = await request(app)
        .post('/api/v1/citas/walk-in')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          // NO enviar cliente_id
          // NO enviar nombre_cliente
          servicio_id: testServicio.id
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('Debe fallar si envía cliente_id Y nombre_cliente simultáneamente', async () => {
      const response = await request(app)
        .post('/api/v1/citas/walk-in')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          cliente_id: testCliente.id,
          nombre_cliente: 'Juan Test',
          telefono: '+573222222222',
          servicio_id: testServicio.id
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('Debe fallar si no hay profesionales disponibles para el servicio', async () => {
      const tempClient = await global.testPool.connect();

      // Desactivar todos los profesionales
      await tempClient.query(
        'UPDATE profesionales SET activo = false WHERE organizacion_id = $1',
        [testOrg.id]
      );

      const response = await request(app)
        .post('/api/v1/citas/walk-in')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          cliente_id: testCliente.id,
          servicio_id: testServicio.id
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('profesionales disponibles');

      // Reactivar profesionales
      await tempClient.query(
        'UPDATE profesionales SET activo = true WHERE organizacion_id = $1',
        [testOrg.id]
      );

      tempClient.release();
    });

    test('Debe crear walk-in con cliente nuevo SIN teléfono (opcional)', async () => {
      const nombreSinTel = 'Cliente Sin Teléfono Test';

      const response = await request(app)
        .post('/api/v1/citas/walk-in')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nombre_cliente: nombreSinTel,
          // NO enviar telefono (es opcional ahora)
          servicio_id: testServicio.id,
          notas_walk_in: 'Cliente walk-in sin teléfono'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('codigo_cita');
      expect(response.body.data.cliente_id).toBeGreaterThan(0);
      expect(response.body.data.profesional_id).toBeGreaterThan(0);

      // Verificar que el cliente se creó SIN teléfono
      const tempClient = await global.testPool.connect();
      const clienteCreado = await tempClient.query(
        'SELECT * FROM clientes WHERE id = $1 AND organizacion_id = $2',
        [response.body.data.cliente_id, testOrg.id]
      );
      tempClient.release();

      expect(clienteCreado.rows.length).toBe(1);
      expect(clienteCreado.rows[0].nombre).toBe(nombreSinTel);
      expect(clienteCreado.rows[0].telefono).toBeNull(); // Sin teléfono
      expect(clienteCreado.rows[0].como_conocio).toBe('walk_in_pos');
    });

    test('Debe validar formato de teléfono si se proporciona', async () => {
      const response = await request(app)
        .post('/api/v1/citas/walk-in')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nombre_cliente: 'Test Teléfono Inválido',
          telefono: 'INVALIDO123', // Formato inválido
          servicio_id: testServicio.id
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});

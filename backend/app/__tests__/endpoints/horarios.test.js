/**
 * Tests de Endpoints de Horarios
 * Suite completa para validar endpoints del controller de horarios
 */

const request = require('supertest');
const saasApp = require('../../app');
const authConfig = require('../../config/auth');
const {
  cleanAllTables,
  createTestOrganizacion,
  createTestUsuario,
  createTestProfesional,
  getUniqueTestId
} = require('../helpers/db-helper');

describe('Endpoints de Horarios', () => {
  let app;
  let client;
  let testOrg;
  let testUsuario;
  let adminUsuario;
  let userToken;
  let adminToken;
  let testProfesional;
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
      nombre: 'Test Org Horarios'
    });

    // Crear usuario empleado
    testUsuario = await createTestUsuario(client, testOrg.id, {
      nombre: 'Usuario',
      apellidos: 'Test',
      rol: 'empleado',
      activo: true,
      email_verificado: true
    });

    // Crear usuario admin
    adminUsuario = await createTestUsuario(client, testOrg.id, {
      nombre: 'Admin',
      apellidos: 'Test',
      rol: 'admin',
      activo: true,
      email_verificado: true
    });

    // Generar tokens
    userToken = authConfig.generateToken({
      userId: testUsuario.id,
      email: testUsuario.email,
      rol: testUsuario.rol,
      organizacionId: testOrg.id
    });

    adminToken = authConfig.generateToken({
      userId: adminUsuario.id,
      email: adminUsuario.email,
      rol: adminUsuario.rol,
      organizacionId: testOrg.id
    });

    // Crear profesional de prueba
    testProfesional = await createTestProfesional(client, testOrg.id, {
      nombre_completo: 'Profesional Test',
      tipo_profesional: 'barbero'
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
  // Tests de Crear Horario
  // ============================================================================

  describe('POST /api/v1/horarios', () => {
    test('Crear horario exitosamente con rol empleado', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fecha = tomorrow.toISOString().split('T')[0];

      const horarioData = {
        profesional_id: testProfesional.id,
        fecha: fecha,
        hora_inicio: '09:00:00',
        hora_fin: '18:00:00',
        dia_semana: tomorrow.getDay()
      };

      const response = await request(app)
        .post('/api/v1/horarios')
        .set('Authorization', `Bearer ${userToken}`)
        .send(horarioData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.profesional_id).toBe(testProfesional.id);
      expect(response.body.data.fecha).toContain(fecha);
    });

    test('Falla sin autenticación', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fecha = tomorrow.toISOString().split('T')[0];

      const response = await request(app)
        .post('/api/v1/horarios')
        .send({
          profesional_id: testProfesional.id,
          fecha: fecha,
          hora_inicio: '09:00:00',
          hora_fin: '18:00:00'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla sin profesional_id requerido', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fecha = tomorrow.toISOString().split('T')[0];

      const response = await request(app)
        .post('/api/v1/horarios')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          fecha: fecha,
          hora_inicio: '09:00:00',
          hora_fin: '18:00:00'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Consultar Disponibilidad (Endpoints Públicos para IA)
  // ============================================================================

  describe('GET /api/v1/horarios/disponibles', () => {
    test('Consultar disponibilidad básica (público)', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fecha = tomorrow.toISOString().split('T')[0];

      const response = await request(app)
        .get('/api/v1/horarios/disponibles')
        .query({
          organizacion_id: testOrg.id,
          fecha: fecha,
          profesional_id: testProfesional.id
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
    });

    test('Falla sin parámetros requeridos', async () => {
      const response = await request(app)
        .get('/api/v1/horarios/disponibles')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Disponibilidad Inteligente (NLP)
  // ============================================================================

  describe('GET /api/v1/horarios/disponibles/inteligente', () => {
    test('Consultar disponibilidad inteligente (público)', async () => {
      const response = await request(app)
        .get('/api/v1/horarios/disponibles/inteligente')
        .query({
          organizacion_id: testOrg.id,
          consulta_nlp: 'mañana por la mañana',
          profesional_id: testProfesional.id
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
    });

    test('Falla sin parámetros requeridos', async () => {
      const response = await request(app)
        .get('/api/v1/horarios/disponibles/inteligente')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Reservar Temporal (Carrito IA)
  // ============================================================================

  describe('POST /api/v1/horarios/reservar-temporal', () => {
    test('Reservar horario temporalmente (público)', async () => {
      // Primero crear un horario disponible
      const tempClient = await global.testPool.connect();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 6); // Usar +6 días para evitar conflictos con otros tests
      const fecha = tomorrow.toISOString().split('T')[0];

      const { setRLSContext } = require('../helpers/db-helper');
      await setRLSContext(tempClient, testOrg.id);

      const horarioResult = await tempClient.query(
        `INSERT INTO horarios_disponibilidad (
          organizacion_id, profesional_id, fecha, hora_inicio, hora_fin, estado, tipo_horario
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`,
        [testOrg.id, testProfesional.id, fecha, '14:00:00', '15:00:00', 'disponible', 'franja_especifica']
      );
      const horarioId = horarioResult.rows[0].id;
      tempClient.release();

      // Ahora reservar ese horario temporalmente
      const response = await request(app)
        .post('/api/v1/horarios/reservar-temporal')
        .send({
          horario_id: horarioId,
          organizacion_id: testOrg.id,
          duracion_minutos: 15
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
    });

    test('Falla sin campos requeridos', async () => {
      const response = await request(app)
        .post('/api/v1/horarios/reservar-temporal')
        .send({
          organizacion_id: testOrg.id
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Listar Horarios
  // ============================================================================

  describe('GET /api/v1/horarios', () => {
    test('Listar horarios de la organización', async () => {
      const response = await request(app)
        .get('/api/v1/horarios')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
    });

    test('Listar horarios con filtros', async () => {
      const response = await request(app)
        .get('/api/v1/horarios')
        .query({ profesional_id: testProfesional.id })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get('/api/v1/horarios')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Obtener Horario por ID
  // ============================================================================

  describe('GET /api/v1/horarios/:id', () => {
    test('Obtener horario por ID', async () => {
      // Crear horario para probar
      const tempClient = await global.testPool.connect();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const fecha = tomorrow.toISOString().split('T')[0];

      const { bypassRLS, setRLSContext } = require('../helpers/db-helper');
      await setRLSContext(tempClient, testOrg.id);

      const result = await tempClient.query(
        `INSERT INTO horarios_disponibilidad (
          organizacion_id, profesional_id, fecha, hora_inicio, hora_fin, dia_semana, estado, tipo_horario
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          testOrg.id,
          testProfesional.id,
          fecha,
          '09:00:00',
          '18:00:00',
          tomorrow.getDay(),
          'disponible',
          'franja_especifica'
        ]
      );
      const horario = result.rows[0];
      tempClient.release();

      const response = await request(app)
        .get(`/api/v1/horarios/${horario.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get('/api/v1/horarios/1')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Actualizar Horario
  // ============================================================================

  describe('PUT /api/v1/horarios/:id', () => {
    test('Actualizar horario con rol admin', async () => {
      // Crear horario para actualizar
      const tempClient = await global.testPool.connect();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 3);
      const fecha = tomorrow.toISOString().split('T')[0];

      const { setRLSContext } = require('../helpers/db-helper');
      await setRLSContext(tempClient, testOrg.id);

      const result = await tempClient.query(
        `INSERT INTO horarios_disponibilidad (
          organizacion_id, profesional_id, fecha, hora_inicio, hora_fin, dia_semana, estado, tipo_horario
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          testOrg.id,
          testProfesional.id,
          fecha,
          '09:00:00',
          '18:00:00',
          tomorrow.getDay(),
          'disponible',
          'franja_especifica'
        ]
      );
      const horario = result.rows[0];
      tempClient.release();

      const updateData = {
        hora_inicio: '10:00:00',
        hora_fin: '19:00:00'
      };

      const response = await request(app)
        .put(`/api/v1/horarios/${horario.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .put('/api/v1/horarios/1')
        .send({ hora_inicio: '10:00:00' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Eliminar Horario
  // ============================================================================

  describe('DELETE /api/v1/horarios/:id', () => {
    test('Eliminar horario con rol admin', async () => {
      // Crear horario temporal para eliminar
      const tempClient = await global.testPool.connect();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 4);
      const fecha = tomorrow.toISOString().split('T')[0];

      const { setRLSContext } = require('../helpers/db-helper');
      await setRLSContext(tempClient, testOrg.id);

      const result = await tempClient.query(
        `INSERT INTO horarios_disponibilidad (
          organizacion_id, profesional_id, fecha, hora_inicio, hora_fin, dia_semana, estado, tipo_horario
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          testOrg.id,
          testProfesional.id,
          fecha,
          '09:00:00',
          '18:00:00',
          tomorrow.getDay(),
          'disponible',
          'franja_especifica'
        ]
      );
      const horario = result.rows[0];
      tempClient.release();

      const response = await request(app)
        .delete(`/api/v1/horarios/${horario.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .delete('/api/v1/horarios/1')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Liberar Reserva Temporal
  // ============================================================================

  describe('POST /api/v1/horarios/liberar-reserva', () => {
    test('Liberar reserva temporal', async () => {
      // Crear horario temporal para liberar
      const tempClient = await global.testPool.connect();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 5);
      const fecha = tomorrow.toISOString().split('T')[0];

      const { setRLSContext } = require('../helpers/db-helper');
      await setRLSContext(tempClient, testOrg.id);

      const horarioResult = await tempClient.query(
        `INSERT INTO horarios_disponibilidad (
          organizacion_id, profesional_id, fecha, hora_inicio, hora_fin, estado, tipo_horario, reservado_hasta
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + INTERVAL '15 minutes')
        RETURNING id`,
        [testOrg.id, testProfesional.id, fecha, '10:00:00', '11:00:00', 'reservado_temporal', 'franja_especifica']
      );
      const horarioId = horarioResult.rows[0].id;
      tempClient.release();

      const response = await request(app)
        .post('/api/v1/horarios/liberar-reserva')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          horario_id: horarioId,
          organizacion_id: testOrg.id
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .post('/api/v1/horarios/liberar-reserva')
        .send({
          horario_id: 1,
          organizacion_id: 1
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Limpiar Reservas Expiradas
  // ============================================================================

  describe('POST /api/v1/horarios/limpiar-reservas-expiradas', () => {
    test('Limpiar reservas expiradas con rol admin', async () => {
      const response = await request(app)
        .post('/api/v1/horarios/limpiar-reservas-expiradas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          organizacion_id: testOrg.id
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('reservas_limpiadas');
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .post('/api/v1/horarios/limpiar-reservas-expiradas')
        .send({
          organizacion_id: testOrg.id
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Aislamiento RLS Multi-Tenant
  // ============================================================================
  describe('Aislamiento RLS Multi-Tenant', () => {
    let testHorario;

    beforeAll(async () => {
      const tempClient = await global.testPool.connect();
      const { setRLSContext } = require('../helpers/db-helper');

      // Generar fecha futura (7 días desde hoy)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const fecha = futureDate.toISOString().split('T')[0];

      await setRLSContext(tempClient, testOrg.id);

      // Crear horario de disponibilidad para testProfesional
      const result = await tempClient.query(`
        INSERT INTO horarios_disponibilidad (
          organizacion_id, profesional_id, fecha, hora_inicio, hora_fin, estado, tipo_horario
        ) VALUES ($1, $2, $3, '09:00:00', '17:00:00', 'disponible', 'franja_especifica')
        RETURNING *
      `, [testOrg.id, testProfesional.id, fecha]);

      testHorario = result.rows[0];
      tempClient.release();
    });

    test('❌ CRÍTICO: Admin de otra org NO puede ver horario', async () => {
      const response = await request(app)
        .get(`/api/v1/horarios/${testHorario.id}`)
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .expect(200);

      // RLS debe bloquear retornando array vacío
      expect(response.body.success).toBe(true);
      expect(response.body.data.horarios).toBeDefined();
      expect(response.body.data.horarios.length).toBe(0);
    });

    test('❌ CRÍTICO: Admin de otra org NO puede actualizar horario', async () => {
      const response = await request(app)
        .put(`/api/v1/horarios/${testHorario.id}`)
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .send({ hora_inicio: '10:00' });

      // RLS debe bloquear con 403 o 404
      expect([403, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('❌ CRÍTICO: Listar horarios NO muestra horarios de otras orgs', async () => {
      const response = await request(app)
        .get(`/api/v1/horarios/profesional/${testProfesional.id}`)
        .set('Authorization', `Bearer ${otherOrgToken}`);

      // RLS debe bloquear (puede retornar array vacío o error)
      if (response.status === 200) {
        const horarios = response.body.data || [];
        expect(horarios.length).toBe(0);
      } else {
        expect([403, 404]).toContain(response.status);
      }
    });

    test('✅ Admin SÍ puede ver su propio horario', async () => {
      const response = await request(app)
        .get(`/api/v1/horarios/${testHorario.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.horarios).toBeDefined();
      expect(response.body.data.horarios.length).toBe(1);
      expect(response.body.data.horarios[0].id).toBe(testHorario.id);
    });
  });
});

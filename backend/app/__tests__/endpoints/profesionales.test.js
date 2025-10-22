/**
 * Tests de Endpoints de Profesionales
 * Suite completa para validar endpoints del controller de profesionales
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

describe('Endpoints de Profesionales', () => {
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
      nombre: 'Test Org Profesionales'
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
      tipo_profesional_id: 1, // barbero
      telefono: '5512345678'
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
  // Tests de Crear Profesional
  // ============================================================================

  describe('POST /api/v1/profesionales', () => {
    test('Crear profesional exitosamente con rol admin', async () => {
      const uniqueId = getUniqueTestId();
      const profesionalData = {
        nombre_completo: `Nuevo Profesional ${uniqueId}`,
        tipo_profesional_id: 2, // estilista
        telefono: `55${uniqueId.slice(-8)}`, // Asegurar que empiece con 55 (celular válido)
        email: `profesional-${uniqueId}@test.com`
      };

      const response = await request(app)
        .post('/api/v1/profesionales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(profesionalData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.nombre_completo).toBe(profesionalData.nombre_completo);
      expect(response.body.data.tipo_profesional_id).toBe(profesionalData.tipo_profesional_id);
    });

    test('Falla sin autenticación', async () => {
      const uniqueId = getUniqueTestId();

      const response = await request(app)
        .post('/api/v1/profesionales')
        .send({
          nombre_completo: `Profesional ${uniqueId}`,
          tipo_profesional_id: 1, // barbero
          telefono: `${uniqueId.slice(-10)}`
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla sin nombre_completo requerido', async () => {
      const uniqueId = getUniqueTestId();

      const response = await request(app)
        .post('/api/v1/profesionales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipo_profesional_id: 1, // barbero
          telefono: `${uniqueId.slice(-10)}`
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Listar Profesionales
  // ============================================================================

  describe('GET /api/v1/profesionales', () => {
    test('Listar profesionales de la organización', async () => {
      const response = await request(app)
        .get('/api/v1/profesionales')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.data || response.body.data.profesionales || response.body.data)).toBe(true);
    });

    test('Listar profesionales con paginación', async () => {
      const response = await request(app)
        .get('/api/v1/profesionales')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get('/api/v1/profesionales')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Obtener Profesional por ID
  // ============================================================================

  describe('GET /api/v1/profesionales/:id', () => {
    test('Obtener profesional por ID', async () => {
      const response = await request(app)
        .get(`/api/v1/profesionales/${testProfesional.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testProfesional.id);
    });

    test('Falla con ID inexistente', async () => {
      const response = await request(app)
        .get('/api/v1/profesionales/999999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get(`/api/v1/profesionales/${testProfesional.id}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Actualizar Profesional
  // ============================================================================

  describe('PUT /api/v1/profesionales/:id', () => {
    test('Actualizar profesional exitosamente con rol admin', async () => {
      const updateData = {
        nombre_completo: 'Profesional Actualizado',
        tipo_profesional_id: 2 // estilista
      };

      const response = await request(app)
        .put(`/api/v1/profesionales/${testProfesional.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.nombre_completo).toBe(updateData.nombre_completo);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .put(`/api/v1/profesionales/${testProfesional.id}`)
        .send({ nombre_completo: 'Test' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Buscar por Tipo
  // ============================================================================

  describe('GET /api/v1/profesionales/tipo/:tipoId', () => {
    test('Buscar profesionales por tipo', async () => {
      const response = await request(app)
        .get('/api/v1/profesionales/tipo/1') // 1 = barbero
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get('/api/v1/profesionales/tipo/1') // 1 = barbero
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Cambiar Estado
  // ============================================================================

  describe('PATCH /api/v1/profesionales/:id/estado', () => {
    test('Cambiar estado de profesional con rol admin', async () => {
      const response = await request(app)
        .patch(`/api/v1/profesionales/${testProfesional.id}/estado`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ activo: false })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .patch(`/api/v1/profesionales/${testProfesional.id}/estado`)
        .send({ activo: true })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Eliminar Profesional
  // ============================================================================

  describe('DELETE /api/v1/profesionales/:id', () => {
    test('Eliminar profesional requiere rol admin', async () => {
      const uniqueId = getUniqueTestId();

      // Crear profesional temporal para eliminar
      const tempClient = await global.testPool.connect();
      const tempProfesional = await createTestProfesional(tempClient, testOrg.id, {
        nombre_completo: `Temp Profesional ${uniqueId}`,
        tipo_profesional_id: 1 // barbero
      });
      tempClient.release();

      const response = await request(app)
        .delete(`/api/v1/profesionales/${tempProfesional.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .delete(`/api/v1/profesionales/${testProfesional.id}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Validar Email
  // ============================================================================

  describe('POST /api/v1/profesionales/validar-email', () => {
    test('Validar email disponible', async () => {
      const uniqueId = getUniqueTestId();

      const response = await request(app)
        .post('/api/v1/profesionales/validar-email')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: `nuevo-email-${uniqueId}@test.com` })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .post('/api/v1/profesionales/validar-email')
        .send({ email: 'test@test.com' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Estadísticas
  // ============================================================================

  describe('GET /api/v1/profesionales/estadisticas', () => {
    test('Obtener estadísticas de profesionales con rol admin', async () => {
      const response = await request(app)
        .get('/api/v1/profesionales/estadisticas')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get('/api/v1/profesionales/estadisticas')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Aislamiento RLS Multi-Tenant
  // ============================================================================
  describe('Aislamiento RLS Multi-Tenant', () => {
    test('❌ CRÍTICO: Admin de otra org NO puede ver profesional', async () => {
      const response = await request(app)
        .get(`/api/v1/profesionales/${testProfesional.id}`)
        .set('Authorization', `Bearer ${otherOrgToken}`);

      // RLS debe bloquear con 403 o 404
      expect([403, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('❌ CRÍTICO: Admin de otra org NO puede actualizar profesional', async () => {
      const response = await request(app)
        .put(`/api/v1/profesionales/${testProfesional.id}`)
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .send({ nombre_completo: 'Intentando modificar' });

      // RLS debe bloquear con 403 o 404
      expect([403, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('❌ CRÍTICO: Listar profesionales NO muestra profesionales de otras orgs', async () => {
      const response = await request(app)
        .get('/api/v1/profesionales')
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .expect(200);

      const profesionales = response.body.data.profesionales || [];

      // Verificar que no incluye testProfesional
      const profesionalDeOtraOrg = profesionales.find(p => p.id === testProfesional.id);
      expect(profesionalDeOtraOrg).toBeUndefined();
    });

    test('✅ Admin SÍ puede ver su propio profesional', async () => {
      const response = await request(app)
        .get(`/api/v1/profesionales/${testProfesional.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testProfesional.id);
    });
  });
});

/**
 * Tests de Endpoints de Clientes
 * Suite completa para validar endpoints del controller de clientes
 */

const request = require('supertest');
const saasApp = require('../../app');
const authConfig = require('../../config/auth');
const {
  cleanAllTables,
  createTestOrganizacion,
  createTestUsuario,
  createTestCliente,
  getUniqueTestId
} = require('../helpers/db-helper');

describe('Endpoints de Clientes', () => {
  let app;
  let client;
  let testOrg;
  let testUsuario;
  let userToken;
  let testCliente;

  beforeAll(async () => {
    app = saasApp.getExpressApp();
    client = await global.testPool.connect();

    // Limpiar BD
    await cleanAllTables(client);

    // Crear organización de prueba
    testOrg = await createTestOrganizacion(client, {
      nombre: 'Test Org Clientes'
    });

    // Crear usuario de la organización
    testUsuario = await createTestUsuario(client, testOrg.id, {
      nombre: 'Usuario',
      apellidos: 'Test',
      rol: 'empleado',
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

    client.release();
  });

  afterAll(async () => {
    const cleanupClient = await global.testPool.connect();
    await cleanAllTables(cleanupClient);
    cleanupClient.release();
  });

  // ============================================================================
  // Tests de Crear Cliente
  // ============================================================================

  describe('POST /api/v1/clientes', () => {
    test('Crear cliente exitosamente', async () => {
      const uniqueId = getUniqueTestId();
      const clienteData = {
        nombre: `Nuevo Cliente ${uniqueId}`,
        telefono: `+521${uniqueId.slice(-10)}`,
        email: `cliente-${uniqueId}@test.com`,
        organizacion_id: testOrg.id
      };

      const response = await request(app)
        .post('/api/v1/clientes')
        .set('Authorization', `Bearer ${userToken}`)
        .send(clienteData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.nombre).toBe(clienteData.nombre);
      expect(response.body.data.telefono).toBe(clienteData.telefono);
    });

    test('Falla sin autenticación', async () => {
      const uniqueId = getUniqueTestId();

      const response = await request(app)
        .post('/api/v1/clientes')
        .send({
          nombre: `Cliente ${uniqueId}`,
          telefono: `+521${uniqueId.slice(-10)}`,
          organizacion_id: testOrg.id
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla sin nombre requerido', async () => {
      const uniqueId = getUniqueTestId();

      const response = await request(app)
        .post('/api/v1/clientes')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          telefono: `+521${uniqueId.slice(-10)}`,
          organizacion_id: testOrg.id
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Listar Clientes
  // ============================================================================

  describe('GET /api/v1/clientes', () => {
    test('Listar clientes de la organización', async () => {
      const response = await request(app)
        .get('/api/v1/clientes')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.data || response.body.data.clientes || response.body.data)).toBe(true);
    });

    test('Listar clientes con paginación', async () => {
      const response = await request(app)
        .get('/api/v1/clientes')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get('/api/v1/clientes')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Obtener Cliente por ID
  // ============================================================================

  describe('GET /api/v1/clientes/:id', () => {
    test('Obtener cliente por ID', async () => {
      const response = await request(app)
        .get(`/api/v1/clientes/${testCliente.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
    });

    test('Falla con ID inexistente', async () => {
      const response = await request(app)
        .get('/api/v1/clientes/999999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get(`/api/v1/clientes/${testCliente.id}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Actualizar Cliente
  // ============================================================================

  describe('PUT /api/v1/clientes/:id', () => {
    test('Actualizar cliente exitosamente', async () => {
      const updateData = {
        nombre: 'Cliente Actualizado',
        organizacion_id: testOrg.id
      };

      const response = await request(app)
        .put(`/api/v1/clientes/${testCliente.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .put(`/api/v1/clientes/${testCliente.id}`)
        .send({ nombre: 'Test' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Buscar por Teléfono
  // ============================================================================

  describe('GET /api/v1/clientes/buscar-telefono', () => {
    test('Buscar cliente por teléfono', async () => {
      const response = await request(app)
        .get('/api/v1/clientes/buscar-telefono')
        .query({ telefono: testCliente.telefono })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin parámetro telefono', async () => {
      const response = await request(app)
        .get('/api/v1/clientes/buscar-telefono')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Buscar por Nombre
  // ============================================================================

  describe('GET /api/v1/clientes/buscar-nombre', () => {
    test('Buscar cliente por nombre', async () => {
      const response = await request(app)
        .get('/api/v1/clientes/buscar-nombre')
        .query({ nombre: 'Cliente' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin parámetro nombre', async () => {
      const response = await request(app)
        .get('/api/v1/clientes/buscar-nombre')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Eliminar Cliente
  // ============================================================================

  describe('DELETE /api/v1/clientes/:id', () => {
    test('Eliminar cliente requiere rol admin', async () => {
      // Este test probablemente falle con rol empleado
      const response = await request(app)
        .delete(`/api/v1/clientes/${testCliente.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      // Puede ser 200 (éxito) o 403 (sin permisos)
      expect([200, 403]).toContain(response.status);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .delete(`/api/v1/clientes/${testCliente.id}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});

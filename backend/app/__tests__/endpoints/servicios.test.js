/**
 * Tests de Endpoints de Servicios
 * Suite completa para validar endpoints del controller de servicios
 */

const request = require('supertest');
const saasApp = require('../../app');
const authConfig = require('../../config/auth');
const {
  cleanAllTables,
  createTestOrganizacion,
  createTestUsuario,
  createTestServicio,
  createTestProfesional,
  getUniqueTestId
} = require('../helpers/db-helper');

describe('Endpoints de Servicios', () => {
  let app;
  let client;
  let testOrg;
  let testUsuario;
  let userToken;
  let testServicio;
  let testProfesional;

  beforeAll(async () => {
    app = saasApp.getExpressApp();
    client = await global.testPool.connect();

    // Limpiar BD
    await cleanAllTables(client);

    // Crear organización de prueba
    testOrg = await createTestOrganizacion(client, {
      nombre: 'Test Org Servicios'
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

    // Crear servicio de prueba
    testServicio = await createTestServicio(client, testOrg.id, {
      nombre: 'Servicio Test',
      duracion_minutos: 30,
      precio: 150.00
    });

    // Crear profesional de prueba para asignación
    testProfesional = await createTestProfesional(client, testOrg.id, {
      nombre_completo: 'Profesional Test',
      tipo_profesional: 'barbero'
    });

    client.release();
  });

  afterAll(async () => {
    const cleanupClient = await global.testPool.connect();
    await cleanAllTables(cleanupClient);
    cleanupClient.release();
  });

  // ============================================================================
  // Tests de Crear Servicio
  // ============================================================================

  describe('POST /api/v1/servicios', () => {
    test('Crear servicio exitosamente', async () => {
      const uniqueId = getUniqueTestId();
      const servicioData = {
        nombre: `Nuevo Servicio ${uniqueId}`,
        descripcion: 'Servicio de prueba',
        duracion_minutos: 45,
        precio: 200.00,
        categoria: 'Cabello'
      };

      const response = await request(app)
        .post('/api/v1/servicios')
        .set('Authorization', `Bearer ${userToken}`)
        .send(servicioData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.nombre).toBe(servicioData.nombre);
      expect(response.body.data.duracion_minutos).toBe(servicioData.duracion_minutos);
      expect(parseFloat(response.body.data.precio)).toBe(servicioData.precio);
    });

    test('Falla sin autenticación', async () => {
      const uniqueId = getUniqueTestId();

      const response = await request(app)
        .post('/api/v1/servicios')
        .send({
          nombre: `Servicio ${uniqueId}`,
          duracion_minutos: 30,
          precio: 100.00
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla sin nombre requerido', async () => {
      const response = await request(app)
        .post('/api/v1/servicios')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          duracion_minutos: 30,
          precio: 100.00
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla con duración inválida (fuera de rango)', async () => {
      const uniqueId = getUniqueTestId();

      const response = await request(app)
        .post('/api/v1/servicios')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nombre: `Servicio ${uniqueId}`,
          duracion_minutos: 500, // Más de 480 minutos
          precio: 100.00
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Listar Servicios
  // ============================================================================

  describe('GET /api/v1/servicios', () => {
    test('Listar servicios de la organización', async () => {
      const response = await request(app)
        .get('/api/v1/servicios')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.data || response.body.data.servicios || response.body.data)).toBe(true);
    });

    test('Listar servicios con paginación', async () => {
      const response = await request(app)
        .get('/api/v1/servicios')
        .query({ pagina: 1, limite: 10 })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Listar servicios con filtros', async () => {
      const response = await request(app)
        .get('/api/v1/servicios')
        .query({ activo: true, precio_min: 50, precio_max: 500 })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get('/api/v1/servicios')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Obtener Servicio por ID
  // ============================================================================

  describe('GET /api/v1/servicios/:id', () => {
    test('Obtener servicio por ID', async () => {
      const response = await request(app)
        .get(`/api/v1/servicios/${testServicio.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testServicio.id);
    });

    test('Falla con ID inexistente', async () => {
      const response = await request(app)
        .get('/api/v1/servicios/999999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get(`/api/v1/servicios/${testServicio.id}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Actualizar Servicio
  // ============================================================================

  describe('PUT /api/v1/servicios/:id', () => {
    test('Actualizar servicio exitosamente', async () => {
      const updateData = {
        nombre: 'Servicio Actualizado',
        precio: 250.00
      };

      const response = await request(app)
        .put(`/api/v1/servicios/${testServicio.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .put(`/api/v1/servicios/${testServicio.id}`)
        .send({ nombre: 'Test' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Buscar Servicios
  // ============================================================================

  describe('GET /api/v1/servicios/buscar', () => {
    test('Buscar servicios por término', async () => {
      const response = await request(app)
        .get('/api/v1/servicios/buscar')
        .query({ termino: 'Servicio' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
    });

    test('Falla sin parámetro termino', async () => {
      const response = await request(app)
        .get('/api/v1/servicios/buscar')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get('/api/v1/servicios/buscar')
        .query({ termino: 'Test' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Eliminar Servicio
  // ============================================================================

  describe('DELETE /api/v1/servicios/:id', () => {
    test('Eliminar servicio (soft delete)', async () => {
      const uniqueId = getUniqueTestId();

      // Crear servicio temporal para eliminar
      const tempClient = await global.testPool.connect();
      const tempServicio = await createTestServicio(tempClient, testOrg.id, {
        nombre: `Temp Servicio ${uniqueId}`,
        duracion_minutos: 30,
        precio: 100.00
      });
      tempClient.release();

      const response = await request(app)
        .delete(`/api/v1/servicios/${tempServicio.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .delete(`/api/v1/servicios/${testServicio.id}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Asignar Profesional a Servicio
  // ============================================================================

  describe('POST /api/v1/servicios/:id/profesionales', () => {
    test('Asignar profesional a servicio', async () => {
      const response = await request(app)
        .post(`/api/v1/servicios/${testServicio.id}/profesionales`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          profesional_id: testProfesional.id,
          configuracion: {
            precio_personalizado: 175.00
          }
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin profesional_id', async () => {
      const response = await request(app)
        .post(`/api/v1/servicios/${testServicio.id}/profesionales`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          configuracion: {}
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .post(`/api/v1/servicios/${testServicio.id}/profesionales`)
        .send({ profesional_id: testProfesional.id })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Obtener Profesionales de Servicio
  // ============================================================================

  describe('GET /api/v1/servicios/:id/profesionales', () => {
    test('Obtener profesionales de un servicio', async () => {
      const response = await request(app)
        .get(`/api/v1/servicios/${testServicio.id}/profesionales`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get(`/api/v1/servicios/${testServicio.id}/profesionales`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Desasignar Profesional de Servicio
  // ============================================================================

  describe('DELETE /api/v1/servicios/:id/profesionales/:profesional_id', () => {
    test('Desasignar profesional de servicio', async () => {
      const response = await request(app)
        .delete(`/api/v1/servicios/${testServicio.id}/profesionales/${testProfesional.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .delete(`/api/v1/servicios/${testServicio.id}/profesionales/${testProfesional.id}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Estadísticas
  // ============================================================================

  describe('GET /api/v1/servicios/estadisticas', () => {
    test('Obtener estadísticas de servicios', async () => {
      const response = await request(app)
        .get('/api/v1/servicios/estadisticas')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get('/api/v1/servicios/estadisticas')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});

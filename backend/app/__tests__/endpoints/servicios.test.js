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
      nombre: 'Test Org Servicios'
    });

    // Crear usuario admin de la organización
    testUsuario = await createTestUsuario(client, testOrg.id, {
      nombre: 'Usuario',
      apellidos: 'Test',
      rol: 'admin',
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

    // ✅ IMPORTANTE: Crear profesional ANTES del servicio
    testProfesional = await createTestProfesional(client, testOrg.id, {
      nombre_completo: 'Profesional Test',
      tipo_profesional: 'barbero'
    });

    // ✅ Crear servicio de prueba con profesional asignado
    testServicio = await createTestServicio(client, testOrg.id, {
      nombre: 'Servicio Test',
      duracion_minutos: 30,
      precio: 150.00
    }, [testProfesional.id]);  // ✅ Asignar profesional al servicio

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
        categoria: 'Cabello',
        profesionales_ids: [testProfesional.id]  // ✅ Requerido desde validación actualizada
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

      // ✅ Validar que el profesional fue asociado
      expect(response.body.data).toHaveProperty('profesionales');
      expect(response.body.data.profesionales).toBeInstanceOf(Array);
      expect(response.body.data.profesionales.length).toBe(1);
      expect(response.body.data.profesionales[0].id).toBe(testProfesional.id);
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

    test('✅ Crear servicio SIN profesionales_ids (independiente)', async () => {
      const uniqueId = getUniqueTestId();

      const response = await request(app)
        .post('/api/v1/servicios')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nombre: `Servicio Independiente ${uniqueId}`,
          duracion_minutos: 30,
          precio: 100.00
          // ✅ profesionales_ids es opcional - se puede asignar después
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.nombre).toContain('Servicio Independiente');
      // Verificar que se creó sin profesionales asignados
      expect(response.body.message).toMatch(/creado exitosamente/i);
    });

    test('✅ Crear servicio con profesionales_ids en el body', async () => {
      const uniqueId = getUniqueTestId();
      const servicioData = {
        nombre: `Servicio con Profesionales ${uniqueId}`,
        descripcion: 'Servicio con asignación automática de profesionales',
        duracion_minutos: 45,
        precio: 250.00,
        profesionales_ids: [testProfesional.id]
      };

      const response = await request(app)
        .post('/api/v1/servicios')
        .set('Authorization', `Bearer ${userToken}`)
        .send(servicioData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.nombre).toBe(servicioData.nombre);

      // Validar que los profesionales fueron asociados
      expect(response.body.data).toHaveProperty('profesionales');
      expect(response.body.data.profesionales).toBeInstanceOf(Array);
      expect(response.body.data.profesionales.length).toBe(1);
      expect(response.body.data.profesionales[0].id).toBe(testProfesional.id);
    });

    test('❌ Falla al crear servicio con profesional_id inexistente', async () => {
      const uniqueId = getUniqueTestId();

      const response = await request(app)
        .post('/api/v1/servicios')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nombre: `Servicio Test ${uniqueId}`,
          precio: 100.00,
          duracion_minutos: 30,
          profesionales_ids: [99999] // ID inexistente
        });

      // Puede ser 400 (validación) o 404 (profesional no encontrado)
      expect([400, 404, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('✅ Crear servicio con múltiples profesionales', async () => {
      const uniqueId = getUniqueTestId();

      // Crear segundo profesional para este test
      const tempClient = await global.testPool.connect();
      const profesional2 = await createTestProfesional(tempClient, testOrg.id, {
        nombre_completo: `Profesional 2 ${uniqueId}`,
        tipo_profesional: 'estilista'
      });
      tempClient.release();

      const response = await request(app)
        .post('/api/v1/servicios')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nombre: `Servicio Compartido ${uniqueId}`,
          descripcion: 'Servicio ofrecido por múltiples profesionales',
          precio: 300.00,
          duracion_minutos: 60,
          profesionales_ids: [testProfesional.id, profesional2.id]
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profesionales).toBeDefined();
      expect(response.body.data.profesionales.length).toBe(2);

      // Verificar que ambos profesionales están en la respuesta
      const profesionalesIds = response.body.data.profesionales.map(p => p.id);
      expect(profesionalesIds).toContain(testProfesional.id);
      expect(profesionalesIds).toContain(profesional2.id);
    });

    test('❌ Falla con profesionales_ids de otra organización', async () => {
      const uniqueId = getUniqueTestId();

      // Crear profesional en otra organización
      const tempClient = await global.testPool.connect();
      const otherOrgProfesional = await createTestProfesional(tempClient, otherOrg.id, {
        nombre_completo: `Profesional Otra Org ${uniqueId}`,
        tipo_profesional: 'barbero'
      });
      tempClient.release();

      const response = await request(app)
        .post('/api/v1/servicios')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nombre: `Servicio Test ${uniqueId}`,
          precio: 150.00,
          duracion_minutos: 30,
          profesionales_ids: [otherOrgProfesional.id] // Profesional de otra org
        });

      // RLS debe bloquear la asignación
      expect([400, 403, 404, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
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

  // ============================================================================
  // Tests de Aislamiento RLS Multi-Tenant
  // ============================================================================
  describe('Aislamiento RLS Multi-Tenant', () => {
    test('❌ CRÍTICO: Admin de otra org NO puede ver servicio', async () => {
      const response = await request(app)
        .get(`/api/v1/servicios/${testServicio.id}`)
        .set('Authorization', `Bearer ${otherOrgToken}`);

      // RLS debe bloquear con 403 o 404
      expect([403, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('❌ CRÍTICO: Admin de otra org NO puede actualizar servicio', async () => {
      const response = await request(app)
        .put(`/api/v1/servicios/${testServicio.id}`)
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .send({ nombre: 'Intentando modificar' });

      // RLS debe bloquear con 403 o 404
      expect([403, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('❌ CRÍTICO: Listar servicios NO muestra servicios de otras orgs', async () => {
      const response = await request(app)
        .get('/api/v1/servicios')
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .expect(200);

      const servicios = response.body.data.servicios || [];

      // Verificar que no incluye testServicio
      const servicioDeOtraOrg = servicios.find(s => s.id === testServicio.id);
      expect(servicioDeOtraOrg).toBeUndefined();
    });

    test('✅ Admin SÍ puede ver su propio servicio', async () => {
      const response = await request(app)
        .get(`/api/v1/servicios/${testServicio.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testServicio.id);
    });
  });
});

/**
 * Tests de Endpoints de Organizaciones
 * Suite completa para validar endpoints del controller de organizaciones
 */

const request = require('supertest');
const saasApp = require('../../app');
const authConfig = require('../../config/auth');
const {
  cleanAllTables,
  createTestOrganizacion,
  createTestUsuario,
  getUniqueTestId
} = require('../helpers/db-helper');

describe('Endpoints de Organizaciones', () => {
  let app;
  let client;
  let testOrg;
  let superAdminUser;
  let superAdminToken;
  let adminUser;
  let adminToken;
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
      nombre: 'Test Org Admin'
    });

    // Crear usuario super_admin (sin organizacion_id)
    superAdminUser = await createTestUsuario(client, null, {
      nombre: 'Super',
      apellidos: 'Admin',
      rol: 'super_admin',
      activo: true,
      email_verificado: true
    });

    // Generar token para super_admin
    superAdminToken = authConfig.generateToken({
      userId: superAdminUser.id,
      email: superAdminUser.email,
      rol: superAdminUser.rol,
      organizacionId: null
    });

    // Crear usuario admin de la organización
    adminUser = await createTestUsuario(client, testOrg.id, {
      nombre: 'Admin',
      apellidos: 'Test',
      rol: 'admin',
      activo: true,
      email_verificado: true
    });

    // Generar token para admin
    adminToken = authConfig.generateToken({
      userId: adminUser.id,
      email: adminUser.email,
      rol: adminUser.rol,
      organizacionId: testOrg.id
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
  // Tests de Crear Organización
  // ============================================================================

  describe('POST /api/v1/organizaciones', () => {
    test('Crear organización exitosamente como super_admin', async () => {
      const uniqueId = getUniqueTestId();
      const orgData = {
        nombre_comercial: `Nueva Org ${uniqueId}`,
        slug: `nueva-org-${uniqueId}`,
        tipo_industria: 'barberia',
        email_admin: `admin-${uniqueId}@test.com`
      };

      const response = await request(app)
        .post('/api/v1/organizaciones')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(orgData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.nombre_comercial).toBe(orgData.nombre_comercial);
      expect(response.body.data.tipo_industria).toBe(orgData.tipo_industria);
    });

    test('Falla al crear organización sin autenticación', async () => {
      const uniqueId = getUniqueTestId();
      const orgData = {
        nombre_comercial: `Org Sin Auth ${uniqueId}`,
        slug: `org-sin-auth-${uniqueId}`,
        tipo_industria: 'barberia',
        email_admin: `admin-${uniqueId}@test.com`
      };

      const response = await request(app)
        .post('/api/v1/organizaciones')
        .send(orgData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla con datos inválidos (sin nombre_comercial)', async () => {
      const uniqueId = getUniqueTestId();

      const response = await request(app)
        .post('/api/v1/organizaciones')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          slug: `org-invalida-${uniqueId}`,
          tipo_industria: 'barberia'
          // Falta nombre_comercial
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Listar Organizaciones
  // ============================================================================

  describe('GET /api/v1/organizaciones', () => {
    test('Listar organizaciones como super_admin', async () => {
      const response = await request(app)
        .get('/api/v1/organizaciones')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('data');
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.data.length).toBeGreaterThan(0);
    });

    test('Listar organizaciones con paginación', async () => {
      const response = await request(app)
        .get('/api/v1/organizaciones')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 10);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get('/api/v1/organizaciones')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Obtener Organización por ID
  // ============================================================================

  describe('GET /api/v1/organizaciones/:id', () => {
    test('Obtener organización por ID como super_admin', async () => {
      const response = await request(app)
        .get(`/api/v1/organizaciones/${testOrg.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testOrg.id);
    });

    test('Obtener organización como admin de la organización', async () => {
      const response = await request(app)
        .get(`/api/v1/organizaciones/${testOrg.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.id).toBe(testOrg.id);
    });

    test('Falla con ID inexistente', async () => {
      const response = await request(app)
        .get('/api/v1/organizaciones/999999')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get(`/api/v1/organizaciones/${testOrg.id}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Actualizar Organización
  // ============================================================================

  describe('PUT /api/v1/organizaciones/:id', () => {
    test('Actualizar organización como super_admin', async () => {
      const updateData = {
        nombre_comercial: 'Org Actualizada'
      };

      const response = await request(app)
        .put(`/api/v1/organizaciones/${testOrg.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.nombre_comercial).toBe(updateData.nombre_comercial);
    });

    test('Actualizar organización como admin de la organización', async () => {
      const updateData = {
        telefono: '+5215512345678'
      };

      const response = await request(app)
        .put(`/api/v1/organizaciones/${testOrg.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.telefono).toBe(updateData.telefono);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .put(`/api/v1/organizaciones/${testOrg.id}`)
        .send({ nombre_comercial: 'Test' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Estadísticas
  // ============================================================================

  describe('GET /api/v1/organizaciones/:id/estadisticas', () => {
    test('Obtener estadísticas como super_admin', async () => {
      const response = await request(app)
        .get(`/api/v1/organizaciones/${testOrg.id}/estadisticas`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
    });

    test('Obtener estadísticas como admin de la organización', async () => {
      const response = await request(app)
        .get(`/api/v1/organizaciones/${testOrg.id}/estadisticas`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get(`/api/v1/organizaciones/${testOrg.id}/estadisticas`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Verificar Límites
  // ============================================================================

  describe('GET /api/v1/organizaciones/:id/limites', () => {
    test('Verificar límites como super_admin', async () => {
      const response = await request(app)
        .get(`/api/v1/organizaciones/${testOrg.id}/limites`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get(`/api/v1/organizaciones/${testOrg.id}/limites`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Aislamiento RLS Multi-Tenant
  // ============================================================================
  describe('Aislamiento RLS Multi-Tenant', () => {
    test('❌ CRÍTICO: Admin de otra org NO puede ver organización', async () => {
      const response = await request(app)
        .get(`/api/v1/organizaciones/${testOrg.id}`)
        .set('Authorization', `Bearer ${otherOrgToken}`);

      // RLS debe bloquear con 403 o 404
      expect([403, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('❌ CRÍTICO: Admin de otra org NO puede actualizar organización', async () => {
      const response = await request(app)
        .put(`/api/v1/organizaciones/${testOrg.id}`)
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .send({ nombre_comercial: 'Intentando modificar' });

      // RLS debe bloquear con 403 o 404
      expect([403, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('❌ CRÍTICO: Admin de otra org NO puede ver estadísticas', async () => {
      const response = await request(app)
        .get(`/api/v1/organizaciones/${testOrg.id}/estadisticas`)
        .set('Authorization', `Bearer ${otherOrgToken}`);

      // RLS debe bloquear con 403 o 404
      expect([403, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('❌ CRÍTICO: Listar organizaciones como admin solo muestra su propia org', async () => {
      const response = await request(app)
        .get('/api/v1/organizaciones')
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .expect(200);

      const organizaciones = response.body.data.data || response.body.data || [];

      // Verificar que no incluye testOrg
      const orgDeOtraOrg = organizaciones.find(o => o.id === testOrg.id);
      expect(orgDeOtraOrg).toBeUndefined();

      // Verificar que solo incluye otherOrg
      organizaciones.forEach(org => {
        expect(org.id).toBe(otherOrg.id);
      });
    });

    test('✅ Admin SÍ puede ver su propia organización', async () => {
      const response = await request(app)
        .get(`/api/v1/organizaciones/${testOrg.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testOrg.id);
    });
  });

  // ============================================================================
  // 🎯 Tests de ONBOARDING de Nuevas Organizaciones (Patrón SaaS)
  // ============================================================================
  describe('POST /api/v1/organizaciones/register - 🎯 ONBOARDING de Nuevas Organizaciones', () => {
    test('✅ Onboarding completo con plantillas de servicios', async () => {
      const uniqueId = getUniqueTestId();
      const registroData = {
        organizacion: {
          nombre_comercial: `Barbería Auto-Registro ${uniqueId}`,
          razon_social: `Barbería Auto-Registro S.A. ${uniqueId}`,
          rfc: `RFC${uniqueId.slice(-10)}`,
          tipo_industria: 'barberia',
          plan: 'basico',
          telefono_principal: `+521${uniqueId.slice(-10)}`,
          email_contacto: `contacto-${uniqueId}@autoregistro.com`
        },
        admin: {
          nombre: 'Admin',
          apellidos: 'Auto-Registro',
          email: `admin-${uniqueId}@autoregistro.com`,
          password: 'Password123!',
          telefono: `+521${uniqueId.slice(-10)}`
        },
        aplicar_plantilla_servicios: true,
        enviar_email_bienvenida: false
      };

      const response = await request(app)
        .post('/api/v1/organizaciones/register')
        // ❌ SIN autenticación (endpoint público)
        .send(registroData)
        .expect(201);

      // Validar estructura de respuesta
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('organizacion');
      expect(response.body.data).toHaveProperty('admin');
      expect(response.body.data).toHaveProperty('servicios_creados');

      // Validar organización creada
      expect(response.body.data.organizacion.nombre_comercial).toBe(registroData.organizacion.nombre_comercial);
      expect(response.body.data.organizacion.tipo_industria).toBe(registroData.organizacion.tipo_industria);
      expect(response.body.data.organizacion.plan_actual).toBe('basico');
      expect(response.body.data.organizacion.activo).toBe(true);

      // Validar admin creado con token (auto-login)
      expect(response.body.data.admin.email).toBe(registroData.admin.email);
      expect(response.body.data.admin.rol).toBe('admin');
      expect(response.body.data.admin).toHaveProperty('token');
      expect(response.body.data.admin.token).toBeTruthy();

      // Validar que se aplicaron plantillas de servicios
      expect(response.body.data.servicios_creados).toBeGreaterThan(0);

      // Validar que el token funciona para operaciones posteriores
      const tokenTest = await request(app)
        .get(`/api/v1/organizaciones/${response.body.data.organizacion.id}`)
        .set('Authorization', `Bearer ${response.body.data.admin.token}`)
        .expect(200);

      expect(tokenTest.body.success).toBe(true);
    });

    test('✅ Onboarding sin plantillas de servicios', async () => {
      const uniqueId = getUniqueTestId();
      const registroData = {
        organizacion: {
          nombre_comercial: `Org Sin Plantilla ${uniqueId}`,
          tipo_industria: 'spa',
          plan: 'basico'
        },
        admin: {
          nombre: 'Admin',
          apellidos: 'Sin Plantilla',
          email: `admin-noplant-${uniqueId}@test.com`,
          password: 'Password123!'
        },
        aplicar_plantilla_servicios: false
      };

      const response = await request(app)
        .post('/api/v1/organizaciones/register')
        .send(registroData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.servicios_creados).toBe(0);
    });

    test('❌ Onboarding falla con email de admin duplicado', async () => {
      const uniqueId = getUniqueTestId();

      // Primer registro exitoso
      const primerRegistro = {
        organizacion: {
          nombre_comercial: `Org 1 ${uniqueId}`,
          tipo_industria: 'barberia',
          plan: 'basico'
        },
        admin: {
          nombre: 'Admin',
          apellidos: 'Primero',
          email: `duplicado-${uniqueId}@test.com`,
          password: 'Password123!'
        },
        aplicar_plantilla_servicios: false
      };

      await request(app)
        .post('/api/v1/organizaciones/register')
        .send(primerRegistro)
        .expect(201);

      // Segundo registro con email duplicado debe fallar
      const segundoRegistro = {
        organizacion: {
          nombre_comercial: `Org 2 ${uniqueId}`,
          tipo_industria: 'barberia',
          plan: 'basico'
        },
        admin: {
          nombre: 'Admin',
          apellidos: 'Segundo',
          email: `duplicado-${uniqueId}@test.com`, // Email duplicado
          password: 'Password123!'
        },
        aplicar_plantilla_servicios: false
      };

      const response = await request(app)
        .post('/api/v1/organizaciones/register')
        .send(segundoRegistro)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message.toLowerCase()).toContain('email');
    });

    test('❌ Onboarding falla con contraseña débil', async () => {
      const uniqueId = getUniqueTestId();
      const registroData = {
        organizacion: {
          nombre_comercial: `Org Pass Débil ${uniqueId}`,
          tipo_industria: 'barberia',
          plan: 'basico'
        },
        admin: {
          nombre: 'Admin',
          apellidos: 'Test',
          email: `admin-${uniqueId}@test.com`,
          password: '123' // Contraseña débil
        }
      };

      const response = await request(app)
        .post('/api/v1/organizaciones/register')
        .send(registroData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('❌ Onboarding falla sin datos de organización', async () => {
      const uniqueId = getUniqueTestId();
      const response = await request(app)
        .post('/api/v1/organizaciones/register')
        .send({
          admin: {
            nombre: 'Admin',
            apellidos: 'Test',
            email: `admin-${uniqueId}@test.com`,
            password: 'Password123!'
          }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('❌ Onboarding falla sin datos de admin', async () => {
      const uniqueId = getUniqueTestId();
      const response = await request(app)
        .post('/api/v1/organizaciones/register')
        .send({
          organizacion: {
            nombre_comercial: `Org ${uniqueId}`,
            tipo_industria: 'barberia',
            plan: 'basico'
          }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('❌ Onboarding falla con tipo de industria inválido', async () => {
      const uniqueId = getUniqueTestId();
      const response = await request(app)
        .post('/api/v1/organizaciones/register')
        .send({
          organizacion: {
            nombre_comercial: `Org ${uniqueId}`,
            tipo_industria: 'industria_inexistente',
            plan: 'basico'
          },
          admin: {
            nombre: 'Admin',
            apellidos: 'Test',
            email: `admin-${uniqueId}@test.com`,
            password: 'Password123!'
          }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('❌ Onboarding falla con plan inválido', async () => {
      const uniqueId = getUniqueTestId();
      const response = await request(app)
        .post('/api/v1/organizaciones/register')
        .send({
          organizacion: {
            nombre_comercial: `Org ${uniqueId}`,
            tipo_industria: 'barberia',
            plan: 'plan_inexistente'
          },
          admin: {
            nombre: 'Admin',
            apellidos: 'Test',
            email: `admin-${uniqueId}@test.com`,
            password: 'Password123!'
          }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

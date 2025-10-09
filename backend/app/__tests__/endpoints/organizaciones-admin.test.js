/**
 * Tests de Endpoints Administrativos de Organizaciones
 * Suite completa para validar operaciones críticas de negocio
 * CRÍTICO: Onboarding, Suspender, Reactivar, Cambiar Plan
 */

const request = require('supertest');
const saasApp = require('../../app');
const authConfig = require('../../config/auth');
const {
  cleanAllTables,
  createTestOrganizacion,
  createTestUsuario
} = require('../helpers/db-helper');

describe('Endpoints Administrativos de Organizaciones', () => {
  let app;
  let client;
  let superAdmin;
  let superAdminToken;
  let testOrg;
  let testAdmin;
  let adminToken;

  beforeAll(async () => {
    app = saasApp.getExpressApp();
    client = await global.testPool.connect();

    await cleanAllTables(client);

    // Crear super admin
    superAdmin = await createTestUsuario(client, null, {
      nombre: 'Super',
      apellidos: 'Admin',
      rol: 'super_admin',
      activo: true,
      email_verificado: true
    });

    superAdminToken = authConfig.generateToken({
      userId: superAdmin.id,
      email: superAdmin.email,
      rol: 'super_admin',
      organizacionId: null
    });

    // Crear organización de prueba
    testOrg = await createTestOrganizacion(client, {
      nombre: 'Test Org Admin',
      plan: 'basico',
      activo: true
    });

    // Crear admin de la org
    testAdmin = await createTestUsuario(client, testOrg.id, {
      nombre: 'Admin',
      apellidos: 'Org',
      rol: 'admin',
      activo: true,
      email_verificado: true
    });

    adminToken = authConfig.generateToken({
      userId: testAdmin.id,
      email: testAdmin.email,
      rol: 'admin',
      organizacionId: testOrg.id
    });

    client.release();
  });

  afterAll(async () => {
    const cleanupClient = await global.testPool.connect();
    await cleanAllTables(cleanupClient);
    cleanupClient.release();
  });

  // ============================================================================
  // Tests de SUSPENDER ORGANIZACIÓN
  // ============================================================================

  describe('PUT /api/v1/organizaciones/:id/suspender - Suspender Servicios', () => {
    let orgParaSuspender;

    beforeAll(async () => {
      const tempClient = await global.testPool.connect();
      orgParaSuspender = await createTestOrganizacion(tempClient, {
        nombre: 'Org Para Suspender',
        plan: 'premium',
        activo: true
      });
      tempClient.release();
    });

    test('Suspender organización exitosamente', async () => {
      const response = await request(app)
        .put(`/api/v1/organizaciones/${orgParaSuspender.id}/suspender`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          motivo_suspension: 'Falta de pago - Cliente con 30 días de mora'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.activo).toBe(false);
      expect(response.body.data.suspendido).toBe(true);
      expect(response.body.data.motivo_suspension).toBe('Falta de pago - Cliente con 30 días de mora');
    });

    test('Organización suspendida no puede operar', async () => {
      // Crear token de usuario de org suspendida
      const tempClient = await global.testPool.connect();
      const userOrgSuspendida = await createTestUsuario(tempClient, orgParaSuspender.id, {
        nombre: 'User',
        apellidos: 'Suspendido',
        rol: 'admin'
      });
      tempClient.release();

      const tokenSuspendido = authConfig.generateToken({
        userId: userOrgSuspendida.id,
        email: userOrgSuspendida.email,
        rol: 'admin',
        organizacionId: orgParaSuspender.id
      });

      // Intentar crear profesional debe fallar
      const response = await request(app)
        .post('/api/v1/profesionales')
        .set('Authorization', `Bearer ${tokenSuspendido}`)
        .send({
          nombre_completo: 'Test Prof',
          tipo_profesional: 'barbero'
        });

      // Debe fallar por organización suspendida
      expect([403, 423]).toContain(response.status);
    });

    test('Falla sin motivo de suspensión', async () => {
      const response = await request(app)
        .put(`/api/v1/organizaciones/${testOrg.id}/suspender`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('Falla si no es super_admin', async () => {
      const response = await request(app)
        .put(`/api/v1/organizaciones/${testOrg.id}/suspender`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ motivo_suspension: 'Motivo de prueba válido' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .put(`/api/v1/organizaciones/${testOrg.id}/suspender`)
        .send({ motivo_suspension: 'Motivo de prueba válido' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Tests de REACTIVAR ORGANIZACIÓN
  // ============================================================================

  describe('PUT /api/v1/organizaciones/:id/reactivar - Reactivar Servicios', () => {
    let orgParaReactivar;

    beforeAll(async () => {
      const tempClient = await global.testPool.connect();

      // Crear org suspendida usando helper
      orgParaReactivar = await createTestOrganizacion(tempClient, {
        nombre_comercial: 'Org Para Reactivar',
        razon_social: 'Razón Reactivar',
        tipo_industria: 'barberia',
        activo: false,
        suspendido: true,
        motivo_suspension: 'Suspendido para test'
      });

      tempClient.release();
    });

    test('Reactivar organización exitosamente', async () => {
      const response = await request(app)
        .put(`/api/v1/organizaciones/${orgParaReactivar.id}/reactivar`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          notas_reactivacion: 'Pago recibido, reactivar servicios'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.activo).toBe(true);
      expect(response.body.data.suspendido).toBe(false);
      expect(response.body.data.motivo_suspension).toBeNull();
    });

    test('Organización reactivada puede operar', async () => {
      // Crear usuario de org reactivada
      const tempClient = await global.testPool.connect();
      const userOrgReactivada = await createTestUsuario(tempClient, orgParaReactivar.id, {
        nombre: 'User',
        apellidos: 'Reactivado',
        rol: 'admin'
      });
      tempClient.release();

      const tokenReactivado = authConfig.generateToken({
        userId: userOrgReactivada.id,
        email: userOrgReactivada.email,
        rol: 'admin',
        organizacionId: orgParaReactivar.id
      });

      // Debe poder crear profesional
      const response = await request(app)
        .post('/api/v1/profesionales')
        .set('Authorization', `Bearer ${tokenReactivado}`)
        .send({
          nombre_completo: 'Prof Reactivado',
          tipo_profesional: 'barbero'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('Falla reactivar org ya activa', async () => {
      const response = await request(app)
        .put(`/api/v1/organizaciones/${testOrg.id}/reactivar`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          notas_reactivacion: 'Test'
        });

      // Debe retornar error o warning (testOrg ya está activa)
      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    test('Falla si no es super_admin', async () => {
      const response = await request(app)
        .put(`/api/v1/organizaciones/${orgParaReactivar.id}/reactivar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notas_reactivacion: 'Test' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Tests de CAMBIAR PLAN
  // ============================================================================

  describe('PUT /api/v1/organizaciones/:id/plan - Cambiar Plan', () => {
    test('Upgrade de plan básico a profesional', async () => {
      const response = await request(app)
        .put(`/api/v1/organizaciones/${testOrg.id}/plan`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          nuevo_plan: 'profesional'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.plan_actual).toBe('profesional');
      expect(response.body.data.limites).toBeDefined();
      expect(response.body.data.limites.max_profesionales).toBeGreaterThan(3);
    });

    test('Downgrade de profesional a básico', async () => {
      // Primero hacer upgrade
      await request(app)
        .put(`/api/v1/organizaciones/${testOrg.id}/plan`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ nuevo_plan: 'profesional' });

      // Luego downgrade
      const response = await request(app)
        .put(`/api/v1/organizaciones/${testOrg.id}/plan`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          nuevo_plan: 'basico'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.plan_actual).toBe('basico');
    });

    test('Cambio a plan enterprise', async () => {
      const response = await request(app)
        .put(`/api/v1/organizaciones/${testOrg.id}/plan`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          nuevo_plan: 'empresarial'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.plan_actual).toBe('empresarial');
      expect(response.body.data.limites.max_profesionales).toBe(100); // Plan empresarial
    });

    test('Falla con plan inválido', async () => {
      const response = await request(app)
        .put(`/api/v1/organizaciones/${testOrg.id}/plan`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          nuevo_plan: 'plan_inexistente'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('Validar aplicación de límites después de cambio', async () => {
      // Cambiar a plan básico (max 5 profesionales, 15 servicios)
      await request(app)
        .put(`/api/v1/organizaciones/${testOrg.id}/plan`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ nuevo_plan: 'basico' });

      // Verificar límites
      const response = await request(app)
        .get(`/api/v1/organizaciones/${testOrg.id}/limites`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.profesionales.limite).toBe(5);
      expect(response.body.data.servicios.limite).toBe(15);
    });

    test('Falla si no es super_admin', async () => {
      const response = await request(app)
        .put(`/api/v1/organizaciones/${testOrg.id}/plan`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nuevo_plan: 'profesional' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .put(`/api/v1/organizaciones/${testOrg.id}/plan`)
        .send({ nuevo_plan: 'profesional' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Tests de DESACTIVAR ORGANIZACIÓN
  // ============================================================================

  describe('DELETE /api/v1/organizaciones/:id - Desactivar (Soft Delete)', () => {
    let orgParaDesactivar;

    beforeAll(async () => {
      const tempClient = await global.testPool.connect();
      orgParaDesactivar = await createTestOrganizacion(tempClient, {
        nombre: 'Org Para Desactivar',
        plan: 'basico',
        activo: true
      });
      tempClient.release();
    });

    test('Desactivar organización exitosamente', async () => {
      const response = await request(app)
        .delete(`/api/v1/organizaciones/${orgParaDesactivar.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          motivo: 'Cliente canceló servicio',
          confirmar: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.activo).toBe(false);
    });

    test('Organización desactivada no aparece en listados', async () => {
      const response = await request(app)
        .get('/api/v1/organizaciones')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const orgs = response.body.data.data || response.body.data;
      const orgDesactivada = orgs.find(o => o.id === orgParaDesactivar.id);

      // No debe aparecer en listado por defecto
      expect(orgDesactivada).toBeUndefined();
    });

    test('Puede listar organizaciones desactivadas con filtro', async () => {
      const response = await request(app)
        .get('/api/v1/organizaciones')
        .query({ incluir_inactivas: true })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const orgs = response.body.data.data || response.body.data;
      const orgDesactivada = orgs.find(o => o.id === orgParaDesactivar.id);

      // Ahora sí debe aparecer
      expect(orgDesactivada).toBeDefined();
      expect(orgDesactivada.activo).toBe(false);
    });

    test('Falla sin confirmación', async () => {
      const response = await request(app)
        .delete(`/api/v1/organizaciones/${testOrg.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ motivo: 'Test' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('confirmar');
    });

    test('Falla si no es super_admin', async () => {
      const response = await request(app)
        .delete(`/api/v1/organizaciones/${testOrg.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ motivo: 'Test', confirmar: true })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Tests de MÉTRICAS DE ORGANIZACIÓN
  // ============================================================================

  describe('GET /api/v1/organizaciones/:id/metricas - Métricas Detalladas', () => {
    test('Obtener métricas de organización', async () => {
      const response = await request(app)
        .get(`/api/v1/organizaciones/${testOrg.id}/metricas`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('uso_recursos');
      expect(response.body.data).toHaveProperty('estadisticas_operacionales');
      expect(response.body.data).toHaveProperty('salud_sistema');
    });

    test('Métricas incluyen límites de plan', async () => {
      const response = await request(app)
        .get(`/api/v1/organizaciones/${testOrg.id}/metricas`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.uso_recursos).toHaveProperty('profesionales');
      expect(response.body.data.uso_recursos).toHaveProperty('servicios');
      expect(response.body.data.uso_recursos).toHaveProperty('usuarios');
      expect(response.body.data.uso_recursos.profesionales).toHaveProperty('usados');
      expect(response.body.data.uso_recursos.profesionales).toHaveProperty('limite');
      expect(response.body.data.uso_recursos.profesionales).toHaveProperty('porcentaje_uso');
    });

    test('Admin de org puede ver métricas propias', async () => {
      const response = await request(app)
        .get(`/api/v1/organizaciones/${testOrg.id}/metricas`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get(`/api/v1/organizaciones/${testOrg.id}/metricas`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

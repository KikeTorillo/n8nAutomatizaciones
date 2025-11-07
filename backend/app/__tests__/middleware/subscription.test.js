/**
 * ============================================================================
 * TESTS - MIDDLEWARE DE SUSCRIPCIONES Y LÍMITES DE PLANES
 * ============================================================================
 */

const request = require('supertest');
const saasApp = require('../../app');
const {
  createTestOrganizacion,
  createTestUsuario,
  cleanAllTables,
  generateTestToken
} = require('../helpers/db-helper');

describe('Middleware de Suscripciones', () => {
  let app;
  let client;
  let organizacion;
  let usuario;
  let token;

  beforeAll(async () => {
    app = saasApp.getExpressApp();
    client = await global.testPool.connect();
    await cleanAllTables(client);
  });

  afterAll(async () => {
    const cleanupClient = await global.testPool.connect();
    await cleanAllTables(cleanupClient);
    cleanupClient.release();
    if (client) client.release();
  });

  // No usar beforeEach para limpiar ya que beforeAll lo hace
  // y cada test crea sus propios datos únicos

  // ============================================================================
  // TESTS: checkActiveSubscription - Validación de suscripción activa
  // ============================================================================

  describe('checkActiveSubscription', () => {
    test('Permite acceso si suscripción trial está vigente', async () => {
      // Crear org con trial vigente (creada hoy, expira en 30 días)
      organizacion = await createTestOrganizacion(client, {
        plan: 'basico',
        nombre: 'Org Trial Vigente'
      });

      usuario = await createTestUsuario(client, organizacion.id, {
        rol: 'admin'
        // email se genera automáticamente con ID único
      });

      token = generateTestToken(usuario, organizacion);

      // Intentar crear un profesional (requiere suscripción activa)
      const response = await request(app)
        .post('/api/v1/profesionales')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan@test.com',
          tipo_profesional_id: 1
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test('Rechaza si trial expiró', async () => {
      // Crear org con trial expirado (hace 35 días)
      organizacion = await createTestOrganizacion(client, {
        plan: 'basico',
        nombre: 'Org Trial Expirado'
      });

      usuario = await createTestUsuario(client, organizacion.id, {
        rol: 'admin'
      });

      token = generateTestToken(usuario, organizacion);

      // Actualizar manualmente la fecha_fin para simular expiración
      await client.query(`
        UPDATE subscripciones
        SET fecha_fin = CURRENT_DATE - INTERVAL '5 days'
        WHERE organizacion_id = $1
      `, [organizacion.id]);

      // Intentar crear profesional con trial expirado
      const response = await request(app)
        .post('/api/v1/profesionales')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan@test.com',
          tipo_profesional_id: 1
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('periodo de prueba ha expirado');
      expect(response.body.data.codigo_error).toBe('TRIAL_EXPIRED');
    });

    test('Rechaza si suscripción está en estado moroso', async () => {
      organizacion = await createTestOrganizacion(client, {
        plan: 'basico',
        nombre: 'Org Morosa'
      });

      usuario = await createTestUsuario(client, organizacion.id, {
        rol: 'admin'
      });

      token = generateTestToken(usuario, organizacion);

      // Cambiar estado a moroso
      await client.query(`
        UPDATE subscripciones
        SET estado = 'morosa'
        WHERE organizacion_id = $1
      `, [organizacion.id]);

      const response = await request(app)
        .post('/api/v1/profesionales')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan@test.com',
          tipo_profesional_id: 1
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('estado moroso');
      expect(response.body.data.codigo_error).toBe('SUBSCRIPTION_OVERDUE');
    });

    test('Rechaza si suscripción está suspendida', async () => {
      organizacion = await createTestOrganizacion(client, {
        plan: 'basico',
        nombre: 'Org Suspendida'
      });

      usuario = await createTestUsuario(client, organizacion.id, {
        rol: 'admin'
      });

      token = generateTestToken(usuario, organizacion);

      // Suspender suscripción
      await client.query(`
        UPDATE subscripciones
        SET estado = 'suspendida'
        WHERE organizacion_id = $1
      `, [organizacion.id]);

      const response = await request(app)
        .post('/api/v1/profesionales')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan@test.com',
          tipo_profesional_id: 1
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('suspendida');
      expect(response.body.data.codigo_error).toBe('SUBSCRIPTION_SUSPENDED');
    });

    test('Rechaza si suscripción está cancelada', async () => {
      organizacion = await createTestOrganizacion(client, {
        plan: 'basico',
        nombre: 'Org Cancelada'
      });

      usuario = await createTestUsuario(client, organizacion.id, {
        rol: 'admin'
      });

      token = generateTestToken(usuario, organizacion);

      // Cancelar suscripción
      await client.query(`
        UPDATE subscripciones
        SET estado = 'cancelada', activa = false
        WHERE organizacion_id = $1
      `, [organizacion.id]);

      const response = await request(app)
        .post('/api/v1/profesionales')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan@test.com',
          tipo_profesional_id: 1
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('cancelada');
      expect(response.body.data.codigo_error).toBe('SUBSCRIPTION_CANCELLED');
    });

    test('Permite acceso con plan pagado (basico)', async () => {
      organizacion = await createTestOrganizacion(client, {
        plan: 'basico',
        nombre: 'Org Básico Activo'
      });

      usuario = await createTestUsuario(client, organizacion.id, {
        rol: 'admin'
      });

      token = generateTestToken(usuario, organizacion);

      const response = await request(app)
        .post('/api/v1/profesionales')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan@test.com',
          tipo_profesional_id: 1
        });

      expect(response.status).toBe(201);
    });
  });

  // ============================================================================
  // TESTS: checkResourceLimit - Validación de límites por plan
  // ============================================================================

  describe('checkResourceLimit - Profesionales', () => {
    test('Permite crear profesional si no se alcanzó el límite (basico: 5)', async () => {
      organizacion = await createTestOrganizacion(client, {
        plan: 'basico',
        nombre: 'Org Trial'
      });

      usuario = await createTestUsuario(client, organizacion.id, {
        rol: 'admin'
      });

      token = generateTestToken(usuario, organizacion);

      // Crear primer profesional (de 2 permitidos)
      const response = await request(app)
        .post('/api/v1/profesionales')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan@test.com',
          tipo_profesional_id: 1
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test('Rechaza crear profesional si límite alcanzado (basico: 5)', async () => {
      organizacion = await createTestOrganizacion(client, {
        plan: 'basico',
        nombre: 'Org Trial Límite'
      });

      usuario = await createTestUsuario(client, organizacion.id, {
        rol: 'admin'
      });

      token = generateTestToken(usuario, organizacion);

      // Crear 2 profesionales (límite del basico)
      await request(app)
        .post('/api/v1/profesionales')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan@test.com',
          tipo_profesional_id: 1
        });

      await request(app)
        .post('/api/v1/profesionales')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'María',
          apellido: 'García',
          email: 'maria@test.com',
          tipo_profesional_id: 1
        });

      // Intentar crear el 3er profesional (excede límite)
      const response = await request(app)
        .post('/api/v1/profesionales')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Pedro',
          apellido: 'López',
          email: 'pedro@test.com',
          tipo_profesional_id: 1
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('límite de profesionales');
      expect(response.body.error).toContain('(2)'); // Mostrar límite
      expect(response.body.data.codigo_error).toBe('PLAN_LIMIT_REACHED');
      expect(response.body.data.recurso).toBe('profesionales');
      expect(response.body.data.limite).toBe(2);
      expect(response.body.data.uso_actual).toBe(2);
    });

    test('Plan basico permite más profesionales (5)', async () => {
      organizacion = await createTestOrganizacion(client, {
        plan: 'basico',
        nombre: 'Org Básico'
      });

      usuario = await createTestUsuario(client, organizacion.id, {
        rol: 'admin'
      });

      token = generateTestToken(usuario, organizacion);

      // Crear 3er profesional (permitido en plan básico: límite 5)
      const response = await request(app)
        .post('/api/v1/profesionales')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan@test.com',
          tipo_profesional_id: 1
        });

      expect(response.status).toBe(201);
    });
  });

  describe('checkResourceLimit - Clientes', () => {
    test('Rechaza crear cliente si límite alcanzado (basico: 200)', async () => {
      organizacion = await createTestOrganizacion(client, {
        plan: 'basico',
        nombre: 'Org Trial Clientes'
      });

      usuario = await createTestUsuario(client, organizacion.id, {
        rol: 'admin'
      });

      token = generateTestToken(usuario, organizacion);

      // Simular que ya tiene 50 clientes
      await client.query(`
        UPDATE metricas_uso_organizacion
        SET uso_clientes = 50
        WHERE organizacion_id = $1
      `, [organizacion.id]);

      const response = await request(app)
        .post('/api/v1/clientes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Cliente',
          apellido: 'Test',
          telefono: '1234567890'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('límite de clientes');
      expect(response.body.data.limite).toBe(50);
    });
  });

  describe('checkResourceLimit - Servicios', () => {
    test('Rechaza crear servicio si límite alcanzado (basico: 15)', async () => {
      organizacion = await createTestOrganizacion(client, {
        plan: 'basico',
        nombre: 'Org Trial Servicios'
      });

      usuario = await createTestUsuario(client, organizacion.id, {
        rol: 'admin'
      });

      token = generateTestToken(usuario, organizacion);

      // Simular que ya tiene 5 servicios
      await client.query(`
        UPDATE metricas_uso_organizacion
        SET uso_servicios = 5
        WHERE organizacion_id = $1
      `, [organizacion.id]);

      const response = await request(app)
        .post('/api/v1/servicios')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Servicio Test',
          descripcion: 'Test',
          precio: 100,
          duracion_minutos: 30
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('límite de servicios');
      expect(response.body.data.limite).toBe(5);
    });
  });

  describe('checkResourceLimit - Usuarios', () => {
    test('Rechaza crear usuario si límite alcanzado (basico: 5)', async () => {
      organizacion = await createTestOrganizacion(client, {
        plan: 'basico',
        nombre: 'Org Trial Usuarios'
      });

      usuario = await createTestUsuario(client, organizacion.id, {
        rol: 'admin'
      });

      token = generateTestToken(usuario, organizacion);

      // Ya hay 1 usuario (el admin), simular que hay 2
      await client.query(`
        UPDATE metricas_uso_organizacion
        SET uso_usuarios = 2
        WHERE organizacion_id = $1
      `, [organizacion.id]);

      const response = await request(app)
        .post('/api/v1/usuarios')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Nuevo',
          apellido: 'Usuario',
          email: 'nuevo@test.com',
          password: 'Password123!',
          rol: 'empleado'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('límite de usuarios');
      expect(response.body.data.limite).toBe(2);
    });
  });

  // ============================================================================
  // TESTS: Integración completa
  // ============================================================================

  describe('Integración - Flujo completo de límites', () => {
    test('Usuario puede usar recursos hasta alcanzar límites, luego debe upgradeear', async () => {
      organizacion = await createTestOrganizacion(client, {
        plan: 'basico',
        nombre: 'Org Trial Completa'
      });

      usuario = await createTestUsuario(client, organizacion.id, {
        rol: 'admin'
      });

      token = generateTestToken(usuario, organizacion);

      // 1. Crear 2 profesionales (límite del basico)
      const prof1 = await request(app)
        .post('/api/v1/profesionales')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Prof1',
          apellido: 'Test',
          email: 'prof1@test.com',
          tipo_profesional_id: 1
        });
      expect(prof1.status).toBe(201);

      const prof2 = await request(app)
        .post('/api/v1/profesionales')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Prof2',
          apellido: 'Test',
          email: 'prof2@test.com',
          tipo_profesional_id: 1
        });
      expect(prof2.status).toBe(201);

      // 2. Intentar crear 3er profesional (rechazado)
      const prof3 = await request(app)
        .post('/api/v1/profesionales')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Prof3',
          apellido: 'Test',
          email: 'prof3@test.com',
          tipo_profesional_id: 1
        });
      expect(prof3.status).toBe(403);
      expect(prof3.body.data.accion_requerida).toBe('upgrade_plan');

      // 3. Simular upgrade a plan básico
      await client.query(`
        UPDATE subscripciones s
        SET plan_id = (SELECT id FROM planes_subscripcion WHERE codigo_plan = 'basico'),
            estado = 'activa',
            fecha_fin = NULL
        WHERE organizacion_id = $1
      `, [organizacion.id]);

      await client.query(`
        UPDATE organizaciones
        SET plan_actual = 'basico'
        WHERE id = $1
      `, [organizacion.id]);

      // 4. Ahora SÍ puede crear más profesionales (límite básico: 5)
      const prof3Retry = await request(app)
        .post('/api/v1/profesionales')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Prof3',
          apellido: 'Test',
          email: 'prof3@test.com',
          tipo_profesional_id: 1
        });
      expect(prof3Retry.status).toBe(201);
    });
  });
});

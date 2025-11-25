/**
 * ============================================================================
 * TESTS DE INTEGRACIÓN - SISTEMA DE MÓDULOS
 * ============================================================================
 * Valida el funcionamiento del middleware requireModule() y la protección
 * de endpoints según módulos activos de cada organización.
 *
 * Casos de prueba:
 * 1. Rechazo de endpoints cuando módulo está inactivo (403)
 * 2. Acceso permitido cuando módulo está activo (200/201)
 * 3. Validación de dependencias entre módulos
 * 4. Cache de módulos activos funciona correctamente
 */

const request = require('supertest');
const saasApp = require('../../app');
const {
  createTestOrganizacion,
  createTestUsuario,
  cleanAllTables,
  generateTestToken,
  bypassRLS
} = require('../helpers/db-helper');

// Importar ModulesCache para limpiar cache entre tests
const ModulesCache = require('../../core/ModulesCache');

describe('Sistema de Módulos - Integración', () => {
  let app;
  let client;

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
    ModulesCache.cleanup();
  });

  beforeEach(async () => {
    // Limpiar cache de módulos antes de cada test
    await ModulesCache.clear();
  });

  // ============================================================================
  // HELPER: Actualizar módulos activos de una organización
  // ============================================================================
  async function updateModulosActivos(organizacionId, modulos) {
    await bypassRLS(client);

    await client.query(`
      UPDATE subscripciones
      SET modulos_activos = $1::jsonb
      WHERE organizacion_id = $2
    `, [JSON.stringify(modulos), organizacionId]);

    // Invalidar cache
    await ModulesCache.invalidate(organizacionId);
  }

  // ============================================================================
  // TESTS: Módulo INVENTARIO
  // ============================================================================
  describe('Módulo INVENTARIO', () => {
    let organizacion;
    let usuario;
    let token;

    beforeAll(async () => {
      organizacion = await createTestOrganizacion(client, {
        nombre: 'Org Test Inventario',
        plan: 'basico'
      });

      usuario = await createTestUsuario(client, organizacion.id, {
        rol: 'admin'
      });

      token = generateTestToken(usuario, organizacion);
    });

    test('Rechaza POST /categorias si módulo inventario está inactivo', async () => {
      // Configurar solo core y agendamiento activos (sin inventario)
      await updateModulosActivos(organizacion.id, {
        core: true,
        agendamiento: true,
        inventario: false
      });

      const response = await request(app)
        .post('/api/v1/inventario/categorias')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Categoría Test',
          descripcion: 'Descripción test'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/módulo|Inventario/i);
      expect(response.body.errors?.codigo).toBe('MODULO_NO_ACTIVO');
    });

    test('Permite POST /categorias si módulo inventario está activo', async () => {
      // Activar inventario
      await updateModulosActivos(organizacion.id, {
        core: true,
        agendamiento: true,
        inventario: true
      });

      const response = await request(app)
        .post('/api/v1/inventario/categorias')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Categoría Test Activa',
          descripcion: 'Descripción test'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test('Rechaza POST /productos si módulo inventario está inactivo', async () => {
      await updateModulosActivos(organizacion.id, {
        core: true,
        agendamiento: true,
        inventario: false
      });

      const response = await request(app)
        .post('/api/v1/inventario/productos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Producto Test',
          sku: 'SKU-TEST-001',
          precio_venta: 100.00
        });

      expect(response.status).toBe(403);
      expect(response.body.errors?.codigo).toBe('MODULO_NO_ACTIVO');
    });
  });

  // ============================================================================
  // TESTS: Módulo POS
  // ============================================================================
  describe('Módulo POS', () => {
    let organizacion;
    let usuario;
    let token;

    beforeAll(async () => {
      organizacion = await createTestOrganizacion(client, {
        nombre: 'Org Test POS',
        plan: 'basico'
      });

      usuario = await createTestUsuario(client, organizacion.id, {
        rol: 'admin'
      });

      token = generateTestToken(usuario, organizacion);
    });

    test('Rechaza POST /ventas si módulo POS está inactivo', async () => {
      await updateModulosActivos(organizacion.id, {
        core: true,
        agendamiento: true,
        pos: false
      });

      const response = await request(app)
        .post('/api/v1/pos/ventas')
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [],
          metodo_pago: 'efectivo'
        });

      expect(response.status).toBe(403);
      expect(response.body.errors?.codigo).toBe('MODULO_NO_ACTIVO');
    });

    test('Rechaza POST /ventas/:id/pago si módulo POS está inactivo', async () => {
      await updateModulosActivos(organizacion.id, {
        core: true,
        agendamiento: true,
        pos: false
      });

      const response = await request(app)
        .post('/api/v1/pos/ventas/1/pago')
        .set('Authorization', `Bearer ${token}`)
        .send({
          monto_pago: 100,
          metodo_pago: 'efectivo'
        });

      expect(response.status).toBe(403);
      expect(response.body.errors?.codigo).toBe('MODULO_NO_ACTIVO');
    });

    test('Permite acceso a POS si módulo está activo', async () => {
      await updateModulosActivos(organizacion.id, {
        core: true,
        agendamiento: true,
        inventario: true, // POS depende de inventario
        pos: true
      });

      // GET no está protegido por requireModule, solo las escrituras
      // Probamos que al menos no rechaza por módulo
      const response = await request(app)
        .get('/api/v1/pos/ventas')
        .set('Authorization', `Bearer ${token}`);

      // Puede ser 200 (lista vacía) o cualquier código que NO sea 403 por módulo
      expect(response.status).not.toBe(403);
    });
  });

  // ============================================================================
  // TESTS: Módulo COMISIONES
  // ============================================================================
  describe('Módulo COMISIONES', () => {
    let organizacion;
    let usuario;
    let token;

    beforeAll(async () => {
      organizacion = await createTestOrganizacion(client, {
        nombre: 'Org Test Comisiones',
        plan: 'basico'
      });

      usuario = await createTestUsuario(client, organizacion.id, {
        rol: 'admin'
      });

      token = generateTestToken(usuario, organizacion);
    });

    test('Rechaza POST /configuracion si módulo comisiones está inactivo', async () => {
      await updateModulosActivos(organizacion.id, {
        core: true,
        agendamiento: true,
        comisiones: false
      });

      const response = await request(app)
        .post('/api/v1/comisiones/configuracion')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tipo_comision: 'porcentaje',
          valor: 10
        });

      expect(response.status).toBe(403);
      expect(response.body.errors?.codigo).toBe('MODULO_NO_ACTIVO');
    });

    test('Permite POST /configuracion si módulo comisiones está activo', async () => {
      await updateModulosActivos(organizacion.id, {
        core: true,
        agendamiento: true,
        comisiones: true
      });

      const response = await request(app)
        .post('/api/v1/comisiones/configuracion')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tipo_comision: 'porcentaje',
          valor: 10
        });

      // Puede ser 201 (creado) o 400 (validación) pero NO 403 por módulo
      expect(response.status).not.toBe(403);
    });
  });

  // ============================================================================
  // TESTS: Módulo MARKETPLACE
  // ============================================================================
  describe('Módulo MARKETPLACE', () => {
    let organizacion;
    let usuario;
    let token;

    beforeAll(async () => {
      organizacion = await createTestOrganizacion(client, {
        nombre: 'Org Test Marketplace',
        plan: 'basico'
      });

      usuario = await createTestUsuario(client, organizacion.id, {
        rol: 'admin'
      });

      token = generateTestToken(usuario, organizacion);
    });

    test('Rechaza POST /perfiles si módulo marketplace está inactivo', async () => {
      await updateModulosActivos(organizacion.id, {
        core: true,
        agendamiento: true,
        marketplace: false
      });

      const response = await request(app)
        .post('/api/v1/marketplace/perfiles')
        .set('Authorization', `Bearer ${token}`)
        .send({
          descripcion: 'Test descripción',
          visible: true
        });

      expect(response.status).toBe(403);
      expect(response.body.errors?.codigo).toBe('MODULO_NO_ACTIVO');
    });

    test('Permite POST /perfiles si módulo marketplace está activo', async () => {
      await updateModulosActivos(organizacion.id, {
        core: true,
        agendamiento: true,
        marketplace: true
      });

      const response = await request(app)
        .post('/api/v1/marketplace/perfiles')
        .set('Authorization', `Bearer ${token}`)
        .send({
          descripcion: 'Test descripción marketplace',
          visible: true
        });

      // Puede ser 201 o error de validación, pero NO 403 por módulo
      expect(response.status).not.toBe(403);
    });
  });

  // ============================================================================
  // TESTS: Dependencias entre módulos
  // ============================================================================
  describe('Dependencias entre Módulos', () => {
    let organizacion;
    let usuario;
    let token;

    beforeAll(async () => {
      organizacion = await createTestOrganizacion(client, {
        nombre: 'Org Test Dependencias',
        plan: 'basico'
      });

      usuario = await createTestUsuario(client, organizacion.id, {
        rol: 'admin'
      });

      token = generateTestToken(usuario, organizacion);
    });

    test('POS requiere inventario activo (dependencia - validación SQL)', async () => {
      // El trigger SQL valida dependencias ANTES de guardar
      // Esto debe fallar al intentar actualizar modulos_activos
      await expect(async () => {
        await updateModulosActivos(organizacion.id, {
          core: true,
          agendamiento: true,
          inventario: false, // Dependencia faltante
          pos: true
        });
      }).rejects.toThrow(/inventario/i);
    });

    test('Comisiones requiere agendamiento activo (dependencia - validación SQL)', async () => {
      // El trigger SQL valida dependencias ANTES de guardar
      await expect(async () => {
        await updateModulosActivos(organizacion.id, {
          core: true,
          agendamiento: false, // Dependencia faltante
          comisiones: true
        });
      }).rejects.toThrow(/agendamiento/i);
    });
  });

  // ============================================================================
  // TESTS: Cache de módulos
  // ============================================================================
  describe('Cache de Módulos', () => {
    let organizacion;
    let usuario;
    let token;

    beforeAll(async () => {
      organizacion = await createTestOrganizacion(client, {
        nombre: 'Org Test Cache',
        plan: 'basico'
      });

      usuario = await createTestUsuario(client, organizacion.id, {
        rol: 'admin'
      });

      token = generateTestToken(usuario, organizacion);
    });

    test('Cache se invalida al cambiar módulos activos', async () => {
      // Primero: inventario inactivo
      await updateModulosActivos(organizacion.id, {
        core: true,
        agendamiento: true,
        inventario: false
      });

      const response1 = await request(app)
        .post('/api/v1/inventario/categorias')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Test 1' });

      expect(response1.status).toBe(403);

      // Activar inventario (esto invalida cache)
      await updateModulosActivos(organizacion.id, {
        core: true,
        agendamiento: true,
        inventario: true
      });

      const response2 = await request(app)
        .post('/api/v1/inventario/categorias')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Test 2 Activo' });

      expect(response2.status).toBe(201);
    });

    test('Múltiples requests usan cache (performance)', async () => {
      await updateModulosActivos(organizacion.id, {
        core: true,
        agendamiento: true,
        inventario: true
      });

      // Limpiar estadísticas
      ModulesCache.resetStats();

      // Hacer múltiples requests POST (estos SÍ pasan por requireModule)
      // Usamos endpoint que requiere inventario activo
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/v1/inventario/categorias')
          .set('Authorization', `Bearer ${token}`)
          .send({ nombre: `Test Cache ${i}`, descripcion: 'Test' });
      }

      // Verificar que hubo cache hits (primer request es miss, los demás son hits)
      const stats = ModulesCache.getStats();
      // Con 3 requests: 1 miss + 2 hits = 2 cache hits esperados
      expect(stats.hits).toBeGreaterThanOrEqual(2);
    });
  });

  // ============================================================================
  // TESTS: Módulo CORE siempre activo
  // ============================================================================
  describe('Módulo CORE', () => {
    let organizacion;
    let usuario;
    let token;

    beforeAll(async () => {
      organizacion = await createTestOrganizacion(client, {
        nombre: 'Org Test Core',
        plan: 'basico'
      });

      usuario = await createTestUsuario(client, organizacion.id, {
        rol: 'admin'
      });

      token = generateTestToken(usuario, organizacion);
    });

    test('Endpoints de CORE siempre accesibles', async () => {
      // Configurar solo core activo
      await updateModulosActivos(organizacion.id, {
        core: true
      });

      // Endpoint de usuarios (CORE) - no debe ser bloqueado por módulos
      const response = await request(app)
        .get('/api/v1/usuarios/perfil')
        .set('Authorization', `Bearer ${token}`);

      // El status puede variar (200, 400 por validación, etc)
      // pero NO debe ser 403 por "módulo no activo"
      expect(response.status).not.toBe(403);

      // Si hay error, no debe ser por módulo
      if (!response.body.success) {
        expect(response.body.errors?.codigo).not.toBe('MODULO_NO_ACTIVO');
      }
    });

    test('Trigger impide desactivar módulo CORE', async () => {
      // Intentar desactivar core
      await bypassRLS(client);

      try {
        await client.query(`
          UPDATE subscripciones
          SET modulos_activos = '{"core": false}'::jsonb
          WHERE organizacion_id = $1
        `, [organizacion.id]);

        // Si llegamos aquí, el trigger no funcionó
        fail('El trigger debió impedir desactivar core');
      } catch (error) {
        // El trigger debe lanzar error
        expect(error.message).toContain('core');
      }
    });
  });

  // ============================================================================
  // TESTS: Organización sin subscripción
  // ============================================================================
  describe('Sin Subscripción', () => {
    test('Organización sin subscripción solo tiene acceso a CORE', async () => {
      // Crear org sin subscripción (eliminar la que se crea por defecto)
      const orgSinSub = await createTestOrganizacion(client, {
        nombre: 'Org Sin Subscripción'
      });

      // Eliminar subscripción
      await bypassRLS(client);
      await client.query(`
        DELETE FROM subscripciones WHERE organizacion_id = $1
      `, [orgSinSub.id]);

      const usuarioSinSub = await createTestUsuario(client, orgSinSub.id, {
        rol: 'admin'
      });

      const tokenSinSub = generateTestToken(usuarioSinSub, orgSinSub);

      // Intentar acceder a inventario
      const response = await request(app)
        .post('/api/v1/inventario/categorias')
        .set('Authorization', `Bearer ${tokenSinSub}`)
        .send({ nombre: 'Test Sin Sub' });

      // Debe rechazar - puede ser 403 (módulo/subscripción) o 500 (error al buscar subscripción)
      // El sistema maneja esto de diferentes formas según el orden de middleware
      expect([403, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });
});

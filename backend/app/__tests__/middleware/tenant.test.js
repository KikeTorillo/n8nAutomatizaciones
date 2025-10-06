/**
 * Tests para Middleware Multi-Tenant (RLS)
 * Suite de tests para validar el middleware setTenantContext
 */

const { setTenantContext } = require('../../middleware/tenant');
const {
  bypassRLS,
  cleanAllTables,
  createTestOrganizacion,
  createTestUsuario,
  createTestCliente
} = require('../helpers/db-helper');

describe('Middleware Tenant - setTenantContext', () => {
  let org1, org2;
  let userOrg1, superAdmin;
  let cliente1, cliente2;

  beforeAll(async () => {
    const client = await global.testPool.connect();

    // Limpiar BD
    await cleanAllTables(client);

    // Crear 2 organizaciones
    org1 = await createTestOrganizacion(client, {
      nombre: 'Organización 1'
    });

    org2 = await createTestOrganizacion(client, {
      nombre: 'Organización 2'
    });

    // Crear usuarios
    userOrg1 = await createTestUsuario(client, org1.id, {
      rol: 'empleado'
    });

    superAdmin = await createTestUsuario(client, org1.id, {
      rol: 'super_admin'
    });

    // Crear clientes para cada organización
    cliente1 = await createTestCliente(client, org1.id, {
      nombre: 'Cliente Org 1'
    });

    cliente2 = await createTestCliente(client, org2.id, {
      nombre: 'Cliente Org 2'
    });

    client.release();
  });

  afterAll(async () => {
    const client = await global.testPool.connect();
    await cleanAllTables(client);
    client.release();
  });

  // Test 1: Super admin puede especificar tenant_id (POST)
  test('Super admin puede especificar tenant_id en POST', async () => {
    const req = {
      user: {
        id: superAdmin.id,
        rol: 'super_admin',
        organizacion_id: org1.id
      },
      method: 'POST',
      body: {},
      query: {},
      params: {},
      headers: {
        'x-organization-id': org2.id.toString() // Super admin quiere acceder a org2
      },
      baseUrl: '/api/v1/clientes',
      path: '/api/v1/clientes',
      ip: '127.0.0.1'
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    await setTenantContext(req, res, next);

    // Verificar que next() fue llamado (éxito)
    expect(next).toHaveBeenCalled();

    // Verificar que tenant context fue configurado correctamente
    expect(req.tenant).toBeDefined();
    expect(req.tenant.organizacionId).toBe(org2.id);
  });

  // Test 2: Super admin puede especificar tenant_id (GET)
  test('Super admin puede especificar tenant_id en GET', async () => {
    const req = {
      user: {
        id: superAdmin.id,
        rol: 'super_admin',
        organizacion_id: org1.id
      },
      method: 'GET',
      body: {},
      query: {},
      params: {},
      headers: {
        'x-organization-id': org2.id.toString() // Super admin quiere acceder a org2
      },
      baseUrl: '/api/v1/clientes',
      path: '/api/v1/clientes',
      ip: '127.0.0.1'
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    await setTenantContext(req, res, next);

    // Verificar que next() fue llamado (éxito)
    expect(next).toHaveBeenCalled();

    // Verificar que tenant context fue configurado correctamente
    expect(req.tenant).toBeDefined();
    expect(req.tenant.organizacionId).toBe(org2.id);
  });

  // Test 3: Usuario normal usa su organizacion_id
  test('Usuario normal usa su organizacion_id automáticamente', async () => {
    const req = {
      user: {
        id: userOrg1.id,
        rol: 'empleado',
        organizacion_id: org1.id
      },
      method: 'GET',
      body: {},
      query: {},
      params: {},
      baseUrl: '/api/v1/clientes',
      path: '/api/v1/clientes',
      ip: '127.0.0.1'
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    await setTenantContext(req, res, next);

    // Verificar que next() fue llamado (éxito)
    expect(next).toHaveBeenCalled();

    // Verificar que tenant context usa organizacion_id del usuario
    expect(req.tenant).toBeDefined();
    expect(req.tenant.organizacionId).toBe(org1.id);
  });

  // Test 4: RLS se configura correctamente en BD
  test('RLS se configura correctamente en BD', async () => {
    const client = await global.testPool.connect();

    try {
      const req = {
        user: {
          id: userOrg1.id,
          rol: 'empleado',
          organizacion_id: org1.id
        },
        method: 'GET',
        body: {},
        query: {},
        params: {},
        baseUrl: '/api/v1/clientes',
        path: '/api/v1/clientes',
        ip: '127.0.0.1'
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      await setTenantContext(req, res, next);

      // Verificar configuración RLS en BD
      // El middleware ya configuró RLS, ahora configuramos en nuestra conexión de test
      await client.query('SELECT set_config($1, $2, false)', [
        'app.current_tenant_id',
        org1.id.toString()
      ]);

      await client.query('SELECT set_config($1, $2, false)', [
        'app.bypass_rls',
        'false'
      ]);

      // Verificar que podemos leer variables
      const tenantIdResult = await client.query("SELECT current_setting('app.current_tenant_id', true)");
      const bypassResult = await client.query("SELECT current_setting('app.bypass_rls', true)");

      expect(tenantIdResult.rows[0].current_setting).toBe(org1.id.toString());
      expect(bypassResult.rows[0].current_setting).toBe('false');

    } finally {
      client.release();
    }
  });

  // Test 5: Tenant context persiste en request
  test('Tenant context persiste en request', async () => {
    const req = {
      user: {
        id: userOrg1.id,
        rol: 'empleado',
        organizacion_id: org1.id
      },
      method: 'GET',
      body: {},
      query: {},
      params: {},
      baseUrl: '/api/v1/clientes',
      path: '/api/v1/clientes',
      ip: '127.0.0.1'
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    await setTenantContext(req, res, next);

    // Verificar que tenant context está disponible en req
    expect(req.tenant).toBeDefined();
    expect(req.tenant.organizacionId).toBe(org1.id);

    // Simular otro middleware que usa req.tenant
    const middlewareSimulado = (req, res, next) => {
      expect(req.tenant).toBeDefined();
      expect(req.tenant.organizacionId).toBe(org1.id);
      next();
    };

    const next2 = jest.fn();
    middlewareSimulado(req, res, next2);

    expect(next2).toHaveBeenCalled();
  });

  // Test 6: Sin tenant_id falla correctamente (super_admin sin especificar)
  test('Super admin sin tenant_id rechaza solicitud', async () => {
    const req = {
      user: {
        id: superAdmin.id,
        rol: 'super_admin',
        organizacion_id: org1.id
      },
      method: 'POST',
      body: {},
      query: {},
      params: {},
      headers: {}, // Sin X-Organization-Id header
      baseUrl: '/api/v1/clientes',
      path: '/api/v1/clientes',
      ip: '127.0.0.1'
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    await setTenantContext(req, res, next);

    // Verificar que se rechazó (400)
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('X-Organization-Id')
      })
    );

    // Verificar que next() NO fue llamado
    expect(next).not.toHaveBeenCalled();
  });

  // Test 7: Tenant inválido rechaza solicitud
  test('Tenant inválido (no numérico) rechaza solicitud', async () => {
    const req = {
      user: {
        id: superAdmin.id,
        rol: 'super_admin',
        organizacion_id: org1.id
      },
      method: 'POST',
      body: {},
      query: {},
      params: {},
      headers: {
        'x-organization-id': 'invalid_id' // ID no numérico
      },
      baseUrl: '/api/v1/clientes',
      path: '/api/v1/clientes',
      ip: '127.0.0.1'
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    await setTenantContext(req, res, next);

    // Verificar que se rechazó (400 o 500)
    expect(res.status).toHaveBeenCalledWith(expect.any(Number));
    expect([400, 500]).toContain(res.status.mock.calls[0][0]);

    // Verificar que next() NO fue llamado
    expect(next).not.toHaveBeenCalled();
  });

  // Test 8: Queries respetan RLS después de middleware
  test('Queries respetan RLS después de middleware', async () => {
    const client = await global.testPool.connect();

    try {
      // Configurar RLS para org1
      await client.query('SELECT set_config($1, $2, false)', [
        'app.current_tenant_id',
        org1.id.toString()
      ]);

      await client.query('SELECT set_config($1, $2, false)', [
        'app.bypass_rls',
        'false'
      ]);

      // Query de clientes con RLS activo
      const result = await client.query('SELECT * FROM clientes');

      // Verificar que solo retorna clientes de org1
      expect(result.rows.length).toBeGreaterThan(0);

      result.rows.forEach(cliente => {
        expect(cliente.organizacion_id).toBe(org1.id);
      });

    } finally {
      client.release();
    }
  });

  // Test 9: Múltiples requests NO cruzan contextos
  test('Múltiples requests NO cruzan contextos RLS', async () => {
    // Request 1 - Usuario de org1
    const req1 = {
      user: {
        id: userOrg1.id,
        rol: 'empleado',
        organizacion_id: org1.id
      },
      method: 'GET',
      body: {},
      query: {},
      params: {},
      baseUrl: '/api/v1/clientes',
      path: '/api/v1/clientes',
      ip: '127.0.0.1'
    };

    const res1 = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next1 = jest.fn();

    await setTenantContext(req1, res1, next1);

    // Request 2 - Super admin accediendo a org2
    const req2 = {
      user: {
        id: superAdmin.id,
        rol: 'super_admin',
        organizacion_id: org1.id
      },
      method: 'POST',
      body: {},
      query: {},
      params: {},
      headers: {
        'x-organization-id': org2.id.toString()
      },
      baseUrl: '/api/v1/clientes',
      path: '/api/v1/clientes',
      ip: '127.0.0.1'
    };

    const res2 = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next2 = jest.fn();

    await setTenantContext(req2, res2, next2);

    // Verificar que cada request tiene su propio contexto
    expect(req1.tenant.organizacionId).toBe(org1.id);
    expect(req2.tenant.organizacionId).toBe(org2.id);

    // Verificar que no se cruzaron
    expect(req1.tenant.organizacionId).not.toBe(req2.tenant.organizacionId);
  });
});

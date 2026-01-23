/**
 * Tests para Middleware de Autenticación JWT
 * Suite de tests para validar el middleware authenticateToken
 */

const { authenticateToken, addToTokenBlacklist } = require('../../middleware/auth');
const authConfig = require('../../config/auth');
const {
  bypassRLS,
  cleanAllTables,
  createTestOrganizacion,
  createTestUsuario
} = require('../helpers/db-helper');

describe('Middleware Auth - authenticateToken', () => {
  let client;
  let testOrg;
  let testUsuario;
  let validToken;

  beforeAll(async () => {
    client = await global.testPool.connect();

    // Limpiar BD
    await cleanAllTables(client);

    // Crear organización y usuario de prueba
    testOrg = await createTestOrganizacion(client, {
      nombre: 'Test Org Auth'
    });

    testUsuario = await createTestUsuario(client, testOrg.id, {
      nombre: 'Auth',
      apellidos: 'Test',
      rol: 'empleado',
      activo: true,
      email_verificado: true
    });

    // Generar token JWT válido (FASE 7: solo rolId, sin rol ENUM)
    validToken = authConfig.generateToken({
      userId: testUsuario.id,
      email: testUsuario.email,
      rolId: testUsuario.rol_id,
      organizacionId: testOrg.id
    });

    client.release();
  });

  afterAll(async () => {
    // Cleanup final
    const cleanupClient = await global.testPool.connect();
    await cleanAllTables(cleanupClient);
    cleanupClient.release();
  });

  // Test 1: Token válido permite acceso
  test('Token válido permite acceso', async () => {
    const req = {
      headers: {
        authorization: `Bearer ${validToken}`
      },
      ip: '127.0.0.1',
      path: '/test',
      get: () => 'Jest Test'
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    await authenticateToken(req, res, next);

    // Verificar que next() fue llamado (éxito)
    expect(next).toHaveBeenCalled();

    // Verificar que req.user fue configurado correctamente
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe(testUsuario.id);
    expect(req.user.email).toBe(testUsuario.email);
    expect(req.user.rol_codigo).toBeDefined(); // FASE 7: usa rol_codigo en vez de rol
    expect(req.user.organizacion_id).toBe(testOrg.id);
  });

  // Test 2: Token inválido rechaza solicitud
  test('Token inválido rechaza solicitud', async () => {
    const req = {
      headers: {
        authorization: 'Bearer token_invalido_12345'
      },
      ip: '127.0.0.1',
      path: '/test',
      get: () => 'Jest Test'
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    await authenticateToken(req, res, next);

    // Verificar que se rechazó (401)
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Token inválido'
      })
    );

    // Verificar que next() NO fue llamado
    expect(next).not.toHaveBeenCalled();
  });

  // Test 3: Token expirado rechaza solicitud
  test('Token expirado rechaza solicitud', async () => {
    // Generar token con expiración inmediata
    const expiredToken = authConfig.generateToken(
      {
        userId: testUsuario.id,
        email: testUsuario.email,
        rolId: testUsuario.rol_id,
        organizacionId: testOrg.id
      },
      '0s' // Expira inmediatamente
    );

    // Esperar un segundo para asegurar que expire
    await new Promise(resolve => setTimeout(resolve, 1000));

    const req = {
      headers: {
        authorization: `Bearer ${expiredToken}`
      },
      ip: '127.0.0.1',
      path: '/test',
      get: () => 'Jest Test'
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    await authenticateToken(req, res, next);

    // Verificar que se rechazó (401) con código TOKEN_EXPIRED
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Token expirado',
        errors: expect.objectContaining({
          code: 'TOKEN_EXPIRED'
        })
      })
    );

    // Verificar que next() NO fue llamado
    expect(next).not.toHaveBeenCalled();
  });

  // Test 4: Sin token rechaza solicitud
  test('Sin token rechaza solicitud', async () => {
    const req = {
      headers: {}, // Sin header authorization
      ip: '127.0.0.1',
      path: '/test',
      get: () => 'Jest Test'
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    await authenticateToken(req, res, next);

    // Verificar que se rechazó (401)
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Token de autenticación requerido'
      })
    );

    // Verificar que next() NO fue llamado
    expect(next).not.toHaveBeenCalled();
  });

  // Test 5: Token en blacklist rechaza solicitud
  test('Token en blacklist rechaza solicitud', async () => {
    // Generar un nuevo token para invalidar
    const tokenToBlacklist = authConfig.generateToken({
      userId: testUsuario.id,
      email: testUsuario.email,
      rolId: testUsuario.rol_id,
      organizacionId: testOrg.id
    });

    // Agregar token a blacklist
    await addToTokenBlacklist(tokenToBlacklist);

    const req = {
      headers: {
        authorization: `Bearer ${tokenToBlacklist}`
      },
      ip: '127.0.0.1',
      path: '/test',
      get: () => 'Jest Test'
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    await authenticateToken(req, res, next);

    // Verificar que se rechazó (401) con código TOKEN_BLACKLISTED
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Token invalidado',
        errors: expect.objectContaining({
          code: 'TOKEN_BLACKLISTED'
        })
      })
    );

    // Verificar que next() NO fue llamado
    expect(next).not.toHaveBeenCalled();
  });

  // Test 6: Token con usuario inactivo rechaza solicitud
  test('Token con usuario inactivo rechaza solicitud', async () => {
    // Crear usuario inactivo
    const testClient = await global.testPool.connect();
    await bypassRLS(testClient);

    const usuarioInactivo = await createTestUsuario(testClient, testOrg.id, {
      nombre: 'Inactive',
      apellidos: 'User',
      rol: 'empleado',
      activo: false, // Usuario inactivo
      email_verificado: true
    });

    testClient.release();

    // Generar token para usuario inactivo
    const inactiveToken = authConfig.generateToken({
      userId: usuarioInactivo.id,
      email: usuarioInactivo.email,
      rolId: usuarioInactivo.rol_id,
      organizacionId: testOrg.id
    });

    const req = {
      headers: {
        authorization: `Bearer ${inactiveToken}`
      },
      ip: '127.0.0.1',
      path: '/test',
      get: () => 'Jest Test'
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    await authenticateToken(req, res, next);

    // Verificar que se rechazó (401)
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Usuario no autorizado'
      })
    );

    // Verificar que next() NO fue llamado
    expect(next).not.toHaveBeenCalled();
  });
});

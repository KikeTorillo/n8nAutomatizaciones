/**
 * Tests de Endpoints de Autenticación
 * Suite completa para validar endpoints de auth controller
 */

const request = require('supertest');
const saasApp = require('../../app');
const {
  cleanAllTables,
  createTestOrganizacion,
  createTestUsuario,
  getUniqueTestId
} = require('../helpers/db-helper');

describe('Endpoints de Autenticación', () => {
  let app;
  let client;
  let testOrg;
  let testUsuario;
  const testPassword = 'Password123!';

  beforeAll(async () => {
    app = saasApp.getExpressApp();
    client = await global.testPool.connect();

    // Limpiar BD
    await cleanAllTables(client);

    // Crear organización de prueba
    testOrg = await createTestOrganizacion(client, {
      nombre: 'Test Auth Org'
    });

    // Crear usuario de prueba con contraseña conocida
    // Hash para 'Password123!' (bcrypt)
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(testPassword, 10);

    testUsuario = await createTestUsuario(client, testOrg.id, {
      nombre: 'Usuario',
      apellidos: 'Test Auth',
      rol: 'empleado',
      activo: true,
      email_verificado: true,
      password_hash: passwordHash
    });

    client.release();
  });

  afterAll(async () => {
    const cleanupClient = await global.testPool.connect();
    await cleanAllTables(cleanupClient);
    cleanupClient.release();
  });

  // ============================================================================
  // Tests de Login
  // ============================================================================

  describe('POST /api/v1/auth/login', () => {
    test('Login exitoso con credenciales válidas', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsuario.email,
          password: testPassword
        })
        .expect(200);

      // Verificar estructura de respuesta
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('usuario');

      // Verificar datos del usuario
      expect(response.body.data.usuario.id).toBe(testUsuario.id);
      expect(response.body.data.usuario.email).toBe(testUsuario.email);
      expect(response.body.data.usuario.rol).toBe(testUsuario.rol);

      // Verificar que NO se incluye password_hash
      expect(response.body.data.usuario).not.toHaveProperty('password_hash');
    });

    test('Login falla con contraseña incorrecta', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsuario.email,
          password: 'ContraseñaIncorrecta123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    test('Login falla con email no registrado', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'noexiste@test.com',
          password: testPassword
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    test('Login falla sin email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          password: testPassword
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Login falla sin password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsuario.email
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // 👤 Tests de REGISTRO de Usuarios en Organizaciones Existentes
  // ============================================================================

  describe('POST /api/v1/auth/register - 👤 REGISTRO de Usuarios', () => {
    test('✅ Registro de usuario en organización existente', async () => {
      const uniqueId = getUniqueTestId();
      const newUserData = {
        email: `newuser-${uniqueId}@test.com`,
        password: 'NewPassword123!',
        nombre: 'Nuevo',
        apellidos: 'Usuario',
        rol: 'empleado',
        organizacion_id: testOrg.id
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(newUserData)
        .expect(201);

      // Verificar estructura de respuesta
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('usuario');

      // Verificar datos del usuario creado
      expect(response.body.data.usuario.email).toBe(newUserData.email);
      expect(response.body.data.usuario.nombre).toBe(newUserData.nombre);
      expect(response.body.data.usuario.rol).toBe(newUserData.rol);

      // Verificar que NO se incluye password_hash
      expect(response.body.data.usuario).not.toHaveProperty('password_hash');
    });

    test('❌ Registro de usuario falla con email duplicado', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testUsuario.email, // Email ya existente
          password: 'Password123!',
          nombre: 'Duplicado',
          apellidos: 'Usuario',
          rol: 'empleado',
          organizacion_id: testOrg.id
        });

      // Puede ser 409 o 500 dependiendo del manejo de errores
      expect([409, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success', false);
    });

    test('❌ Registro de usuario falla sin organizacion_id', async () => {
      const uniqueId = getUniqueTestId();

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `test-${uniqueId}@test.com`,
          password: 'Password123!',
          nombre: 'Test',
          apellidos: 'User',
          rol: 'empleado'
          // Falta organizacion_id
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('❌ Registro de usuario falla con contraseña débil', async () => {
      const uniqueId = getUniqueTestId();

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `test-${uniqueId}@test.com`,
          password: '123', // Contraseña muy corta
          nombre: 'Test',
          apellidos: 'User',
          rol: 'empleado',
          organizacion_id: testOrg.id
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Refresh Token
  // ============================================================================

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken;

    beforeAll(async () => {
      // Hacer login para obtener refresh token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsuario.email,
          password: testPassword
        });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    test('Refresh exitoso con token válido', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: refreshToken
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('expiresIn');
    });

    test('Refresh falla sin refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Refresh falla con token inválido', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'token_invalido_12345'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Logout
  // ============================================================================

  describe('POST /api/v1/auth/logout', () => {
    let accessToken;

    beforeEach(async () => {
      // Hacer login para obtener access token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsuario.email,
          password: testPassword
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    test('Logout exitoso con token válido', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Logout falla sin token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de /me (Usuario Autenticado)
  // ============================================================================

  describe('GET /api/v1/auth/me', () => {
    test('Obtener información del usuario autenticado', async () => {
      // Hacer login fresco para obtener token válido
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsuario.email,
          password: testPassword
        });

      const accessToken = loginResponse.body.data.accessToken;

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('usuario');
      expect(response.body.data.usuario.id).toBe(testUsuario.id);
      expect(response.body.data.usuario.email).toBe(testUsuario.email);
    });

    test('Falla sin token de autenticación', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Cambio de Contraseña
  // ============================================================================

  describe('POST /api/v1/auth/change-password', () => {
    test('Cambio de contraseña exitoso', async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsuario.email,
          password: testPassword
        });

      const accessToken = loginResponse.body.data.accessToken;

      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          passwordAnterior: testPassword,
          passwordNueva: 'NewPassword456!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Cambio de contraseña falla con contraseña anterior incorrecta', async () => {
      // El test anterior cambió la contraseña a 'NewPassword456!'
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsuario.email,
          password: 'NewPassword456!' // Usar la nueva contraseña
        });

      const accessToken = loginResponse.body.data.accessToken;

      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          passwordAnterior: 'ContraseñaIncorrecta',
          passwordNueva: 'AnotherPassword789!'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Cambio de contraseña falla sin autenticación', async () => {
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .send({
          passwordAnterior: testPassword,
          passwordNueva: 'NewPassword456!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});

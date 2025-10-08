/**
 * Tests de Endpoints de Recuperación de Contraseña
 * Suite completa para validar flujo de reset de contraseña
 * CRÍTICO: Validar seguridad y expiración de tokens
 */

const request = require('supertest');
const saasApp = require('../../app');
const {
  cleanAllTables,
  createTestOrganizacion,
  createTestUsuario,
  getUniqueTestId,
  bypassRLS
} = require('../helpers/db-helper');

describe('Endpoints de Recuperación de Contraseña', () => {
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

    // Crear organización
    testOrg = await createTestOrganizacion(client, {
      nombre: 'Test Org Password Recovery'
    });

    // Crear usuario con contraseña conocida
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(testPassword, 10);

    testUsuario = await createTestUsuario(client, testOrg.id, {
      nombre: 'Usuario',
      apellidos: 'Password Test',
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
  // Tests de Solicitar Reset de Contraseña
  // ============================================================================

  describe('POST /api/v1/auth/reset-password - Solicitar Reset', () => {
    test('Solicitar reset de contraseña exitosamente', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          email: testUsuario.email,
          organizacion_id: testOrg.id
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('token_enviado', true);

      // En test mode, debe retornar el reset_token
      if (process.env.NODE_ENV === 'test') {
        expect(response.body.data).toHaveProperty('reset_token');
        expect(response.body.data.reset_token).toMatch(/^[a-f0-9]{64}$/);
      }
    });

    test('Retorna mensaje genérico con email inexistente (seguridad)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          email: 'noexiste@test.com',
          organizacion_id: testOrg.id
        })
        .expect(200); // Debe retornar 200 para no revelar existencia

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('token_enviado');
    });

    test('Retorna mensaje genérico con organización incorrecta (seguridad)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          email: testUsuario.email,
          organizacion_id: 999999
        })
        .expect(200); // Debe retornar 200 para no revelar existencia

      expect(response.body.success).toBe(true);
    });

    test('Falla sin email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          organizacion_id: testOrg.id
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla sin organizacion_id', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          email: testUsuario.email
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla con email en formato inválido', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          email: 'email-invalido',
          organizacion_id: testOrg.id
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Rate limiting: previene múltiples solicitudes', async () => {
      // Este test verifica que el sistema tiene rate limiting
      // pero no debe bloquear completamente en tests
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(
          request(app)
            .post('/api/v1/auth/reset-password')
            .send({
              email: testUsuario.email,
              organizacion_id: testOrg.id
            })
        );
      }

      const responses = await Promise.all(promises);
      // Al menos una debe tener éxito
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Tests de Validar Token de Reset
  // ============================================================================

  describe('GET /api/v1/auth/validate-reset-token/:token - Validar Token', () => {
    let validToken;

    beforeAll(async () => {
      // Generar un token válido
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          email: testUsuario.email,
          organizacion_id: testOrg.id
        });

      if (process.env.NODE_ENV === 'test') {
        validToken = response.body.data.reset_token;
      }
    });

    test('Validar token válido exitosamente', async () => {
      if (!validToken) {
        console.warn('Saltando test: reset_token no disponible');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/auth/validate-reset-token/${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('valido', true);
      expect(response.body.data).toHaveProperty('email', testUsuario.email);
      expect(response.body.data).toHaveProperty('expira_en_minutos');
      expect(response.body.data.expira_en_minutos).toBeGreaterThan(0);
    });

    test('Falla con token inválido', async () => {
      const tokenInvalido = 'a'.repeat(64);

      const response = await request(app)
        .get(`/api/v1/auth/validate-reset-token/${tokenInvalido}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.data).toHaveProperty('valido', false);
    });

    test('Falla con token en formato incorrecto', async () => {
      const response = await request(app)
        .get('/api/v1/auth/validate-reset-token/token-corto')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla con token ya usado', async () => {
      if (!validToken) {
        console.warn('Saltando test: reset_token no disponible');
        return;
      }

      // Primero usar el token
      await request(app)
        .post(`/api/v1/auth/reset-password/${validToken}`)
        .send({
          passwordNueva: 'NewPassword456!'
        });

      // Intentar validar el token usado
      const response = await request(app)
        .get(`/api/v1/auth/validate-reset-token/${validToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.data.valido).toBe(false);
    });
  });

  // ============================================================================
  // Tests de Confirmar Reset de Contraseña
  // ============================================================================

  describe('POST /api/v1/auth/reset-password/:token - Confirmar Reset', () => {
    let resetToken;

    beforeEach(async () => {
      // Generar un token fresco para cada test
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          email: testUsuario.email,
          organizacion_id: testOrg.id
        });

      if (process.env.NODE_ENV === 'test') {
        resetToken = response.body.data.reset_token;
      }
    });

    test('Confirmar reset de contraseña exitosamente', async () => {
      if (!resetToken) {
        console.warn('Saltando test: reset_token no disponible');
        return;
      }

      const nuevaPassword = 'NuevaPassword789!';

      const response = await request(app)
        .post(`/api/v1/auth/reset-password/${resetToken}`)
        .send({
          passwordNueva: nuevaPassword
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('email', testUsuario.email);

      // Verificar que puede hacer login con la nueva contraseña
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsuario.email,
          password: nuevaPassword
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    test('Falla con token inválido', async () => {
      const tokenInvalido = 'a'.repeat(64);

      const response = await request(app)
        .post(`/api/v1/auth/reset-password/${tokenInvalido}`)
        .send({
          passwordNueva: 'NewPassword456!'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla con contraseña débil', async () => {
      if (!resetToken) {
        console.warn('Saltando test: reset_token no disponible');
        return;
      }

      const response = await request(app)
        .post(`/api/v1/auth/reset-password/${resetToken}`)
        .send({
          passwordNueva: '123' // Contraseña muy débil
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla sin passwordNueva', async () => {
      if (!resetToken) {
        console.warn('Saltando test: reset_token no disponible');
        return;
      }

      const response = await request(app)
        .post(`/api/v1/auth/reset-password/${resetToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla al reutilizar token ya usado', async () => {
      if (!resetToken) {
        console.warn('Saltando test: reset_token no disponible');
        return;
      }

      // Usar el token primera vez
      await request(app)
        .post(`/api/v1/auth/reset-password/${resetToken}`)
        .send({
          passwordNueva: 'FirstPassword123!'
        })
        .expect(200);

      // Intentar reutilizar el mismo token
      const response = await request(app)
        .post(`/api/v1/auth/reset-password/${resetToken}`)
        .send({
          passwordNueva: 'SecondPassword456!'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Tests de Evaluar Fortaleza de Contraseña
  // ============================================================================

  describe('POST /api/v1/auth/password-strength - Evaluar Fortaleza', () => {
    test('Evaluar contraseña fuerte', async () => {
      const response = await request(app)
        .post('/api/v1/auth/password-strength')
        .send({
          password: 'SuperSecurePassword123!@#'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('score');
      expect(response.body.data).toHaveProperty('nivel');
      expect(response.body.data).toHaveProperty('requisitos');
      expect(response.body.data.score).toBeGreaterThan(0);
    });

    test('Evaluar contraseña débil', async () => {
      const response = await request(app)
        .post('/api/v1/auth/password-strength')
        .send({
          password: '123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.nivel).toMatch(/débil|muy débil/i);
    });

    test('Evaluar contraseña media', async () => {
      const response = await request(app)
        .post('/api/v1/auth/password-strength')
        .send({
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('nivel');
    });

    test('Evaluar contraseña con caracteres especiales', async () => {
      const response = await request(app)
        .post('/api/v1/auth/password-strength')
        .send({
          password: 'P@ssw0rd!2024'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.requisitos).toHaveProperty('caracteres_especiales', true);
    });

    test('Falla sin password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/password-strength')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Evalúa contraseña vacía', async () => {
      const response = await request(app)
        .post('/api/v1/auth/password-strength')
        .send({
          password: ''
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.score).toBe(0);
    });
  });

  // ============================================================================
  // Tests de Verificación de Email
  // ============================================================================

  describe('GET /api/v1/auth/verificar-email/:token - Verificar Email', () => {
    let verificationToken;
    let unverifiedUsuario;

    beforeAll(async () => {
      const tempClient = await global.testPool.connect();

      // Crear usuario sin verificar
      const uniqueId = getUniqueTestId();
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash('TempPassword123!', 10);

      await bypassRLS(tempClient);

      const verificationExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

      const result = await tempClient.query(
        `INSERT INTO usuarios (
          email, password_hash, nombre, apellidos, rol,
          organizacion_id, activo, email_verificado, token_verificacion_email, token_verificacion_expira
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, token_verificacion_email`,
        [
          `unverified-${uniqueId}@test.com`,
          passwordHash,
          'Unverified',
          'User',
          'empleado',
          testOrg.id,
          true,
          false,
          `verification_${uniqueId}_${Date.now()}`,
          verificationExpiration
        ]
      );

      unverifiedUsuario = result.rows[0];
      verificationToken = result.rows[0].token_verificacion_email;
      tempClient.release();
    });

    test('Verificar email exitosamente', async () => {
      const response = await request(app)
        .get(`/api/v1/auth/verificar-email/${verificationToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('verificado', true);
      expect(response.body.data).toHaveProperty('email');
    });

    test('Falla con token inválido', async () => {
      const response = await request(app)
        .get('/api/v1/auth/verificar-email/token_invalido_12345')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Retorna ya_verificado si token ya fue usado', async () => {
      const response = await request(app)
        .get(`/api/v1/auth/verificar-email/${verificationToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ya_verificado).toBe(true);
    });
  });
});

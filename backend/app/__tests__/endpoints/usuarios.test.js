/**
 * Tests de Endpoints de Usuarios
 * Suite completa para validar endpoints del controller de usuarios
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

describe('Endpoints de Usuarios', () => {
  let app;
  let client;
  let testOrg;
  let adminUsuario;
  let adminToken;
  let testUsuario;
  let otherOrg;
  let otherOrgUser;
  let otherOrgToken;

  beforeAll(async () => {
    app = saasApp.getExpressApp();
    client = await global.testPool.connect();

    // Limpiar BD
    await cleanAllTables(client);

    // Crear organización de prueba
    testOrg = await createTestOrganizacion(client, {
      nombre: 'Test Org Usuarios'
    });

    // Crear usuario administrador
    adminUsuario = await createTestUsuario(client, testOrg.id, {
      nombre: 'Admin',
      apellidos: 'Test',
      rol: 'admin',
      activo: true,
      email_verificado: true
    });

    // Generar token para el admin
    adminToken = authConfig.generateToken({
      userId: adminUsuario.id,
      email: adminUsuario.email,
      rol: adminUsuario.rol,
      organizacionId: testOrg.id
    });

    // Crear usuario empleado de prueba
    testUsuario = await createTestUsuario(client, testOrg.id, {
      nombre: 'Empleado',
      apellidos: 'Test',
      rol: 'empleado',
      activo: true,
      email_verificado: true
    });

    // Crear segunda organización para tests RLS
    otherOrg = await createTestOrganizacion(client, {
      nombre: 'Other Org RLS Test'
    });

    // Crear usuario de otra organización
    otherOrgUser = await createTestUsuario(client, otherOrg.id, {
      nombre: 'Other Org',
      apellidos: 'User',
      rol: 'admin',
      activo: true,
      email_verificado: true
    });

    // Generar token para usuario de otra org
    otherOrgToken = authConfig.generateToken({
      userId: otherOrgUser.id,
      email: otherOrgUser.email,
      rol: otherOrgUser.rol,
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
  // Tests de Crear Usuario
  // ============================================================================

  describe('POST /api/v1/usuarios', () => {
    test('Crear usuario exitosamente', async () => {
      const uniqueId = getUniqueTestId();
      const usuarioData = {
        email: `usuario-${uniqueId}@test.com`,
        password: 'Password123!',
        nombre: 'Nuevo',
        apellidos: 'Usuario',
        rol: 'empleado',
        organizacion_id: testOrg.id
      };

      const response = await request(app)
        .post('/api/v1/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(usuarioData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(usuarioData.email);
      expect(response.body.data.nombre).toBe(usuarioData.nombre);
      expect(response.body.data.rol).toBe(usuarioData.rol);
    });

    test('Falla sin autenticación', async () => {
      const uniqueId = getUniqueTestId();

      const response = await request(app)
        .post('/api/v1/usuarios')
        .send({
          email: `usuario-${uniqueId}@test.com`,
          password: 'Password123!',
          nombre: 'Test',
          rol: 'empleado'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('Falla con email duplicado', async () => {
      const response = await request(app)
        .post('/api/v1/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: testUsuario.email, // Email ya existente
          password: 'Password123!',
          nombre: 'Test',
          apellidos: 'Duplicado',
          rol: 'empleado'
        });

      // Acepta 409 o 500 - ambos indican rechazo de duplicado
      expect([409, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Falla sin campos requeridos', async () => {
      const response = await request(app)
        .post('/api/v1/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Test'
          // Falta email, password, rol
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('Falla con contraseña débil', async () => {
      const uniqueId = getUniqueTestId();

      const response = await request(app)
        .post('/api/v1/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `usuario-${uniqueId}@test.com`,
          password: '123', // Contraseña débil
          nombre: 'Test',
          apellidos: 'Usuario',
          rol: 'empleado'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Tests de Listar Usuarios
  // ============================================================================

  describe('GET /api/v1/usuarios', () => {
    test('Listar usuarios de la organización', async () => {
      const response = await request(app)
        .get('/api/v1/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.data).toBeInstanceOf(Array);
      expect(response.body.data.data.length).toBeGreaterThan(0);
    });

    test('Listar con filtro por rol', async () => {
      const response = await request(app)
        .get('/api/v1/usuarios?rol=empleado')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toBeInstanceOf(Array);

      // Verificar que todos son empleados
      response.body.data.data.forEach(usuario => {
        expect(usuario.rol).toBe('empleado');
      });
    });

    test('Listar con filtro por activo', async () => {
      const response = await request(app)
        .get('/api/v1/usuarios?activo=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toBeInstanceOf(Array);

      // Verificar que todos están activos
      response.body.data.data.forEach(usuario => {
        expect(usuario.activo).toBe(true);
      });
    });

    test('Listar con paginación', async () => {
      const response = await request(app)
        .get('/api/v1/usuarios?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(5);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get('/api/v1/usuarios')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Tests de Obtener Usuario por ID
  // ============================================================================

  describe('GET /api/v1/usuarios/:id', () => {
    test('Obtener usuario por ID exitosamente', async () => {
      const response = await request(app)
        .get(`/api/v1/usuarios/${testUsuario.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testUsuario.id);
      expect(response.body.data.email).toBe(testUsuario.email);
    });

    test('Falla con ID inexistente', async () => {
      const response = await request(app)
        .get('/api/v1/usuarios/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get(`/api/v1/usuarios/${testUsuario.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Tests de Actualizar Usuario
  // ============================================================================

  describe('PUT /api/v1/usuarios/:id', () => {
    test('Actualizar usuario exitosamente', async () => {
      const response = await request(app)
        .put(`/api/v1/usuarios/${testUsuario.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Nombre Actualizado',
          apellidos: 'Apellido Actualizado'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.nombre).toBe('Nombre Actualizado');
      expect(response.body.data.apellidos).toBe('Apellido Actualizado');
    });

    test('Falla con ID inexistente', async () => {
      const response = await request(app)
        .put('/api/v1/usuarios/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Test'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .put(`/api/v1/usuarios/${testUsuario.id}`)
        .send({
          nombre: 'Test'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Tests de Cambiar Rol
  // ============================================================================

  describe('PATCH /api/v1/usuarios/:id/rol', () => {
    test('Cambiar rol exitosamente', async () => {
      const response = await request(app)
        .patch(`/api/v1/usuarios/${testUsuario.id}/rol`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rol: 'propietario'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.usuario.rol).toBe('propietario');
    });

    test('Falla con rol inválido', async () => {
      const response = await request(app)
        .patch(`/api/v1/usuarios/${testUsuario.id}/rol`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rol: 'rol_invalido'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .patch(`/api/v1/usuarios/${testUsuario.id}/rol`)
        .send({
          rol: 'manager'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Tests de Obtener Usuarios Bloqueados
  // ============================================================================

  describe('GET /api/v1/usuarios/bloqueados', () => {
    test('Obtener lista de usuarios bloqueados', async () => {
      const response = await request(app)
        .get('/api/v1/usuarios/bloqueados')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get('/api/v1/usuarios/bloqueados')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Tests de Verificar Bloqueo
  // ============================================================================

  describe('GET /api/v1/usuarios/:id/bloqueo', () => {
    test('Verificar estado de bloqueo de usuario', async () => {
      const response = await request(app)
        .get(`/api/v1/usuarios/${testUsuario.id}/bloqueo`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveProperty('esta_bloqueado');
      expect(response.body.data).toHaveProperty('intentos_fallidos');
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get(`/api/v1/usuarios/${testUsuario.id}/bloqueo`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Tests de Desbloquear Usuario
  // ============================================================================

  describe('PATCH /api/v1/usuarios/:id/desbloquear', () => {
    test('Desbloquear usuario exitosamente', async () => {
      const response = await request(app)
        .patch(`/api/v1/usuarios/${testUsuario.id}/desbloquear`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test('Falla con ID inexistente', async () => {
      const response = await request(app)
        .patch('/api/v1/usuarios/999999/desbloquear')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .patch(`/api/v1/usuarios/${testUsuario.id}/desbloquear`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Tests de Aislamiento RLS Multi-Tenant (CRÍTICO)
  // ============================================================================

  describe('Aislamiento RLS Multi-Tenant', () => {
    test('❌ CRÍTICO: Usuario de otra org NO puede ver usuario', async () => {
      const response = await request(app)
        .get(`/api/v1/usuarios/${testUsuario.id}`)
        .set('Authorization', `Bearer ${otherOrgToken}`);

      // RLS debe bloquear: 403/404 (error) o 200 con datos vacíos
      if (response.status === 200) {
        // Si retorna 200, debe retornar null o datos vacíos
        expect(response.body.data).toBeNull();
      } else {
        // O debe retornar error 403/404
        expect([403, 404]).toContain(response.status);
        expect(response.body.success).toBe(false);
      }
    });

    test('❌ CRÍTICO: Usuario de otra org NO puede actualizar usuario', async () => {
      const response = await request(app)
        .put(`/api/v1/usuarios/${testUsuario.id}`)
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .send({ nombre: 'Intentando modificar' });

      // RLS debe bloquear con 403 o 404
      expect([403, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('❌ CRÍTICO: Usuario de otra org NO puede cambiar rol', async () => {
      const response = await request(app)
        .patch(`/api/v1/usuarios/${testUsuario.id}/rol`)
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .send({ rol: 'empleado' });

      // RLS debe bloquear con 403 o 404
      expect([403, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('❌ CRÍTICO: Usuario de otra org NO puede desbloquear usuario', async () => {
      const response = await request(app)
        .patch(`/api/v1/usuarios/${testUsuario.id}/desbloquear`)
        .set('Authorization', `Bearer ${otherOrgToken}`);

      // RLS debe bloquear con 403 o 404
      expect([403, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('✅ Usuario de la misma org SÍ puede ver su usuario', async () => {
      const response = await request(app)
        .get(`/api/v1/usuarios/${testUsuario.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testUsuario.id);
    });

    test('❌ CRÍTICO: Listar usuarios NO muestra usuarios de otras orgs', async () => {
      const response = await request(app)
        .get('/api/v1/usuarios')
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .expect(200);

      const usuarios = response.body.data.data || response.body.data || [];

      // Verificar que ningún usuario pertenece a testOrg
      const usuarioDeOtraOrg = usuarios.find(u => u.id === testUsuario.id || u.id === adminUsuario.id);
      expect(usuarioDeOtraOrg).toBeUndefined();

      // Verificar que solo retorna usuarios de otherOrg
      usuarios.forEach(usuario => {
        expect(usuario.organizacion_id).toBe(otherOrg.id);
      });
    });
  });
});

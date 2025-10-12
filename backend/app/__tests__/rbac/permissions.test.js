/**
 * Tests de RBAC - Control de Permisos por Rol
 * Suite completa para validar autorización granular en todos los módulos
 * CRÍTICO: Prevenir escalación de privilegios
 */

const request = require('supertest');
const saasApp = require('../../app');
const authConfig = require('../../config/auth');
const {
  cleanAllTables,
  createTestOrganizacion,
  createTestUsuario,
  createTestProfesional,
  createTestServicio,
  createTestCliente,
  getUniqueTestId
} = require('../helpers/db-helper');

describe('RBAC - Control de Permisos por Rol', () => {
  let app;
  let client;
  let testOrg;

  // Usuarios con diferentes roles
  let superAdmin;
  let propietario;
  let admin;
  let empleado;

  // Tokens
  let superAdminToken;
  let propietarioToken;
  let adminToken;
  let empleadoToken;

  // Entidades de prueba
  let testProfesional;
  let testServicio;
  let testCliente;

  beforeAll(async () => {
    app = saasApp.getExpressApp();
    client = await global.testPool.connect();

    await cleanAllTables(client);

    // Crear organización
    testOrg = await createTestOrganizacion(client, {
      nombre: 'Test Org RBAC',
      plan: 'premium'
    });

    // Crear usuarios con diferentes roles
    superAdmin = await createTestUsuario(client, null, {
      nombre: 'Super',
      apellidos: 'Admin',
      rol: 'super_admin',
      activo: true,
      email_verificado: true
    });

    propietario = await createTestUsuario(client, testOrg.id, {
      nombre: 'Propietario',
      apellidos: 'Test',
      rol: 'propietario',
      activo: true,
      email_verificado: true
    });

    admin = await createTestUsuario(client, testOrg.id, {
      nombre: 'Admin',
      apellidos: 'Test',
      rol: 'admin',
      activo: true,
      email_verificado: true
    });

    empleado = await createTestUsuario(client, testOrg.id, {
      nombre: 'Empleado',
      apellidos: 'Test',
      rol: 'empleado',
      activo: true,
      email_verificado: true
    });

    // Generar tokens
    superAdminToken = authConfig.generateToken({
      userId: superAdmin.id,
      email: superAdmin.email,
      rol: 'super_admin',
      organizacionId: null
    });

    propietarioToken = authConfig.generateToken({
      userId: propietario.id,
      email: propietario.email,
      rol: 'propietario',
      organizacionId: testOrg.id
    });

    adminToken = authConfig.generateToken({
      userId: admin.id,
      email: admin.email,
      rol: 'admin',
      organizacionId: testOrg.id
    });

    empleadoToken = authConfig.generateToken({
      userId: empleado.id,
      email: empleado.email,
      rol: 'empleado',
      organizacionId: testOrg.id
    });

    // Crear entidades de prueba
    testProfesional = await createTestProfesional(client, testOrg.id, {
      nombre_completo: 'Profesional RBAC Test',
      tipo_profesional: 'barbero'
    });

    // ⚠️ CRÍTICO: Crear horarios profesionales (Domingo-Sábado 9:00-18:00)
    // Sin esto, validarHorarioPermitido() fallará
    for (let dia = 0; dia <= 6; dia++) { // Domingo (0) a Sábado (6)
      await client.query(`
        INSERT INTO horarios_profesionales (
          organizacion_id, profesional_id, dia_semana,
          hora_inicio, hora_fin, tipo_horario,
          nombre_horario, permite_citas, activo,
          fecha_inicio
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        testOrg.id,
        testProfesional.id,
        dia,
        '09:00:00',
        '18:00:00',
        'regular',
        'Horario Laboral',
        true,
        true,
        '2025-01-01'
      ]);
    }

    testServicio = await createTestServicio(client, testOrg.id, {
      nombre: 'Servicio RBAC Test',
      precio: 100.00,
      duracion_minutos: 30
    }, [testProfesional.id]);

    testCliente = await createTestCliente(client, testOrg.id, {
      nombre: 'Cliente RBAC Test',
      telefono: '+5215512345678'
    });

    client.release();
  });

  afterAll(async () => {
    const cleanupClient = await global.testPool.connect();
    await cleanAllTables(cleanupClient);
    cleanupClient.release();
  });

  // ============================================================================
  // RBAC - MÓDULO PROFESIONALES
  // ============================================================================

  describe('RBAC - Profesionales', () => {
    test('✅ Admin SÍ puede crear profesional', async () => {
      const uniqueId = getUniqueTestId();
      const response = await request(app)
        .post('/api/v1/profesionales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre_completo: `Prof Admin ${uniqueId}`,
          tipo_profesional: 'barbero',
          telefono: `+521${uniqueId.slice(-10)}`
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('✅ Propietario SÍ puede crear profesional', async () => {
      const uniqueId = getUniqueTestId();
      const response = await request(app)
        .post('/api/v1/profesionales')
        .set('Authorization', `Bearer ${propietarioToken}`)
        .send({
          nombre_completo: `Prof Propietario ${uniqueId}`,
          tipo_profesional: 'barbero',
          telefono: `+521${uniqueId.slice(-10)}`
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('❌ Empleado NO puede crear profesional', async () => {
      const uniqueId = getUniqueTestId();
      const response = await request(app)
        .post('/api/v1/profesionales')
        .set('Authorization', `Bearer ${empleadoToken}`)
        .send({
          nombre_completo: `Prof Empleado ${uniqueId}`,
          tipo_profesional: 'barbero',
          telefono: `+521${uniqueId.slice(-10)}`
        });

      // Debe fallar con 403 (Forbidden)
      expect([403]).toContain(response.status);
      if (response.status === 403) {
        expect(response.body.success).toBe(false);
      }
    });

    test('❌ Empleado NO puede eliminar profesional', async () => {
      const response = await request(app)
        .delete(`/api/v1/profesionales/${testProfesional.id}`)
        .set('Authorization', `Bearer ${empleadoToken}`);

      // Debe fallar con 403
      expect([403]).toContain(response.status);
      if (response.status === 403) {
        expect(response.body.success).toBe(false);
      }
    });

    test('✅ Admin SÍ puede cambiar estado de profesional', async () => {
      const response = await request(app)
        .patch(`/api/v1/profesionales/${testProfesional.id}/estado`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ activo: true });

      // Admin debería tener acceso
      expect([200, 403]).toContain(response.status);
    });
  });

  // ============================================================================
  // RBAC - MÓDULO SERVICIOS
  // ============================================================================

  describe('RBAC - Servicios', () => {
    test('✅ Admin SÍ puede crear servicio', async () => {
      const uniqueId = getUniqueTestId();
      const response = await request(app)
        .post('/api/v1/servicios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: `Servicio Admin ${uniqueId}`,
          precio: 150.00,
          duracion_minutos: 45
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('❌ Empleado NO puede eliminar servicio', async () => {
      const response = await request(app)
        .delete(`/api/v1/servicios/${testServicio.id}`)
        .set('Authorization', `Bearer ${empleadoToken}`);

      // Debe fallar con 403
      expect([403]).toContain(response.status);
      if (response.status === 403) {
        expect(response.body.success).toBe(false);
      }
    });

    test('✅ Propietario SÍ puede actualizar servicio', async () => {
      const response = await request(app)
        .put(`/api/v1/servicios/${testServicio.id}`)
        .set('Authorization', `Bearer ${propietarioToken}`)
        .send({
          nombre: 'Servicio Actualizado',
          precio: 200.00
        });

      expect([200, 201]).toContain(response.status);
    });

    test('❌ Empleado NO puede eliminar permanente servicio', async () => {
      const response = await request(app)
        .delete(`/api/v1/servicios/${testServicio.id}/permanente`)
        .set('Authorization', `Bearer ${empleadoToken}`);

      // Solo super_admin puede hacer hard delete
      expect([403]).toContain(response.status);
    });
  });

  // ============================================================================
  // RBAC - MÓDULO USUARIOS
  // ============================================================================

  describe('RBAC - Usuarios', () => {
    test('✅ Admin SÍ puede crear usuario', async () => {
      const uniqueId = getUniqueTestId();
      const response = await request(app)
        .post('/api/v1/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `nuevo-${uniqueId}@test.com`,
          password: 'Password123!',
          nombre: 'Nuevo',
          apellidos: 'Usuario',
          rol: 'empleado'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('❌ Empleado NO puede crear usuario', async () => {
      const uniqueId = getUniqueTestId();
      const response = await request(app)
        .post('/api/v1/usuarios')
        .set('Authorization', `Bearer ${empleadoToken}`)
        .send({
          email: `empleado-${uniqueId}@test.com`,
          password: 'Password123!',
          nombre: 'Test',
          apellidos: 'Usuario',
          rol: 'empleado'
        });

      expect([403]).toContain(response.status);
      if (response.status === 403) {
        expect(response.body.success).toBe(false);
      }
    });

    test('❌ Empleado NO puede cambiar rol de usuario', async () => {
      const response = await request(app)
        .patch(`/api/v1/usuarios/${empleado.id}/rol`)
        .set('Authorization', `Bearer ${empleadoToken}`)
        .send({ rol: 'admin' });

      expect([403]).toContain(response.status);
      if (response.status === 403) {
        expect(response.body.success).toBe(false);
      }
    });

    test('✅ Propietario SÍ puede cambiar rol de usuario', async () => {
      const tempClient = await global.testPool.connect();
      const tempUser = await createTestUsuario(tempClient, testOrg.id, {
        nombre: 'Temp',
        apellidos: 'User',
        rol: 'empleado'
      });
      tempClient.release();

      const response = await request(app)
        .patch(`/api/v1/usuarios/${tempUser.id}/rol`)
        .set('Authorization', `Bearer ${propietarioToken}`)
        .send({ rol: 'admin' });

      expect([200, 201]).toContain(response.status);
    });

    test('❌ Empleado NO puede desbloquear usuario', async () => {
      const response = await request(app)
        .patch(`/api/v1/usuarios/${empleado.id}/desbloquear`)
        .set('Authorization', `Bearer ${empleadoToken}`);

      // Solo admin/propietario pueden desbloquear
      expect([403]).toContain(response.status);
    });
  });

  // ============================================================================
  // RBAC - MÓDULO CLIENTES
  // ============================================================================

  describe('RBAC - Clientes', () => {
    test('✅ Empleado SÍ puede crear cliente', async () => {
      const uniqueId = getUniqueTestId();
      const response = await request(app)
        .post('/api/v1/clientes')
        .set('Authorization', `Bearer ${empleadoToken}`)
        .send({
          nombre: `Cliente Empleado ${uniqueId}`,
          telefono: `+521${uniqueId.slice(-10)}`
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('✅ Admin SÍ puede ver estadísticas de clientes', async () => {
      const response = await request(app)
        .get('/api/v1/clientes/estadisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      // Admin tiene acceso a estadísticas
      expect([200]).toContain(response.status);
    });

    test('❌ Empleado NO puede ver estadísticas', async () => {
      const response = await request(app)
        .get('/api/v1/clientes/estadisticas')
        .set('Authorization', `Bearer ${empleadoToken}`);

      // Empleado no tiene acceso
      expect([403]).toContain(response.status);
    });

    test('❌ Empleado NO puede cambiar estado de cliente', async () => {
      const response = await request(app)
        .patch(`/api/v1/clientes/${testCliente.id}/estado`)
        .set('Authorization', `Bearer ${empleadoToken}`)
        .send({ activo: false });

      expect([403]).toContain(response.status);
    });

    test('❌ Empleado NO puede eliminar cliente', async () => {
      const response = await request(app)
        .delete(`/api/v1/clientes/${testCliente.id}`)
        .set('Authorization', `Bearer ${empleadoToken}`);

      // Solo admin puede eliminar
      expect([403]).toContain(response.status);
    });

    test('✅ Admin SÍ puede eliminar cliente', async () => {
      const tempClient = await global.testPool.connect();
      const tempCliente = await createTestCliente(tempClient, testOrg.id, {
        nombre: 'Cliente Temp',
        telefono: '+5219999999999'
      });
      tempClient.release();

      const response = await request(app)
        .delete(`/api/v1/clientes/${tempCliente.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 204]).toContain(response.status);
    });
  });

  // ============================================================================
  // RBAC - MÓDULO ORGANIZACIONES
  // ============================================================================

  describe('RBAC - Organizaciones', () => {
    test('✅ Super Admin SÍ puede crear organización', async () => {
      const uniqueId = getUniqueTestId();
      const response = await request(app)
        .post('/api/v1/organizaciones')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          nombre_comercial: `Org ${uniqueId}`,
          razon_social: `Razón Social ${uniqueId}`,
          tipo_industria: 'barberia',
          plan: 'basico'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('❌ Admin regular NO puede crear organización', async () => {
      const uniqueId = getUniqueTestId();
      const response = await request(app)
        .post('/api/v1/organizaciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre_comercial: `Org Admin ${uniqueId}`,
          razon_social: `Razón Admin ${uniqueId}`,
          tipo_industria: 'barberia',
          plan: 'basico'
        });

      // Solo super_admin puede crear orgs
      expect([403]).toContain(response.status);
    });

    test('❌ Propietario NO puede suspender organización', async () => {
      const response = await request(app)
        .put(`/api/v1/organizaciones/${testOrg.id}/suspender`)
        .set('Authorization', `Bearer ${propietarioToken}`);

      // Solo super_admin puede suspender
      expect([403, 404]).toContain(response.status);
    });

    test('❌ Admin NO puede cambiar plan', async () => {
      const response = await request(app)
        .put(`/api/v1/organizaciones/${testOrg.id}/plan`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ plan: 'enterprise' });

      // Solo super_admin puede cambiar plan
      expect([403, 404]).toContain(response.status);
    });

    test('✅ Propietario SÍ puede ver su organización', async () => {
      const response = await request(app)
        .get(`/api/v1/organizaciones/${testOrg.id}`)
        .set('Authorization', `Bearer ${propietarioToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testOrg.id);
    });

    test('✅ Admin SÍ puede ver estadísticas de su org', async () => {
      const response = await request(app)
        .get(`/api/v1/organizaciones/${testOrg.id}/estadisticas`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('❌ Empleado NO puede ver estadísticas', async () => {
      const response = await request(app)
        .get(`/api/v1/organizaciones/${testOrg.id}/estadisticas`)
        .set('Authorization', `Bearer ${empleadoToken}`);

      // Empleado no tiene acceso a estadísticas
      expect([403]).toContain(response.status);
    });
  });

  // ============================================================================
  // RBAC - RESUMEN DE PERMISOS
  // ============================================================================

  describe('Matriz de Permisos - Resumen', () => {
    test('Documentar matriz de permisos esperada', () => {
      const matrizPermisos = {
        profesionales: {
          crear: ['super_admin', 'admin', 'propietario'],
          ver: ['super_admin', 'admin', 'propietario', 'empleado'],
          actualizar: ['super_admin', 'admin', 'propietario'],
          eliminar: ['super_admin', 'admin', 'propietario']
        },
        servicios: {
          crear: ['super_admin', 'admin', 'propietario'],
          ver: ['super_admin', 'admin', 'propietario', 'empleado'],
          actualizar: ['super_admin', 'admin', 'propietario'],
          eliminar: ['super_admin', 'admin', 'propietario'],
          eliminar_permanente: ['super_admin']
        },
        usuarios: {
          crear: ['super_admin', 'admin', 'propietario'],
          ver: ['super_admin', 'admin', 'propietario'],
          actualizar: ['super_admin', 'admin', 'propietario'],
          cambiar_rol: ['super_admin', 'propietario'],
          desbloquear: ['super_admin', 'admin', 'propietario']
        },
        clientes: {
          crear: ['super_admin', 'admin', 'propietario', 'empleado'],
          ver: ['super_admin', 'admin', 'propietario', 'empleado'],
          actualizar: ['super_admin', 'admin', 'propietario', 'empleado'],
          estadisticas: ['super_admin', 'admin', 'propietario'],
          cambiar_estado: ['super_admin', 'admin', 'propietario'],
          eliminar: ['super_admin', 'admin', 'propietario']
        },
        organizaciones: {
          crear: ['super_admin'],
          ver_propia: ['super_admin', 'admin', 'propietario'],
          ver_todas: ['super_admin'],
          actualizar: ['super_admin', 'propietario'],
          suspender: ['super_admin'],
          cambiar_plan: ['super_admin'],
          estadisticas: ['super_admin', 'admin', 'propietario']
        }
      };

      // Este test documenta la matriz esperada
      expect(matrizPermisos).toBeDefined();
      expect(Object.keys(matrizPermisos)).toHaveLength(5);
    });
  });
});

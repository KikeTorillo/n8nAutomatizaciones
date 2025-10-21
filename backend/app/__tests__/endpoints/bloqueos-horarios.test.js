/**
 * Tests de Endpoints de Bloqueos de Horarios
 * Suite completa para validar endpoints del controller de bloqueos-horarios
 * CRÍTICO: Validar impacto en disponibilidad y aislamiento RLS
 */

const request = require('supertest');
const saasApp = require('../../app');
const authConfig = require('../../config/auth');
const {
  cleanAllTables,
  createTestOrganizacion,
  createTestUsuario,
  createTestProfesional,
  setRLSContext,
  getUniqueTestId
} = require('../helpers/db-helper');

describe('Endpoints de Bloqueos de Horarios', () => {
  let app;
  let client;
  let testOrg;
  let otherOrg;
  let adminUsuario;
  let empleadoUsuario;
  let otherOrgUser;
  let adminToken;
  let empleadoToken;
  let otherOrgToken;
  let testProfesional;
  let otherOrgProfesional;

  beforeAll(async () => {
    app = saasApp.getExpressApp();
    client = await global.testPool.connect();

    // Limpiar BD
    await cleanAllTables(client);

    // Crear primera organización
    testOrg = await createTestOrganizacion(client, {
      nombre: 'Test Org Bloqueos'
    });

    // Crear segunda organización (para tests de aislamiento RLS)
    otherOrg = await createTestOrganizacion(client, {
      nombre: 'Other Org Bloqueos'
    });

    // Crear usuarios de testOrg
    adminUsuario = await createTestUsuario(client, testOrg.id, {
      nombre: 'Admin',
      apellidos: 'Test',
      rol: 'admin',
      activo: true,
      email_verificado: true
    });

    empleadoUsuario = await createTestUsuario(client, testOrg.id, {
      nombre: 'Empleado',
      apellidos: 'Test',
      rol: 'empleado',
      activo: true,
      email_verificado: true
    });

    // Crear usuario de otherOrg
    otherOrgUser = await createTestUsuario(client, otherOrg.id, {
      nombre: 'Other',
      apellidos: 'Admin',
      rol: 'admin',
      activo: true,
      email_verificado: true
    });

    // Generar tokens
    adminToken = authConfig.generateToken({
      userId: adminUsuario.id,
      email: adminUsuario.email,
      rol: adminUsuario.rol,
      organizacionId: testOrg.id
    });

    empleadoToken = authConfig.generateToken({
      userId: empleadoUsuario.id,
      email: empleadoUsuario.email,
      rol: empleadoUsuario.rol,
      organizacionId: testOrg.id
    });

    otherOrgToken = authConfig.generateToken({
      userId: otherOrgUser.id,
      email: otherOrgUser.email,
      rol: otherOrgUser.rol,
      organizacionId: otherOrg.id
    });

    // Crear profesionales
    testProfesional = await createTestProfesional(client, testOrg.id, {
      nombre_completo: 'Profesional Test',
      tipo_profesional: 'barbero'
    });

    otherOrgProfesional = await createTestProfesional(client, otherOrg.id, {
      nombre_completo: 'Other Org Profesional',
      tipo_profesional: 'barbero'
    });

    client.release();
  });

  afterAll(async () => {
    const cleanupClient = await global.testPool.connect();
    await cleanAllTables(cleanupClient);
    cleanupClient.release();
  });

  // ============================================================================
  // Tests de Crear Bloqueo
  // ============================================================================

  describe('POST /api/v1/bloqueos-horarios', () => {
    test('Crear bloqueo de vacaciones exitosamente', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 5);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 3);

      const bloqueoData = {
        profesional_id: testProfesional.id,
        tipo_bloqueo_id: 1, // vacaciones
        titulo: 'Vacaciones de verano',
        descripcion: 'Periodo vacacional programado',
        fecha_inicio: tomorrow.toISOString().split('T')[0],
        fecha_fin: dayAfter.toISOString().split('T')[0],
        notificar_afectados: true,
        mensaje_clientes: 'El profesional estará de vacaciones',
        notas_internas: 'Aprobado por gerencia'
      };

      const response = await request(app)
        .post('/api/v1/bloqueos-horarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bloqueoData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.profesional_id).toBe(testProfesional.id);
      expect(response.body.data.tipo_bloqueo_id).toBe(1); // vacaciones
      expect(response.body.data.titulo).toBe(bloqueoData.titulo);
    });

    test('Crear bloqueo organizacional (sin profesional_id)', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 10);

      const bloqueoData = {
        // Sin profesional_id para bloqueo organizacional
        tipo_bloqueo_id: 2, // feriado
        titulo: 'Día festivo nacional',
        descripcion: 'Cerrado por día festivo',
        fecha_inicio: tomorrow.toISOString().split('T')[0],
        fecha_fin: tomorrow.toISOString().split('T')[0],
        color_display: '#FF0000',
        icono: 'calendar-event'
      };

      const response = await request(app)
        .post('/api/v1/bloqueos-horarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bloqueoData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profesional_id).toBeNull();
      expect(response.body.data.tipo_bloqueo_id).toBe(2); // feriado
    });

    test('Crear bloqueo con horario específico', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 15);

      const bloqueoData = {
        profesional_id: testProfesional.id,
        tipo_bloqueo_id: 4, // evento_especial
        titulo: 'Capacitación técnica',
        fecha_inicio: tomorrow.toISOString().split('T')[0],
        fecha_fin: tomorrow.toISOString().split('T')[0],
        hora_inicio: '09:00:00',
        hora_fin: '13:00:00'
      };

      const response = await request(app)
        .post('/api/v1/bloqueos-horarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bloqueoData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hora_inicio).toBeDefined();
      expect(response.body.data.hora_fin).toBeDefined();
    });

    test('Falla sin autenticación', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await request(app)
        .post('/api/v1/bloqueos-horarios')
        .send({
          tipo_bloqueo_id: 1, // vacaciones
          titulo: 'Test',
          fecha_inicio: tomorrow.toISOString().split('T')[0],
          fecha_fin: tomorrow.toISOString().split('T')[0]
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla sin tipo_bloqueo requerido', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await request(app)
        .post('/api/v1/bloqueos-horarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titulo: 'Test',
          fecha_inicio: tomorrow.toISOString().split('T')[0],
          fecha_fin: tomorrow.toISOString().split('T')[0]
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla con tipo_bloqueo inválido', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await request(app)
        .post('/api/v1/bloqueos-horarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipo_bloqueo_id: 999, // tipo inválido para test
          titulo: 'Test',
          fecha_inicio: tomorrow.toISOString().split('T')[0],
          fecha_fin: tomorrow.toISOString().split('T')[0]
        })
        .expect(500); // Ahora se valida en el modelo (no en schema)

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla con fecha_fin anterior a fecha_inicio', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const response = await request(app)
        .post('/api/v1/bloqueos-horarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipo_bloqueo_id: 1, // vacaciones
          titulo: 'Test',
          fecha_inicio: tomorrow.toISOString().split('T')[0],
          fecha_fin: yesterday.toISOString().split('T')[0]
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla con hora_fin anterior a hora_inicio', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await request(app)
        .post('/api/v1/bloqueos-horarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipo_bloqueo_id: 4, // evento_especial
          titulo: 'Test',
          fecha_inicio: tomorrow.toISOString().split('T')[0],
          fecha_fin: tomorrow.toISOString().split('T')[0],
          hora_inicio: '14:00:00',
          hora_fin: '10:00:00'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Listar Bloqueos
  // ============================================================================

  describe('GET /api/v1/bloqueos-horarios', () => {
    test('Listar bloqueos de la organización', async () => {
      const response = await request(app)
        .get('/api/v1/bloqueos-horarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data) || Array.isArray(response.body.data.bloqueos)).toBe(true);
    });

    test('Listar bloqueos con filtro por profesional', async () => {
      const response = await request(app)
        .get('/api/v1/bloqueos-horarios')
        .query({ profesional_id: testProfesional.id })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Listar bloqueos con filtro por tipo', async () => {
      const response = await request(app)
        .get('/api/v1/bloqueos-horarios')
        .query({ tipo_bloqueo_id: 1 }) // vacaciones
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Listar bloqueos con filtro de fechas', async () => {
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const response = await request(app)
        .get('/api/v1/bloqueos-horarios')
        .query({
          fecha_inicio: today,
          fecha_fin: futureDate.toISOString().split('T')[0]
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Listar solo bloqueos organizacionales', async () => {
      const response = await request(app)
        .get('/api/v1/bloqueos-horarios')
        .query({ solo_organizacionales: true })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get('/api/v1/bloqueos-horarios')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Obtener Bloqueo por ID
  // ============================================================================

  describe('GET /api/v1/bloqueos-horarios/:id', () => {
    let bloqueoId;

    beforeAll(async () => {
      // Crear bloqueo para probar
      const tempClient = await global.testPool.connect();
      await setRLSContext(tempClient, testOrg.id);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 20);

      const result = await tempClient.query(
        `INSERT INTO bloqueos_horarios (
          organizacion_id, profesional_id, tipo_bloqueo_id, titulo,
          fecha_inicio, fecha_fin, activo
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`,
        [
          testOrg.id,
          testProfesional.id,
          6, // personal
          'Permiso médico',
          tomorrow.toISOString().split('T')[0],
          tomorrow.toISOString().split('T')[0],
          true
        ]
      );
      bloqueoId = result.rows[0].id;
      tempClient.release();
    });

    test('Obtener bloqueo por ID', async () => {
      const response = await request(app)
        .get(`/api/v1/bloqueos-horarios/${bloqueoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
    });

    test('Falla con ID inexistente', async () => {
      const response = await request(app)
        .get('/api/v1/bloqueos-horarios/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // El endpoint retorna array vacío o resultado sin datos
      expect(response.body).toHaveProperty('success', true);
      const bloqueos = response.body.data.bloqueos || response.body.data || [];
      expect(bloqueos.length).toBe(0);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get(`/api/v1/bloqueos-horarios/${bloqueoId}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Actualizar Bloqueo
  // ============================================================================

  describe('PUT /api/v1/bloqueos-horarios/:id', () => {
    let bloqueoId;

    beforeAll(async () => {
      const tempClient = await global.testPool.connect();
      await setRLSContext(tempClient, testOrg.id);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 25);

      const result = await tempClient.query(
        `INSERT INTO bloqueos_horarios (
          organizacion_id, profesional_id, tipo_bloqueo_id, titulo,
          fecha_inicio, fecha_fin, activo
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`,
        [
          testOrg.id,
          testProfesional.id,
          4, // evento_especial
          'Capacitación inicial',
          tomorrow.toISOString().split('T')[0],
          tomorrow.toISOString().split('T')[0],
          true
        ]
      );
      bloqueoId = result.rows[0].id;
      tempClient.release();
    });

    test('Actualizar bloqueo exitosamente', async () => {
      const updateData = {
        titulo: 'Capacitación actualizada',
        descripcion: 'Descripción modificada',
        notas_internas: 'Notas actualizadas'
      };

      const response = await request(app)
        .put(`/api/v1/bloqueos-horarios/${bloqueoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .put(`/api/v1/bloqueos-horarios/${bloqueoId}`)
        .send({ titulo: 'Test' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Eliminar Bloqueo
  // ============================================================================

  describe('DELETE /api/v1/bloqueos-horarios/:id', () => {
    test('Eliminar bloqueo exitosamente', async () => {
      // Crear bloqueo temporal para eliminar
      const tempClient = await global.testPool.connect();
      await setRLSContext(tempClient, testOrg.id);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 30);

      const result = await tempClient.query(
        `INSERT INTO bloqueos_horarios (
          organizacion_id, profesional_id, tipo_bloqueo_id, titulo,
          fecha_inicio, fecha_fin, activo
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`,
        [
          testOrg.id,
          testProfesional.id,
          6, // personal
          'Bloqueo temporal',
          tomorrow.toISOString().split('T')[0],
          tomorrow.toISOString().split('T')[0],
          true
        ]
      );
      const bloqueoId = result.rows[0].id;
      tempClient.release();

      const response = await request(app)
        .delete(`/api/v1/bloqueos-horarios/${bloqueoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .delete('/api/v1/bloqueos-horarios/1')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Aislamiento RLS (CRÍTICO)
  // ============================================================================

  describe('Aislamiento RLS Multi-Tenant', () => {
    let testOrgBloqueoId;

    beforeAll(async () => {
      const tempClient = await global.testPool.connect();
      await setRLSContext(tempClient, testOrg.id);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 35);

      const result = await tempClient.query(
        `INSERT INTO bloqueos_horarios (
          organizacion_id, profesional_id, tipo_bloqueo_id, titulo,
          fecha_inicio, fecha_fin, activo
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`,
        [
          testOrg.id,
          testProfesional.id,
          1, // vacaciones
          'Bloqueo privado Org1',
          tomorrow.toISOString().split('T')[0],
          tomorrow.toISOString().split('T')[0],
          true
        ]
      );
      testOrgBloqueoId = result.rows[0].id;
      tempClient.release();
    });

    test('❌ CRÍTICO: Usuario de otra org NO puede ver bloqueo', async () => {
      const response = await request(app)
        .get(`/api/v1/bloqueos-horarios/${testOrgBloqueoId}`)
        .set('Authorization', `Bearer ${otherOrgToken}`);

      // RLS debe bloquear: 403/404 (error) o 200 con datos vacíos
      if (response.status === 200) {
        // Si retorna 200, debe retornar array vacío (RLS filtró los datos)
        const bloqueos = response.body.data?.bloqueos || response.body.data || [];
        expect(bloqueos.length).toBe(0);
      } else {
        // O debe retornar error 403/404
        expect([403, 404]).toContain(response.status);
        expect(response.body.success).toBe(false);
      }
    });

    test('❌ CRÍTICO: Usuario de otra org NO puede actualizar bloqueo', async () => {
      const response = await request(app)
        .put(`/api/v1/bloqueos-horarios/${testOrgBloqueoId}`)
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .send({ titulo: 'Intentando modificar' });

      // RLS debe bloquear con 403 o 404
      expect([403, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('❌ CRÍTICO: Usuario de otra org NO puede eliminar bloqueo', async () => {
      const response = await request(app)
        .delete(`/api/v1/bloqueos-horarios/${testOrgBloqueoId}`)
        .set('Authorization', `Bearer ${otherOrgToken}`);

      // RLS debe bloquear con 403 o 404
      expect([403, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('✅ Usuario de la misma org SÍ puede ver su bloqueo', async () => {
      const response = await request(app)
        .get(`/api/v1/bloqueos-horarios/${testOrgBloqueoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('❌ CRÍTICO: Listar bloqueos NO muestra bloqueos de otras orgs', async () => {
      const response = await request(app)
        .get('/api/v1/bloqueos-horarios')
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .expect(200);

      const bloqueos = response.body.data.bloqueos || response.body.data || [];

      // Verificar que ningún bloqueo pertenece a testOrg
      const bloqueoDeOtraOrg = bloqueos.find(b => b.id === testOrgBloqueoId);
      expect(bloqueoDeOtraOrg).toBeUndefined();
    });
  });
});

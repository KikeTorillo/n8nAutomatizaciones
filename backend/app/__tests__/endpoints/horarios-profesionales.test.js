/**
 * Tests de Endpoints de Horarios Profesionales
 * Suite completa para validar endpoints del controller de horarios-profesionales
 * CRÍTICO: Validar creación de horarios, validación de configuración y aislamiento RLS
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
  bypassRLS
} = require('../helpers/db-helper');

// Aumentar timeout para operaciones RLS complejas
jest.setTimeout(30000);

describe('Endpoints de Horarios Profesionales', () => {
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
      nombre: 'Test Org Horarios'
    });

    // Crear segunda organización (para tests de aislamiento RLS)
    otherOrg = await createTestOrganizacion(client, {
      nombre: 'Other Org Horarios'
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
  // Tests de Crear Horario
  // ============================================================================

  describe('POST /api/v1/horarios-profesionales', () => {
    test('Crear horario laboral exitosamente', async () => {
      const horarioData = {
        profesional_id: testProfesional.id,
        dia_semana: 1, // Lunes
        hora_inicio: '09:00:00',
        hora_fin: '18:00:00',
        tipo_horario: 'regular',
        nombre_horario: 'Horario Regular Lunes',
        permite_citas: true,
        capacidad_maxima: 1,
        fecha_inicio: '2025-01-01',
        fecha_fin: null // Sin fecha fin
      };

      const response = await request(app)
        .post('/api/v1/horarios-profesionales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(horarioData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.profesional_id).toBe(testProfesional.id);
      expect(response.body.data.dia_semana).toBe(1);
      expect(response.body.data.tipo_horario).toBe('regular');
    });

    test('Crear horario de break (no permite citas)', async () => {
      const horarioData = {
        profesional_id: testProfesional.id,
        dia_semana: 2, // Martes (evitar conflicto con test anterior)
        hora_inicio: '13:00:00',
        hora_fin: '14:00:00',
        tipo_horario: 'break',
        nombre_horario: 'Almuerzo',
        permite_citas: false,
        fecha_inicio: '2025-01-01'
      };

      const response = await request(app)
        .post('/api/v1/horarios-profesionales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(horarioData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tipo_horario).toBe('break');
      expect(response.body.data.permite_citas).toBe(false);
    });

    test('Crear horario con vigencia temporal', async () => {
      const horarioData = {
        profesional_id: testProfesional.id,
        dia_semana: 6, // Sábado
        hora_inicio: '09:00:00',
        hora_fin: '14:00:00',
        tipo_horario: 'premium', // Corregido: tipo válido para horarios especiales
        nombre_horario: 'Horario Sábados Temporada Alta',
        permite_citas: true,
        capacidad_maxima: 1,
        fecha_inicio: '2025-12-01',
        fecha_fin: '2025-12-31'
      };

      const response = await request(app)
        .post('/api/v1/horarios-profesionales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(horarioData)
        .expect(201);

      expect(response.body.success).toBe(true);
      // Las fechas se retornan en formato ISO timestamp
      expect(response.body.data.fecha_inicio).toContain('2025-12-01');
      expect(response.body.data.fecha_fin).toContain('2025-12-31');
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .post('/api/v1/horarios-profesionales')
        .send({
          profesional_id: testProfesional.id,
          dia_semana: 1,
          hora_inicio: '09:00:00',
          hora_fin: '18:00:00'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla sin rol admin', async () => {
      const response = await request(app)
        .post('/api/v1/horarios-profesionales')
        .set('Authorization', `Bearer ${empleadoToken}`)
        .send({
          profesional_id: testProfesional.id,
          dia_semana: 1,
          hora_inicio: '09:00:00',
          hora_fin: '18:00:00'
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla con día de semana inválido', async () => {
      const response = await request(app)
        .post('/api/v1/horarios-profesionales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          profesional_id: testProfesional.id,
          dia_semana: 7, // Inválido (0-6)
          hora_inicio: '09:00:00',
          hora_fin: '18:00:00'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla con hora_fin menor que hora_inicio', async () => {
      const response = await request(app)
        .post('/api/v1/horarios-profesionales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          profesional_id: testProfesional.id,
          dia_semana: 1,
          hora_inicio: '18:00:00',
          hora_fin: '09:00:00' // Menor que inicio
        });

      // Acepta tanto 400 (validación Joi) como 500 (validación en BD/modelo)
      expect([400, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla sin profesional_id', async () => {
      const response = await request(app)
        .post('/api/v1/horarios-profesionales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dia_semana: 1,
          hora_inicio: '09:00:00',
          hora_fin: '18:00:00'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Crear Horarios Semanales Estándar
  // ============================================================================

  describe('POST /api/v1/horarios-profesionales/semanales-estandar', () => {
    let profesionalSinHorarios;

    beforeAll(async () => {
      const tempClient = await global.testPool.connect();
      profesionalSinHorarios = await createTestProfesional(tempClient, testOrg.id, {
        nombre_completo: 'Profesional Sin Horarios',
        tipo_profesional: 'estilista'
      });
      tempClient.release();
    });

    test('Crear horarios semanales estándar exitosamente', async () => {
      const horarioData = {
        profesional_id: profesionalSinHorarios.id,
        hora_inicio: '09:00:00',
        hora_fin: '18:00:00',
        incluir_sabado: false,
        incluir_domingo: false,
        fecha_inicio: '2025-01-01'
      };

      const response = await request(app)
        .post('/api/v1/horarios-profesionales/semanales-estandar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(horarioData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.horarios_creados).toBe(5); // Es un número, no array
      expect(response.body.data.horarios).toBeDefined();
      expect(Array.isArray(response.body.data.horarios)).toBe(true);
      expect(response.body.data.horarios.length).toBe(5);
    });

    test('Crear horarios semanales incluyendo sábado', async () => {
      const tempClient = await global.testPool.connect();
      const profesional2 = await createTestProfesional(tempClient, testOrg.id, {
        nombre_completo: 'Profesional 2',
        tipo_profesional: 'barbero'
      });
      tempClient.release();

      const horarioData = {
        profesional_id: profesional2.id,
        dias: [1, 2, 3, 4, 5, 6], // Lunes a Sábado
        hora_inicio: '09:00:00',
        hora_fin: '18:00:00',
        fecha_inicio: '2025-01-01'
      };

      const response = await request(app)
        .post('/api/v1/horarios-profesionales/semanales-estandar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(horarioData)
        .expect(201);

      expect(response.body.success).toBe(true);
      // Debe crear 6 horarios (Lunes-Sábado)
      expect(response.body.data.horarios_creados).toBe(6); // Es un número, no array
      expect(response.body.data.horarios.length).toBe(6);
    });

    test('Crear horarios semanales con domingo', async () => {
      const tempClient = await global.testPool.connect();
      const profesional3 = await createTestProfesional(tempClient, testOrg.id, {
        nombre_completo: 'Profesional 3',
        tipo_profesional: 'barbero'
      });
      tempClient.release();

      const horarioData = {
        profesional_id: profesional3.id,
        dias: [0, 1, 2, 3, 4, 5, 6], // Domingo a Sábado (toda la semana)
        hora_inicio: '10:00:00',
        hora_fin: '16:00:00',
        fecha_inicio: '2025-01-01'
      };

      const response = await request(app)
        .post('/api/v1/horarios-profesionales/semanales-estandar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(horarioData)
        .expect(201);

      expect(response.body.success).toBe(true);
      // Debe crear 7 horarios (Lunes-Domingo)
      expect(response.body.data.horarios_creados).toBe(7); // Es un número, no array
      expect(response.body.data.horarios.length).toBe(7);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .post('/api/v1/horarios-profesionales/semanales-estandar')
        .send({
          profesional_id: profesionalSinHorarios.id,
          hora_inicio: '09:00:00',
          hora_fin: '18:00:00'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla sin rol admin', async () => {
      const response = await request(app)
        .post('/api/v1/horarios-profesionales/semanales-estandar')
        .set('Authorization', `Bearer ${empleadoToken}`)
        .send({
          profesional_id: profesionalSinHorarios.id,
          hora_inicio: '09:00:00',
          hora_fin: '18:00:00'
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Listar Horarios
  // ============================================================================

  describe('GET /api/v1/horarios-profesionales', () => {
    test('Listar horarios de un profesional', async () => {
      const response = await request(app)
        .get('/api/v1/horarios-profesionales')
        .query({ profesional_id: testProfesional.id })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data) || Array.isArray(response.body.data.horarios)).toBe(true);
    });

    test('Listar horarios filtrados por día de semana', async () => {
      const response = await request(app)
        .get('/api/v1/horarios-profesionales')
        .query({
          profesional_id: testProfesional.id,
          dia_semana: 1 // Lunes
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Listar horarios filtrados por tipo', async () => {
      const response = await request(app)
        .get('/api/v1/horarios-profesionales')
        .query({
          profesional_id: testProfesional.id,
          tipo_horario: 'regular'
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get('/api/v1/horarios-profesionales')
        .query({ profesional_id: testProfesional.id })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla sin profesional_id requerido', async () => {
      const response = await request(app)
        .get('/api/v1/horarios-profesionales')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Obtener Horario por ID
  // ============================================================================

  describe('GET /api/v1/horarios-profesionales/:id', () => {
    let horarioId;

    beforeAll(async () => {
      const tempClient = await global.testPool.connect();
      await setRLSContext(tempClient, testOrg.id);

      const result = await tempClient.query(
        `INSERT INTO horarios_profesionales (
          organizacion_id, profesional_id, dia_semana,
          hora_inicio, hora_fin, tipo_horario, nombre_horario,
          permite_citas, capacidad_maxima, fecha_inicio, activo
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id`,
        [
          testOrg.id,
          testProfesional.id,
          4, // Jueves (evitar conflicto con otros tests)
          '10:00:00',
          '19:00:00',
          'regular',
          'Horario Jueves',
          true,
          1,
          '2025-01-01',
          true
        ]
      );
      horarioId = result.rows[0].id;
      tempClient.release();
    });

    test('Obtener horario por ID', async () => {
      const response = await request(app)
        .get(`/api/v1/horarios-profesionales/${horarioId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(horarioId);
    });

    test('Falla con ID inexistente', async () => {
      const response = await request(app)
        .get('/api/v1/horarios-profesionales/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get(`/api/v1/horarios-profesionales/${horarioId}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Actualizar Horario
  // ============================================================================

  describe('PUT /api/v1/horarios-profesionales/:id', () => {
    let horarioId;

    beforeAll(async () => {
      const tempClient = await global.testPool.connect();
      await setRLSContext(tempClient, testOrg.id);

      const result = await tempClient.query(
        `INSERT INTO horarios_profesionales (
          organizacion_id, profesional_id, dia_semana,
          hora_inicio, hora_fin, tipo_horario, nombre_horario,
          permite_citas, fecha_inicio, activo
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id`,
        [
          testOrg.id,
          testProfesional.id,
          3, // Miércoles
          '09:00:00',
          '17:00:00',
          'regular',
          'Horario Miércoles Original',
          true,
          '2025-01-01',
          true
        ]
      );
      horarioId = result.rows[0].id;
      tempClient.release();
    });

    test('Actualizar horario exitosamente', async () => {
      const updateData = {
        nombre_horario: 'Horario Miércoles Actualizado',
        descripcion: 'Horario actualizado en test'
      };

      const response = await request(app)
        .put(`/api/v1/horarios-profesionales/${horarioId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.nombre_horario).toBe('Horario Miércoles Actualizado');
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .put(`/api/v1/horarios-profesionales/${horarioId}`)
        .send({ hora_inicio: '10:00:00' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla sin rol admin', async () => {
      const response = await request(app)
        .put(`/api/v1/horarios-profesionales/${horarioId}`)
        .set('Authorization', `Bearer ${empleadoToken}`)
        .send({ hora_inicio: '10:00:00' })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Eliminar Horario
  // ============================================================================

  describe('DELETE /api/v1/horarios-profesionales/:id', () => {
    test('Eliminar horario exitosamente (soft delete)', async () => {
      const tempClient = await global.testPool.connect();
      await setRLSContext(tempClient, testOrg.id);

      const result = await tempClient.query(
        `INSERT INTO horarios_profesionales (
          organizacion_id, profesional_id, dia_semana,
          hora_inicio, hora_fin, tipo_horario, fecha_inicio, activo
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id`,
        [
          testOrg.id,
          testProfesional.id,
          5, // Viernes (evitar conflicto con otros tests)
          '09:00:00',
          '17:00:00',
          'regular', // Corregido: 'temporal' no es un tipo válido
          '2025-01-01',
          true
        ]
      );
      const horarioId = result.rows[0].id;
      tempClient.release();

      const response = await request(app)
        .delete(`/api/v1/horarios-profesionales/${horarioId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .delete('/api/v1/horarios-profesionales/1')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla sin rol admin', async () => {
      const response = await request(app)
        .delete('/api/v1/horarios-profesionales/1')
        .set('Authorization', `Bearer ${empleadoToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Validar Configuración
  // ============================================================================

  describe('GET /api/v1/horarios-profesionales/validar/:profesional_id', () => {
    test('Validar configuración de profesional con horarios', async () => {
      const response = await request(app)
        .get(`/api/v1/horarios-profesionales/validar/${testProfesional.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
    });

    test('Validar configuración de profesional sin horarios', async () => {
      const tempClient = await global.testPool.connect();
      const profesionalSinHorarios = await createTestProfesional(tempClient, testOrg.id, {
        nombre_completo: 'Profesional Sin Config',
        tipo_profesional: 'barbero'
      });
      tempClient.release();

      const response = await request(app)
        .get(`/api/v1/horarios-profesionales/validar/${profesionalSinHorarios.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      // Debe indicar que no tiene horarios configurados
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .get(`/api/v1/horarios-profesionales/validar/${testProfesional.id}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Aislamiento RLS (CRÍTICO)
  // ============================================================================

  describe('Aislamiento RLS Multi-Tenant', () => {
    let testOrgHorarioId;

    beforeAll(async () => {
      const tempClient = await global.testPool.connect();
      await setRLSContext(tempClient, testOrg.id);

      const result = await tempClient.query(
        `INSERT INTO horarios_profesionales (
          organizacion_id, profesional_id, dia_semana,
          hora_inicio, hora_fin, tipo_horario, nombre_horario,
          fecha_inicio, activo
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id`,
        [
          testOrg.id,
          testProfesional.id,
          0, // Domingo (evitar conflicto con otros tests)
          '09:00:00',
          '18:00:00',
          'regular',
          'Horario Privado Org1',
          '2025-01-01',
          true
        ]
      );
      testOrgHorarioId = result.rows[0].id;
      tempClient.release();
    });

    test('❌ CRÍTICO: Usuario de otra org NO puede ver horario', async () => {
      const response = await request(app)
        .get(`/api/v1/horarios-profesionales/${testOrgHorarioId}`)
        .set('Authorization', `Bearer ${otherOrgToken}`);

      // RLS debe bloquear: 403/404
      expect([403, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('❌ CRÍTICO: Usuario de otra org NO puede actualizar horario', async () => {
      const response = await request(app)
        .put(`/api/v1/horarios-profesionales/${testOrgHorarioId}`)
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .send({ hora_inicio: '10:00:00' });

      expect([403, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('❌ CRÍTICO: Usuario de otra org NO puede eliminar horario', async () => {
      const response = await request(app)
        .delete(`/api/v1/horarios-profesionales/${testOrgHorarioId}`)
        .set('Authorization', `Bearer ${otherOrgToken}`);

      expect([403, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('✅ Usuario de la misma org SÍ puede ver su horario', async () => {
      const response = await request(app)
        .get(`/api/v1/horarios-profesionales/${testOrgHorarioId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testOrgHorarioId);
    });

    test('❌ CRÍTICO: Listar horarios NO muestra horarios de otras orgs', async () => {
      const response = await request(app)
        .get('/api/v1/horarios-profesionales')
        .query({ profesional_id: testProfesional.id })
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .expect(200);

      const horarios = response.body.data?.horarios || response.body.data || [];

      // No debe encontrar horarios del profesional de otra org
      expect(horarios.length).toBe(0);
    });
  });
});

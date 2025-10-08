/**
 * Tests de Concurrencia - Horarios y Reservas
 * Suite completa para validar prevención de doble booking y race conditions
 * CRÍTICO: Prevenir conflictos de agenda en producción
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

describe('Tests de Concurrencia - Horarios', () => {
  let app;
  let client;
  let testOrg;
  let testUsuario;
  let userToken;
  let testProfesional;

  beforeAll(async () => {
    app = saasApp.getExpressApp();
    client = await global.testPool.connect();

    await cleanAllTables(client);

    testOrg = await createTestOrganizacion(client, {
      nombre: 'Test Org Concurrency'
    });

    testUsuario = await createTestUsuario(client, testOrg.id, {
      nombre: 'Usuario',
      apellidos: 'Test',
      rol: 'admin',
      activo: true,
      email_verificado: true
    });

    userToken = authConfig.generateToken({
      userId: testUsuario.id,
      email: testUsuario.email,
      rol: testUsuario.rol,
      organizacionId: testOrg.id
    });

    testProfesional = await createTestProfesional(client, testOrg.id, {
      nombre_completo: 'Profesional Concurrency Test',
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
  // Tests de Doble Booking - Reservas Temporales
  // ============================================================================

  describe('Prevención de Doble Booking - Reservas Temporales', () => {
    test('❌ 2 usuarios NO pueden reservar mismo horario simultáneamente', async () => {
      // Crear horario disponible
      const tempClient = await global.testPool.connect();
      await setRLSContext(tempClient, testOrg.id);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fecha = tomorrow.toISOString().split('T')[0];

      const result = await tempClient.query(
        `INSERT INTO horarios_disponibilidad (
          organizacion_id, profesional_id, fecha, hora_inicio, hora_fin, estado, tipo_horario
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`,
        [testOrg.id, testProfesional.id, fecha, '10:00:00', '11:00:00', 'disponible', 'franja_especifica']
      );
      const horarioId = result.rows[0].id;
      tempClient.release();

      // 2 requests simultáneos para el mismo horario
      const promises = [
        request(app)
          .post('/api/v1/horarios/reservar-temporal')
          .send({
            horario_id: horarioId,
            organizacion_id: testOrg.id,
            duracion_minutos: 30
          }),
        request(app)
          .post('/api/v1/horarios/reservar-temporal')
          .send({
            horario_id: horarioId,
            organizacion_id: testOrg.id,
            duracion_minutos: 30
          })
      ];

      const [response1, response2] = await Promise.all(promises);

      // Solo uno debe tener éxito
      const successCount = [response1, response2].filter(r => r.status === 200).length;
      expect(successCount).toBe(1);

      // El otro debe fallar con 409 (Conflict)
      const conflictCount = [response1, response2].filter(r => r.status === 409).length;
      expect(conflictCount).toBe(1);

      // El que falló debe tener mensaje claro
      const failedResponse = response1.status === 409 ? response1 : response2;
      expect(failedResponse.body.success).toBe(false);
      expect(failedResponse.body.message).toMatch(/ocupado|reservado|disponible/i);
    });

    test('❌ 3 usuarios compitiendo por el mismo horario', async () => {
      const tempClient = await global.testPool.connect();
      await setRLSContext(tempClient, testOrg.id);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const fecha = tomorrow.toISOString().split('T')[0];

      const result = await tempClient.query(
        `INSERT INTO horarios_disponibilidad (
          organizacion_id, profesional_id, fecha, hora_inicio, hora_fin, estado, tipo_horario
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`,
        [testOrg.id, testProfesional.id, fecha, '11:00:00', '12:00:00', 'disponible', 'franja_especifica']
      );
      const horarioId = result.rows[0].id;
      tempClient.release();

      // 3 requests simultáneos
      const promises = [1, 2, 3].map(() =>
        request(app)
          .post('/api/v1/horarios/reservar-temporal')
          .send({
            horario_id: horarioId,
            organizacion_id: testOrg.id,
            duracion_minutos: 30
          })
      );

      const responses = await Promise.all(promises);

      // Solo UNO debe tener éxito
      const successResponses = responses.filter(r => r.status === 200);
      expect(successResponses.length).toBe(1);

      // Los demás deben fallar
      const failedResponses = responses.filter(r => r.status === 409);
      expect(failedResponses.length).toBe(2);
    });

    test('✅ Reservas en horarios diferentes deben tener éxito', async () => {
      const tempClient = await global.testPool.connect();
      await setRLSContext(tempClient, testOrg.id);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 3);
      const fecha = tomorrow.toISOString().split('T')[0];

      // Crear 3 horarios diferentes
      const horarios = [];
      for (let i = 0; i < 3; i++) {
        const hora = 14 + i;
        const result = await tempClient.query(
          `INSERT INTO horarios_disponibilidad (
            organizacion_id, profesional_id, fecha, hora_inicio, hora_fin, estado, tipo_horario
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id`,
          [testOrg.id, testProfesional.id, fecha, `${hora}:00:00`, `${hora + 1}:00:00`, 'disponible', 'franja_especifica']
        );
        horarios.push(result.rows[0].id);
      }
      tempClient.release();

      // 3 requests simultáneos a horarios diferentes
      const promises = horarios.map(horarioId =>
        request(app)
          .post('/api/v1/horarios/reservar-temporal')
          .send({
            horario_id: horarioId,
            organizacion_id: testOrg.id,
            duracion_minutos: 30
          })
      );

      const responses = await Promise.all(promises);

      // Todos deben tener éxito
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBe(3);
    });
  });

  // ============================================================================
  // Tests de Creación Simultánea de Horarios
  // ============================================================================

  describe('Creación Simultánea de Horarios', () => {
    test('✅ 2 usuarios pueden crear horarios diferentes simultáneamente', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 4);
      const fecha = tomorrow.toISOString().split('T')[0];

      const promises = [
        request(app)
          .post('/api/v1/horarios')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            profesional_id: testProfesional.id,
            fecha: fecha,
            hora_inicio: '09:00:00',
            hora_fin: '10:00:00',
            dia_semana: tomorrow.getDay()
          }),
        request(app)
          .post('/api/v1/horarios')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            profesional_id: testProfesional.id,
            fecha: fecha,
            hora_inicio: '10:00:00',
            hora_fin: '11:00:00',
            dia_semana: tomorrow.getDay()
          })
      ];

      const [response1, response2] = await Promise.all(promises);

      // Ambos deben tener éxito
      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
    });

    test('❌ NO se pueden crear horarios superpuestos', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 5);
      const fecha = tomorrow.toISOString().split('T')[0];

      const promises = [
        request(app)
          .post('/api/v1/horarios')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            profesional_id: testProfesional.id,
            fecha: fecha,
            hora_inicio: '13:00:00',
            hora_fin: '15:00:00',
            dia_semana: tomorrow.getDay()
          }),
        request(app)
          .post('/api/v1/horarios')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            profesional_id: testProfesional.id,
            fecha: fecha,
            hora_inicio: '14:00:00',
            hora_fin: '16:00:00', // Se superpone con el anterior
            dia_semana: tomorrow.getDay()
          })
      ];

      const [response1, response2] = await Promise.all(promises);

      // Uno debe tener éxito, el otro debe fallar por superposición
      const successCount = [response1, response2].filter(r => r.status === 201).length;
      const conflictCount = [response1, response2].filter(r => [400, 409].includes(r.status)).length;

      expect(successCount).toBe(1);
      expect(conflictCount).toBe(1);
    });
  });

  // ============================================================================
  // Tests de Liberación de Reservas
  // ============================================================================

  describe('Liberación de Reservas Temporales', () => {
    test('Reserva liberada puede ser tomada por otro usuario', async () => {
      // Crear horario
      const tempClient = await global.testPool.connect();
      await setRLSContext(tempClient, testOrg.id);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 6);
      const fecha = tomorrow.toISOString().split('T')[0];

      const result = await tempClient.query(
        `INSERT INTO horarios_disponibilidad (
          organizacion_id, profesional_id, fecha, hora_inicio, hora_fin, estado, tipo_horario
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`,
        [testOrg.id, testProfesional.id, fecha, '16:00:00', '17:00:00', 'disponible', 'franja_especifica']
      );
      const horarioId = result.rows[0].id;
      tempClient.release();

      // Primera reserva
      const reserva1 = await request(app)
        .post('/api/v1/horarios/reservar-temporal')
        .send({
          horario_id: horarioId,
          organizacion_id: testOrg.id,
          duracion_minutos: 30
        })
        .expect(200);

      expect(reserva1.body.success).toBe(true);

      // Liberar reserva
      await request(app)
        .post('/api/v1/horarios/liberar-reserva')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          horario_id: horarioId,
          organizacion_id: testOrg.id
        })
        .expect(200);

      // Segunda reserva (diferente usuario) debe tener éxito
      const reserva2 = await request(app)
        .post('/api/v1/horarios/reservar-temporal')
        .send({
          horario_id: horarioId,
          organizacion_id: testOrg.id,
          duracion_minutos: 30
        })
        .expect(200);

      expect(reserva2.body.success).toBe(true);
    });
  });

  // ============================================================================
  // Tests de Carga - Múltiples Reservas Simultáneas
  // ============================================================================

  describe('Tests de Carga - Múltiples Reservas', () => {
    test('10 usuarios compitiendo por 3 horarios', async () => {
      const tempClient = await global.testPool.connect();
      await setRLSContext(tempClient, testOrg.id);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 7);
      const fecha = tomorrow.toISOString().split('T')[0];

      // Crear 3 horarios disponibles
      const horarios = [];
      for (let i = 0; i < 3; i++) {
        const hora = 9 + i;
        const result = await tempClient.query(
          `INSERT INTO horarios_disponibilidad (
            organizacion_id, profesional_id, fecha, hora_inicio, hora_fin, estado, tipo_horario
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id`,
          [testOrg.id, testProfesional.id, fecha, `${hora}:00:00`, `${hora + 1}:00:00`, 'disponible', 'franja_especifica']
        );
        horarios.push(result.rows[0].id);
      }
      tempClient.release();

      // 10 usuarios compitiendo (intentan reservar horarios aleatorios)
      const promises = [];
      for (let i = 0; i < 10; i++) {
        const randomHorarioId = horarios[i % 3]; // Distribuir entre los 3 horarios
        promises.push(
          request(app)
            .post('/api/v1/horarios/reservar-temporal')
            .send({
              horario_id: randomHorarioId,
              organizacion_id: testOrg.id,
              duracion_minutos: 30
            })
        );
      }

      const responses = await Promise.all(promises);

      // Solo 3 deben tener éxito (1 por horario)
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBe(3);

      // Los demás deben fallar con 409
      const conflictCount = responses.filter(r => r.status === 409).length;
      expect(conflictCount).toBe(7);
    });

    test('100 requests simultáneos distribuidos en 10 horarios', async () => {
      const tempClient = await global.testPool.connect();
      await setRLSContext(tempClient, testOrg.id);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 8);
      const fecha = tomorrow.toISOString().split('T')[0];

      // Crear 10 horarios disponibles
      const horarios = [];
      for (let i = 0; i < 10; i++) {
        const hora = 9 + i;
        const result = await tempClient.query(
          `INSERT INTO horarios_disponibilidad (
            organizacion_id, profesional_id, fecha, hora_inicio, hora_fin, estado, tipo_horario
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id`,
          [testOrg.id, testProfesional.id, fecha, `${hora}:00:00`, `${hora + 1}:00:00`, 'disponible', 'franja_especifica']
        );
        horarios.push(result.rows[0].id);
      }
      tempClient.release();

      // 100 requests simultáneos
      const promises = [];
      for (let i = 0; i < 100; i++) {
        const randomHorarioId = horarios[i % 10];
        promises.push(
          request(app)
            .post('/api/v1/horarios/reservar-temporal')
            .send({
              horario_id: randomHorarioId,
              organizacion_id: testOrg.id,
              duracion_minutos: 30
            })
        );
      }

      const responses = await Promise.all(promises);

      // Solo 10 deben tener éxito (1 por horario)
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBe(10);

      // Los demás deben fallar
      const failedCount = responses.filter(r => r.status !== 200).length;
      expect(failedCount).toBe(90);

      // Verificar que todos los errores son 409 (no 500)
      const serverErrors = responses.filter(r => r.status === 500).length;
      expect(serverErrors).toBe(0);
    }, 30000); // Timeout de 30 segundos para este test
  });

  // ============================================================================
  // Tests de Expiración de Reservas
  // ============================================================================

  describe('Expiración Automática de Reservas', () => {
    test('Reservas expiradas pueden ser limpiadas', async () => {
      const tempClient = await global.testPool.connect();
      await setRLSContext(tempClient, testOrg.id);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 10);
      const fecha = tomorrow.toISOString().split('T')[0];

      // Crear horario disponible primero
      const result = await tempClient.query(
        `INSERT INTO horarios_disponibilidad (
          organizacion_id, profesional_id, fecha, hora_inicio, hora_fin, estado, tipo_horario
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`,
        [testOrg.id, testProfesional.id, fecha, '17:00:00', '18:00:00', 'disponible', 'franja_especifica']
      );
      const horarioId = result.rows[0].id;

      // Ahora actualizar a reservado_temporal con fecha expirada
      // (UPDATE bypasea el constraint de INSERT)
      await tempClient.query(
        `UPDATE horarios_disponibilidad
         SET estado = 'reservado_temporal',
             reservado_hasta = NOW() - INTERVAL '10 minutes'
         WHERE id = $1`,
        [horarioId]
      );

      tempClient.release();

      // Limpiar reservas expiradas
      const response = await request(app)
        .post('/api/v1/horarios/limpiar-reservas-expiradas')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ organizacion_id: testOrg.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reservas_limpiadas).toBeGreaterThan(0);

      // Verificar que el horario está disponible nuevamente
      const horarioLiberado = await global.testPool.query(
        `SELECT estado FROM horarios_disponibilidad WHERE id = $1`,
        [horarioId]
      );

      expect(horarioLiberado.rows[0].estado).toBe('disponible');
    });
  });
});

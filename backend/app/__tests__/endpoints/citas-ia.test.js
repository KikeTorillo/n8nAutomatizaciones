/**
 * Tests de Endpoints de IA Conversacional - Citas Automáticas
 * Suite completa para validar endpoints de WhatsApp/IA
 * CRÍTICO: Validar flujo completo de agendamiento automático
 */

const request = require('supertest');
const saasApp = require('../../app');
const authConfig = require('../../config/auth');
const {
  cleanAllTables,
  createTestOrganizacion,
  createTestUsuario,
  createTestCliente,
  createTestProfesional,
  createTestServicio,
  createTestCita,
  setRLSContext,
  getUniqueTestId
} = require('../helpers/db-helper');

describe('Endpoints de IA Conversacional - Citas Automáticas', () => {
  let app;
  let client;
  let testOrg;
  let inactiveOrg;
  let testUsuario;
  let userToken;
  let testCliente;
  let testProfesional;
  let testServicio;

  beforeAll(async () => {
    app = saasApp.getExpressApp();
    client = await global.testPool.connect();

    await cleanAllTables(client);

    testOrg = await createTestOrganizacion(client, {
      nombre: 'Test Org IA',
      activo: true
    });

    inactiveOrg = await createTestOrganizacion(client, {
      nombre: 'Inactive Org',
      activo: false
    });

    testUsuario = await createTestUsuario(client, testOrg.id, {
      nombre: 'Usuario',
      apellidos: 'Test',
      rol: 'empleado',
      activo: true,
      email_verificado: true
    });

    userToken = authConfig.generateToken({
      userId: testUsuario.id,
      email: testUsuario.email,
      rol: testUsuario.rol,
      organizacionId: testOrg.id
    });

    testCliente = await createTestCliente(client, testOrg.id, {
      nombre: 'Cliente WhatsApp',
      telefono: '+5215512345678',
      email: 'cliente@test.com'
    });

    testProfesional = await createTestProfesional(client, testOrg.id, {
      nombre_completo: 'Profesional IA Test',
      tipo_profesional: 'barbero',
      telefono: '+5215598765432'
    });

    testServicio = await createTestServicio(client, testOrg.id, {
      nombre: 'Corte de Cabello',
      duracion_minutos: 30,
      precio: 150.00,
      activo: true
    }, [testProfesional.id]);

    await setRLSContext(client, testOrg.id);

    // Crear horarios para los próximos 3 días (mañana y pasado mañana)
    for (let daysAhead = 1; daysAhead <= 3; daysAhead++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysAhead);
      const targetDateStr = targetDate.toISOString().split('T')[0];
      const dayOfWeek = targetDate.getDay();

      // Horarios de mañana (9:00-12:00)
      for (let hour = 9; hour < 12; hour++) {
        const horaInicio = `${hour.toString().padStart(2, '0')}:00:00`;
        const horaFin = `${(hour + 1).toString().padStart(2, '0')}:00:00`;

        await client.query(
          `INSERT INTO horarios_disponibilidad (
            organizacion_id, profesional_id, fecha, hora_inicio, hora_fin,
            dia_semana, estado, tipo_horario
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [testOrg.id, testProfesional.id, targetDateStr, horaInicio, horaFin,
           dayOfWeek, 'disponible', 'franja_especifica']
        );
      }

      // Horarios de tarde (14:00-18:00)
      for (let hour = 14; hour < 18; hour++) {
        const horaInicio = `${hour.toString().padStart(2, '0')}:00:00`;
        const horaFin = `${(hour + 1).toString().padStart(2, '0')}:00:00`;

        await client.query(
          `INSERT INTO horarios_disponibilidad (
            organizacion_id, profesional_id, fecha, hora_inicio, hora_fin,
            dia_semana, estado, tipo_horario
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [testOrg.id, testProfesional.id, targetDateStr, horaInicio, horaFin,
           dayOfWeek, 'disponible', 'franja_especifica']
        );
      }
    }

    client.release();
  });

  afterAll(async () => {
    const cleanupClient = await global.testPool.connect();
    await cleanAllTables(cleanupClient);
    cleanupClient.release();
  });

  // ============================================================================
  // Tests de Crear Cita Automática (Endpoint Principal IA)
  // ============================================================================

  describe('POST /api/v1/citas/automatica - Crear Cita vía IA', () => {
    test('Crear cita automática con cliente existente', async () => {
      const citaData = {
        telefono_cliente: testCliente.telefono,
        organizacion_id: testOrg.id,
        servicio_id: testServicio.id,
        fecha_solicitada: 'mañana',
        turno_preferido: 'mañana',
        metadata: {
          canal: 'whatsapp',
          mensaje_original: 'Quiero una cita para mañana por la mañana'
        }
      };

      const response = await request(app)
        .post('/api/v1/citas/automatica')
        .send(citaData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('cita');
      expect(response.body.data.cita).toHaveProperty('codigo');
      expect(response.body.data.cita.codigo).toMatch(/^[A-Z0-9]+-\d{8}-\d{3}$/);
      expect(response.body.data.cliente.es_nuevo).toBe(false);
      expect(response.body.data).toHaveProperty('mensaje_confirmacion');
    });

    test('Crear cita automática con nuevo cliente (auto-creación)', async () => {
      const nuevoTelefono = `+521${getUniqueTestId().slice(-10)}`;

      const citaData = {
        telefono_cliente: nuevoTelefono,
        organizacion_id: testOrg.id,
        servicio_id: testServicio.id,
        fecha_solicitada: 'mañana',
        crear_cliente_si_no_existe: true,
        nombre_cliente_nuevo: 'Cliente Nuevo WhatsApp',
        email_cliente_nuevo: `nuevo-${getUniqueTestId()}@test.com`
      };

      const response = await request(app)
        .post('/api/v1/citas/automatica')
        .send(citaData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cliente.es_nuevo).toBe(true);
      expect(response.body.data.cita.codigo).toMatch(/^[A-Z0-9]+-\d{8}-\d{3}$/);
    });

    test('Crear cita con preferencia de profesional', async () => {
      const citaData = {
        telefono_cliente: testCliente.telefono,
        organizacion_id: testOrg.id,
        servicio_id: testServicio.id,
        fecha_solicitada: 'pasado mañana',
        profesional_preferido: testProfesional.id
      };

      const response = await request(app)
        .post('/api/v1/citas/automatica')
        .send(citaData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cita.profesional).toContain(testProfesional.nombre_completo.split(' ')[0]);
    });

    test('Crear cita con turno preferido tarde', async () => {
      const citaData = {
        telefono_cliente: testCliente.telefono,
        organizacion_id: testOrg.id,
        servicio_id: testServicio.id,
        fecha_solicitada: 'mañana',
        turno_preferido: 'tarde'
      };

      const response = await request(app)
        .post('/api/v1/citas/automatica')
        .send(citaData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('Falla con organización inactiva', async () => {
      const citaData = {
        telefono_cliente: testCliente.telefono,
        organizacion_id: inactiveOrg.id,
        servicio_id: testServicio.id,
        fecha_solicitada: 'mañana'
      };

      const response = await request(app)
        .post('/api/v1/citas/automatica')
        .send(citaData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Organización no encontrada o inactiva');
    });

    test('Falla con servicio inexistente', async () => {
      const citaData = {
        telefono_cliente: testCliente.telefono,
        organizacion_id: testOrg.id,
        servicio_id: 999999,
        fecha_solicitada: 'mañana'
      };

      const response = await request(app)
        .post('/api/v1/citas/automatica')
        .send(citaData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('Falla sin telefono_cliente', async () => {
      const citaData = {
        organizacion_id: testOrg.id,
        servicio_id: testServicio.id,
        fecha_solicitada: 'mañana'
      };

      const response = await request(app)
        .post('/api/v1/citas/automatica')
        .send(citaData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('Falla sin organizacion_id', async () => {
      const citaData = {
        telefono_cliente: testCliente.telefono,
        servicio_id: testServicio.id,
        fecha_solicitada: 'mañana'
      };

      const response = await request(app)
        .post('/api/v1/citas/automatica')
        .send(citaData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('Falla sin servicio_id', async () => {
      const citaData = {
        telefono_cliente: testCliente.telefono,
        organizacion_id: testOrg.id,
        fecha_solicitada: 'mañana'
      };

      const response = await request(app)
        .post('/api/v1/citas/automatica')
        .send(citaData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Tests de Buscar por Teléfono (Consulta de Citas vía WhatsApp)
  // ============================================================================

  describe('GET /api/v1/citas/buscar-por-telefono - Buscar Citas por Teléfono', () => {
    let codigoCita;

    beforeAll(async () => {
      // Crear cita de prueba
      const tempClient = await global.testPool.connect();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fechaCita = tomorrow.toISOString().split('T')[0];

      const cita = await createTestCita(tempClient, testOrg.id, {
        cliente_id: testCliente.id,
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id,
        fecha_cita: fechaCita,
        hora_inicio: '10:00:00',
        hora_fin: '10:30:00',
        precio_servicio: 150.00,
        precio_final: 150.00,
        estado: 'pendiente'
      });
      codigoCita = cita.codigo_cita;
      tempClient.release();
    });

    test('Buscar citas por teléfono exitosamente', async () => {
      const response = await request(app)
        .get('/api/v1/citas/buscar-por-telefono')
        .query({
          telefono: testCliente.telefono,
          organizacion_id: testOrg.id
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const citaEncontrada = response.body.data.find(c => c.codigo_cita === codigoCita);
      expect(citaEncontrada).toBeDefined();
      expect(citaEncontrada).toHaveProperty('fecha');
      expect(citaEncontrada).toHaveProperty('hora');
      expect(citaEncontrada).toHaveProperty('servicio');
      expect(citaEncontrada).toHaveProperty('profesional');
      expect(citaEncontrada).toHaveProperty('estado');
      expect(citaEncontrada).toHaveProperty('puede_cancelar');
      expect(citaEncontrada).toHaveProperty('puede_modificar');
    });

    test('Buscar citas con filtro de estados', async () => {
      const response = await request(app)
        .get('/api/v1/citas/buscar-por-telefono')
        .query({
          telefono: testCliente.telefono,
          organizacion_id: testOrg.id,
          estados: 'pendiente,confirmada'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('Buscar citas incluyendo históricas', async () => {
      const response = await request(app)
        .get('/api/v1/citas/buscar-por-telefono')
        .query({
          telefono: testCliente.telefono,
          organizacion_id: testOrg.id,
          incluir_historicas: 'true'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('Retorna array vacío con teléfono sin citas', async () => {
      const response = await request(app)
        .get('/api/v1/citas/buscar-por-telefono')
        .query({
          telefono: '+5219999999999',
          organizacion_id: testOrg.id
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    test('Falla con organización inactiva', async () => {
      const response = await request(app)
        .get('/api/v1/citas/buscar-por-telefono')
        .query({
          telefono: testCliente.telefono,
          organizacion_id: inactiveOrg.id
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('Falla sin teléfono', async () => {
      const response = await request(app)
        .get('/api/v1/citas/buscar-por-telefono')
        .query({
          organizacion_id: testOrg.id
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('Falla sin organizacion_id', async () => {
      const response = await request(app)
        .get('/api/v1/citas/buscar-por-telefono')
        .query({
          telefono: testCliente.telefono
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Tests de Modificar Cita Automática (vía IA)
  // ============================================================================

  describe('PUT /api/v1/citas/automatica/:codigo - Modificar Cita vía IA', () => {
    let codigoCitaModificable;

    beforeAll(async () => {
      const tempClient = await global.testPool.connect();
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const fechaCita = dayAfterTomorrow.toISOString().split('T')[0];

      const cita = await createTestCita(tempClient, testOrg.id, {
        cliente_id: testCliente.id,
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id,
        fecha_cita: fechaCita,
        hora_inicio: '11:00:00',
        hora_fin: '11:30:00',
        precio_servicio: 150.00,
        precio_final: 150.00,
        estado: 'pendiente'
      });
      codigoCitaModificable = cita.codigo_cita;
      tempClient.release();
    });

    test('Modificar fecha de cita exitosamente', async () => {
      const response = await request(app)
        .put(`/api/v1/citas/automatica/${codigoCitaModificable}`)
        .send({
          organizacion_id: testOrg.id,
          nueva_fecha: 'pasado mañana',
          motivo: 'Cliente solicitó cambio de fecha'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('Modificar turno de cita', async () => {
      const response = await request(app)
        .put(`/api/v1/citas/automatica/${codigoCitaModificable}`)
        .send({
          organizacion_id: testOrg.id,
          nuevo_turno: 'tarde',
          motivo: 'Cambio a horario tarde'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('Falla con código de cita inexistente', async () => {
      const response = await request(app)
        .put('/api/v1/citas/automatica/NOEXISTE-20250101-999')
        .send({
          organizacion_id: testOrg.id,
          nueva_fecha: 'mañana'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('Falla con organización inactiva', async () => {
      const response = await request(app)
        .put(`/api/v1/citas/automatica/${codigoCitaModificable}`)
        .send({
          organizacion_id: inactiveOrg.id,
          nueva_fecha: 'mañana'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('Falla sin organizacion_id', async () => {
      const response = await request(app)
        .put(`/api/v1/citas/automatica/${codigoCitaModificable}`)
        .send({
          nueva_fecha: 'mañana'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Tests de Cancelar Cita Automática (vía IA)
  // ============================================================================

  describe('DELETE /api/v1/citas/automatica/:codigo - Cancelar Cita vía IA', () => {
    let codigoCitaCancelable;

    beforeEach(async () => {
      const tempClient = await global.testPool.connect();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 3);
      const fechaCita = tomorrow.toISOString().split('T')[0];

      const cita = await createTestCita(tempClient, testOrg.id, {
        cliente_id: testCliente.id,
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id,
        fecha_cita: fechaCita,
        hora_inicio: '14:00:00',
        hora_fin: '14:30:00',
        precio_servicio: 150.00,
        precio_final: 150.00,
        estado: 'pendiente'
      });
      codigoCitaCancelable = cita.codigo_cita;
      tempClient.release();
    });

    test('Cancelar cita exitosamente', async () => {
      const response = await request(app)
        .delete(`/api/v1/citas/automatica/${codigoCitaCancelable}`)
        .send({
          organizacion_id: testOrg.id,
          motivo: 'Cliente canceló por WhatsApp'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('Cancelar cita sin motivo (usa motivo por defecto)', async () => {
      const response = await request(app)
        .delete(`/api/v1/citas/automatica/${codigoCitaCancelable}`)
        .send({
          organizacion_id: testOrg.id
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('Falla con código inexistente', async () => {
      const response = await request(app)
        .delete('/api/v1/citas/automatica/NOEXISTE-20250101-999')
        .send({
          organizacion_id: testOrg.id
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('Falla con organización inactiva', async () => {
      const response = await request(app)
        .delete(`/api/v1/citas/automatica/${codigoCitaCancelable}`)
        .send({
          organizacion_id: inactiveOrg.id
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('Falla sin organizacion_id', async () => {
      const response = await request(app)
        .delete(`/api/v1/citas/automatica/${codigoCitaCancelable}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Tests de Marcar Recordatorio Enviado
  // ============================================================================

  describe('PATCH /api/v1/citas/:codigo/recordatorio-enviado - Marcar Recordatorio', () => {
    let codigoCitaRecordatorio;

    beforeAll(async () => {
      const tempClient = await global.testPool.connect();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fechaCita = tomorrow.toISOString().split('T')[0];

      const cita = await createTestCita(tempClient, testOrg.id, {
        cliente_id: testCliente.id,
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id,
        fecha_cita: fechaCita,
        hora_inicio: '15:00:00',
        hora_fin: '15:30:00',
        precio_servicio: 150.00,
        precio_final: 150.00,
        estado: 'confirmada'
      });
      codigoCitaRecordatorio = cita.codigo_cita;
      tempClient.release();
    });

    test('Marcar recordatorio como enviado exitosamente', async () => {
      const response = await request(app)
        .patch(`/api/v1/citas/${codigoCitaRecordatorio}/recordatorio-enviado`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('Falla con código de cita inexistente', async () => {
      const response = await request(app)
        .patch('/api/v1/citas/NOEXISTE-20250101-999/recordatorio-enviado')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .patch(`/api/v1/citas/${codigoCitaRecordatorio}/recordatorio-enviado`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Tests de Calificar Cliente
  // ============================================================================

  describe('PATCH /api/v1/citas/:codigo/calificar-cliente - Calificar Cliente', () => {
    let codigoCitaCalificar;

    beforeAll(async () => {
      const tempClient = await global.testPool.connect();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const fechaCita = yesterday.toISOString().split('T')[0];

      const cita = await createTestCita(tempClient, testOrg.id, {
        cliente_id: testCliente.id,
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id,
        fecha_cita: fechaCita,
        hora_inicio: '16:00:00',
        hora_fin: '16:30:00',
        precio_servicio: 150.00,
        precio_final: 150.00,
        estado: 'completada',
        pagado: true // Requerido por constraint valid_estado_pagado
      });
      codigoCitaCalificar = cita.codigo_cita;
      tempClient.release();
    });

    test('Calificar cliente exitosamente', async () => {
      const calificacion = {
        puntuacion: 5,
        comentario: 'Excelente cliente, muy puntual'
      };

      const response = await request(app)
        .patch(`/api/v1/citas/${codigoCitaCalificar}/calificar-cliente`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(calificacion)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('Calificar con puntuación mínima', async () => {
      const calificacion = {
        puntuacion: 1,
        comentario: 'Cliente no se presentó'
      };

      const response = await request(app)
        .patch(`/api/v1/citas/${codigoCitaCalificar}/calificar-cliente`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(calificacion)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('Calificar sin comentario (opcional)', async () => {
      const calificacion = {
        puntuacion: 4
      };

      const response = await request(app)
        .patch(`/api/v1/citas/${codigoCitaCalificar}/calificar-cliente`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(calificacion)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .patch(`/api/v1/citas/${codigoCitaCalificar}/calificar-cliente`)
        .send({ puntuacion: 5 })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('Falla sin puntuación', async () => {
      const response = await request(app)
        .patch(`/api/v1/citas/${codigoCitaCalificar}/calificar-cliente`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ comentario: 'Test' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

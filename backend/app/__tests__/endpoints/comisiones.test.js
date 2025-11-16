/**
 * Tests de Endpoints de Comisiones
 * Suite completa para validar endpoints del módulo de comisiones
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

describe('Endpoints de Comisiones', () => {
  let app;
  let client;
  let testOrg;
  let adminUsuario;
  let adminToken;
  let testProfesional;
  let testServicio;
  let testCliente;
  let configComisionId;
  let citaId;
  let comisionId;

  beforeAll(async () => {
    app = saasApp.getExpressApp();
    client = await global.testPool.connect();

    // Limpiar BD
    await cleanAllTables(client);

    // Crear organización de prueba
    testOrg = await createTestOrganizacion(client, {
      nombre: 'Test Org Comisiones',
      plan_actual: 'profesional'
    });

    // Crear usuario admin de la organización
    adminUsuario = await createTestUsuario(client, testOrg.id, {
      nombre: 'Admin',
      apellidos: 'Comisiones',
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

    // Crear profesional de prueba
    testProfesional = await createTestProfesional(client, testOrg.id, {
      nombre_completo: 'Dr. Test Comisiones',
      email: `prof.comisiones.${getUniqueTestId()}@test.com`
    });

    // Crear servicio de prueba
    testServicio = await createTestServicio(client, testOrg.id, {
      nombre: 'Servicio Test Comisiones',
      precio: 500.00,
      duracion_minutos: 30
    });

    // Asignar servicio al profesional
    await client.query(
      'INSERT INTO servicios_profesionales (profesional_id, servicio_id) VALUES ($1, $2)',
      [testProfesional.id, testServicio.id]
    );

    // Crear cliente de prueba
    testCliente = await createTestCliente(client, testOrg.id, {
      nombre: 'Cliente Test Comisiones',
      telefono: '5512345678'
    });

    client.release();
  });

  afterAll(async () => {
    const cleanupClient = await global.testPool.connect();
    await cleanAllTables(cleanupClient);
    cleanupClient.release();
  });

  // ============================================================================
  // Tests de Configuración de Comisiones
  // ============================================================================

  describe('POST /api/v1/comisiones/configuracion', () => {
    test('Crear configuración de comisión global (porcentaje) exitosamente', async () => {
      const response = await request(app)
        .post('/api/v1/comisiones/configuracion')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          profesional_id: testProfesional.id,
          tipo_comision: 'porcentaje',
          valor_comision: 15.00,
          activo: true,
          notas: 'Comisión global del 15%'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.profesional_id).toBe(testProfesional.id);
      expect(response.body.data.tipo_comision).toBe('porcentaje');
      expect(parseFloat(response.body.data.valor_comision)).toBe(15.00);
      expect(response.body.data.servicio_id).toBeNull();
      expect(response.body.data.activo).toBe(true);

      // Guardar ID para siguientes tests
      configComisionId = response.body.data.id;
    });

    test('Crear configuración específica por servicio (monto fijo)', async () => {
      const response = await request(app)
        .post('/api/v1/comisiones/configuracion')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          profesional_id: testProfesional.id,
          servicio_id: testServicio.id,
          tipo_comision: 'monto_fijo',
          valor_comision: 50.00,
          activo: true,
          notas: 'Comisión fija de $50 por este servicio'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.servicio_id).toBe(testServicio.id);
      expect(response.body.data.tipo_comision).toBe('monto_fijo');
      expect(parseFloat(response.body.data.valor_comision)).toBe(50.00);
    });

    test('Actualizar configuración existente (upsert)', async () => {
      const response = await request(app)
        .post('/api/v1/comisiones/configuracion')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          profesional_id: testProfesional.id,
          tipo_comision: 'porcentaje',
          valor_comision: 20.00, // Cambiar de 15% a 20%
          activo: true,
          notas: 'Comisión actualizada a 20%'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(parseFloat(response.body.data.valor_comision)).toBe(20.00);
    });

    test('Rechazar porcentaje > 100', async () => {
      const response = await request(app)
        .post('/api/v1/comisiones/configuracion')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          profesional_id: testProfesional.id,
          tipo_comision: 'porcentaje',
          valor_comision: 150.00, // Inválido
          activo: true
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('Rechazar sin autenticación', async () => {
      const response = await request(app)
        .post('/api/v1/comisiones/configuracion')
        .send({
          profesional_id: testProfesional.id,
          tipo_comision: 'porcentaje',
          valor_comision: 15.00
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/comisiones/configuracion', () => {
    test('Listar todas las configuraciones de la organización', async () => {
      const response = await request(app)
        .get('/api/v1/comisiones/configuracion')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verificar estructura de los datos
      const config = response.body.data[0];
      expect(config).toHaveProperty('id');
      expect(config).toHaveProperty('profesional_nombre');
      expect(config).toHaveProperty('tipo_comision');
      expect(config).toHaveProperty('valor_comision');
    });

    test('Filtrar configuraciones por profesional', async () => {
      const response = await request(app)
        .get(`/api/v1/comisiones/configuracion?profesional_id=${testProfesional.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Todas las configuraciones deben ser del profesional especificado
      response.body.data.forEach(config => {
        expect(config.profesional_id).toBe(testProfesional.id);
      });
    });

    test('Filtrar configuraciones activas', async () => {
      const response = await request(app)
        .get('/api/v1/comisiones/configuracion?activo=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      response.body.data.forEach(config => {
        expect(config.activo).toBe(true);
      });
    });
  });

  describe('DELETE /api/v1/comisiones/configuracion/:id', () => {
    test('Eliminar configuración exitosamente', async () => {
      // Primero crear una config temporal
      const createResponse = await request(app)
        .post('/api/v1/comisiones/configuracion')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          profesional_id: testProfesional.id,
          tipo_comision: 'monto_fijo',
          valor_comision: 25.00,
          activo: false,
          notas: 'Config temporal para eliminar'
        });

      const tempConfigId = createResponse.body.data.id;

      // Eliminar
      const response = await request(app)
        .delete(`/api/v1/comisiones/configuracion/${tempConfigId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('Rechazar eliminación de configuración inexistente', async () => {
      const response = await request(app)
        .delete('/api/v1/comisiones/configuracion/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  // ============================================================================
  // Tests de Generación Automática de Comisiones (Trigger)
  // ============================================================================

  describe('Generación Automática de Comisiones', () => {
    test('Crear cita y completarla → Trigger genera comisión', async () => {
      // PASO 1: Crear cita
      const fechaCita = new Date();
      fechaCita.setDate(fechaCita.getDate() + 1);
      const fechaString = fechaCita.toISOString().split('T')[0];

      const createCitaResponse = await request(app)
        .post('/api/v1/citas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cliente_id: testCliente.id,
          profesional_id: testProfesional.id,
          servicios_ids: [testServicio.id],
          fecha_cita: fechaString,
          hora_inicio: '14:00',
          hora_fin: '14:30',
          precio_total: 500.00,
          duracion_total_minutos: 30,
          notas: 'Cita para test de comisiones'
        });

      expect(createCitaResponse.status).toBe(201);
      citaId = createCitaResponse.body.data.id;

      // PASO 2: Completar cita (esto dispara el trigger)
      const completeCitaResponse = await request(app)
        .post(`/api/v1/citas/${citaId}/complete`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notas_completado: 'Servicio completado - Test de comisiones'
        });

      expect(completeCitaResponse.status).toBe(200);

      // PASO 3: Esperar un momento para que el trigger se ejecute
      await new Promise(resolve => setTimeout(resolve, 500));

      // PASO 4: Verificar que se generó la comisión
      const comisionesResponse = await request(app)
        .get(`/api/v1/comisiones/profesional/${testProfesional.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(comisionesResponse.status).toBe(200);
      expect(comisionesResponse.body.data.comisiones.length).toBeGreaterThan(0);

      const comision = comisionesResponse.body.data.comisiones[0];
      comisionId = comision.id;

      expect(comision.cita_id).toBe(citaId);
      expect(parseFloat(comision.monto_base)).toBe(500.00);
      expect(comision.estado_pago).toBe('pendiente');

      // Verificar cálculo: 20% de $500 = $100
      expect(parseFloat(comision.monto_comision)).toBe(100.00);
      expect(comision.tipo_comision).toBe('porcentaje');
      expect(parseFloat(comision.valor_comision)).toBe(20.00);

      // Verificar que tiene detalle_servicios en formato JSONB
      expect(comision.detalle_servicios).toBeDefined();
    });
  });

  // ============================================================================
  // Tests de Consultas de Comisiones
  // ============================================================================

  describe('GET /api/v1/comisiones/profesional/:id', () => {
    test('Listar comisiones de un profesional con paginación', async () => {
      const response = await request(app)
        .get(`/api/v1/comisiones/profesional/${testProfesional.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('comisiones');
      expect(response.body.data).toHaveProperty('paginacion');
      expect(Array.isArray(response.body.data.comisiones)).toBe(true);
    });

    test('Filtrar comisiones por estado_pago=pendiente', async () => {
      const response = await request(app)
        .get(`/api/v1/comisiones/profesional/${testProfesional.id}?estado_pago=pendiente`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      response.body.data.comisiones.forEach(comision => {
        expect(comision.estado_pago).toBe('pendiente');
      });
    });

    test('Filtrar comisiones por rango de fechas', async () => {
      const fechaDesde = '2025-01-01';
      const fechaHasta = '2025-12-31';

      const response = await request(app)
        .get(`/api/v1/comisiones/profesional/${testProfesional.id}?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v1/comisiones/:id', () => {
    test('Obtener comisión por ID con detalles completos', async () => {
      const response = await request(app)
        .get(`/api/v1/comisiones/${comisionId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(comisionId);
      expect(response.body.data).toHaveProperty('profesional_nombre');
      expect(response.body.data).toHaveProperty('cliente_nombre');
      expect(response.body.data).toHaveProperty('codigo_cita');
      expect(response.body.data).toHaveProperty('detalle_servicios');
    });

    test('Rechazar comisión inexistente', async () => {
      const response = await request(app)
        .get('/api/v1/comisiones/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/comisiones/:id/pagar', () => {
    test('Marcar comisión como pagada exitosamente', async () => {
      const response = await request(app)
        .patch(`/api/v1/comisiones/${comisionId}/pagar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          metodo_pago: 'transferencia',
          referencia_pago: 'TRANS-TEST-001',
          notas_pago: 'Pago de prueba via transferencia'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.estado_pago).toBe('pagada');
      expect(response.body.data.metodo_pago).toBe('transferencia');
      expect(response.body.data.referencia_pago).toBe('TRANS-TEST-001');
      expect(response.body.data).toHaveProperty('fecha_pago');
    });

    test('Rechazar pagar comisión ya pagada', async () => {
      const response = await request(app)
        .patch(`/api/v1/comisiones/${comisionId}/pagar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          metodo_pago: 'efectivo'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Tests de Reportes y Estadísticas
  // ============================================================================

  describe('GET /api/v1/comisiones/dashboard', () => {
    test('Obtener métricas de dashboard exitosamente', async () => {
      const response = await request(app)
        .get('/api/v1/comisiones/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('resumen');
      expect(response.body.data).toHaveProperty('por_tipo');
      expect(response.body.data).toHaveProperty('top_profesionales');

      const resumen = response.body.data.resumen;
      expect(resumen).toHaveProperty('total_comisiones');
      expect(resumen).toHaveProperty('total_monto');
      expect(resumen).toHaveProperty('monto_pendiente');
      expect(resumen).toHaveProperty('monto_pagado');
      expect(resumen).toHaveProperty('comision_promedio');
    });
  });

  describe('GET /api/v1/comisiones/estadisticas', () => {
    test('Obtener estadísticas básicas', async () => {
      const response = await request(app)
        .get('/api/v1/comisiones/estadisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_comisiones');
      expect(response.body.data).toHaveProperty('total_monto');
    });
  });

  describe('GET /api/v1/comisiones/reporte', () => {
    test('Generar reporte por profesional (JSON)', async () => {
      const fechaDesde = '2025-01-01';
      const fechaHasta = '2025-12-31';

      const response = await request(app)
        .get(`/api/v1/comisiones/reporte?tipo=por_profesional&fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('profesionales');
      expect(response.body.data).toHaveProperty('totales');
      expect(response.body.data).toHaveProperty('periodo');
    });

    test('Generar reporte detallado', async () => {
      const fechaDesde = '2025-01-01';
      const fechaHasta = '2025-12-31';

      const response = await request(app)
        .get(`/api/v1/comisiones/reporte?tipo=detallado&fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('Rechazar reporte sin fechas requeridas', async () => {
      const response = await request(app)
        .get('/api/v1/comisiones/reporte?tipo=por_profesional')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/comisiones/periodo', () => {
    test('Consultar comisiones por período exitosamente', async () => {
      const fechaDesde = '2025-01-01';
      const fechaHasta = '2025-12-31';

      const response = await request(app)
        .get(`/api/v1/comisiones/periodo?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('Rechazar sin fechas requeridas', async () => {
      const response = await request(app)
        .get('/api/v1/comisiones/periodo')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });

  // ============================================================================
  // Tests de Seguridad Multi-Tenant (RLS)
  // ============================================================================

  describe('Seguridad Multi-Tenant (RLS)', () => {
    let otherOrg;
    let otherOrgToken;

    beforeAll(async () => {
      const setupClient = await global.testPool.connect();

      // Crear segunda organización
      otherOrg = await createTestOrganizacion(setupClient, {
        nombre: 'Other Org RLS Test Comisiones'
      });

      // Crear admin de la segunda organización
      const otherAdmin = await createTestUsuario(setupClient, otherOrg.id, {
        nombre: 'Other',
        apellidos: 'Admin',
        rol: 'admin',
        activo: true,
        email_verificado: true
      });

      // Generar token
      otherOrgToken = authConfig.generateToken({
        userId: otherAdmin.id,
        email: otherAdmin.email,
        rol: otherAdmin.rol,
        organizacionId: otherOrg.id
      });

      setupClient.release();
    });

    test('No debe ver configuraciones de otra organización', async () => {
      const response = await request(app)
        .get('/api/v1/comisiones/configuracion')
        .set('Authorization', `Bearer ${otherOrgToken}`);

      expect(response.status).toBe(200);

      // No debe contener configuraciones de testOrg
      response.body.data.forEach(config => {
        expect(config.organizacion_id).not.toBe(testOrg.id);
      });
    });

    test('No debe ver comisiones de otra organización', async () => {
      const response = await request(app)
        .get(`/api/v1/comisiones/profesional/${testProfesional.id}`)
        .set('Authorization', `Bearer ${otherOrgToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.comisiones.length).toBe(0);
    });

    test('No debe poder modificar comisiones de otra organización', async () => {
      const response = await request(app)
        .patch(`/api/v1/comisiones/${comisionId}/pagar`)
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .send({
          metodo_pago: 'efectivo'
        });

      expect(response.status).toBe(404);
    });
  });
});

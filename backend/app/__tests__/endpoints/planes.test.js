/**
 * Tests de Endpoints de Planes de Subscripción
 * Suite completa para validar endpoints públicos del controller de planes
 * NOTA: Estos endpoints NO requieren autenticación (son públicos)
 */

const request = require('supertest');
const saasApp = require('../../app');
const {
  cleanAllTables,
  setRLSContext
} = require('../helpers/db-helper');

describe('Endpoints de Planes de Subscripción', () => {
  let app;
  let client;
  let planBasicoId;
  let planProfesionalId;
  let planEmpresarialId;

  beforeAll(async () => {
    app = saasApp.getExpressApp();
    client = await global.testPool.connect();

    // Limpiar BD
    await cleanAllTables(client);

    // Crear planes de prueba con códigos únicos para evitar conflictos
    // Los planes son compartidos por todas las organizaciones
    // Usar sufijo corto para no exceder VARCHAR(20)
    const suffix = Date.now().toString().slice(-6);
    const planBasico = await client.query(`
      INSERT INTO planes_subscripcion (
        codigo_plan, nombre_plan, descripcion, precio_mensual, precio_anual,
        limite_usuarios, limite_profesionales, limite_citas_mes,
        funciones_habilitadas, activo, orden_display
      ) VALUES (
        'TEST_BASIC_${suffix}',
        'Plan Básico',
        'Ideal para pequeños negocios',
        29.99,
        299.99,
        3,
        5,
        100,
        '{"agenda_basica": true, "clientes": true, "recordatorios": true}',
        true,
        1
      ) RETURNING id
    `);
    planBasicoId = planBasico.rows[0].id;

    const planProfesional = await client.query(`
      INSERT INTO planes_subscripcion (
        codigo_plan, nombre_plan, descripcion, precio_mensual, precio_anual,
        limite_usuarios, limite_profesionales, limite_citas_mes,
        funciones_habilitadas, activo, orden_display
      ) VALUES (
        'TEST_PRO_${suffix}',
        'Plan Profesional',
        'Para negocios en crecimiento',
        59.99,
        599.99,
        10,
        15,
        500,
        '{"agenda_avanzada": true, "clientes": true, "recordatorios": true, "reportes": true, "integraciones": true}',
        true,
        2
      ) RETURNING id
    `);
    planProfesionalId = planProfesional.rows[0].id;

    const planEmpresarial = await client.query(`
      INSERT INTO planes_subscripcion (
        codigo_plan, nombre_plan, descripcion, precio_mensual, precio_anual,
        limite_usuarios, limite_profesionales, limite_citas_mes,
        funciones_habilitadas, activo, orden_display
      ) VALUES (
        'TEST_ENT_${suffix}',
        'Plan Empresarial',
        'Solución completa para empresas',
        99.99,
        999.99,
        999,
        999,
        9999,
        '{"agenda_premium": true, "clientes": true, "recordatorios": true, "reportes": true, "integraciones": true, "api": true, "soporte_premium": true}',
        true,
        3
      ) RETURNING id
    `);
    planEmpresarialId = planEmpresarial.rows[0].id;

    client.release();
  });

  afterAll(async () => {
    const cleanupClient = await global.testPool.connect();
    await cleanAllTables(cleanupClient);
    cleanupClient.release();
  });

  // ============================================================================
  // Tests de Listar Planes
  // ============================================================================

  describe('GET /api/v1/planes', () => {
    test('Listar todos los planes (sin autenticación requerida)', async () => {
      const response = await request(app)
        .get('/api/v1/planes')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
    });

    test('Los planes están ordenados por orden_display', async () => {
      const response = await request(app)
        .get('/api/v1/planes')
        .expect(200);

      const planes = response.body.data;

      // Verificar que están ordenados
      for (let i = 0; i < planes.length - 1; i++) {
        expect(planes[i].orden_display).toBeLessThanOrEqual(
          planes[i + 1].orden_display
        );
      }
    });

    test('Los planes incluyen todos los campos necesarios', async () => {
      const response = await request(app)
        .get('/api/v1/planes')
        .expect(200);

      const plan = response.body.data[0];

      expect(plan).toHaveProperty('id');
      expect(plan).toHaveProperty('nombre');
      expect(plan).toHaveProperty('descripcion');
      expect(plan).toHaveProperty('precio_mensual');
      expect(plan).toHaveProperty('precio_anual');
      expect(plan).toHaveProperty('max_usuarios');
      expect(plan).toHaveProperty('max_profesionales');
      expect(plan).toHaveProperty('max_citas_mes');
      expect(plan).toHaveProperty('funciones_habilitadas');
    });

    test('Solo retorna planes activos', async () => {
      // Crear un plan inactivo con código único
      const tempClient = await global.testPool.connect();
      const suffix = Date.now().toString().slice(-6);
      await tempClient.query(`
        INSERT INTO planes_subscripcion (
          codigo_plan, nombre_plan, descripcion, precio_mensual, precio_anual,
          limite_usuarios, limite_profesionales, limite_citas_mes,
          funciones_habilitadas, activo, orden_display
        ) VALUES (
          'TEST_INA_${suffix}',
          'Plan Inactivo',
          'Este plan está desactivado',
          19.99,
          199.99,
          1,
          1,
          10,
          '{"basico": true}',
          false,
          99
        )
      `);
      tempClient.release();

      const response = await request(app)
        .get('/api/v1/planes')
        .expect(200);

      const planesInactivos = response.body.data.filter(p => p.activo === false);
      expect(planesInactivos.length).toBe(0);
    });

    test('Retorna al menos 3 planes', async () => {
      const response = await request(app)
        .get('/api/v1/planes')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ============================================================================
  // Tests de Obtener Plan por ID
  // ============================================================================

  describe('GET /api/v1/planes/:id', () => {
    test('Obtener plan por ID (sin autenticación requerida)', async () => {
      const response = await request(app)
        .get(`/api/v1/planes/${planBasicoId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(planBasicoId);
      expect(response.body.data.nombre).toBe('Plan Básico');
    });

    test('Obtener plan profesional por ID', async () => {
      const response = await request(app)
        .get(`/api/v1/planes/${planProfesionalId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nombre).toBe('Plan Profesional');
    });

    test('Obtener plan empresarial por ID', async () => {
      const response = await request(app)
        .get(`/api/v1/planes/${planEmpresarialId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nombre).toBe('Plan Empresarial');
      expect(response.body.data.max_usuarios).toBe(999);
    });

    test('Falla con ID inexistente', async () => {
      const response = await request(app)
        .get('/api/v1/planes/999999')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla con ID inválido (no numérico)', async () => {
      const response = await request(app)
        .get('/api/v1/planes/abc123');

      // Puede retornar 400 o 500 dependiendo de la validación
      expect([400, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success', false);
    });

    test('No retorna planes inactivos por ID', async () => {
      // Crear plan inactivo con código único
      const tempClient = await global.testPool.connect();
      const suffix = Date.now().toString().slice(-6);
      const result = await tempClient.query(`
        INSERT INTO planes_subscripcion (
          codigo_plan, nombre_plan, descripcion, precio_mensual, precio_anual,
          limite_usuarios, limite_profesionales, limite_citas_mes,
          funciones_habilitadas, activo, orden_display
        ) VALUES (
          'TEST_DES_${suffix}',
          'Plan Desactivado Test',
          'Test',
          9.99,
          99.99,
          1,
          1,
          1,
          '{"test": true}',
          false,
          100
        ) RETURNING id
      `);
      const planInactivoId = result.rows[0].id;
      tempClient.release();

      const response = await request(app)
        .get(`/api/v1/planes/${planInactivoId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Tests de Comparación de Planes
  // ============================================================================

  describe('Comparación de Planes', () => {
    test('Plan Básico tiene límites más bajos que Profesional', async () => {
      const basico = await request(app)
        .get(`/api/v1/planes/${planBasicoId}`)
        .expect(200);

      const profesional = await request(app)
        .get(`/api/v1/planes/${planProfesionalId}`)
        .expect(200);

      expect(basico.body.data.max_usuarios).toBeLessThan(
        profesional.body.data.max_usuarios
      );
      expect(basico.body.data.max_profesionales).toBeLessThan(
        profesional.body.data.max_profesionales
      );
      expect(basico.body.data.max_citas_mes).toBeLessThan(
        profesional.body.data.max_citas_mes
      );
      // Convertir a número para comparación
      expect(parseFloat(basico.body.data.precio_mensual)).toBeLessThan(
        parseFloat(profesional.body.data.precio_mensual)
      );
    });

    test('Plan Profesional tiene límites más bajos que Empresarial', async () => {
      const profesional = await request(app)
        .get(`/api/v1/planes/${planProfesionalId}`)
        .expect(200);

      const empresarial = await request(app)
        .get(`/api/v1/planes/${planEmpresarialId}`)
        .expect(200);

      expect(profesional.body.data.max_usuarios).toBeLessThan(
        empresarial.body.data.max_usuarios
      );
      expect(profesional.body.data.max_profesionales).toBeLessThan(
        empresarial.body.data.max_profesionales
      );
      expect(profesional.body.data.max_citas_mes).toBeLessThan(
        empresarial.body.data.max_citas_mes
      );
    });

    test('Planes con precio anual tienen descuento (precio anual < precio mensual * 12)', async () => {
      const response = await request(app)
        .get('/api/v1/planes')
        .expect(200);

      response.body.data.forEach(plan => {
        // Solo validar si tiene precio anual definido
        if (plan.precio_anual) {
          const precioMensual = parseFloat(plan.precio_mensual);
          const precioAnual = parseFloat(plan.precio_anual);
          const precioAnualEquivalente = precioMensual * 12;
          expect(precioAnual).toBeLessThan(precioAnualEquivalente);
        }
      });
    });
  });

  // ============================================================================
  // Tests de Funciones Incluidas
  // ============================================================================

  describe('Funciones Incluidas', () => {
    test('Plan Básico tiene funciones básicas', async () => {
      const response = await request(app)
        .get(`/api/v1/planes/${planBasicoId}`)
        .expect(200);

      const funciones = response.body.data.funciones_habilitadas;
      expect(funciones).toBeDefined();
      expect(funciones.agenda_basica).toBe(true);
      expect(funciones.clientes).toBe(true);
    });

    test('Plan Profesional incluye funciones avanzadas', async () => {
      const response = await request(app)
        .get(`/api/v1/planes/${planProfesionalId}`)
        .expect(200);

      const funciones = response.body.data.funciones_habilitadas;
      expect(funciones.reportes).toBe(true);
      expect(funciones.integraciones).toBe(true);
    });

    test('Plan Empresarial incluye funciones premium', async () => {
      const response = await request(app)
        .get(`/api/v1/planes/${planEmpresarialId}`)
        .expect(200);

      const funciones = response.body.data.funciones_habilitadas;
      expect(funciones.api).toBe(true);
      expect(funciones.soporte_premium).toBe(true);
    });
  });

  // ============================================================================
  // Tests de Performance
  // ============================================================================

  describe('Performance', () => {
    test('Listar planes responde en menos de 1 segundo', async () => {
      const inicio = Date.now();

      await request(app)
        .get('/api/v1/planes')
        .expect(200);

      const duracion = Date.now() - inicio;
      expect(duracion).toBeLessThan(1000);
    });

    test('Obtener plan por ID responde en menos de 500ms', async () => {
      const inicio = Date.now();

      await request(app)
        .get(`/api/v1/planes/${planBasicoId}`)
        .expect(200);

      const duracion = Date.now() - inicio;
      expect(duracion).toBeLessThan(500);
    });
  });
});

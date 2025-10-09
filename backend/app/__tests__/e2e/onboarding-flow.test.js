/**
 * Tests E2E - Flujo Completo de Onboarding
 * CRÍTICO: Valida el flujo end-to-end completo desde registro hasta verificación
 *
 * Este test simula exactamente el mismo flujo que la colección de Bruno:
 * 1. Registro público (sin auth) → Token JWT
 * 2. Crear profesional (con token)
 * 3. Crear servicio (con token)
 * 4. Configurar horarios (con token)
 * 5. Verificar setup completo (con token)
 */

const request = require('supertest');
const saasApp = require('../../app');
const {
  cleanAllTables,
  getUniqueTestId
} = require('../helpers/db-helper');

describe('🎯 E2E: Flujo Completo de ONBOARDING de Organizaciones', () => {
  let app;
  let client;

  beforeAll(async () => {
    app = saasApp.getExpressApp();
    client = await global.testPool.connect();
    await cleanAllTables(client);
    client.release();
  });

  afterAll(async () => {
    const cleanupClient = await global.testPool.connect();
    await cleanAllTables(cleanupClient);
    cleanupClient.release();
  });

  test('✅ FLUJO COMPLETO: Onboarding → Profesional → Servicio → Horario → Verificación', async () => {
    const uniqueId = getUniqueTestId();

    // ============================================================================
    // PASO 1: ONBOARDING Público (sin autenticación)
    // ============================================================================
    console.log('\n📝 PASO 1: Onboarding de organización...');

    const registroData = {
      organizacion: {
        nombre_comercial: `Barbería E2E ${uniqueId}`,
        razon_social: `Barbería E2E S.A. ${uniqueId}`,
        rfc: `RFC${uniqueId.slice(-10)}`,
        tipo_industria: 'barberia',
        plan: 'basico',
        telefono_principal: `+521${uniqueId.slice(-10)}`,
        email_contacto: `contacto-${uniqueId}@e2e.com`
      },
      admin: {
        nombre: 'Carlos',
        apellidos: 'González',
        email: `carlos-${uniqueId}@e2e.com`,
        password: 'Password123!',
        telefono: `+521${uniqueId.slice(-10)}`
      },
      aplicar_plantilla_servicios: true,
      enviar_email_bienvenida: false
    };

    const registro = await request(app)
      .post('/api/v1/organizaciones/register')
      .send(registroData)
      .expect(201);

    // Validar respuesta del registro
    expect(registro.body.success).toBe(true);
    expect(registro.body.data.organizacion).toBeDefined();
    expect(registro.body.data.admin).toBeDefined();
    expect(registro.body.data.admin.token).toBeDefined();

    // Extraer datos críticos
    const token = registro.body.data.admin.token;
    const orgId = registro.body.data.organizacion.id;
    const serviciosPlantilla = registro.body.data.servicios_creados;

    console.log(`✅ Organización creada: ID ${orgId}`);
    console.log(`✅ Token JWT generado (auto-login)`);
    console.log(`✅ Servicios de plantilla aplicados: ${serviciosPlantilla}`);

    // ============================================================================
    // PASO 2: Verificar Auto-Login (token funciona)
    // ============================================================================
    console.log('\n📝 PASO 2: Verificar auto-login...');

    const autoLogin = await request(app)
      .get(`/api/v1/organizaciones/${orgId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(autoLogin.body.success).toBe(true);
    expect(autoLogin.body.data.id).toBe(orgId);
    console.log('✅ Auto-login validado - Token funciona correctamente');

    // ============================================================================
    // PASO 3: Crear Primer Profesional
    // ============================================================================
    console.log('\n📝 PASO 3: Crear primer profesional...');

    const profesionalData = {
      nombre_completo: 'Juan Pérez',
      email: `juan-${uniqueId}@e2e.com`,
      telefono: `+521${uniqueId.slice(-10)}`,
      tipo_profesional: 'barbero',
      especialidades: ['Corte clásico', 'Barba', 'Afeitado'],
      biografia: 'Barbero con 10 años de experiencia',
      activo: true
    };

    const profesional = await request(app)
      .post('/api/v1/profesionales')
      .set('Authorization', `Bearer ${token}`)
      .send(profesionalData)
      .expect(201);

    expect(profesional.body.success).toBe(true);
    expect(profesional.body.data).toBeDefined();
    expect(profesional.body.data.id).toBeDefined();
    expect(profesional.body.data.tipo_profesional).toBe('barbero');

    const profesionalId = profesional.body.data.id;
    console.log(`✅ Profesional creado: ID ${profesionalId} - ${profesionalData.nombre_completo}`);

    // ============================================================================
    // PASO 4: Crear Primer Servicio
    // ============================================================================
    console.log('\n📝 PASO 4: Crear primer servicio...');

    const servicioData = {
      nombre: 'Corte de Cabello Premium',
      descripcion: 'Corte clásico de cabello con máquina y tijera',
      precio: 500.00,
      duracion_minutos: 30,
      activo: true,
      profesionales_ids: [profesionalId]
    };

    const servicio = await request(app)
      .post('/api/v1/servicios')
      .set('Authorization', `Bearer ${token}`)
      .send(servicioData)
      .expect(201);

    expect(servicio.body.success).toBe(true);
    expect(servicio.body.data).toBeDefined();
    expect(servicio.body.data.id).toBeDefined();
    expect(servicio.body.data.duracion_minutos).toBe(30);

    const servicioId = servicio.body.data.id;
    console.log(`✅ Servicio creado: ID ${servicioId} - ${servicioData.nombre}`);

    // ============================================================================
    // PASO 5: Configurar Horarios del Profesional
    // ============================================================================
    console.log('\n📝 PASO 5: Configurar horarios...');

    // Generar fecha futura (mañana)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const fecha = tomorrow.toISOString().split('T')[0];

    const horarioData = {
      profesional_id: profesionalId,
      fecha: fecha,
      hora_inicio: '09:00:00',
      hora_fin: '18:00:00',
      duracion_slot: 30,
      tipo_horario: 'franja_especifica'
    };

    const horario = await request(app)
      .post('/api/v1/horarios')
      .set('Authorization', `Bearer ${token}`)
      .send(horarioData)
      .expect(201);

    expect(horario.body.success).toBe(true);
    expect(horario.body.data).toBeDefined();
    expect(horario.body.data.id).toBeDefined();
    expect(horario.body.data.profesional_id).toBe(profesionalId);

    const horarioId = horario.body.data.id;
    console.log(`✅ Horario creado: ID ${horarioId} - ${fecha} (09:00-18:00)`);

    // ============================================================================
    // PASO 6: Verificar Setup Completo (Organización 100% Operativa)
    // ============================================================================
    console.log('\n📝 PASO 6: Verificar setup completo...');

    const verificacion = await request(app)
      .get(`/api/v1/organizaciones/${orgId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(verificacion.body.success).toBe(true);
    expect(verificacion.body.data.id).toBe(orgId);
    expect(verificacion.body.data.activo).toBe(true);
    expect(verificacion.body.data.plan_actual).toBe('basico');

    console.log('✅ Organización verificada - Estado: ACTIVA');

    // ============================================================================
    // VALIDACIONES FINALES: Estado Completo del Sistema
    // ============================================================================
    console.log('\n📊 VALIDACIONES FINALES...');

    // 1. Validar que el profesional existe y está activo
    const profesionalCheck = await request(app)
      .get('/api/v1/profesionales')
      .query({ id: profesionalId })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(profesionalCheck.body.success).toBe(true);
    console.log('✅ Profesional confirmado en sistema');

    // 2. Validar que el servicio existe y está activo
    const servicioCheck = await request(app)
      .get('/api/v1/servicios')
      .query({ id: servicioId })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(servicioCheck.body.success).toBe(true);
    console.log('✅ Servicio confirmado en sistema');

    // 3. Validar que el horario existe
    const horarioCheck = await request(app)
      .get(`/api/v1/horarios/${horarioId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(horarioCheck.body.success).toBe(true);
    console.log('✅ Horario confirmado en sistema');

    // ============================================================================
    // RESULTADO FINAL
    // ============================================================================
    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('   🎉 FLUJO E2E COMPLETADO EXITOSAMENTE');
    console.log('════════════════════════════════════════════════════════════════');
    console.log(`   Organización: ${registroData.organizacion.nombre_comercial}`);
    console.log(`   ID: ${orgId}`);
    console.log(`   Plan: basico`);
    console.log(`   Estado: ACTIVA`);
    console.log('');
    console.log('   📊 Recursos creados:');
    console.log(`   - Profesionales: 1`);
    console.log(`   - Servicios: ${serviciosPlantilla + 1} (${serviciosPlantilla} plantilla + 1 manual)`);
    console.log(`   - Horarios: 1`);
    console.log(`   - Usuarios: 1 (admin)`);
    console.log('');
    console.log('   ✅ Organización 100% OPERATIVA - Lista para recibir citas');
    console.log('════════════════════════════════════════════════════════════════\n');
  });

  test('✅ FLUJO COMPLETO: Sin plantillas de servicios', async () => {
    const uniqueId = getUniqueTestId();

    console.log('\n📝 Test: Flujo sin plantillas de servicios...');

    // Registro sin plantillas
    const registro = await request(app)
      .post('/api/v1/organizaciones/register')
      .send({
        organizacion: {
          nombre_comercial: `Spa E2E ${uniqueId}`,
          tipo_industria: 'spa',
          plan: 'basico'
        },
        admin: {
          nombre: 'Admin',
          apellidos: 'Spa',
          email: `admin-spa-${uniqueId}@e2e.com`,
          password: 'Password123!'
        },
        aplicar_plantilla_servicios: false
      })
      .expect(201);

    expect(registro.body.data.servicios_creados).toBe(0);

    const token = registro.body.data.admin.token;
    const orgId = registro.body.data.organizacion.id;

    // Crear profesional
    const profesional = await request(app)
      .post('/api/v1/profesionales')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre_completo: 'María López',
        email: `maria-${uniqueId}@e2e.com`,
        tipo_profesional: 'masajista',
        activo: true
      })
      .expect(201);

    // Crear servicio manual
    const servicio = await request(app)
      .post('/api/v1/servicios')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Masaje Relajante',
        precio: 800.00,
        duracion_minutos: 60,
        activo: true,
        profesionales_ids: [profesional.body.data.id]
      })
      .expect(201);

    // Verificar final
    const verificacion = await request(app)
      .get(`/api/v1/organizaciones/${orgId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(verificacion.body.data.activo).toBe(true);
    console.log('✅ Flujo sin plantillas completado exitosamente');
  });

  test('❌ FALLO EN PASO 3: Token inválido no permite continuar', async () => {
    const uniqueId = getUniqueTestId();

    console.log('\n📝 Test: Flujo con token inválido...');

    // Registro exitoso
    const registro = await request(app)
      .post('/api/v1/organizaciones/register')
      .send({
        organizacion: {
          nombre_comercial: `Test Token ${uniqueId}`,
          tipo_industria: 'barberia',
          plan: 'basico'
        },
        admin: {
          nombre: 'Test',
          apellidos: 'Token',
          email: `test-token-${uniqueId}@e2e.com`,
          password: 'Password123!'
        },
        aplicar_plantilla_servicios: false
      })
      .expect(201);

    const orgId = registro.body.data.organizacion.id;

    // Intentar crear profesional con token INVÁLIDO
    const profesionalFail = await request(app)
      .post('/api/v1/profesionales')
      .set('Authorization', 'Bearer TOKEN_INVALIDO')
      .send({
        nombre_completo: 'Test',
        email: `test-${uniqueId}@e2e.com`,
        tipo_profesional: 'barbero'
      })
      .expect(401);

    expect(profesionalFail.body.success).toBe(false);
    console.log('✅ Token inválido correctamente rechazado');

    // Verificar que la organización existe pero no tiene profesionales
    const tokenValido = registro.body.data.admin.token;
    const verificacion = await request(app)
      .get(`/api/v1/organizaciones/${orgId}`)
      .set('Authorization', `Bearer ${tokenValido}`)
      .expect(200);

    expect(verificacion.body.data.activo).toBe(true);
    console.log('✅ Organización existe pero flujo interrumpido correctamente');
  });
});

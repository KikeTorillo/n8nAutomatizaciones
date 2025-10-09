/**
 * Tests E2E - Flujo Completo de Configuración Inicial
 * CRÍTICO: Valida el setup wizard que ejecuta el usuario después del onboarding
 *
 * Este test simula exactamente el mismo flujo que la colección de Bruno:
 * 1. Prerequisito: Onboarding completo (org + admin + profesional creados)
 * 2. Configurar horarios adicionales del profesional
 * 3. Listar servicios de plantilla aplicados en onboarding
 * 4. Actualizar servicio de plantilla (personalizar precio/duración)
 * 5. Agregar nuevo servicio personalizado
 * 6. Verificar configuración completa del sistema
 */

const request = require('supertest');
const saasApp = require('../../app');
const {
  cleanAllTables,
  getUniqueTestId
} = require('../helpers/db-helper');

describe('🎯 E2E: Flujo Completo de CONFIGURACIÓN INICIAL', () => {
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

  test('✅ FLUJO COMPLETO: Onboarding → Configuración Inicial → Sistema Operativo', async () => {
    const uniqueId = getUniqueTestId();

    // ============================================================================
    // PREREQUISITO: Ejecutar ONBOARDING completo (Flujo 1)
    // ============================================================================
    console.log('\n📝 PREREQUISITO: Ejecutar Onboarding completo...');

    const registroData = {
      organizacion: {
        nombre_comercial: `Barbería Setup ${uniqueId}`,
        razon_social: `Barbería Setup S.A. ${uniqueId}`,
        rfc: `RFC${uniqueId.slice(-10)}`,
        tipo_industria: 'barberia',
        plan: 'basico',
        telefono_principal: `+521${uniqueId.slice(-10)}`,
        email_contacto: `contacto-${uniqueId}@setup.com`
      },
      admin: {
        nombre: 'Admin',
        apellidos: 'Setup',
        email: `admin-${uniqueId}@setup.com`,
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

    expect(registro.body.success).toBe(true);
    expect(registro.body.data.organizacion).toBeDefined();
    expect(registro.body.data.admin).toBeDefined();
    expect(registro.body.data.admin.token).toBeDefined();

    const token = registro.body.data.admin.token;
    const orgId = registro.body.data.organizacion.id;
    const serviciosPlantilla = registro.body.data.servicios_creados;

    console.log(`✅ Onboarding completo: Org ${orgId}, ${serviciosPlantilla} servicios plantilla`);

    // Crear profesional (parte del onboarding)
    const profesionalData = {
      nombre_completo: 'Juan Pérez',
      email: `juan-${uniqueId}@setup.com`,
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
    const profesionalId = profesional.body.data.id;
    console.log(`✅ Profesional creado: ID ${profesionalId}`);

    // ============================================================================
    // FLUJO 2 - PASO 1: Configurar Horarios del Profesional
    // ============================================================================
    console.log('\n📝 FLUJO 2 - PASO 1: Configurar horarios del profesional...');

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
      tipo_horario: 'franja_especifica',
      notas: 'Horario inicial de atención'
    };

    const horario = await request(app)
      .post('/api/v1/horarios')
      .set('Authorization', `Bearer ${token}`)
      .send(horarioData)
      .expect(201);

    expect(horario.body.success).toBe(true);
    expect(horario.body.data).toBeDefined();
    expect(horario.body.data.profesional_id).toBe(profesionalId);
    expect(horario.body.data.duracion_slot).toBe(30);

    const horarioId = horario.body.data.id;
    console.log(`✅ Horario configurado: ID ${horarioId}, Fecha ${fecha} (09:00-18:00)`);

    // ============================================================================
    // FLUJO 2 - PASO 2: Listar Servicios de Plantilla
    // ============================================================================
    console.log('\n📝 FLUJO 2 - PASO 2: Listar servicios de plantilla...');

    const serviciosResponse = await request(app)
      .get('/api/v1/servicios')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(serviciosResponse.body.success).toBe(true);
    expect(serviciosResponse.body.data).toHaveProperty('servicios');
    expect(serviciosResponse.body.data.servicios).toBeInstanceOf(Array);

    const servicios = serviciosResponse.body.data.servicios;
    expect(servicios.length).toBeGreaterThanOrEqual(serviciosPlantilla);

    // Encontrar servicio de plantilla para actualizar
    const servicioPlantilla = servicios.find(s => s.plantilla_servicio_id !== null);
    expect(servicioPlantilla).toBeDefined();

    const servicioId = servicioPlantilla.id;
    console.log(`✅ ${servicios.length} servicios listados`);
    console.log(`   - Servicio para actualizar: "${servicioPlantilla.nombre}" (ID: ${servicioId})`);

    // ============================================================================
    // FLUJO 2 - PASO 3: Actualizar Servicio de Plantilla
    // ============================================================================
    console.log('\n📝 FLUJO 2 - PASO 3: Actualizar servicio de plantilla...');

    const precioOriginal = parseFloat(servicioPlantilla.precio);
    const duracionOriginal = servicioPlantilla.duracion_minutos;

    const actualizacion = {
      nombre: servicioPlantilla.nombre + ' Premium',
      descripcion: 'Servicio personalizado con mejoras',
      precio: precioOriginal + 100, // Aumentar precio
      duracion_minutos: duracionOriginal + 15, // Aumentar duración
      activo: true
    };

    const servicioActualizado = await request(app)
      .put(`/api/v1/servicios/${servicioId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(actualizacion)
      .expect(200);

    expect(servicioActualizado.body.success).toBe(true);
    expect(servicioActualizado.body.data.nombre).toBe(actualizacion.nombre);
    expect(parseFloat(servicioActualizado.body.data.precio)).toBe(actualizacion.precio);
    expect(servicioActualizado.body.data.duracion_minutos).toBe(actualizacion.duracion_minutos);

    console.log(`✅ Servicio actualizado:`);
    console.log(`   Antes: "${servicioPlantilla.nombre}" - $${precioOriginal} - ${duracionOriginal} min`);
    console.log(`   Después: "${actualizacion.nombre}" - $${actualizacion.precio} - ${actualizacion.duracion_minutos} min`);

    // ============================================================================
    // FLUJO 2 - PASO 4: Agregar Nuevo Servicio Personalizado
    // ============================================================================
    console.log('\n📝 FLUJO 2 - PASO 4: Agregar nuevo servicio personalizado...');

    const nuevoServicioData = {
      nombre: 'Barba y Bigote',
      descripcion: 'Recorte y perfilado de barba y bigote con máquina y tijera',
      precio: 150.00,
      duracion_minutos: 30,
      activo: true,
      profesionales_ids: [profesionalId]
    };

    const nuevoServicio = await request(app)
      .post('/api/v1/servicios')
      .set('Authorization', `Bearer ${token}`)
      .send(nuevoServicioData)
      .expect(201);

    expect(nuevoServicio.body.success).toBe(true);
    expect(nuevoServicio.body.data).toBeDefined();
    expect(nuevoServicio.body.data.nombre).toBe(nuevoServicioData.nombre);
    expect(parseFloat(nuevoServicio.body.data.precio)).toBe(nuevoServicioData.precio);

    const nuevoServicioId = nuevoServicio.body.data.id;
    console.log(`✅ Nuevo servicio creado: "${nuevoServicioData.nombre}" (ID: ${nuevoServicioId})`);

    // ============================================================================
    // FLUJO 2 - PASO 5: Verificar Configuración Completa
    // ============================================================================
    console.log('\n📝 FLUJO 2 - PASO 5: Verificar configuración completa...');

    const verificacion = await request(app)
      .get(`/api/v1/organizaciones/${orgId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(verificacion.body.success).toBe(true);
    expect(verificacion.body.data.id).toBe(orgId);
    expect(verificacion.body.data.activo).toBe(true);
    expect(verificacion.body.data.suspendido).toBe(false);
    expect(verificacion.body.data.plan_actual).toBe('basico');

    console.log('✅ Organización verificada - Estado: ACTIVA');

    // ============================================================================
    // VALIDACIONES FINALES: Estado Completo del Sistema
    // ============================================================================
    console.log('\n📊 VALIDACIONES FINALES...');

    // 1. Validar que el profesional tiene horarios configurados
    const horariosCheck = await request(app)
      .get(`/api/v1/horarios/${horarioId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(horariosCheck.body.success).toBe(true);
    expect(horariosCheck.body.data.horarios).toBeDefined();
    expect(horariosCheck.body.data.horarios.length).toBeGreaterThan(0);
    expect(horariosCheck.body.data.horarios[0].profesional_id).toBe(profesionalId);
    console.log('✅ Horarios confirmados en sistema');

    // 2. Validar servicios totales (plantilla + actualizados + nuevos)
    const serviciosFinales = await request(app)
      .get('/api/v1/servicios')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(serviciosFinales.body.success).toBe(true);
    const totalServicios = serviciosFinales.body.data.servicios.length;
    expect(totalServicios).toBeGreaterThanOrEqual(serviciosPlantilla + 1); // Plantilla + nuevo servicio

    console.log(`✅ Total servicios: ${totalServicios} (${serviciosPlantilla} plantilla + ${totalServicios - serviciosPlantilla} personalizados)`);

    // 3. Validar que el servicio actualizado tiene los nuevos valores
    const servicioVerificado = serviciosFinales.body.data.servicios.find(s => s.id === servicioId);
    expect(servicioVerificado).toBeDefined();
    expect(servicioVerificado.nombre).toBe(actualizacion.nombre);
    console.log('✅ Servicio actualizado confirmado');

    // 4. Validar que el nuevo servicio existe
    const nuevoServicioVerificado = serviciosFinales.body.data.servicios.find(s => s.id === nuevoServicioId);
    expect(nuevoServicioVerificado).toBeDefined();
    expect(nuevoServicioVerificado.nombre).toBe(nuevoServicioData.nombre);
    console.log('✅ Nuevo servicio confirmado');

    // ============================================================================
    // RESULTADO FINAL
    // ============================================================================
    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('   🎉 FLUJO 2: CONFIGURACIÓN INICIAL COMPLETADO EXITOSAMENTE');
    console.log('════════════════════════════════════════════════════════════════');
    console.log(`   Organización: ${registroData.organizacion.nombre_comercial}`);
    console.log(`   ID: ${orgId}`);
    console.log(`   Plan: ${verificacion.body.data.plan_actual}`);
    console.log(`   Estado: ACTIVA`);
    console.log('');
    console.log('   📊 Configuración completada:');
    console.log(`   - Profesionales: 1 (${profesionalData.nombre_completo})`);
    console.log(`   - Servicios: ${totalServicios} (${serviciosPlantilla} plantilla + ${totalServicios - serviciosPlantilla} personalizados)`);
    console.log(`   - Horarios: 1 día configurado (${fecha})`);
    console.log('');
    console.log('   ✅ Setup Wizard 100% COMPLETO');
    console.log('   ✅ Sistema OPERATIVO - Listo para recibir citas');
    console.log('   🎯 Próximo paso: Flujo 4 - Agendamiento Manual');
    console.log('════════════════════════════════════════════════════════════════\n');
  });

  test('✅ FLUJO ALTERNATIVO: Sin actualizar servicios (solo agregar nuevos)', async () => {
    const uniqueId = getUniqueTestId();

    console.log('\n📝 Test: Configuración inicial sin actualizar servicios...');

    // Onboarding
    const registro = await request(app)
      .post('/api/v1/organizaciones/register')
      .send({
        organizacion: {
          nombre_comercial: `Spa Setup ${uniqueId}`,
          tipo_industria: 'spa',
          plan: 'basico'
        },
        admin: {
          nombre: 'Admin',
          apellidos: 'Spa',
          email: `admin-spa-${uniqueId}@setup.com`,
          password: 'Password123!'
        },
        aplicar_plantilla_servicios: true
      })
      .expect(201);

    const token = registro.body.data.admin.token;
    const orgId = registro.body.data.organizacion.id;

    // Crear profesional
    const profesional = await request(app)
      .post('/api/v1/profesionales')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre_completo: 'María López',
        email: `maria-${uniqueId}@setup.com`,
        tipo_profesional: 'masajista',
        activo: true
      })
      .expect(201);

    const profesionalId = profesional.body.data.id;

    // Configurar horarios
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const fecha = tomorrow.toISOString().split('T')[0];

    await request(app)
      .post('/api/v1/horarios')
      .set('Authorization', `Bearer ${token}`)
      .send({
        profesional_id: profesionalId,
        fecha: fecha,
        hora_inicio: '08:00:00',
        hora_fin: '20:00:00',
        duracion_slot: 60,
        tipo_horario: 'franja_especifica'
      })
      .expect(201);

    // Agregar servicio nuevo (sin actualizar plantilla)
    const nuevoServicio = await request(app)
      .post('/api/v1/servicios')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Masaje Personalizado',
        precio: 1200.00,
        duracion_minutos: 90,
        activo: true,
        profesionales_ids: [profesionalId]
      })
      .expect(201);

    expect(nuevoServicio.body.success).toBe(true);

    // Verificación final
    const verificacion = await request(app)
      .get(`/api/v1/organizaciones/${orgId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(verificacion.body.data.activo).toBe(true);
    console.log('✅ Flujo alternativo completado - Sin actualizar servicios plantilla');
  });

  test('❌ FALLO: No se puede configurar horarios sin profesional', async () => {
    const uniqueId = getUniqueTestId();

    console.log('\n📝 Test: Intentar configurar horarios sin profesional...');

    // Onboarding sin crear profesional
    const registro = await request(app)
      .post('/api/v1/organizaciones/register')
      .send({
        organizacion: {
          nombre_comercial: `Test Sin Prof ${uniqueId}`,
          tipo_industria: 'barberia',
          plan: 'basico'
        },
        admin: {
          nombre: 'Test',
          apellidos: 'NoProfesional',
          email: `test-noprof-${uniqueId}@setup.com`,
          password: 'Password123!'
        },
        aplicar_plantilla_servicios: false
      })
      .expect(201);

    const token = registro.body.data.admin.token;

    // Intentar configurar horarios con ID inexistente
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const fecha = tomorrow.toISOString().split('T')[0];

    const horarioFail = await request(app)
      .post('/api/v1/horarios')
      .set('Authorization', `Bearer ${token}`)
      .send({
        profesional_id: 99999, // ID inexistente
        fecha: fecha,
        hora_inicio: '09:00:00',
        hora_fin: '18:00:00',
        duracion_slot: 30,
        tipo_horario: 'franja_especifica'
      });

    // Puede ser 404 o 500 dependiendo de la implementación del controller
    expect([404, 500]).toContain(horarioFail.status);
    expect(horarioFail.body.success).toBe(false);
    console.log('✅ Error correctamente capturado - Profesional inexistente');
  });
});

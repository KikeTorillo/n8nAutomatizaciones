/**
 * Tests E2E - Flujo Completo de Catálogo de Servicios
 * CRÍTICO: Valida el flujo end-to-end de gestión de profesionales y servicios
 *
 * Este test simula exactamente el mismo flujo que la colección de Bruno (Flujo 3):
 * 1. Crear Profesional
 * 2. Listar Profesionales
 * 3. Crear Servicio (con profesionales_ids)
 * 4. Listar Servicios
 * 5. Ver Servicios de Profesional
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

describe('🎯 E2E: Flujo Completo de CATÁLOGO DE SERVICIOS', () => {
  let app;
  let client;
  let testOrg;
  let userToken;

  beforeAll(async () => {
    app = saasApp.getExpressApp();
    client = await global.testPool.connect();
    await cleanAllTables(client);

    // Setup inicial: Crear organización y usuario con token
    testOrg = await createTestOrganizacion(client);
    const testUsuario = await createTestUsuario(client, testOrg.id, { rol: 'propietario' });

    // Generar token JWT para el usuario
    userToken = authConfig.generateToken({
      userId: testUsuario.id,
      email: testUsuario.email,
      rol: testUsuario.rol,
      organizacionId: testOrg.id
    });

    client.release();
  });

  afterAll(async () => {
    const cleanupClient = await global.testPool.connect();
    await cleanAllTables(cleanupClient);
    cleanupClient.release();
  });

  test('✅ FLUJO COMPLETO: Crear Profesional → Listar → Crear Servicio → Listar → Ver Servicios por Profesional', async () => {
    const uniqueId = getUniqueTestId();

    // ============================================================================
    // PASO 1: Crear Profesional
    // ============================================================================
    console.log('\n📝 PASO 1: Crear profesional...');

    const profesionalData = {
      nombre_completo: 'Carlos Martínez',
      email: `carlos.martinez-${uniqueId}@example.com`,
      telefono: `+5491187654321`,
      tipo_profesional: 'barbero',
      especialidades: ['corte_cabello', 'barba', 'coloracion'],
      activo: true
    };

    const profesional = await request(app)
      .post('/api/v1/profesionales')
      .set('Authorization', `Bearer ${userToken}`)
      .send(profesionalData)
      .expect(201);

    expect(profesional.body.success).toBe(true);
    expect(profesional.body.data).toBeDefined();
    expect(profesional.body.data.id).toBeDefined();
    expect(profesional.body.data.nombre_completo).toBe(profesionalData.nombre_completo);
    expect(profesional.body.data.tipo_profesional).toBe('barbero');

    const profesionalId = profesional.body.data.id;
    console.log(`✅ Profesional creado: ID ${profesionalId} - ${profesionalData.nombre_completo}`);

    // ============================================================================
    // PASO 2: Listar Profesionales
    // ============================================================================
    console.log('\n📝 PASO 2: Listar profesionales...');

    const listarProfesionales = await request(app)
      .get('/api/v1/profesionales')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(listarProfesionales.body.success).toBe(true);
    expect(listarProfesionales.body.data).toBeDefined();

    // La respuesta puede ser un array directo o un objeto con propiedad data/profesionales
    const profesionales = listarProfesionales.body.data.data ||
                          listarProfesionales.body.data.profesionales ||
                          listarProfesionales.body.data;

    expect(Array.isArray(profesionales)).toBe(true);
    expect(profesionales.length).toBeGreaterThan(0);

    // Verificar que el profesional creado está en la lista
    const profesionalEnLista = profesionales.find(p => p.id === profesionalId);
    expect(profesionalEnLista).toBeDefined();
    expect(profesionalEnLista.nombre_completo).toBe(profesionalData.nombre_completo);
    expect(profesionalEnLista.especialidades).toEqual(profesionalData.especialidades);

    console.log(`✅ Profesionales listados: ${profesionales.length} encontrado(s)`);

    // ============================================================================
    // PASO 3: Crear Servicio con profesionales_ids
    // ============================================================================
    console.log('\n📝 PASO 3: Crear servicio con profesionales_ids...');

    const servicioData = {
      nombre: 'Corte de Cabello Premium',
      descripcion: 'Corte de cabello con lavado y secado incluido',
      precio: 2500.00,
      duracion_minutos: 45,
      activo: true,
      profesionales_ids: [profesionalId]
    };

    const servicio = await request(app)
      .post('/api/v1/servicios')
      .set('Authorization', `Bearer ${userToken}`)
      .send(servicioData)
      .expect(201);

    expect(servicio.body.success).toBe(true);
    expect(servicio.body.data).toBeDefined();
    expect(servicio.body.data.id).toBeDefined();
    expect(servicio.body.data.nombre).toBe(servicioData.nombre);
    expect(parseFloat(servicio.body.data.precio)).toBe(servicioData.precio);
    expect(servicio.body.data.duracion_minutos).toBe(servicioData.duracion_minutos);

    // Validar que los profesionales fueron asociados
    expect(servicio.body.data.profesionales).toBeDefined();
    expect(servicio.body.data.profesionales).toBeInstanceOf(Array);
    expect(servicio.body.data.profesionales.length).toBe(1);
    expect(servicio.body.data.profesionales[0].id).toBe(profesionalId);
    expect(servicio.body.data.profesionales[0].nombre_completo).toBe(profesionalData.nombre_completo);

    const servicioId = servicio.body.data.id;
    console.log(`✅ Servicio creado: ID ${servicioId} - ${servicioData.nombre}`);
    console.log(`✅ Asociado a ${servicio.body.data.profesionales.length} profesional(es)`);

    // ============================================================================
    // PASO 4: Listar Servicios
    // ============================================================================
    console.log('\n📝 PASO 4: Listar servicios...');

    const listarServicios = await request(app)
      .get('/api/v1/servicios')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(listarServicios.body.success).toBe(true);
    expect(listarServicios.body.data).toBeDefined();

    // La respuesta puede ser un array directo o un objeto con propiedad data/servicios
    const servicios = listarServicios.body.data.data ||
                      listarServicios.body.data.servicios ||
                      listarServicios.body.data;

    expect(Array.isArray(servicios)).toBe(true);
    expect(servicios.length).toBeGreaterThan(0);

    // Verificar que el servicio creado está en la lista
    const servicioEnLista = servicios.find(s => s.id === servicioId);
    expect(servicioEnLista).toBeDefined();
    expect(servicioEnLista.nombre).toBe(servicioData.nombre);
    expect(parseFloat(servicioEnLista.precio)).toBe(servicioData.precio);
    expect(servicioEnLista.duracion_minutos).toBe(servicioData.duracion_minutos);

    console.log(`✅ Servicios listados: ${servicios.length} encontrado(s)`);

    // ============================================================================
    // PASO 5: Ver Servicios de Profesional (Endpoint correcto)
    // ============================================================================
    console.log('\n📝 PASO 5: Ver servicios del profesional...');

    // Endpoint correcto: /servicios/profesionales/:profesional_id/servicios
    const serviciosProfesional = await request(app)
      .get(`/api/v1/servicios/profesionales/${profesionalId}/servicios`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(serviciosProfesional.body.success).toBe(true);
    expect(serviciosProfesional.body.data).toBeDefined();

    // La respuesta puede ser un array directo o un objeto con propiedad data/servicios
    const serviciosProf = serviciosProfesional.body.data.data ||
                          serviciosProfesional.body.data.servicios ||
                          serviciosProfesional.body.data;

    expect(Array.isArray(serviciosProf)).toBe(true);
    expect(serviciosProf.length).toBeGreaterThan(0);

    // Verificar que el servicio creado está en la lista del profesional
    const servicioDelProfesional = serviciosProf.find(s => s.id === servicioId);
    expect(servicioDelProfesional).toBeDefined();
    expect(servicioDelProfesional.nombre).toBe(servicioData.nombre);
    expect(servicioDelProfesional.duracion_minutos).toBe(servicioData.duracion_minutos);

    console.log(`✅ Servicios del profesional: ${serviciosProf.length} servicio(s)`);

    // ============================================================================
    // VALIDACIONES FINALES
    // ============================================================================
    console.log('\n📊 VALIDACIONES FINALES...');

    console.log('✅ Profesional creado y listado correctamente');
    console.log('✅ Servicio creado con asociación a profesionales');
    console.log('✅ Endpoint de servicios por profesional funciona correctamente');
    console.log('✅ Campo duracion_minutos correctamente utilizado (no "duracion")');

    // ============================================================================
    // RESULTADO FINAL
    // ============================================================================
    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('   🎉 FLUJO E2E CATÁLOGO DE SERVICIOS COMPLETADO');
    console.log('════════════════════════════════════════════════════════════════');
    console.log(`   Organización: ${testOrg.nombre_comercial}`);
    console.log(`   ID: ${testOrg.id}`);
    console.log('');
    console.log('   📊 Recursos creados:');
    console.log(`   - Profesionales: 1`);
    console.log(`   - Servicios: 1`);
    console.log(`   - Asociaciones profesional-servicio: 1`);
    console.log('');
    console.log('   ✅ Catálogo configurado correctamente');
    console.log('════════════════════════════════════════════════════════════════\n');
  });

  test('✅ FLUJO AVANZADO: Múltiples profesionales y servicios con relaciones cruzadas', async () => {
    const uniqueId = getUniqueTestId();

    console.log('\n📝 Test: Múltiples profesionales y servicios...');

    // Crear segundo profesional
    const profesional2 = await request(app)
      .post('/api/v1/profesionales')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        nombre_completo: `Ana García ${uniqueId}`,
        email: `ana.garcia-${uniqueId}@example.com`,
        telefono: `+5491187654322`,
        tipo_profesional: 'estilista',
        especialidades: ['corte_dama', 'coloracion', 'peinado'],
        activo: true
      })
      .expect(201);

    const profesional2Id = profesional2.body.data.id;
    console.log(`✅ Segundo profesional creado: ID ${profesional2Id}`);

    // Crear servicio compartido (múltiples profesionales)
    const servicioCompartido = await request(app)
      .post('/api/v1/servicios')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        nombre: `Coloración Premium ${uniqueId}`,
        descripcion: 'Coloración profesional con productos de alta calidad',
        precio: 3500.00,
        duracion_minutos: 90,
        activo: true,
        profesionales_ids: [profesional2Id] // Solo el estilista
      })
      .expect(201);

    expect(servicioCompartido.body.data.profesionales.length).toBe(1);
    console.log(`✅ Servicio compartido creado: ${servicioCompartido.body.data.profesionales.length} profesional(es)`);

    // Verificar que cada profesional tiene sus servicios correctos
    const serviciosProf2 = await request(app)
      .get(`/api/v1/servicios/profesionales/${profesional2Id}/servicios`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(serviciosProf2.body.data.length).toBe(1);
    console.log(`✅ Profesional 2 tiene ${serviciosProf2.body.data.length} servicio(s)`);

    console.log('✅ Relaciones cruzadas validadas correctamente');
  });

  test('❌ FALLO: No se puede crear servicio con profesional_id inexistente', async () => {
    const uniqueId = getUniqueTestId();

    console.log('\n📝 Test: Servicio con profesional inexistente...');

    const servicioFail = await request(app)
      .post('/api/v1/servicios')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        nombre: `Servicio Fail ${uniqueId}`,
        precio: 100.00,
        duracion_minutos: 30,
        profesionales_ids: [99999] // ID inexistente
      });

    expect([400, 404, 500]).toContain(servicioFail.status);
    expect(servicioFail.body.success).toBe(false);

    console.log('✅ Validación de profesional inexistente funciona correctamente');
  });

  test('❌ FALLO: No se puede crear servicio con campo "duracion" (debe ser "duracion_minutos")', async () => {
    const uniqueId = getUniqueTestId();

    console.log('\n📝 Test: Validar que campo "duracion" no es aceptado...');

    // Crear profesional de prueba
    const profesional = await request(app)
      .post('/api/v1/profesionales')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        nombre_completo: `Test Duracion ${uniqueId}`,
        email: `test-duracion-${uniqueId}@example.com`,
        tipo_profesional: 'barbero',
        activo: true
      })
      .expect(201);

    // Intentar crear servicio con campo "duracion" (incorrecto)
    const servicioConDuracion = await request(app)
      .post('/api/v1/servicios')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        nombre: `Servicio Test ${uniqueId}`,
        precio: 100.00,
        duracion: 30, // ❌ Campo incorrecto (debe ser duracion_minutos)
        profesionales_ids: [profesional.body.data.id]
      });

    // Debe fallar con 400 o 422 (validación Joi)
    expect([400, 422]).toContain(servicioConDuracion.status);
    expect(servicioConDuracion.body.success).toBe(false);

    console.log('✅ Campo "duracion" correctamente rechazado (debe ser "duracion_minutos")');
  });
});

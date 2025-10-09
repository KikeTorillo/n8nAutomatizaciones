/**
 * Tests E2E - Flujo Completo de Agendamiento Manual
 * CRÍTICO: Valida el flujo end-to-end de gestión de citas por parte del staff
 *
 * Este test simula exactamente el mismo flujo que la colección de Bruno (Flujo 4):
 * 1. Crear Cliente
 * 2. Verificar Disponibilidad Inmediata
 * 3. Crear Cita (código auto-generado)
 * 4. Actualizar Estado Cita
 * 5. Cancelar Cita
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

describe('🎯 E2E: Flujo Completo de AGENDAMIENTO MANUAL', () => {
  let app;
  let client;
  let testOrg;
  let userToken;
  let testProfesional;
  let testServicio;

  beforeAll(async () => {
    app = saasApp.getExpressApp();
    client = await global.testPool.connect();
    await cleanAllTables(client);

    // Setup inicial: Crear organización, usuario y recursos necesarios
    testOrg = await createTestOrganizacion(client);
    const testUsuario = await createTestUsuario(client, testOrg.id, { rol: 'propietario' });

    // Generar token JWT para el usuario
    userToken = authConfig.generateToken({
      userId: testUsuario.id,
      email: testUsuario.email,
      rol: testUsuario.rol,
      organizacionId: testOrg.id
    });

    // Crear profesional de prueba
    testProfesional = await createTestProfesional(client, testOrg.id, {
      nombre_completo: 'Carlos Martínez',
      tipo_profesional: 'barbero'
    });

    // Crear servicio de prueba
    testServicio = await createTestServicio(client, testOrg.id, {
      nombre: 'Corte de Cabello',
      duracion_minutos: 30,
      precio: 150.00
    }, [testProfesional.id]);

    client.release();
  });

  afterAll(async () => {
    const cleanupClient = await global.testPool.connect();
    await cleanAllTables(cleanupClient);
    cleanupClient.release();
  });

  test('✅ FLUJO COMPLETO: Crear Cliente → Verificar Disponibilidad → Crear Cita → Actualizar Estado → Cancelar', async () => {
    const uniqueId = getUniqueTestId();

    // ============================================================================
    // PASO 1: Crear Cliente (usando helper para evitar problemas de timing)
    // ============================================================================
    console.log('\n📝 PASO 1: Crear cliente...');

    const tempClient = await global.testPool.connect();
    await tempClient.query('BEGIN');
    const cliente = await createTestCliente(tempClient, testOrg.id, {
      nombre: 'Juan Pérez',
      telefono: `+54911${uniqueId.slice(-8)}`,
      email: `juan.perez-${uniqueId}@example.com`
    });
    await tempClient.query('COMMIT');
    tempClient.release();

    expect(cliente).toBeDefined();
    expect(cliente.id).toBeDefined();
    expect(cliente.nombre).toBe('Juan Pérez');

    const clienteId = cliente.id;
    console.log(`✅ Cliente creado: ID ${clienteId} - ${cliente.nombre}`);

    // ============================================================================
    // PASO 2: Verificar Disponibilidad Inmediata
    // ============================================================================
    console.log('\n📝 PASO 2: Verificar disponibilidad inmediata...');

    const disponibilidad = await request(app)
      .get('/api/v1/citas/disponibilidad-inmediata')
      .query({
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id
      })
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(disponibilidad.body.success).toBe(true);
    expect(disponibilidad.body.data).toBeDefined();

    // La respuesta puede tener diferentes estructuras dependiendo de la implementación
    const data = disponibilidad.body.data;
    console.log(`✅ Disponibilidad consultada para servicio: ${testServicio.nombre}`);

    // ============================================================================
    // PASO 3: Crear Cita (código auto-generado)
    // ============================================================================
    console.log('\n📝 PASO 3: Crear cita...');

    // Generar fecha futura (mañana a las 10:00)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const fechaCita = tomorrow.toISOString().split('T')[0]; // Solo fecha YYYY-MM-DD

    const citaData = {
      cliente_id: clienteId,
      profesional_id: testProfesional.id,
      servicio_id: testServicio.id,
      fecha_cita: `${fechaCita}T10:00:00-03:00`,
      hora_inicio: '10:00:00',
      hora_fin: '10:30:00',
      precio_servicio: 150.00,
      precio_final: 150.00,
      notas: 'Primera cita del cliente'
    };

    const cita = await request(app)
      .post('/api/v1/citas')
      .set('Authorization', `Bearer ${userToken}`)
      .send(citaData)
      .expect(201);

    expect(cita.body.success).toBe(true);
    expect(cita.body.data).toBeDefined();
    expect(cita.body.data.id).toBeDefined();

    // Validar código auto-generado (formato: ORG001-20251008-001)
    expect(cita.body.data.codigo_cita).toBeDefined();
    expect(cita.body.data.codigo_cita).toMatch(/^[A-Z0-9]+-\d{8}-\d{3}$/);

    // Validar campos principales (backend retorna solo IDs, no objetos completos)
    expect(cita.body.data).toHaveProperty('cliente_id');
    expect(cita.body.data).toHaveProperty('profesional_id');
    expect(cita.body.data).toHaveProperty('servicio_id');
    expect(cita.body.data).toHaveProperty('estado');
    expect(cita.body.data.estado).toBe('pendiente');

    const citaId = cita.body.data.id;
    const codigoCita = cita.body.data.codigo_cita;
    console.log(`✅ Cita creada: ID ${citaId}, Código ${codigoCita}`);
    console.log(`✅ Estado inicial: ${cita.body.data.estado}`);

    // 🔍 DEBUG: Pequeño delay para asegurar que la transacción se complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // ============================================================================
    // PASO 4: Actualizar Estado Cita
    // ============================================================================
    console.log('\n📝 PASO 4: Actualizar estado de cita...');

    const actualizarEstado = await request(app)
      .put(`/api/v1/citas/${citaId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        estado: 'confirmada'
      })
      .expect(200);

    expect(actualizarEstado.body.success).toBe(true);
    expect(actualizarEstado.body.data).toBeDefined();
    expect(actualizarEstado.body.data.estado).toBe('confirmada');
    expect(actualizarEstado.body.data.codigo_cita).toBe(codigoCita);

    console.log(`✅ Estado actualizado: pendiente → confirmada`);

    // ============================================================================
    // PASO 5: Cancelar Cita
    // ============================================================================
    console.log('\n📝 PASO 5: Cancelar cita...');

    const cancelar = await request(app)
      .delete(`/api/v1/citas/${citaId}`)
      .query({ motivo: 'Cliente solicitó cambio de fecha' })
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(cancelar.body.success).toBe(true);

    console.log(`✅ Cita cancelada exitosamente`);

    // ============================================================================
    // VALIDACIONES FINALES
    // ============================================================================
    console.log('\n📊 VALIDACIONES FINALES...');

    console.log('✅ Cliente creado correctamente');
    console.log('✅ Disponibilidad consultada');
    console.log('✅ Cita creada con código auto-generado');
    console.log('✅ Estado actualizado (pendiente → confirmada)');
    console.log('✅ Cita cancelada exitosamente');

    // ============================================================================
    // RESULTADO FINAL
    // ============================================================================
    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('   🎉 FLUJO E2E AGENDAMIENTO MANUAL COMPLETADO');
    console.log('════════════════════════════════════════════════════════════════');
    console.log(`   Organización: ${testOrg.nombre_comercial}`);
    console.log(`   ID: ${testOrg.id}`);
    console.log('');
    console.log('   📊 Recursos creados:');
    console.log(`   - Clientes: 1`);
    console.log(`   - Citas: 1 (código: ${codigoCita})`);
    console.log(`   - Estados gestionados: pendiente → confirmada → cancelada`);
    console.log('');
    console.log('   ✅ Flujo de agendamiento completado exitosamente');
    console.log('════════════════════════════════════════════════════════════════\n');
  });

  test('❌ FALLO: No se puede crear cita sin codigo_cita (se auto-genera)', async () => {
    const uniqueId = getUniqueTestId();

    console.log('\n📝 Test: Validar que codigo_cita se auto-genera...');

    // Crear cliente temporal
    const tempClient = await global.testPool.connect();
    await tempClient.query('BEGIN');
    const tempCliente = await createTestCliente(tempClient, testOrg.id, {
      nombre: 'Temp Cliente',
      telefono: `+54911${uniqueId.slice(-8)}`
    });
    await tempClient.query('COMMIT');
    tempClient.release();

    // Generar fecha futura
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const fechaTomorrow = tomorrow.toISOString().split('T')[0];

    const cita = await request(app)
      .post('/api/v1/citas')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        cliente_id: tempCliente.id,
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id,
        fecha_cita: `${fechaTomorrow}T14:00:00-03:00`,
        hora_inicio: '14:00:00',
        hora_fin: '14:30:00',
        precio_servicio: 150.00,
        precio_final: 150.00
        // NO enviar codigo_cita - debe auto-generarse
      })
      .expect(201);

    // Validar que el código fue auto-generado
    expect(cita.body.data.codigo_cita).toBeDefined();
    expect(cita.body.data.codigo_cita).toMatch(/^[A-Z0-9]+-\d{8}-\d{3}$/);

    console.log(`✅ Código auto-generado: ${cita.body.data.codigo_cita}`);
  });

  test('❌ FALLO: No se puede crear cita con cliente de otra organización', async () => {
    console.log('\n📝 Test: RLS bloquea cliente de otra org...');

    // Crear segunda organización con cliente
    const tempClient = await global.testPool.connect();
    await tempClient.query('BEGIN');
    const otherOrg = await createTestOrganizacion(tempClient);
    const otherCliente = await createTestCliente(tempClient, otherOrg.id, {
      nombre: 'Cliente Otra Org',
      telefono: '+5491187654321'
    });
    await tempClient.query('COMMIT');
    tempClient.release();

    // Generar fecha futura
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const fechaTomorrow = tomorrow.toISOString().split('T')[0];

    const cita = await request(app)
      .post('/api/v1/citas')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        cliente_id: otherCliente.id, // Cliente de otra org
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id,
        fecha_cita: `${fechaTomorrow}T15:00:00-03:00`,
        hora_inicio: '15:00:00',
        hora_fin: '15:30:00',
        precio_servicio: 150.00,
        precio_final: 150.00
      });

    // RLS debe bloquear (400, 403, 404 o 500)
    expect([400, 403, 404, 500]).toContain(cita.status);
    expect(cita.body.success).toBe(false);

    console.log('✅ RLS bloqueó correctamente cliente de otra organización');
  });

  test('✅ Flujo de estados válidos: pendiente → confirmada → en_curso → completada', async () => {
    const uniqueId = getUniqueTestId();

    console.log('\n📝 Test: Flujo completo de estados...');

    // Crear cliente temporal
    const tempClient = await global.testPool.connect();
    await tempClient.query('BEGIN');
    const tempCliente = await createTestCliente(tempClient, testOrg.id, {
      nombre: `Cliente Estados ${uniqueId}`,
      telefono: `+54911${uniqueId.slice(-8)}`
    });
    await tempClient.query('COMMIT');
    tempClient.release();

    // Generar fecha futura
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(16, 0, 0, 0);
    const fechaTomorrow = tomorrow.toISOString().split('T')[0];

    const cita = await request(app)
      .post('/api/v1/citas')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        cliente_id: tempCliente.id,
        profesional_id: testProfesional.id,
        servicio_id: testServicio.id,
        fecha_cita: `${fechaTomorrow}T16:00:00-03:00`,
        hora_inicio: '16:00:00',
        hora_fin: '16:30:00',
        precio_servicio: 150.00,
        precio_final: 150.00
      })
      .expect(201);

    expect(cita.body.success).toBe(true);
    expect(cita.body.data).toBeDefined();
    expect(cita.body.data.id).toBeDefined();

    const citaId = cita.body.data.id;

    // Estado 1: pendiente (inicial)
    expect(cita.body.data.estado).toBe('pendiente');
    console.log(`✅ Estado inicial: pendiente (Cita ID: ${citaId})`);

    // 🔍 DEBUG: Pequeño delay para asegurar que la transacción se complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Estado 2: confirmada
    const confirmada = await request(app)
      .put(`/api/v1/citas/${citaId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ estado: 'confirmada' })
      .expect(200);

    expect(confirmada.body.data.estado).toBe('confirmada');
    console.log('✅ Transición: pendiente → confirmada');

    // Estado 3: en_curso
    const enCurso = await request(app)
      .put(`/api/v1/citas/${citaId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ estado: 'en_curso' })
      .expect(200);

    expect(enCurso.body.data.estado).toBe('en_curso');
    console.log('✅ Transición: confirmada → en_curso');

    // Estado 4: completada
    const completada = await request(app)
      .put(`/api/v1/citas/${citaId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ estado: 'completada' })
      .expect(200);

    expect(completada.body.data.estado).toBe('completada');
    console.log('✅ Transición: en_curso → completada');

    console.log('✅ Flujo de estados completado exitosamente');

    tempClient.release();
  });
});

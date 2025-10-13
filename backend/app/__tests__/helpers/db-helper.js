/**
 * Helpers de Base de Datos para Tests
 * Funciones utilitarias para configurar RLS, limpiar datos, etc.
 */

const logger = require('../../utils/logger');

// Contador global para generar IDs únicos en tests
let globalTestCounter = 0;

/**
 * Obtener ID único para tests
 * @returns {string} ID único incremental
 */
function getUniqueTestId() {
  globalTestCounter++;
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${timestamp}${globalTestCounter}${random}`;
}

/**
 * Configurar contexto RLS para un tenant específico
 * @param {Object} client - Cliente de PostgreSQL
 * @param {number} tenantId - ID del tenant
 */
async function setRLSContext(client, tenantId) {
  await client.query('SELECT set_config($1, $2, false)', [
    'app.current_tenant_id',
    tenantId.toString()
  ]);

  await client.query('SELECT set_config($1, $2, false)', [
    'app.bypass_rls',
    'false'
  ]);

  logger.debug(`RLS configurado para tenant ${tenantId}`);
}

/**
 * Bypass RLS (solo para setup/cleanup de tests)
 * @param {Object} client - Cliente de PostgreSQL
 * NOTA: Configura app.bypass_rls = 'true' para que las políticas RLS permitan operaciones
 */
async function bypassRLS(client) {
  // Configurar bypass_rls para que las políticas RLS permitan operaciones
  await client.query("SELECT set_config('app.bypass_rls', 'true', false)");
  await client.query("SELECT set_config('app.current_tenant_id', '', false)");
  logger.debug('RLS bypasseado (modo test)');
}

/**
 * Limpiar tabla específica
 * @param {Object} client - Cliente de PostgreSQL
 * @param {string} tableName - Nombre de la tabla
 */
async function truncateTable(client, tableName) {
  await bypassRLS(client);
  await client.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`);
  logger.debug(`Tabla ${tableName} truncada`);
}

/**
 * Limpiar todas las tablas de datos (no estructura)
 * @param {Object} client - Cliente de PostgreSQL
 * NOTA: Usa bypass RLS + DELETE CASCADE para limpieza compatible con usuarios no-superuser
 */
async function cleanAllTables(client) {
  // Lista de tablas en orden inverso de dependencia
  // Orden: eliminar primero las tablas que dependen de otras
  // ⚠️ CRÍTICO: metricas_uso_organizacion debe ir AL FINAL
  //             Los triggers de usuarios/organizaciones intentarán actualizarla,
  //             fallarán silenciosamente, y luego la limpiamos manualmente
  // ⚠️ NO incluir tablas de datos maestros: planes_subscripcion, plantillas_servicios
  const tables = [
    'citas',                      // Depende de: clientes, profesionales, servicios
    'servicios_profesionales',    // Depende de: servicios, profesionales
    'bloqueos_horarios',          // Depende de: profesionales, organizaciones
    'horarios_profesionales',     // Depende de: profesionales
    'servicios',                  // Depende de: organizaciones
    'profesionales',              // Depende de: organizaciones
    'clientes',                   // Depende de: organizaciones
    'usuarios',                   // Depende de: organizaciones (trigger actualiza métricas - ignorar errores)
    'historial_subscripciones',   // Depende de: subscripciones
    'subscripciones',             // Depende de: organizaciones, planes_subscripcion
    'organizaciones',             // Depende de: nada (trigger inserta en métricas - ignorar errores)
    'metricas_uso_organizacion'   // ⚠️ AL FINAL - limpiar residuos de triggers
    // ⚠️ NO limpiar: planes_subscripcion, plantillas_servicios (datos maestros)
  ];

  // ESTRATEGIA DE LIMPIEZA SEGURA (sin requerir superuser):
  // 1. Bypass RLS con app.bypass_rls = 'true' (las políticas RLS lo permiten)
  // 2. Deshabilitar triggers temporalmente (saas_app tiene permiso TRIGGER)
  // 3. DELETE FROM en orden de dependencias
  // 4. Habilitar triggers de nuevo
  // 5. NO resetear secuencias (requiere ownership, no crítico para tests)

  await bypassRLS(client);

  // Deshabilitar triggers en tablas problemáticas (usuarios, organizaciones)
  // Esto evita que los triggers de actualizar_metricas_uso() fallen durante limpieza
  // USER = solo triggers definidos por usuario (no triggers de sistema como FK)
  try {
    await client.query('ALTER TABLE usuarios DISABLE TRIGGER USER');
    await client.query('ALTER TABLE organizaciones DISABLE TRIGGER USER');
    logger.debug('✓ Triggers de usuario deshabilitados temporalmente');
  } catch (err) {
    logger.debug(`⚠️ No se pudieron deshabilitar triggers: ${err.message}`);
  }

  let totalRows = 0;

  for (const table of tables) {
    try {
      const result = await client.query(`DELETE FROM ${table}`);
      totalRows += result.rowCount || 0;
      logger.debug(`✓ ${table} limpiada (${result.rowCount || 0} filas)`);
    } catch (err) {
      logger.debug(`⚠️ ${table}: ${err.message}`);
    }
  }

  // Habilitar triggers de nuevo
  try {
    await client.query('ALTER TABLE usuarios ENABLE TRIGGER USER');
    await client.query('ALTER TABLE organizaciones ENABLE TRIGGER USER');
    logger.debug('✓ Triggers de usuario habilitados nuevamente');
  } catch (err) {
    logger.debug(`⚠️ No se pudieron habilitar triggers: ${err.message}`);
  }

  logger.debug(`✓ Limpieza completa: ${tables.length} tablas, ${totalRows} filas eliminadas`);
}

/**
 * Crear organización de prueba
 * @param {Object} client - Cliente de PostgreSQL
 * @param {Object} data - Datos de la organización
 * @returns {Object} Organización creada
 */
async function createTestOrganizacion(client, data = {}) {
  await bypassRLS(client);

  // Generar códigos únicos con contador global
  const uniqueId = getUniqueTestId();

  const result = await client.query(
    `INSERT INTO organizaciones (
      codigo_tenant, slug, nombre_comercial, razon_social,
      tipo_industria, email_admin, activo
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      data.codigo_tenant || `TEST${uniqueId}`,
      data.slug || `test-org-${uniqueId}`,
      data.nombre_comercial || data.nombre || 'Organización Test',
      data.razon_social || 'Test Org SA de CV',
      data.tipo_industria || 'barberia',
      data.email_admin || `admin${uniqueId}@test.com`,
      data.activo !== undefined ? data.activo : true
    ]
  );

  const organizacion = result.rows[0];

  // Crear subscripción activa para la organización
  const planCodigo = data.plan_actual || data.plan || 'trial';

  // Obtener plan ID
  const planResult = await client.query(
    `SELECT id, precio_mensual FROM planes_subscripcion WHERE codigo_plan = $1`,
    [planCodigo]
  );

  if (planResult.rows.length > 0) {
    const plan = planResult.rows[0];

    await client.query(
      `INSERT INTO subscripciones (
        organizacion_id, plan_id, precio_actual, fecha_inicio,
        fecha_proximo_pago, estado, activa, metadata
      ) VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month', 'activa', true, '{}'::jsonb)`,
      [organizacion.id, plan.id, plan.precio_mensual]
    );
  }

  // CRÍTICO: Limpiar bypass después de crear organización
  await client.query("SELECT set_config('app.bypass_rls', 'false', false)");

  logger.debug(`✓ Organización creada: ID=${organizacion.id}, codigo_tenant=${organizacion.codigo_tenant}`);
  return organizacion;
}

/**
 * Crear usuario de prueba
 * @param {Object} client - Cliente de PostgreSQL
 * @param {number} organizacionId - ID de la organización
 * @param {Object} data - Datos del usuario
 * @returns {Object} Usuario creado
 */
async function createTestUsuario(client, organizacionId, data = {}) {
  await bypassRLS(client);

  const uniqueId = getUniqueTestId();

  const result = await client.query(
    `INSERT INTO usuarios (
      organizacion_id, email, password_hash, nombre, apellidos, rol, activo, email_verificado
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      organizacionId,
      data.email || `test-${uniqueId}@test.com`,
      data.password_hash || '$2a$10$abcdefghijklmnopqrstuv', // Hash de "password123"
      data.nombre || 'Usuario',
      data.apellidos || 'Test',
      data.rol || 'empleado',
      data.activo !== undefined ? data.activo : true,
      data.email_verificado !== undefined ? data.email_verificado : true
    ]
  );

  // CRÍTICO: Limpiar bypass después de crear usuario
  await client.query("SELECT set_config('app.bypass_rls', 'false', false)");

  return result.rows[0];
}

/**
 * Crear cliente de prueba
 * @param {Object} client - Cliente de PostgreSQL
 * @param {number} organizacionId - ID de la organización
 * @param {Object} data - Datos del cliente
 * @returns {Object} Cliente creado
 */
async function createTestCliente(client, organizacionId, data = {}) {
  await setRLSContext(client, organizacionId);

  const result = await client.query(
    `INSERT INTO clientes (
      organizacion_id, nombre, telefono, email, activo
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [
      organizacionId,
      data.nombre || 'Cliente Test',
      data.telefono || `+52${Date.now().toString().slice(-10)}`,
      data.email || null,
      data.activo !== undefined ? data.activo : true
    ]
  );

  return result.rows[0];
}

/**
 * Crear profesional de prueba
 * @param {Object} client - Cliente de PostgreSQL
 * @param {number} organizacionId - ID de la organización
 * @param {Object} data - Datos del profesional
 * @returns {Object} Profesional creado
 */
async function createTestProfesional(client, organizacionId, data = {}) {
  await setRLSContext(client, organizacionId);

  const result = await client.query(
    `INSERT INTO profesionales (
      organizacion_id, nombre_completo, tipo_profesional, telefono, email, activo
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      organizacionId,
      data.nombre_completo || 'Profesional Test',
      data.tipo_profesional || 'barbero',
      data.telefono || `+52${Date.now().toString().slice(-10)}`,
      data.email || null,
      data.activo !== undefined ? data.activo : true
    ]
  );

  return result.rows[0];
}

/**
 * Crear servicio de prueba
 * @param {Object} client - Cliente de PostgreSQL
 * @param {number} organizacionId - ID de la organización
 * @param {Object} data - Datos del servicio
 * @param {Array<number>} profesionales_ids - IDs de profesionales a asociar (opcional)
 * @returns {Object} Servicio creado
 */
async function createTestServicio(client, organizacionId, data = {}, profesionales_ids = []) {
  await setRLSContext(client, organizacionId);

  const result = await client.query(
    `INSERT INTO servicios (
      organizacion_id, nombre, descripcion, duracion_minutos, precio, activo
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      organizacionId,
      data.nombre || 'Servicio Test',
      data.descripcion || 'Servicio de prueba',
      data.duracion_minutos || 30,
      data.precio || 100.00,
      data.activo !== undefined ? data.activo : true
    ]
  );

  const servicio = result.rows[0];

  // Asociar profesionales al servicio si se proporcionan
  if (profesionales_ids && profesionales_ids.length > 0) {
    for (const profesionalId of profesionales_ids) {
      await client.query(
        `INSERT INTO servicios_profesionales (servicio_id, profesional_id, activo)
         VALUES ($1, $2, true)`,
        [servicio.id, profesionalId]
      );
    }
  }

  return servicio;
}

/**
 * Crear cita de prueba (SIN codigo_cita, se auto-genera)
 * @param {Object} client - Cliente de PostgreSQL
 * @param {number} organizacionId - ID de la organización
 * @param {Object} data - Datos de la cita
 * @returns {Object} Cita creada
 */
async function createTestCita(client, organizacionId, data) {
  await setRLSContext(client, organizacionId);

  // ✅ CRÍTICO: NO enviar codigo_cita (auto-generado por trigger)
  const result = await client.query(
    `INSERT INTO citas (
      organizacion_id, cliente_id, profesional_id, servicio_id,
      fecha_cita, hora_inicio, hora_fin, precio_servicio, precio_final, estado, pagado, motivo_cancelacion
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      organizacionId,
      data.cliente_id,
      data.profesional_id,
      data.servicio_id,
      data.fecha_cita,
      data.hora_inicio,
      data.hora_fin,
      data.precio_servicio,
      data.precio_final,
      data.estado || 'pendiente',
      data.pagado !== undefined ? data.pagado : false,
      data.motivo_cancelacion || null
    ]
  );

  return result.rows[0];
}

/**
 * Crear horario profesional de prueba
 * @param {Object} client - Cliente de PostgreSQL
 * @param {number} profesionalId - ID del profesional
 * @param {number} organizacionId - ID de la organización
 * @param {Object} data - Datos del horario
 * @returns {Object} Horario creado
 */
async function createTestHorarioProfesional(client, profesionalId, organizacionId, data = {}) {
  await setRLSContext(client, organizacionId);

  const result = await client.query(
    `INSERT INTO horarios_profesionales (
      organizacion_id, profesional_id, dia_semana,
      hora_inicio, hora_fin, tipo_horario,
      nombre_horario, permite_citas, activo,
      fecha_inicio, duracion_slot_minutos
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      organizacionId,
      profesionalId,
      data.dia_semana !== undefined ? data.dia_semana : 1, // Lunes por defecto
      data.hora_inicio || '09:00:00',
      data.hora_fin || '18:00:00',
      data.tipo_horario || 'regular',
      data.nombre_horario || 'Horario Estándar',
      data.permite_citas !== undefined ? data.permite_citas : true,
      data.activo !== undefined ? data.activo : true,
      data.fecha_inicio || '2025-01-01',
      data.duracion_slot_minutos || 30
    ]
  );

  return result.rows[0];
}

/**
 * Crear horarios semanales completos (Lunes-Viernes) para un profesional
 * @param {Object} client - Cliente de PostgreSQL
 * @param {number} profesionalId - ID del profesional
 * @param {number} organizacionId - ID de la organización
 * @param {Object} config - Configuración del horario
 * @returns {Array<Object>} Horarios creados
 */
async function createTestHorariosSemanalCompleto(client, profesionalId, organizacionId, config = {}) {
  const {
    dias = [1, 2, 3, 4, 5], // Lunes a Viernes
    hora_inicio = '09:00:00',
    hora_fin = '18:00:00',
    tipo_horario = 'regular',
    nombre_horario = 'Horario Laboral'
  } = config;

  const horarios = [];

  for (const dia of dias) {
    const horario = await createTestHorarioProfesional(client, profesionalId, organizacionId, {
      dia_semana: dia,
      hora_inicio,
      hora_fin,
      tipo_horario,
      nombre_horario,
      permite_citas: true,
      activo: true,
      fecha_inicio: '2025-01-01'
    });
    horarios.push(horario);
  }

  logger.debug(`✓ ${horarios.length} horarios semanales creados para profesional ${profesionalId}`);
  return horarios;
}

module.exports = {
  setRLSContext,
  bypassRLS,
  truncateTable,
  cleanAllTables,
  createTestOrganizacion,
  createTestUsuario,
  createTestCliente,
  createTestProfesional,
  createTestServicio,
  createTestCita,
  createTestHorarioProfesional,
  createTestHorariosSemanalCompleto,
  getUniqueTestId
};

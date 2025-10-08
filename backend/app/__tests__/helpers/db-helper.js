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
 * NOTA: Usa TRUNCATE CASCADE para limpieza completa y rápida
 */
async function cleanAllTables(client) {
  try {
    // Bypass RLS
    await bypassRLS(client);

    // Lista de tablas en orden inverso de dependencia
    const tables = [
      'citas',
      'servicios_profesionales',
      'horarios_disponibilidad',
      'bloqueos_horarios',
      'servicios',
      'profesionales',
      'clientes',
      'usuarios',
      'organizaciones'
    ];

    // Usar TRUNCATE CASCADE para limpieza completa
    // Esto es más rápido y resetea secuencias automáticamente
    const tablesList = tables.join(', ');

    await client.query(`TRUNCATE TABLE ${tablesList} RESTART IDENTITY CASCADE`);

    logger.debug(`✓ Todas las tablas limpiadas: ${tables.length} tablas`);
  } catch (error) {
    // Si TRUNCATE falla (por permisos), usar DELETE individual
    logger.warn('⚠️ TRUNCATE falló, usando DELETE...', error.message);

    await bypassRLS(client);

    const tables = [
      'citas',
      'servicios_profesionales',
      'horarios_disponibilidad',
      'bloqueos_horarios',
      'servicios',
      'profesionales',
      'clientes',
      'usuarios',
      'organizaciones'
    ];

    for (const table of tables) {
      try {
        const result = await client.query(`DELETE FROM ${table}`);
        logger.debug(`✓ ${table} limpiada (${result.rowCount} filas)`);
      } catch (err) {
        logger.debug(`⚠️ ${table}: ${err.message}`);
      }
    }
  }
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
  getUniqueTestId
};

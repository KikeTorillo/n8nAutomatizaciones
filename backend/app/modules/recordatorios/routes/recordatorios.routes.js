/**
 * ====================================================================
 * RUTAS: RECORDATORIOS
 * ====================================================================
 *
 * Rutas para el módulo de recordatorios automáticos.
 *
 * ENDPOINTS PÚBLICOS (requieren autenticación):
 * - GET    /api/v1/recordatorios/configuracion     - Obtener config
 * - PUT    /api/v1/recordatorios/configuracion     - Actualizar config
 * - GET    /api/v1/recordatorios/estadisticas      - Estadísticas
 * - GET    /api/v1/recordatorios/historial         - Historial por cita
 * - POST   /api/v1/recordatorios/test              - Enviar prueba
 *
 * ENDPOINTS INTERNOS (sin autenticación, solo red interna):
 * - POST   /internal/recordatorios/procesar        - Procesar batch
 *
 * @module modules/recordatorios/routes/recordatorios.routes
 */

const express = require('express');
const router = express.Router();

// Middleware
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const validate = validation.validate;

// Controller
const RecordatoriosController = require('../controllers/recordatorios.controller');

// Schemas
const {
  actualizarConfiguracionSchema,
  enviarPruebaSchema,
  estadisticasFiltrosSchema,
  procesarBatchSchema,
  historialFiltrosSchema
} = require('../schemas/recordatorios.schemas');

// ====================================================================
// MIDDLEWARE COMÚN
// ====================================================================

// Todas las rutas requieren autenticación
router.use(auth.authenticateToken);
router.use(tenant.setTenantContext);
router.use(rateLimiting.apiRateLimit);

// ====================================================================
// RUTAS DE CONFIGURACIÓN
// ====================================================================

/**
 * GET /api/v1/recordatorios/configuracion
 * Obtener configuración de recordatorios de la organización
 *
 * @access Admin, Propietario
 */
router.get(
  '/configuracion',
  auth.requireRole(['super_admin', 'admin', 'propietario']),
  RecordatoriosController.obtenerConfiguracion
);

/**
 * PUT /api/v1/recordatorios/configuracion
 * Actualizar configuración de recordatorios
 *
 * @access Admin, Propietario
 * @body {Object} - Campos a actualizar
 */
router.put(
  '/configuracion',
  auth.requireRole(['super_admin', 'admin', 'propietario']),
  validate(actualizarConfiguracionSchema),
  RecordatoriosController.actualizarConfiguracion
);

// ====================================================================
// RUTAS DE ESTADÍSTICAS E HISTORIAL
// ====================================================================

/**
 * GET /api/v1/recordatorios/estadisticas
 * Obtener estadísticas de recordatorios
 *
 * @access Admin, Propietario
 * @query {string} fecha_desde - Fecha inicial (ISO)
 * @query {string} fecha_hasta - Fecha final (ISO)
 */
router.get(
  '/estadisticas',
  auth.requireRole(['super_admin', 'admin', 'propietario']),
  validate(estadisticasFiltrosSchema, 'query'),
  RecordatoriosController.obtenerEstadisticas
);

/**
 * GET /api/v1/recordatorios/historial
 * Obtener historial de recordatorios de una cita
 *
 * @access Admin, Propietario, Empleado
 * @query {number} cita_id - ID de la cita (requerido)
 */
router.get(
  '/historial',
  auth.requireRole(['super_admin', 'admin', 'propietario', 'empleado']),
  validate(historialFiltrosSchema, 'query'),
  RecordatoriosController.obtenerHistorial
);

// ====================================================================
// RUTAS DE TESTING
// ====================================================================

/**
 * POST /api/v1/recordatorios/test
 * Enviar mensaje de prueba para verificar configuración
 *
 * @access Admin, Propietario
 * @body {string} telefono - Número de teléfono destino
 * @body {string} mensaje - Mensaje personalizado (opcional)
 */
router.post(
  '/test',
  auth.requireRole(['super_admin', 'admin', 'propietario']),
  validate(enviarPruebaSchema),
  RecordatoriosController.enviarPrueba
);

module.exports = router;

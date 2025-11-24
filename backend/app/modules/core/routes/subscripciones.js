/**
 * ====================================================================
 * RUTAS - SUSCRIPCIONES
 * ====================================================================
 */

const express = require('express');
const router = express.Router();

const subscripcionesController = require('../controllers/subscripciones.controller');
const { auth, tenant, validation, rateLimiting } = require('../../../middleware');
const subscripcionesSchemas = require('../schemas/subscripciones.schema');

const validate = validation.validate;

// ====================================================================
// RUTAS PÚBLICAS
// ====================================================================
// (ninguna por ahora)

// ====================================================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ====================================================================

/**
 * POST /api/v1/subscripciones/crear
 * Crear suscripción en Mercado Pago
 * Roles: admin, propietario
 */
router.post('/crear',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  validate(subscripcionesSchemas.crearSuscripcion),
  subscripcionesController.crearSuscripcion
);

/**
 * GET /api/v1/subscripciones/actual
 * Obtener suscripción actual de la organización
 * Roles: admin, propietario, empleado
 */
router.get('/actual',
  auth.authenticateToken,
  tenant.setTenantContext,
  subscripcionesController.obtenerSuscripcionActual
);

/**
 * GET /api/v1/subscripciones/estado-trial
 * Obtener estado del trial de la organización
 * Roles: admin, propietario
 */
router.get('/estado-trial',
  auth.authenticateToken,
  tenant.setTenantContext,
  subscripcionesController.obtenerEstadoTrial
);

/**
 * POST /api/v1/subscripciones/activar-pago
 * Activar pago con Mercado Pago (después del trial)
 * Roles: admin, propietario
 */
router.post('/activar-pago',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  validate(subscripcionesSchemas.activarPago),
  subscripcionesController.activarPago
);

/**
 * GET /api/v1/subscripciones/metricas-uso
 * Obtener métricas de uso de la organización
 * Roles: admin, propietario, empleado
 */
router.get('/metricas-uso',
  auth.authenticateToken,
  tenant.setTenantContext,
  subscripcionesController.obtenerMetricasUso
);

module.exports = router;

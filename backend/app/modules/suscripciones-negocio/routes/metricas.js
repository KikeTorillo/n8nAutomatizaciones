/**
 * ====================================================================
 * ROUTES: MÉTRICAS SAAS
 * ====================================================================
 */

const express = require('express');
const router = express.Router();
const { MetricasController } = require('../controllers');
const schemas = require('../schemas/suscripciones.schemas');
const { validate } = require('../../../middleware/validation');
const { auth, tenant, permisos } = require('../../../middleware');

// Middleware chain común
const authChain = [
    auth.authenticateToken,
    tenant.setTenantContext
];

/**
 * GET /api/v1/suscripciones-negocio/metricas/dashboard
 * Obtener dashboard completo de métricas
 */
router.get(
    '/dashboard',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_metricas'),
    validate(schemas.metricasPorMes, 'query'),
    MetricasController.obtenerDashboard
);

/**
 * GET /api/v1/suscripciones-negocio/metricas/mrr
 * Calcular MRR (Monthly Recurring Revenue)
 */
router.get(
    '/mrr',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_metricas'),
    validate(schemas.metricasPorFecha, 'query'),
    MetricasController.calcularMRR
);

/**
 * GET /api/v1/suscripciones-negocio/metricas/arr
 * Calcular ARR (Annual Recurring Revenue)
 */
router.get(
    '/arr',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_metricas'),
    validate(schemas.metricasPorFecha, 'query'),
    MetricasController.calcularARR
);

/**
 * GET /api/v1/suscripciones-negocio/metricas/churn
 * Calcular Churn Rate (tasa de cancelación)
 */
router.get(
    '/churn',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_metricas'),
    validate(schemas.metricasPorMes, 'query'),
    MetricasController.calcularChurnRate
);

/**
 * GET /api/v1/suscripciones-negocio/metricas/ltv
 * Calcular LTV (Lifetime Value)
 */
router.get(
    '/ltv',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_metricas'),
    MetricasController.calcularLTV
);

/**
 * GET /api/v1/suscripciones-negocio/metricas/suscriptores-activos
 * Obtener número de suscriptores activos
 */
router.get(
    '/suscriptores-activos',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_metricas'),
    validate(schemas.metricasPorFecha, 'query'),
    MetricasController.obtenerSuscriptoresActivos
);

/**
 * GET /api/v1/suscripciones-negocio/metricas/crecimiento
 * Obtener crecimiento mensual de MRR
 */
router.get(
    '/crecimiento',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_metricas'),
    validate(schemas.metricasPorMes, 'query'),
    MetricasController.obtenerCrecimientoMensual
);

/**
 * GET /api/v1/suscripciones-negocio/metricas/distribucion-estado
 * Obtener distribución de suscriptores por estado
 */
router.get(
    '/distribucion-estado',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_metricas'),
    MetricasController.obtenerDistribucionPorEstado
);

/**
 * GET /api/v1/suscripciones-negocio/metricas/top-planes
 * Obtener top planes más populares
 */
router.get(
    '/top-planes',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_metricas'),
    validate(schemas.metricasTopPlanes, 'query'),
    MetricasController.obtenerTopPlanes
);

/**
 * GET /api/v1/suscripciones-negocio/metricas/evolucion-mrr
 * Obtener evolución de MRR (últimos N meses)
 */
router.get(
    '/evolucion-mrr',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_metricas'),
    validate(schemas.metricasEvolucion, 'query'),
    MetricasController.obtenerEvolucionMRR
);

/**
 * GET /api/v1/suscripciones-negocio/metricas/evolucion-churn
 * Obtener evolución de Churn Rate (últimos N meses)
 */
router.get(
    '/evolucion-churn',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_metricas'),
    validate(schemas.metricasEvolucion, 'query'),
    MetricasController.obtenerEvolucionChurn
);

/**
 * GET /api/v1/suscripciones-negocio/metricas/evolucion-suscriptores
 * Obtener evolución de suscriptores (nuevos, cancelados, neto)
 */
router.get(
    '/evolucion-suscriptores',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_metricas'),
    validate(schemas.metricasEvolucion, 'query'),
    MetricasController.obtenerEvolucionSuscriptores
);

module.exports = router;

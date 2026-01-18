/**
 * ====================================================================
 * ROUTES - REPORTES Y ANALYTICS
 * ====================================================================
 */

const express = require('express');
const InventarioController = require('../controllers');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const inventarioSchemas = require('../schemas/inventario.schemas');

const router = express.Router();
const validate = validation.validate;

/**
 * GET /api/v1/inventario/reportes/valor-inventario
 * Calcular valor total del inventario
 * Returns: total_productos, total_unidades, valor_compra, valor_venta, margen_potencial
 */
router.get('/reportes/valor-inventario',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    InventarioController.obtenerValorInventario
);

/**
 * GET /api/v1/inventario/reportes/analisis-abc
 * Analisis ABC de productos (clasificacion Pareto)
 * Query params: fecha_desde, fecha_hasta, categoria_id (opcional)
 * Returns: Productos clasificados como A (80% ingresos), B (15%), C (5%)
 */
router.get('/reportes/analisis-abc',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.reporteAnalisisABC),
    InventarioController.obtenerAnalisisABC
);

/**
 * GET /api/v1/inventario/reportes/rotacion
 * Reporte de rotacion de inventario
 * Query params: fecha_desde, fecha_hasta, categoria_id (opcional), top (default: 20)
 * Returns: Productos ordenados por dias promedio de rotacion
 */
router.get('/reportes/rotacion',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.reporteRotacion),
    InventarioController.obtenerRotacionInventario
);

/**
 * GET /api/v1/inventario/reportes/alertas
 * Resumen de alertas de inventario agrupadas por tipo y nivel
 * Returns: Totales por tipo_alerta y nivel (critical, warning, info)
 */
router.get('/reportes/alertas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    InventarioController.obtenerResumenAlertas
);

module.exports = router;

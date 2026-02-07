/**
 * ====================================================================
 * ROUTES - INVENTORY AT DATE / SNAPSHOTS
 * ====================================================================
 * Consulta historica del inventario en fechas pasadas
 */

const express = require('express');
const SnapshotsController = require('../controllers/snapshots.controller');
const { auth, tenant, rateLimiting, modules } = require('../../../middleware');
const { asyncHandler } = require('../../../middleware');

const router = express.Router();

/**
 * GET /api/v1/inventario/snapshots/fechas
 * Obtener fechas disponibles para selector
 */
router.get('/snapshots/fechas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    asyncHandler(SnapshotsController.fechasDisponibles)
);

/**
 * GET /api/v1/inventario/snapshots/historico/:productoId
 * Obtener historico de stock de un producto para grafico de pronostico
 * @param productoId - ID del producto
 * @query dias - Dias de historico (default: 30)
 */
router.get('/snapshots/historico/:productoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    asyncHandler(SnapshotsController.historicoProducto)
);

/**
 * GET /api/v1/inventario/snapshots
 * Listar snapshots disponibles
 */
router.get('/snapshots',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    asyncHandler(SnapshotsController.listar)
);

/**
 * POST /api/v1/inventario/snapshots
 * Generar snapshot manualmente
 */
router.post('/snapshots',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    auth.requireRole(['super_admin', 'admin']),
    rateLimiting.userRateLimit,
    asyncHandler(SnapshotsController.generar)
);

/**
 * GET /api/v1/inventario/at-date
 * Consultar stock en fecha especifica
 * @query fecha - Fecha en formato YYYY-MM-DD (requerido)
 * @query producto_id - Filtrar por producto (opcional)
 * @query categoria_id - Filtrar por categoria (opcional)
 * @query solo_con_stock - Solo productos con stock > 0 (opcional)
 */
router.get('/at-date',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    asyncHandler(SnapshotsController.stockEnFecha)
);

/**
 * GET /api/v1/inventario/comparar
 * Comparar inventario entre dos fechas
 * @query fecha_desde - Fecha inicial (requerido)
 * @query fecha_hasta - Fecha final (requerido)
 * @query solo_cambios - Solo productos con cambios (default: true)
 */
router.get('/comparar',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    asyncHandler(SnapshotsController.comparar)
);

module.exports = router;

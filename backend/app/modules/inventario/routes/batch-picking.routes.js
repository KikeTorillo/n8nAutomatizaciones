/**
 * ====================================================================
 * ROUTES - BATCH PICKING (Wave Picking)
 * ====================================================================
 * Agrupacion de operaciones de picking para procesamiento consolidado
 */

const express = require('express');
const BatchPickingController = require('../controllers/batch-picking.controller');
const { auth, tenant, rateLimiting, subscription, modules } = require('../../../middleware');

const router = express.Router();

/**
 * GET /api/v1/inventario/batch-picking
 * Listar batches con filtros
 */
router.get('/batch-picking',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    BatchPickingController.listar
);

/**
 * GET /api/v1/inventario/batch-picking/pendientes/:sucursalId
 * Obtener batches pendientes de una sucursal
 */
router.get('/batch-picking/pendientes/:sucursalId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    BatchPickingController.obtenerPendientes
);

/**
 * GET /api/v1/inventario/batch-picking/operaciones-disponibles/:sucursalId
 * Obtener operaciones de picking disponibles para batch
 */
router.get('/batch-picking/operaciones-disponibles/:sucursalId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    BatchPickingController.obtenerOperacionesDisponibles
);

/**
 * GET /api/v1/inventario/batch-picking/:id
 * Obtener batch con operaciones
 */
router.get('/batch-picking/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    BatchPickingController.obtenerPorId
);

/**
 * GET /api/v1/inventario/batch-picking/:id/lista-consolidada
 * Obtener lista consolidada de productos a recoger
 */
router.get('/batch-picking/:id/lista-consolidada',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    BatchPickingController.obtenerListaConsolidada
);

/**
 * GET /api/v1/inventario/batch-picking/:id/estadisticas
 * Obtener estadisticas del batch
 */
router.get('/batch-picking/:id/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    BatchPickingController.obtenerEstadisticas
);

/**
 * POST /api/v1/inventario/batch-picking
 * Crear batch de picking
 */
router.post('/batch-picking',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    BatchPickingController.crear
);

/**
 * PUT /api/v1/inventario/batch-picking/:id
 * Actualizar batch
 */
router.put('/batch-picking/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    BatchPickingController.actualizar
);

/**
 * DELETE /api/v1/inventario/batch-picking/:id
 * Eliminar batch (solo si esta en borrador)
 */
router.delete('/batch-picking/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    BatchPickingController.eliminar
);

/**
 * POST /api/v1/inventario/batch-picking/:id/operaciones
 * Agregar operacion al batch
 */
router.post('/batch-picking/:id/operaciones',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    BatchPickingController.agregarOperacion
);

/**
 * DELETE /api/v1/inventario/batch-picking/:id/operaciones/:operacionId
 * Quitar operacion del batch
 */
router.delete('/batch-picking/:id/operaciones/:operacionId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    BatchPickingController.quitarOperacion
);

/**
 * POST /api/v1/inventario/batch-picking/:id/iniciar
 * Iniciar procesamiento del batch
 */
router.post('/batch-picking/:id/iniciar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    BatchPickingController.iniciar
);

/**
 * POST /api/v1/inventario/batch-picking/:id/procesar-item
 * Procesar item del batch
 */
router.post('/batch-picking/:id/procesar-item',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    BatchPickingController.procesarItem
);

/**
 * POST /api/v1/inventario/batch-picking/:id/completar
 * Completar batch
 */
router.post('/batch-picking/:id/completar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    BatchPickingController.completar
);

/**
 * POST /api/v1/inventario/batch-picking/:id/cancelar
 * Cancelar batch
 */
router.post('/batch-picking/:id/cancelar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    BatchPickingController.cancelar
);

module.exports = router;

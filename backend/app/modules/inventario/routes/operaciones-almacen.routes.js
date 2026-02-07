/**
 * ====================================================================
 * ROUTES - OPERACIONES DE ALMACEN (Rutas Multietapa)
 * ====================================================================
 * Sistema multi-paso: Recepcion -> QC -> Almacenamiento | Picking -> Empaque -> Envio
 */

const express = require('express');
const OperacionesAlmacenController = require('../controllers/operaciones-almacen.controller');
const { auth, tenant, rateLimiting, subscription, modules } = require('../../../middleware');

const router = express.Router();

/**
 * GET /api/v1/inventario/operaciones
 * Listar operaciones con filtros
 */
router.get('/operaciones',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    OperacionesAlmacenController.listar
);

/**
 * GET /api/v1/inventario/operaciones/pendientes/:sucursalId
 * Obtener operaciones pendientes de una sucursal
 */
router.get('/operaciones/pendientes/:sucursalId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    OperacionesAlmacenController.obtenerPendientes
);

/**
 * GET /api/v1/inventario/operaciones/estadisticas/:sucursalId
 * Obtener estadisticas por tipo
 */
router.get('/operaciones/estadisticas/:sucursalId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    OperacionesAlmacenController.obtenerEstadisticas
);

/**
 * GET /api/v1/inventario/operaciones/kanban/:sucursalId
 * Obtener resumen para vista Kanban
 */
router.get('/operaciones/kanban/:sucursalId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    OperacionesAlmacenController.obtenerResumenKanban
);

/**
 * GET /api/v1/inventario/operaciones/:id
 * Obtener operacion con items
 */
router.get('/operaciones/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    OperacionesAlmacenController.obtenerPorId
);

/**
 * GET /api/v1/inventario/operaciones/:id/cadena
 * Obtener cadena completa de operaciones (multi-step)
 */
router.get('/operaciones/:id/cadena',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    OperacionesAlmacenController.obtenerCadena
);

/**
 * POST /api/v1/inventario/operaciones
 * Crear operacion manual
 */
router.post('/operaciones',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    OperacionesAlmacenController.crear
);

/**
 * PUT /api/v1/inventario/operaciones/:id
 * Actualizar operacion
 */
router.put('/operaciones/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    OperacionesAlmacenController.actualizar
);

/**
 * POST /api/v1/inventario/operaciones/:id/asignar
 * Asignar operacion a usuario
 */
router.post('/operaciones/:id/asignar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    OperacionesAlmacenController.asignar
);

/**
 * POST /api/v1/inventario/operaciones/:id/iniciar
 * Iniciar procesamiento de operacion
 */
router.post('/operaciones/:id/iniciar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    OperacionesAlmacenController.iniciar
);

/**
 * POST /api/v1/inventario/operaciones/:id/completar
 * Completar operacion procesando items
 */
router.post('/operaciones/:id/completar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    OperacionesAlmacenController.completar
);

/**
 * POST /api/v1/inventario/operaciones/:id/cancelar
 * Cancelar operacion
 */
router.post('/operaciones/:id/cancelar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    OperacionesAlmacenController.cancelar
);

/**
 * POST /api/v1/inventario/operaciones/items/:itemId/procesar
 * Procesar item individual
 */
router.post('/operaciones/items/:itemId/procesar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    OperacionesAlmacenController.procesarItem
);

/**
 * POST /api/v1/inventario/operaciones/items/:itemId/cancelar
 * Cancelar item
 */
router.post('/operaciones/items/:itemId/cancelar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    OperacionesAlmacenController.cancelarItem
);

module.exports = router;

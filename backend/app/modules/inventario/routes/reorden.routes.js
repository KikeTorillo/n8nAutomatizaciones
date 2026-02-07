/**
 * ====================================================================
 * ROUTES - REORDEN AUTOMATICO
 * ====================================================================
 */

const express = require('express');
const ReordenController = require('../controllers/reorden.controller');
const { auth, tenant, rateLimiting, validation, subscription, modules } = require('../../../middleware');
const inventarioSchemas = require('../schemas/inventario.schemas');

const router = express.Router();
const validate = validation.validate;

/**
 * GET /api/v1/inventario/reorden/dashboard
 * Obtener metricas del dashboard de reorden
 */
router.get('/reorden/dashboard',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    ReordenController.obtenerDashboard
);

/**
 * GET /api/v1/inventario/reorden/productos-bajo-minimo
 * Listar productos que necesitan reabastecimiento
 */
router.get('/reorden/productos-bajo-minimo',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.listarProductosBajoMinimo),
    ReordenController.productosBajoMinimo
);

/**
 * GET /api/v1/inventario/reorden/rutas
 * Listar rutas de operacion disponibles
 */
router.get('/reorden/rutas',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    ReordenController.listarRutas
);

/**
 * GET /api/v1/inventario/reorden/reglas
 * Listar reglas de reabastecimiento
 */
router.get('/reorden/reglas',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.listarReglasReorden),
    ReordenController.listarReglas
);

/**
 * GET /api/v1/inventario/reorden/reglas/:id
 * Obtener regla por ID
 */
router.get('/reorden/reglas/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    ReordenController.obtenerRegla
);

/**
 * POST /api/v1/inventario/reorden/reglas
 * Crear nueva regla de reabastecimiento
 */
router.post('/reorden/reglas',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.crearReglaReorden),
    ReordenController.crearRegla
);

/**
 * PUT /api/v1/inventario/reorden/reglas/:id
 * Actualizar regla de reabastecimiento
 */
router.put('/reorden/reglas/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.actualizarReglaReorden),
    ReordenController.actualizarRegla
);

/**
 * DELETE /api/v1/inventario/reorden/reglas/:id
 * Eliminar regla de reabastecimiento
 */
router.delete('/reorden/reglas/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    ReordenController.eliminarRegla
);

/**
 * POST /api/v1/inventario/reorden/ejecutar
 * Ejecutar evaluacion de reorden manualmente
 */
router.post('/reorden/ejecutar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.heavyOperationRateLimit,
    ReordenController.ejecutarManual
);

/**
 * GET /api/v1/inventario/reorden/logs
 * Listar historial de ejecuciones de reorden
 */
router.get('/reorden/logs',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.listarLogsReorden),
    ReordenController.listarLogs
);

/**
 * GET /api/v1/inventario/reorden/logs/:id
 * Obtener detalle de un log de ejecucion
 */
router.get('/reorden/logs/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    ReordenController.obtenerLog
);

module.exports = router;

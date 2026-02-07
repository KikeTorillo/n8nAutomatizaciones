/**
 * ====================================================================
 * ROUTES - MOVIMIENTOS DE INVENTARIO
 * ====================================================================
 */

const express = require('express');
const InventarioController = require('../controllers');
const { auth, tenant, rateLimiting, validation, subscription, modules } = require('../../../middleware');
const inventarioSchemas = require('../schemas/inventario.schemas');

const router = express.Router();
const validate = validation.validate;

/**
 * POST /api/v1/inventario/movimientos
 * Registrar movimiento de inventario
 * NOTA: No requiere checkResourceLimit ya que son operaciones sobre productos existentes
 */
router.post('/movimientos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.registrarMovimiento),
    InventarioController.registrarMovimiento
);

/**
 * GET /api/v1/inventario/movimientos/kardex/:producto_id
 * Obtener kardex de un producto
 */
router.get('/movimientos/kardex/:producto_id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.obtenerKardex),
    InventarioController.obtenerKardex
);

/**
 * GET /api/v1/inventario/movimientos/estadisticas
 * Obtener estadisticas de movimientos
 */
router.get('/movimientos/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.obtenerEstadisticasMovimientos),
    InventarioController.obtenerEstadisticasMovimientos
);

/**
 * GET /api/v1/inventario/movimientos
 * Listar movimientos con filtros
 */
router.get('/movimientos',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.listarMovimientos),
    InventarioController.listarMovimientos
);

module.exports = router;

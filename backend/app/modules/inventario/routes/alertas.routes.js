/**
 * ====================================================================
 * ROUTES - ALERTAS DE INVENTARIO
 * ====================================================================
 */

const express = require('express');
const InventarioController = require('../controllers');
const { auth, tenant, rateLimiting, validation, modules } = require('../../../middleware');
const inventarioSchemas = require('../schemas/inventario.schemas');

const router = express.Router();
const validate = validation.validate;

/**
 * GET /api/v1/inventario/alertas/dashboard
 * Obtener dashboard de alertas
 */
router.get('/alertas/dashboard',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    InventarioController.obtenerDashboardAlertas
);

/**
 * PATCH /api/v1/inventario/alertas/marcar-varias-leidas
 * Marcar multiples alertas como leidas
 */
router.patch('/alertas/marcar-varias-leidas',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.marcarVariasAlertasLeidas),
    InventarioController.marcarVariasAlertasLeidas
);

/**
 * GET /api/v1/inventario/alertas/:id
 * Obtener alerta por ID
 */
router.get('/alertas/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    InventarioController.obtenerAlertaPorId
);

/**
 * PATCH /api/v1/inventario/alertas/:id/marcar-leida
 * Marcar alerta como leida
 */
router.patch('/alertas/:id/marcar-leida',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    InventarioController.marcarAlertaLeida
);

/**
 * GET /api/v1/inventario/alertas
 * Listar alertas con filtros
 */
router.get('/alertas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.listarAlertas),
    InventarioController.listarAlertas
);

module.exports = router;

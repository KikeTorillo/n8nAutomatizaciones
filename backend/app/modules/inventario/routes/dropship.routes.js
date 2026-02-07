/**
 * ====================================================================
 * ROUTES - DROPSHIPPING
 * ====================================================================
 * Flujo: Venta dropship -> OC automatica -> Proveedor envia a cliente
 */

const express = require('express');
const DropshipController = require('../controllers/dropship.controller');
const { auth, tenant, rateLimiting, validation, subscription, modules } = require('../../../middleware');
const inventarioSchemas = require('../schemas/inventario.schemas');

const router = express.Router();
const validate = validation.validate;

/**
 * GET /api/v1/inventario/dropship/estadisticas
 * Obtener estadisticas de dropship
 */
router.get('/dropship/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    DropshipController.obtenerEstadisticas
);

/**
 * GET /api/v1/inventario/dropship/configuracion
 * Obtener configuracion dropship de la organizacion
 */
router.get('/dropship/configuracion',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    DropshipController.obtenerConfiguracion
);

/**
 * PATCH /api/v1/inventario/dropship/configuracion
 * Actualizar configuracion dropship
 */
router.patch('/dropship/configuracion',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.actualizarConfigDropship),
    DropshipController.actualizarConfiguracion
);

/**
 * GET /api/v1/inventario/dropship/pendientes
 * Listar ventas pendientes de generar OC dropship
 */
router.get('/dropship/pendientes',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    DropshipController.obtenerVentasPendientes
);

/**
 * POST /api/v1/inventario/dropship/desde-venta/:ventaId
 * Crear OC dropship desde una venta
 */
router.post('/dropship/desde-venta/:ventaId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    DropshipController.crearDesdeVenta
);

/**
 * GET /api/v1/inventario/dropship/ordenes
 * Listar OC dropship
 */
router.get('/dropship/ordenes',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    DropshipController.listarOrdenes
);

/**
 * GET /api/v1/inventario/dropship/ordenes/:id
 * Obtener detalle de OC dropship
 */
router.get('/dropship/ordenes/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    DropshipController.obtenerOrden
);

/**
 * PATCH /api/v1/inventario/dropship/ordenes/:id/confirmar-entrega
 * Confirmar que el cliente recibio el envio
 */
router.patch('/dropship/ordenes/:id/confirmar-entrega',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    DropshipController.confirmarEntrega
);

/**
 * PATCH /api/v1/inventario/dropship/ordenes/:id/cancelar
 * Cancelar OC dropship
 */
router.patch('/dropship/ordenes/:id/cancelar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    DropshipController.cancelar
);

module.exports = router;

/**
 * ====================================================================
 * ROUTES - LANDED COSTS (Costos en Destino)
 * ====================================================================
 * Agregar costos adicionales (flete, arancel, seguro) a OC
 */

const express = require('express');
const LandedCostsController = require('../controllers/landed-costs.controller');
const { auth, tenant, rateLimiting, validation, modules } = require('../../../middleware');
const { asyncHandler } = require('../../../middleware');
const inventarioSchemas = require('../schemas/inventario.schemas');

const router = express.Router();
const validate = validation.validate;

/**
 * GET /api/v1/inventario/ordenes-compra/:id/costos
 * Listar costos adicionales de una OC
 */
router.get('/ordenes-compra/:id/costos',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    asyncHandler(LandedCostsController.listarCostos)
);

/**
 * GET /api/v1/inventario/ordenes-compra/:id/costos/resumen
 * Obtener resumen de costos de una OC
 */
router.get('/ordenes-compra/:id/costos/resumen',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    asyncHandler(LandedCostsController.obtenerResumen)
);

/**
 * GET /api/v1/inventario/ordenes-compra/:id/costos/:costoId
 * Obtener un costo adicional por ID
 */
router.get('/ordenes-compra/:id/costos/:costoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    asyncHandler(LandedCostsController.obtenerCosto)
);

/**
 * POST /api/v1/inventario/ordenes-compra/:id/costos
 * Crear costo adicional
 */
router.post('/ordenes-compra/:id/costos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.crearCostoAdicional),
    asyncHandler(LandedCostsController.crearCosto)
);

/**
 * PUT /api/v1/inventario/ordenes-compra/:id/costos/:costoId
 * Actualizar costo adicional
 */
router.put('/ordenes-compra/:id/costos/:costoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.actualizarCostoAdicional),
    asyncHandler(LandedCostsController.actualizarCosto)
);

/**
 * DELETE /api/v1/inventario/ordenes-compra/:id/costos/:costoId
 * Eliminar costo adicional
 */
router.delete('/ordenes-compra/:id/costos/:costoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    asyncHandler(LandedCostsController.eliminarCosto)
);

/**
 * POST /api/v1/inventario/ordenes-compra/:id/costos/:costoId/distribuir
 * Distribuir un costo adicional a los items
 */
router.post('/ordenes-compra/:id/costos/:costoId/distribuir',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    asyncHandler(LandedCostsController.distribuirCosto)
);

/**
 * GET /api/v1/inventario/ordenes-compra/:id/costos/:costoId/distribucion
 * Obtener detalle de distribucion de un costo
 */
router.get('/ordenes-compra/:id/costos/:costoId/distribucion',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    asyncHandler(LandedCostsController.obtenerDistribucion)
);

/**
 * POST /api/v1/inventario/ordenes-compra/:id/distribuir-costos
 * Distribuir todos los costos pendientes de una OC
 */
router.post('/ordenes-compra/:id/distribuir-costos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    asyncHandler(LandedCostsController.distribuirTodos)
);

/**
 * GET /api/v1/inventario/ordenes-compra/:id/costos-por-items
 * Obtener costos totales desglosados por item
 */
router.get('/ordenes-compra/:id/costos-por-items',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    asyncHandler(LandedCostsController.obtenerCostosPorItems)
);

module.exports = router;

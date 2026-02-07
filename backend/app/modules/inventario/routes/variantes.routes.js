/**
 * ====================================================================
 * ROUTES - VARIANTES DE PRODUCTO
 * ====================================================================
 * Combinaciones con stock y precios independientes
 */

const express = require('express');
const VariantesController = require('../controllers/variantes.controller');
const { auth, tenant, rateLimiting, validation, modules } = require('../../../middleware');
const variantesSchemas = require('../schemas/variantes.schemas');

const router = express.Router();
const validate = validation.validate;

/**
 * GET /api/v1/inventario/variantes/buscar
 * Buscar variante por SKU o codigo de barras
 */
router.get('/variantes/buscar',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(variantesSchemas.buscarVariante),
    VariantesController.buscar
);

/**
 * GET /api/v1/inventario/variantes/:id
 * Obtener variante por ID
 */
router.get('/variantes/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    VariantesController.obtenerPorId
);

/**
 * PUT /api/v1/inventario/variantes/:id
 * Actualizar variante
 */
router.put('/variantes/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(variantesSchemas.actualizarVariante),
    VariantesController.actualizar
);

/**
 * PATCH /api/v1/inventario/variantes/:id/stock
 * Ajustar stock de variante
 */
router.patch('/variantes/:id/stock',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(variantesSchemas.ajustarStock),
    VariantesController.ajustarStock
);

/**
 * DELETE /api/v1/inventario/variantes/:id
 * Eliminar variante
 */
router.delete('/variantes/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    VariantesController.eliminar
);

/**
 * GET /api/v1/inventario/productos/:productoId/variantes
 * Listar variantes de un producto
 */
router.get('/productos/:productoId/variantes',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    VariantesController.listar
);

/**
 * GET /api/v1/inventario/productos/:productoId/variantes/resumen
 * Resumen de stock por variantes
 */
router.get('/productos/:productoId/variantes/resumen',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    VariantesController.obtenerResumen
);

/**
 * POST /api/v1/inventario/productos/:productoId/variantes
 * Crear variante individual
 */
router.post('/productos/:productoId/variantes',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(variantesSchemas.crearVariante),
    VariantesController.crear
);

/**
 * POST /api/v1/inventario/productos/:productoId/variantes/generar
 * Generar variantes automaticamente desde combinaciones
 */
router.post('/productos/:productoId/variantes/generar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(variantesSchemas.generarVariantes),
    VariantesController.generar
);

module.exports = router;

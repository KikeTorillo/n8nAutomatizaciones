/**
 * ====================================================================
 * ROUTES - CATEGORIAS DE PRODUCTOS
 * ====================================================================
 */

const express = require('express');
const InventarioController = require('../controllers');
const { auth, tenant, rateLimiting, validation, subscription, modules } = require('../../../middleware');
const inventarioSchemas = require('../schemas/inventario.schemas');

const router = express.Router();
const validate = validation.validate;

/**
 * POST /api/v1/inventario/categorias
 * Crear nueva categoria de producto
 */
router.post('/categorias',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.crearCategoria),
    InventarioController.crearCategoria
);

/**
 * GET /api/v1/inventario/categorias/arbol
 * Obtener arbol jerarquico de categorias
 */
router.get('/categorias/arbol',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    InventarioController.obtenerArbolCategorias
);

/**
 * GET /api/v1/inventario/categorias/:id
 * Obtener categoria por ID
 */
router.get('/categorias/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    InventarioController.obtenerCategoriaPorId
);

/**
 * GET /api/v1/inventario/categorias
 * Listar categorias con filtros
 */
router.get('/categorias',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.listarCategorias),
    InventarioController.listarCategorias
);

/**
 * PUT /api/v1/inventario/categorias/:id
 * Actualizar categoria
 */
router.put('/categorias/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.actualizarCategoria),
    InventarioController.actualizarCategoria
);

/**
 * DELETE /api/v1/inventario/categorias/:id
 * Eliminar categoria (soft delete)
 */
router.delete('/categorias/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    InventarioController.eliminarCategoria
);

module.exports = router;

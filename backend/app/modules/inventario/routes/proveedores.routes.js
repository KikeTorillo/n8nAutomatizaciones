/**
 * ====================================================================
 * ROUTES - PROVEEDORES
 * ====================================================================
 */

const express = require('express');
const InventarioController = require('../controllers');
const { auth, tenant, rateLimiting, validation, subscription, modules, permisos } = require('../../../middleware');
const inventarioSchemas = require('../schemas/inventario.schemas');
const { verificarPermiso } = permisos;

const router = express.Router();
const validate = validation.validate;

/**
 * POST /api/v1/inventario/proveedores
 * Crear nuevo proveedor
 */
router.post('/proveedores',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    verificarPermiso('inventario.crear_proveedores'),
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.crearProveedor),
    InventarioController.crearProveedor
);

/**
 * GET /api/v1/inventario/proveedores/:id
 * Obtener proveedor por ID
 */
router.get('/proveedores/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    InventarioController.obtenerProveedorPorId
);

/**
 * GET /api/v1/inventario/proveedores
 * Listar proveedores con filtros
 */
router.get('/proveedores',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.listarProveedores),
    InventarioController.listarProveedores
);

/**
 * PUT /api/v1/inventario/proveedores/:id
 * Actualizar proveedor
 */
router.put('/proveedores/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    verificarPermiso('inventario.editar_proveedores'),
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.actualizarProveedor),
    InventarioController.actualizarProveedor
);

/**
 * DELETE /api/v1/inventario/proveedores/:id
 * Eliminar proveedor (soft delete)
 */
router.delete('/proveedores/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    verificarPermiso('inventario.eliminar_proveedores'),
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    InventarioController.eliminarProveedor
);

module.exports = router;

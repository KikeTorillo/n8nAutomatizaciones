/**
 * ====================================================================
 * ROUTES - UBICACIONES DE ALMACEN (WMS)
 * ====================================================================
 * Sistema jerarquico: zona -> pasillo -> estante -> bin
 */

const express = require('express');
const InventarioController = require('../controllers');
const { auth, tenant, rateLimiting, validation, modules } = require('../../../middleware');
const inventarioSchemas = require('../schemas/inventario.schemas');

const router = express.Router();
const validate = validation.validate;

/**
 * POST /api/v1/inventario/ubicaciones
 * Crear nueva ubicacion de almacen
 */
router.post('/ubicaciones',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.crearUbicacion),
    InventarioController.crearUbicacion
);

/**
 * POST /api/v1/inventario/ubicaciones/mover-stock
 * Mover stock entre ubicaciones
 */
router.post('/ubicaciones/mover-stock',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.moverStockUbicacion),
    InventarioController.moverStockUbicacion
);

/**
 * GET /api/v1/inventario/ubicaciones/arbol/:sucursalId
 * Obtener arbol jerarquico de ubicaciones de una sucursal
 */
router.get('/ubicaciones/arbol/:sucursalId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.obtenerArbolUbicaciones),
    InventarioController.obtenerArbolUbicaciones
);

/**
 * GET /api/v1/inventario/ubicaciones/disponibles/:sucursalId
 * Obtener ubicaciones disponibles para almacenar en una sucursal
 */
router.get('/ubicaciones/disponibles/:sucursalId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.obtenerUbicacionesDisponibles),
    InventarioController.obtenerUbicacionesDisponibles
);

/**
 * GET /api/v1/inventario/ubicaciones/estadisticas/:sucursalId
 * Obtener estadisticas de uso de ubicaciones de una sucursal
 */
router.get('/ubicaciones/estadisticas/:sucursalId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.obtenerEstadisticasUbicaciones),
    InventarioController.obtenerEstadisticasUbicaciones
);

/**
 * GET /api/v1/inventario/ubicaciones/:id
 * Obtener ubicacion por ID
 */
router.get('/ubicaciones/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    InventarioController.obtenerUbicacionPorId
);

/**
 * GET /api/v1/inventario/ubicaciones/:id/stock
 * Obtener productos almacenados en una ubicacion
 */
router.get('/ubicaciones/:id/stock',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    InventarioController.obtenerStockUbicacion
);

/**
 * GET /api/v1/inventario/ubicaciones
 * Listar ubicaciones con filtros
 */
router.get('/ubicaciones',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.listarUbicaciones),
    InventarioController.listarUbicaciones
);

/**
 * PUT /api/v1/inventario/ubicaciones/:id
 * Actualizar ubicacion
 */
router.put('/ubicaciones/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.actualizarUbicacion),
    InventarioController.actualizarUbicacion
);

/**
 * PATCH /api/v1/inventario/ubicaciones/:id/bloquear
 * Bloquear/Desbloquear ubicacion
 */
router.patch('/ubicaciones/:id/bloquear',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.toggleBloqueoUbicacion),
    InventarioController.toggleBloqueoUbicacion
);

/**
 * POST /api/v1/inventario/ubicaciones/:id/stock
 * Agregar stock a una ubicacion
 */
router.post('/ubicaciones/:id/stock',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.agregarStockUbicacion),
    InventarioController.agregarStockUbicacion
);

/**
 * DELETE /api/v1/inventario/ubicaciones/:id
 * Eliminar ubicacion (solo si no tiene stock ni sub-ubicaciones)
 */
router.delete('/ubicaciones/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    InventarioController.eliminarUbicacion
);

/**
 * GET /api/v1/inventario/productos/:productoId/ubicaciones
 * Obtener ubicaciones donde esta almacenado un producto
 */
router.get('/productos/:productoId/ubicaciones',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    InventarioController.obtenerUbicacionesProducto
);

module.exports = router;

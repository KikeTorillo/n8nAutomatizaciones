/**
 * ====================================================================
 * ROUTES - PRODUCTOS
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
 * POST /api/v1/inventario/productos
 * Crear nuevo producto
 */
router.post('/productos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    verificarPermiso('inventario.crear_productos'),
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.crearProducto),
    InventarioController.crearProducto
);

/**
 * POST /api/v1/inventario/productos/bulk
 * Crear multiples productos (1-50)
 * CRITICO: Pre-valida limites antes de crear
 */
router.post('/productos/bulk',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    verificarPermiso('inventario.crear_productos'),
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.bulkCrearProductos),
    InventarioController.bulkCrearProductos
);

/**
 * GET /api/v1/inventario/productos/buscar
 * Busqueda avanzada de productos (full-text + codigo de barras)
 * Query params: q, tipo_busqueda, categoria_id, proveedor_id, solo_activos, solo_con_stock, limit
 */
router.get('/productos/buscar',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.buscarProductos),
    InventarioController.buscarProductos
);

/**
 * GET /api/v1/inventario/productos/stock-critico
 * Obtener productos con stock critico
 */
router.get('/productos/stock-critico',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.obtenerStockCritico),
    InventarioController.obtenerStockCritico
);

/**
 * GET /api/v1/inventario/productos/stock-filtrado
 * Listar productos con stock filtrado por ubicación/sucursal/usuario
 * Query params: ubicacion_id?, sucursal_id?, usuario_ubicacion?, solo_con_stock?, busqueda?, categoria_id?
 */
router.get('/productos/stock-filtrado',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.listarProductosStockFiltrado),
    InventarioController.listarConStockFiltrado
);

/**
 * POST /api/v1/inventario/productos/stock-disponible
 * Obtener stock disponible de multiples productos
 */
router.post('/productos/stock-disponible',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.stockDisponibleMultiple),
    InventarioController.stockDisponibleMultiple
);

/**
 * GET /api/v1/inventario/productos/:id
 * Obtener producto por ID
 */
router.get('/productos/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    InventarioController.obtenerProductoPorId
);

/**
 * GET /api/v1/inventario/productos
 * Listar productos con filtros
 */
router.get('/productos',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.listarProductos),
    InventarioController.listarProductos
);

/**
 * PUT /api/v1/inventario/productos/:id
 * Actualizar producto
 */
router.put('/productos/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    verificarPermiso('inventario.editar_productos'),
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.actualizarProducto),
    InventarioController.actualizarProducto
);

/**
 * PATCH /api/v1/inventario/productos/:id/stock
 * Ajustar stock manualmente (conteo fisico, correcciones)
 * Body: cantidad_ajuste, motivo, tipo_movimiento (entrada_ajuste | salida_ajuste)
 * IMPORTANTE: Registra movimiento de inventario automaticamente
 */
router.patch('/productos/:id/stock',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    verificarPermiso('inventario.ajustar_stock'),
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.ajustarStock),
    InventarioController.ajustarStockProducto
);

/**
 * GET /api/v1/inventario/productos/:id/stock-disponible
 * Obtener stock disponible de un producto (real - reservado)
 */
router.get('/productos/:id/stock-disponible',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.stockDisponible),
    InventarioController.stockDisponible
);

/**
 * GET /api/v1/inventario/productos/:id/stock-ubicaciones
 * Obtener stock de un producto desglosado por ubicación
 * Query params: sucursal_id?, usuario_id?
 */
router.get('/productos/:id/stock-ubicaciones',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.obtenerStockUbicaciones),
    InventarioController.obtenerStockPorUbicacion
);

/**
 * GET /api/v1/inventario/productos/:id/mi-stock
 * Obtener stock de un producto en la ubicación del usuario actual
 */
router.get('/productos/:id/mi-stock',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    InventarioController.obtenerMiStock
);

/**
 * GET /api/v1/inventario/productos/:id/verificar-disponibilidad
 * Verificar si hay stock suficiente para una cantidad
 */
router.get('/productos/:id/verificar-disponibilidad',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.verificarDisponibilidad),
    InventarioController.verificarDisponibilidad
);

/**
 * DELETE /api/v1/inventario/productos/:id
 * Eliminar producto (soft delete)
 */
router.delete('/productos/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    verificarPermiso('inventario.eliminar_productos'),
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    InventarioController.eliminarProducto
);

module.exports = router;

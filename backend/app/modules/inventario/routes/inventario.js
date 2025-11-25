/**
 * ====================================================================
 * ROUTES - INVENTARIO
 * ====================================================================
 *
 * Rutas para gestión de inventario:
 * - Categorías de productos
 * - Proveedores
 * - Productos
 * - Movimientos de inventario
 * - Alertas de stock
 */

const express = require('express');
const InventarioController = require('../controllers');
const { auth, tenant, rateLimiting, validation, subscription, modules } = require('../../../middleware');
const inventarioSchemas = require('../schemas/inventario.schemas');

const router = express.Router();
const validate = validation.validate;

// ===================================================================
// CATEGORÍAS DE PRODUCTOS
// ===================================================================

/**
 * POST /api/v1/inventario/categorias
 * Crear nueva categoría de producto
 */
router.post('/categorias',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    subscription.checkActiveSubscription,
    subscription.checkResourceLimit('categorias_productos'),
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.crearCategoria),
    InventarioController.crearCategoria
);

/**
 * GET /api/v1/inventario/categorias/arbol
 * Obtener árbol jerárquico de categorías
 */
router.get('/categorias/arbol',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    InventarioController.obtenerArbolCategorias
);

/**
 * GET /api/v1/inventario/categorias/:id
 * Obtener categoría por ID
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
 * Listar categorías con filtros
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
 * Actualizar categoría
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
 * Eliminar categoría (soft delete)
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

// ===================================================================
// PROVEEDORES
// ===================================================================

/**
 * POST /api/v1/inventario/proveedores
 * Crear nuevo proveedor
 */
router.post('/proveedores',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    subscription.checkActiveSubscription,
    subscription.checkResourceLimit('proveedores'),
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    InventarioController.eliminarProveedor
);

// ===================================================================
// PRODUCTOS
// ===================================================================

/**
 * POST /api/v1/inventario/productos
 * Crear nuevo producto
 */
router.post('/productos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    subscription.checkActiveSubscription,
    subscription.checkResourceLimit('productos'),
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.crearProducto),
    InventarioController.crearProducto
);

/**
 * POST /api/v1/inventario/productos/bulk
 * Crear múltiples productos (1-50)
 * CRÍTICO: Pre-valida límites antes de crear
 */
router.post('/productos/bulk',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    subscription.checkActiveSubscription,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.bulkCrearProductos),
    InventarioController.bulkCrearProductos
);

/**
 * GET /api/v1/inventario/productos/buscar
 * Búsqueda avanzada de productos (full-text + código de barras)
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
 * Obtener productos con stock crítico
 */
router.get('/productos/stock-critico',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    InventarioController.obtenerStockCritico
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
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.actualizarProducto),
    InventarioController.actualizarProducto
);

/**
 * PATCH /api/v1/inventario/productos/:id/stock
 * Ajustar stock manualmente (conteo físico, correcciones)
 * Body: cantidad_ajuste, motivo, tipo_movimiento (entrada_ajuste | salida_ajuste)
 * IMPORTANTE: Registra movimiento de inventario automáticamente
 */
router.patch('/productos/:id/stock',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    subscription.checkActiveSubscription,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.ajustarStock),
    InventarioController.ajustarStockProducto
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
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    InventarioController.eliminarProducto
);

// ===================================================================
// MOVIMIENTOS DE INVENTARIO
// ===================================================================

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
    subscription.checkActiveSubscription,
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.obtenerKardex),
    InventarioController.obtenerKardex
);

/**
 * GET /api/v1/inventario/movimientos/estadisticas
 * Obtener estadísticas de movimientos
 */
router.get('/movimientos/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.listarMovimientos),
    InventarioController.listarMovimientos
);

// ===================================================================
// ALERTAS DE INVENTARIO
// ===================================================================

/**
 * GET /api/v1/inventario/alertas/dashboard
 * Obtener dashboard de alertas
 */
router.get('/alertas/dashboard',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    InventarioController.obtenerDashboardAlertas
);

/**
 * PATCH /api/v1/inventario/alertas/marcar-varias-leidas
 * Marcar múltiples alertas como leídas
 */
router.patch('/alertas/marcar-varias-leidas',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    InventarioController.obtenerAlertaPorId
);

/**
 * PATCH /api/v1/inventario/alertas/:id/marcar-leida
 * Marcar alerta como leída
 */
router.patch('/alertas/:id/marcar-leida',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.listarAlertas),
    InventarioController.listarAlertas
);

// ===================================================================
// REPORTES Y ANALYTICS
// ===================================================================

/**
 * GET /api/v1/inventario/reportes/valor-inventario
 * Calcular valor total del inventario
 * Returns: total_productos, total_unidades, valor_compra, valor_venta, margen_potencial
 */
router.get('/reportes/valor-inventario',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    InventarioController.obtenerValorInventario
);

/**
 * GET /api/v1/inventario/reportes/analisis-abc
 * Análisis ABC de productos (clasificación Pareto)
 * Query params: fecha_desde, fecha_hasta, categoria_id (opcional)
 * Returns: Productos clasificados como A (80% ingresos), B (15%), C (5%)
 */
router.get('/reportes/analisis-abc',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.reporteAnalisisABC),
    InventarioController.obtenerAnalisisABC
);

/**
 * GET /api/v1/inventario/reportes/rotacion
 * Reporte de rotación de inventario
 * Query params: fecha_desde, fecha_hasta, categoria_id (opcional), top (default: 20)
 * Returns: Productos ordenados por días promedio de rotación
 */
router.get('/reportes/rotacion',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.reporteRotacion),
    InventarioController.obtenerRotacionInventario
);

/**
 * GET /api/v1/inventario/reportes/alertas
 * Resumen de alertas de inventario agrupadas por tipo y nivel
 * Returns: Totales por tipo_alerta y nivel (critical, warning, info)
 */
router.get('/reportes/alertas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    InventarioController.obtenerResumenAlertas
);

module.exports = router;

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
const RutasOperacionController = require('../controllers/rutas-operacion.controller');
const AtributosController = require('../controllers/atributos.controller');
const VariantesController = require('../controllers/variantes.controller');
const SnapshotsController = require('../controllers/snapshots.controller');
const ReordenController = require('../controllers/reorden.controller');
const LandedCostsController = require('../controllers/landed-costs.controller');
const DropshipController = require('../controllers/dropship.controller');
const OperacionesAlmacenController = require('../controllers/operaciones-almacen.controller');
const BatchPickingController = require('../controllers/batch-picking.controller');
const ConfiguracionAlmacenController = require('../controllers/configuracion-almacen.controller');
const PaquetesController = require('../controllers/paquetes.controller');
const ConsignaController = require('../controllers/consigna.controller');
const { auth, tenant, rateLimiting, validation, subscription, modules } = require('../../../middleware');
const { asyncHandler } = require('../../../middleware');
const inventarioSchemas = require('../schemas/inventario.schemas');
const variantesSchemas = require('../schemas/variantes.schemas');

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

// ===================================================================
// ÓRDENES DE COMPRA
// ===================================================================

/**
 * POST /api/v1/inventario/ordenes-compra
 * Crear nueva orden de compra (estado: borrador)
 * Body: proveedor_id, fecha_entrega_esperada?, items[]?
 */
router.post('/ordenes-compra',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.crearOrdenCompra),
    InventarioController.crearOrdenCompra
);

/**
 * GET /api/v1/inventario/ordenes-compra/pendientes
 * Obtener órdenes pendientes de recibir
 */
router.get('/ordenes-compra/pendientes',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    InventarioController.obtenerOrdenesCompraPendientes
);

/**
 * GET /api/v1/inventario/ordenes-compra/pendientes-pago
 * Obtener órdenes pendientes de pago
 */
router.get('/ordenes-compra/pendientes-pago',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    InventarioController.obtenerOrdenesCompraPendientesPago
);

/**
 * GET /api/v1/inventario/ordenes-compra/reportes/por-proveedor
 * Estadísticas de compras por proveedor
 */
router.get('/ordenes-compra/reportes/por-proveedor',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.estadisticasComprasPorProveedor),
    InventarioController.obtenerEstadisticasComprasPorProveedor
);

/**
 * GET /api/v1/inventario/ordenes-compra/sugerencias
 * Obtener productos sugeridos para generar OC (stock bajo)
 */
router.get('/ordenes-compra/sugerencias',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    InventarioController.obtenerSugerenciasOC
);

/**
 * POST /api/v1/inventario/ordenes-compra/auto-generar
 * Generar OCs automáticas para todos los productos con stock bajo
 */
router.post('/ordenes-compra/auto-generar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    InventarioController.autoGenerarOCs
);

/**
 * POST /api/v1/inventario/ordenes-compra/reabastecimiento-rutas
 * Generar reabastecimiento usando rutas de operación
 * Query: ?sucursal_id=X (opcional)
 */
router.post('/ordenes-compra/reabastecimiento-rutas',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    InventarioController.generarReabastecimientoConRutas
);

/**
 * POST /api/v1/inventario/ordenes-compra/generar-desde-producto/:productoId
 * Generar OC desde un producto específico con stock bajo
 */
router.post('/ordenes-compra/generar-desde-producto/:productoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.generarOCDesdeProducto),
    InventarioController.generarOCDesdeProducto
);

/**
 * GET /api/v1/inventario/ordenes-compra/:id
 * Obtener orden por ID con items y recepciones
 */
router.get('/ordenes-compra/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.obtenerOrdenCompraPorId),
    InventarioController.obtenerOrdenCompraPorId
);

/**
 * GET /api/v1/inventario/ordenes-compra
 * Listar órdenes con filtros
 */
router.get('/ordenes-compra',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.listarOrdenesCompra),
    InventarioController.listarOrdenesCompra
);

/**
 * PUT /api/v1/inventario/ordenes-compra/:id
 * Actualizar orden (solo borradores)
 */
router.put('/ordenes-compra/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.actualizarOrdenCompra),
    InventarioController.actualizarOrdenCompra
);

/**
 * DELETE /api/v1/inventario/ordenes-compra/:id
 * Eliminar orden (solo borradores)
 */
router.delete('/ordenes-compra/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.obtenerOrdenCompraPorId),
    InventarioController.eliminarOrdenCompra
);

/**
 * POST /api/v1/inventario/ordenes-compra/:id/items
 * Agregar items a orden
 */
router.post('/ordenes-compra/:id/items',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.agregarItemsOrdenCompra),
    InventarioController.agregarItemsOrdenCompra
);

/**
 * PUT /api/v1/inventario/ordenes-compra/:id/items/:itemId
 * Actualizar item de orden
 */
router.put('/ordenes-compra/:id/items/:itemId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.actualizarItemOrdenCompra),
    InventarioController.actualizarItemOrdenCompra
);

/**
 * DELETE /api/v1/inventario/ordenes-compra/:id/items/:itemId
 * Eliminar item de orden
 */
router.delete('/ordenes-compra/:id/items/:itemId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.eliminarItemOrdenCompra),
    InventarioController.eliminarItemOrdenCompra
);

/**
 * PATCH /api/v1/inventario/ordenes-compra/:id/enviar
 * Enviar orden al proveedor (borrador → enviada)
 */
router.patch('/ordenes-compra/:id/enviar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.enviarOrdenCompra),
    InventarioController.enviarOrdenCompra
);

/**
 * PATCH /api/v1/inventario/ordenes-compra/:id/cancelar
 * Cancelar orden
 */
router.patch('/ordenes-compra/:id/cancelar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.cancelarOrdenCompra),
    InventarioController.cancelarOrdenCompra
);

/**
 * POST /api/v1/inventario/ordenes-compra/:id/recibir
 * Recibir mercancía (parcial o total)
 * CRÍTICO: Actualiza stock y crea movimientos de inventario
 */
router.post('/ordenes-compra/:id/recibir',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.recibirMercanciaOrdenCompra),
    InventarioController.recibirMercanciaOrdenCompra
);

/**
 * POST /api/v1/inventario/ordenes-compra/:id/pago
 * Registrar pago de orden
 */
router.post('/ordenes-compra/:id/pago',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.registrarPagoOrdenCompra),
    InventarioController.registrarPagoOrdenCompra
);

// ===================================================================
// LANDED COSTS - Costos en Destino (Dic 2025)
// Agregar costos adicionales (flete, arancel, seguro) a OC
// ===================================================================

/**
 * GET /api/v1/inventario/ordenes-compra/:id/costos
 * Listar costos adicionales de una OC
 */
router.get('/ordenes-compra/:id/costos',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    asyncHandler(LandedCostsController.listarCostos)
);

/**
 * GET /api/v1/inventario/ordenes-compra/:id/costos/resumen
 * Obtener resumen de costos de una OC
 */
router.get('/ordenes-compra/:id/costos/resumen',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    asyncHandler(LandedCostsController.obtenerResumen)
);

/**
 * GET /api/v1/inventario/ordenes-compra/:id/costos/:costoId
 * Obtener un costo adicional por ID
 */
router.get('/ordenes-compra/:id/costos/:costoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
    asyncHandler(LandedCostsController.distribuirCosto)
);

/**
 * GET /api/v1/inventario/ordenes-compra/:id/costos/:costoId/distribucion
 * Obtener detalle de distribucion de un costo
 */
router.get('/ordenes-compra/:id/costos/:costoId/distribucion',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
    asyncHandler(LandedCostsController.distribuirTodos)
);

/**
 * GET /api/v1/inventario/ordenes-compra/:id/costos-por-items
 * Obtener costos totales desglosados por item
 */
router.get('/ordenes-compra/:id/costos-por-items',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    asyncHandler(LandedCostsController.obtenerCostosPorItems)
);

// ===================================================================
// RESERVAS DE STOCK (Dic 2025 - Fase 1 Gaps)
// Evita sobreventa en ventas concurrentes
// ===================================================================

/**
 * POST /api/v1/inventario/reservas
 * Crear nueva reserva de stock
 */
router.post('/reservas',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.crearReserva),
    InventarioController.crearReserva
);

/**
 * POST /api/v1/inventario/reservas/multiple
 * Crear múltiples reservas en una transacción
 */
router.post('/reservas/multiple',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.crearReservaMultiple),
    InventarioController.crearReservaMultiple
);

/**
 * POST /api/v1/inventario/reservas/confirmar-multiple
 * Confirmar múltiples reservas
 */
router.post('/reservas/confirmar-multiple',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.confirmarReservaMultiple),
    InventarioController.confirmarReservaMultiple
);

/**
 * GET /api/v1/inventario/reservas/:id
 * Obtener reserva por ID
 */
router.get('/reservas/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    InventarioController.obtenerReservaPorId
);

/**
 * GET /api/v1/inventario/reservas
 * Listar reservas con filtros
 */
router.get('/reservas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.listarReservas),
    InventarioController.listarReservas
);

/**
 * PATCH /api/v1/inventario/reservas/:id/confirmar
 * Confirmar reserva (descuenta stock real)
 */
router.patch('/reservas/:id/confirmar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.confirmarReserva),
    InventarioController.confirmarReserva
);

/**
 * PATCH /api/v1/inventario/reservas/:id/extender
 * Extender tiempo de expiración de una reserva
 */
router.patch('/reservas/:id/extender',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.extenderReserva),
    InventarioController.extenderReserva
);

/**
 * DELETE /api/v1/inventario/reservas/origen/:tipoOrigen/:origenId
 * Cancelar reservas por origen (ej: todas las de una venta)
 */
router.delete('/reservas/origen/:tipoOrigen/:origenId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.cancelarReservaPorOrigen),
    InventarioController.cancelarReservaPorOrigen
);

/**
 * DELETE /api/v1/inventario/reservas/:id
 * Cancelar reserva individual
 */
router.delete('/reservas/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.cancelarReserva),
    InventarioController.cancelarReserva
);

// ===================================================================
// STOCK DISPONIBLE (endpoints adicionales en productos)
// ===================================================================

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
 * POST /api/v1/inventario/productos/stock-disponible
 * Obtener stock disponible de múltiples productos
 */
router.post('/productos/stock-disponible',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.stockDisponibleMultiple),
    InventarioController.stockDisponibleMultiple
);

// ===================================================================
// UBICACIONES DE ALMACÉN - WMS (Dic 2025 - Fase 3 Gaps)
// Sistema jerárquico: zona → pasillo → estante → bin
// ===================================================================

/**
 * POST /api/v1/inventario/ubicaciones
 * Crear nueva ubicación de almacén
 */
router.post('/ubicaciones',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.moverStockUbicacion),
    InventarioController.moverStockUbicacion
);

/**
 * GET /api/v1/inventario/ubicaciones/arbol/:sucursalId
 * Obtener árbol jerárquico de ubicaciones de una sucursal
 */
router.get('/ubicaciones/arbol/:sucursalId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.obtenerUbicacionesDisponibles),
    InventarioController.obtenerUbicacionesDisponibles
);

/**
 * GET /api/v1/inventario/ubicaciones/estadisticas/:sucursalId
 * Obtener estadísticas de uso de ubicaciones de una sucursal
 */
router.get('/ubicaciones/estadisticas/:sucursalId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.obtenerEstadisticasUbicaciones),
    InventarioController.obtenerEstadisticasUbicaciones
);

/**
 * GET /api/v1/inventario/ubicaciones/:id
 * Obtener ubicación por ID
 */
router.get('/ubicaciones/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    InventarioController.obtenerUbicacionPorId
);

/**
 * GET /api/v1/inventario/ubicaciones/:id/stock
 * Obtener productos almacenados en una ubicación
 */
router.get('/ubicaciones/:id/stock',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.listarUbicaciones),
    InventarioController.listarUbicaciones
);

/**
 * PUT /api/v1/inventario/ubicaciones/:id
 * Actualizar ubicación
 */
router.put('/ubicaciones/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.actualizarUbicacion),
    InventarioController.actualizarUbicacion
);

/**
 * PATCH /api/v1/inventario/ubicaciones/:id/bloquear
 * Bloquear/Desbloquear ubicación
 */
router.patch('/ubicaciones/:id/bloquear',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.toggleBloqueoUbicacion),
    InventarioController.toggleBloqueoUbicacion
);

/**
 * POST /api/v1/inventario/ubicaciones/:id/stock
 * Agregar stock a una ubicación
 */
router.post('/ubicaciones/:id/stock',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.agregarStockUbicacion),
    InventarioController.agregarStockUbicacion
);

/**
 * DELETE /api/v1/inventario/ubicaciones/:id
 * Eliminar ubicación (solo si no tiene stock ni sub-ubicaciones)
 */
router.delete('/ubicaciones/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    InventarioController.eliminarUbicacion
);

/**
 * GET /api/v1/inventario/productos/:productoId/ubicaciones
 * Obtener ubicaciones donde está almacenado un producto
 */
router.get('/productos/:productoId/ubicaciones',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    InventarioController.obtenerUbicacionesProducto
);

// ===================================================================
// VALORACION DE INVENTARIO - FIFO/AVCO (Dic 2025 - Gap Alta Prioridad)
// Metodos contables de valoracion de inventario
// ===================================================================

const ValoracionController = require('../controllers/valoracion.controller');

/**
 * GET /api/v1/inventario/valoracion/configuracion
 * Obtener configuracion de valoracion de la organizacion
 */
router.get('/valoracion/configuracion',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    ValoracionController.obtenerConfiguracion
);

/**
 * PUT /api/v1/inventario/valoracion/configuracion
 * Actualizar metodo de valoracion preferido
 */
router.put('/valoracion/configuracion',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    ValoracionController.actualizarConfiguracion
);

/**
 * GET /api/v1/inventario/valoracion/resumen
 * Resumen comparativo de todos los metodos para dashboard
 */
router.get('/valoracion/resumen',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    ValoracionController.resumen
);

/**
 * GET /api/v1/inventario/valoracion/total
 * Valor total del inventario segun metodo seleccionado
 * Query params: metodo (fifo|avco|promedio), categoria_id, sucursal_id
 */
router.get('/valoracion/total',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    ValoracionController.valorTotal
);

/**
 * GET /api/v1/inventario/valoracion/comparativa
 * Comparar valoracion de todos los productos por los 3 metodos
 * Query params: producto_id (opcional, para un producto especifico)
 */
router.get('/valoracion/comparativa',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    ValoracionController.comparativa
);

/**
 * GET /api/v1/inventario/valoracion/reporte/categorias
 * Reporte de valoracion agrupado por categorias
 */
router.get('/valoracion/reporte/categorias',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    ValoracionController.reportePorCategorias
);

/**
 * GET /api/v1/inventario/valoracion/reporte/diferencias
 * Productos con mayor diferencia entre metodos
 * Query params: limite (default 10)
 */
router.get('/valoracion/reporte/diferencias',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    ValoracionController.reporteDiferencias
);

/**
 * GET /api/v1/inventario/valoracion/producto/:id
 * Valoracion detallada de un producto con todos los metodos
 */
router.get('/valoracion/producto/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    ValoracionController.valorProducto
);

/**
 * GET /api/v1/inventario/valoracion/producto/:id/fifo
 * Valoracion FIFO de un producto
 */
router.get('/valoracion/producto/:id/fifo',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    ValoracionController.valorFIFO
);

/**
 * GET /api/v1/inventario/valoracion/producto/:id/avco
 * Valoracion AVCO de un producto
 */
router.get('/valoracion/producto/:id/avco',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    ValoracionController.valorAVCO
);

/**
 * GET /api/v1/inventario/valoracion/producto/:id/capas
 * Capas de inventario FIFO detalladas con trazabilidad
 */
router.get('/valoracion/producto/:id/capas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    ValoracionController.capasProducto
);

// ===================================================================
// NUMEROS DE SERIE / LOTES (Dic 2025 - Gap Media Prioridad)
// Tracking individual de productos con trazabilidad completa
// ===================================================================

const NumerosSerieController = require('../controllers/numeros-serie.controller');

/**
 * GET /api/v1/inventario/numeros-serie/estadisticas
 * Estadísticas generales de números de serie
 */
router.get('/numeros-serie/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    NumerosSerieController.obtenerEstadisticas
);

/**
 * GET /api/v1/inventario/numeros-serie/buscar
 * Búsqueda rápida de números de serie
 * Query params: q (término de búsqueda)
 */
router.get('/numeros-serie/buscar',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    NumerosSerieController.buscar
);

/**
 * GET /api/v1/inventario/numeros-serie/proximos-vencer
 * Números de serie próximos a vencer
 * Query params: dias (default 30)
 */
router.get('/numeros-serie/proximos-vencer',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    NumerosSerieController.obtenerProximosVencer
);

/**
 * GET /api/v1/inventario/numeros-serie/alertas-vencimiento
 * Alertas de vencimiento con niveles de urgencia (vencido, crítico, urgente, próximo)
 * Query params: sucursal_id (opcional)
 */
router.get('/numeros-serie/alertas-vencimiento',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    NumerosSerieController.obtenerAlertasVencimiento
);

/**
 * GET /api/v1/inventario/numeros-serie/fefo/:productoId
 * Obtener NS para despacho usando estrategia FEFO (First Expired First Out)
 * Query params: cantidad (default 1), sucursal_id (opcional)
 */
router.get('/numeros-serie/fefo/:productoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    NumerosSerieController.obtenerParaDespachoFEFO
);

/**
 * POST /api/v1/inventario/numeros-serie/fefo/reservar
 * Reservar NS para despacho FEFO (usado en proceso de venta)
 * Body: { ns_ids: [1, 2, 3], referencia: "VENTA-123" }
 */
router.post('/numeros-serie/fefo/reservar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    NumerosSerieController.reservarParaDespachoFEFO
);

/**
 * GET /api/v1/inventario/numeros-serie/buscar-trazabilidad
 * Buscar NS por número o lote con trazabilidad resumida
 * Query params: q (término de búsqueda, min 2 chars)
 */
router.get('/numeros-serie/buscar-trazabilidad',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    NumerosSerieController.buscarConTrazabilidad
);

/**
 * GET /api/v1/inventario/numeros-serie/productos-con-serie
 * Productos que requieren número de serie
 */
router.get('/numeros-serie/productos-con-serie',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    NumerosSerieController.obtenerProductosConSerie
);

/**
 * GET /api/v1/inventario/numeros-serie/existe
 * Verificar si existe un número de serie
 * Query params: producto_id, numero_serie
 */
router.get('/numeros-serie/existe',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    NumerosSerieController.verificarExistencia
);

/**
 * POST /api/v1/inventario/numeros-serie/bulk
 * Crear múltiples números de serie (recepción masiva)
 */
router.post('/numeros-serie/bulk',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    NumerosSerieController.crearMultiple
);

/**
 * POST /api/v1/inventario/numeros-serie
 * Crear número de serie individual
 */
router.post('/numeros-serie',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    NumerosSerieController.crear
);

/**
 * GET /api/v1/inventario/numeros-serie/producto/:productoId/disponibles
 * Números de serie disponibles para un producto
 * Query params: sucursal_id (opcional)
 */
router.get('/numeros-serie/producto/:productoId/disponibles',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    NumerosSerieController.obtenerDisponibles
);

/**
 * GET /api/v1/inventario/numeros-serie/producto/:productoId/resumen
 * Resumen de números de serie por producto
 */
router.get('/numeros-serie/producto/:productoId/resumen',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    NumerosSerieController.obtenerResumenProducto
);

/**
 * GET /api/v1/inventario/numeros-serie/:id/historial
 * Historial de movimientos de un número de serie
 */
router.get('/numeros-serie/:id/historial',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    NumerosSerieController.obtenerHistorial
);

/**
 * GET /api/v1/inventario/numeros-serie/:id/trazabilidad
 * Trazabilidad completa: origen (upstream) → estado actual → destino (downstream)
 */
router.get('/numeros-serie/:id/trazabilidad',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    NumerosSerieController.obtenerTrazabilidad
);

/**
 * GET /api/v1/inventario/numeros-serie/:id/timeline
 * Timeline cronológico de todos los movimientos del NS
 */
router.get('/numeros-serie/:id/timeline',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    NumerosSerieController.obtenerTimeline
);

/**
 * POST /api/v1/inventario/numeros-serie/:id/vender
 * Marcar número de serie como vendido
 */
router.post('/numeros-serie/:id/vender',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    NumerosSerieController.vender
);

/**
 * POST /api/v1/inventario/numeros-serie/:id/transferir
 * Transferir número de serie entre sucursales/ubicaciones
 */
router.post('/numeros-serie/:id/transferir',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    NumerosSerieController.transferir
);

/**
 * POST /api/v1/inventario/numeros-serie/:id/devolver
 * Procesar devolución de cliente
 */
router.post('/numeros-serie/:id/devolver',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    NumerosSerieController.devolver
);

/**
 * POST /api/v1/inventario/numeros-serie/:id/defectuoso
 * Marcar como defectuoso
 */
router.post('/numeros-serie/:id/defectuoso',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    NumerosSerieController.marcarDefectuoso
);

/**
 * POST /api/v1/inventario/numeros-serie/:id/reservar
 * Reservar número de serie
 */
router.post('/numeros-serie/:id/reservar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    NumerosSerieController.reservar
);

/**
 * POST /api/v1/inventario/numeros-serie/:id/liberar
 * Liberar reserva de número de serie
 */
router.post('/numeros-serie/:id/liberar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    NumerosSerieController.liberarReserva
);

/**
 * PUT /api/v1/inventario/numeros-serie/:id/garantia
 * Actualizar información de garantía
 */
router.put('/numeros-serie/:id/garantia',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    NumerosSerieController.actualizarGarantia
);

/**
 * GET /api/v1/inventario/numeros-serie/:id
 * Obtener número de serie por ID
 */
router.get('/numeros-serie/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    NumerosSerieController.obtenerPorId
);

/**
 * GET /api/v1/inventario/numeros-serie
 * Listar números de serie con filtros
 */
router.get('/numeros-serie',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    NumerosSerieController.listar
);

// ===================================================================
// RUTAS DE OPERACIÓN
// ===================================================================

/**
 * POST /api/v1/inventario/rutas-operacion/init
 * Crear rutas por defecto para la organización
 */
router.post('/rutas-operacion/init',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    RutasOperacionController.crearRutasDefault
);

/**
 * GET /api/v1/inventario/rutas-operacion
 * Listar rutas de operación
 */
router.get('/rutas-operacion',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    RutasOperacionController.listarRutas
);

/**
 * POST /api/v1/inventario/rutas-operacion
 * Crear ruta de operación
 */
router.post('/rutas-operacion',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    RutasOperacionController.crearRuta
);

/**
 * GET /api/v1/inventario/rutas-operacion/:id
 * Obtener ruta por ID
 */
router.get('/rutas-operacion/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    RutasOperacionController.obtenerRuta
);

/**
 * PUT /api/v1/inventario/rutas-operacion/:id
 * Actualizar ruta
 */
router.put('/rutas-operacion/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    RutasOperacionController.actualizarRuta
);

/**
 * DELETE /api/v1/inventario/rutas-operacion/:id
 * Eliminar ruta
 */
router.delete('/rutas-operacion/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    RutasOperacionController.eliminarRuta
);

// ===================================================================
// PRODUCTOS-RUTAS
// ===================================================================

/**
 * GET /api/v1/inventario/productos/:productoId/rutas
 * Obtener rutas asignadas a un producto
 */
router.get('/productos/:productoId/rutas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    RutasOperacionController.obtenerRutasDeProducto
);

/**
 * POST /api/v1/inventario/productos/:productoId/rutas
 * Asignar ruta a producto
 */
router.post('/productos/:productoId/rutas',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    RutasOperacionController.asignarRutaAProducto
);

/**
 * DELETE /api/v1/inventario/productos/:productoId/rutas/:rutaId
 * Quitar ruta de producto
 */
router.delete('/productos/:productoId/rutas/:rutaId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    RutasOperacionController.quitarRutaDeProducto
);

/**
 * GET /api/v1/inventario/productos/:productoId/determinar-ruta
 * Determinar mejor ruta de reabastecimiento
 */
router.get('/productos/:productoId/determinar-ruta',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    RutasOperacionController.determinarRutaReabastecimiento
);

// ===================================================================
// REGLAS DE REABASTECIMIENTO
// ===================================================================

/**
 * GET /api/v1/inventario/reglas-reabastecimiento
 * Listar reglas de reabastecimiento
 */
router.get('/reglas-reabastecimiento',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    RutasOperacionController.listarReglas
);

/**
 * POST /api/v1/inventario/reglas-reabastecimiento
 * Crear regla de reabastecimiento
 */
router.post('/reglas-reabastecimiento',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    RutasOperacionController.crearRegla
);

/**
 * GET /api/v1/inventario/reglas-reabastecimiento/:id
 * Obtener regla por ID
 */
router.get('/reglas-reabastecimiento/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    RutasOperacionController.obtenerRegla
);

/**
 * PUT /api/v1/inventario/reglas-reabastecimiento/:id
 * Actualizar regla
 */
router.put('/reglas-reabastecimiento/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    RutasOperacionController.actualizarRegla
);

/**
 * DELETE /api/v1/inventario/reglas-reabastecimiento/:id
 * Eliminar regla
 */
router.delete('/reglas-reabastecimiento/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    RutasOperacionController.eliminarRegla
);

// ===================================================================
// TRANSFERENCIAS
// ===================================================================

/**
 * GET /api/v1/inventario/transferencias
 * Listar solicitudes de transferencia
 */
router.get('/transferencias',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    RutasOperacionController.listarSolicitudesTransferencia
);

/**
 * POST /api/v1/inventario/transferencias
 * Crear solicitud de transferencia
 */
router.post('/transferencias',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    RutasOperacionController.crearSolicitudTransferencia
);

/**
 * GET /api/v1/inventario/transferencias/:id
 * Obtener solicitud con items
 */
router.get('/transferencias/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    RutasOperacionController.obtenerSolicitudTransferencia
);

/**
 * POST /api/v1/inventario/transferencias/:id/aprobar
 * Aprobar solicitud de transferencia
 */
router.post('/transferencias/:id/aprobar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    RutasOperacionController.aprobarSolicitud
);

/**
 * POST /api/v1/inventario/transferencias/:id/rechazar
 * Rechazar solicitud de transferencia
 */
router.post('/transferencias/:id/rechazar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    RutasOperacionController.rechazarSolicitud
);

/**
 * POST /api/v1/inventario/transferencias/:id/enviar
 * Marcar transferencia como enviada
 */
router.post('/transferencias/:id/enviar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    RutasOperacionController.enviarTransferencia
);

/**
 * POST /api/v1/inventario/transferencias/:id/recibir
 * Marcar transferencia como recibida
 */
router.post('/transferencias/:id/recibir',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    RutasOperacionController.recibirTransferencia
);

// ===================================================================
// ATRIBUTOS DE PRODUCTO (Dic 2025 - Variantes)
// Tipos de atributos para variantes: Color, Talla, Material, etc.
// ===================================================================

/**
 * POST /api/v1/inventario/atributos/defecto
 * Crear atributos por defecto (Color, Talla)
 */
router.post('/atributos/defecto',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    AtributosController.crearDefecto
);

/**
 * POST /api/v1/inventario/atributos
 * Crear nuevo atributo
 */
router.post('/atributos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(variantesSchemas.crearAtributo),
    AtributosController.crear
);

/**
 * GET /api/v1/inventario/atributos
 * Listar atributos
 */
router.get('/atributos',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    AtributosController.listar
);

/**
 * GET /api/v1/inventario/atributos/:id
 * Obtener atributo con valores
 */
router.get('/atributos/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    AtributosController.obtenerPorId
);

/**
 * PUT /api/v1/inventario/atributos/:id
 * Actualizar atributo
 */
router.put('/atributos/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(variantesSchemas.actualizarAtributo),
    AtributosController.actualizar
);

/**
 * DELETE /api/v1/inventario/atributos/:id
 * Eliminar atributo
 */
router.delete('/atributos/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    AtributosController.eliminar
);

/**
 * POST /api/v1/inventario/atributos/:id/valores
 * Agregar valor a atributo
 */
router.post('/atributos/:id/valores',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(variantesSchemas.crearValor),
    AtributosController.agregarValor
);

/**
 * GET /api/v1/inventario/atributos/:id/valores
 * Obtener valores de un atributo
 */
router.get('/atributos/:id/valores',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    AtributosController.obtenerValores
);

/**
 * PUT /api/v1/inventario/valores/:valorId
 * Actualizar valor de atributo
 */
router.put('/valores/:valorId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(variantesSchemas.actualizarValor),
    AtributosController.actualizarValor
);

/**
 * DELETE /api/v1/inventario/valores/:valorId
 * Eliminar valor de atributo
 */
router.delete('/valores/:valorId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    AtributosController.eliminarValor
);

// ===================================================================
// VARIANTES DE PRODUCTO (Dic 2025 - Variantes)
// Combinaciones con stock y precios independientes
// ===================================================================

/**
 * GET /api/v1/inventario/variantes/buscar
 * Buscar variante por SKU o codigo de barras
 */
router.get('/variantes/buscar',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
    VariantesController.eliminar
);

/**
 * GET /api/v1/inventario/productos/:productoId/variantes
 * Listar variantes de un producto
 */
router.get('/productos/:productoId/variantes',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    VariantesController.listar
);

/**
 * GET /api/v1/inventario/productos/:productoId/variantes/resumen
 * Resumen de stock por variantes
 */
router.get('/productos/:productoId/variantes/resumen',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
    validate(variantesSchemas.generarVariantes),
    VariantesController.generar
);

// ===================================================================
// INVENTORY AT DATE - SNAPSHOTS (Dic 2025)
// Consulta historica del inventario en fechas pasadas
// ===================================================================

/**
 * GET /api/v1/inventario/snapshots/fechas
 * Obtener fechas disponibles para selector
 */
router.get('/snapshots/fechas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    asyncHandler(SnapshotsController.fechasDisponibles)
);

/**
 * GET /api/v1/inventario/snapshots/historico/:productoId
 * Obtener historico de stock de un producto para grafico de pronostico
 * @param productoId - ID del producto
 * @query dias - Dias de historico (default: 30)
 */
router.get('/snapshots/historico/:productoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    asyncHandler(SnapshotsController.historicoProducto)
);

/**
 * GET /api/v1/inventario/snapshots
 * Listar snapshots disponibles
 */
router.get('/snapshots',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    asyncHandler(SnapshotsController.listar)
);

/**
 * POST /api/v1/inventario/snapshots
 * Generar snapshot manualmente
 */
router.post('/snapshots',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    auth.requireRole(['super_admin', 'admin']),
    rateLimiting.apiRateLimit,
    asyncHandler(SnapshotsController.generar)
);

/**
 * GET /api/v1/inventario/at-date
 * Consultar stock en fecha especifica
 * @query fecha - Fecha en formato YYYY-MM-DD (requerido)
 * @query producto_id - Filtrar por producto (opcional)
 * @query categoria_id - Filtrar por categoria (opcional)
 * @query solo_con_stock - Solo productos con stock > 0 (opcional)
 */
router.get('/at-date',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    asyncHandler(SnapshotsController.stockEnFecha)
);

/**
 * GET /api/v1/inventario/comparar
 * Comparar inventario entre dos fechas
 * @query fecha_desde - Fecha inicial (requerido)
 * @query fecha_hasta - Fecha final (requerido)
 * @query solo_cambios - Solo productos con cambios (default: true)
 */
router.get('/comparar',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    asyncHandler(SnapshotsController.comparar)
);

// ===================================================================
// CONTEOS DE INVENTARIO - CONTEO FÍSICO (Dic 2025)
// Verificación física del stock con ajustes automáticos
// ===================================================================

const ConteosController = require('../controllers/conteos.controller');
const AjustesMasivosController = require('../controllers/ajustes-masivos.controller');

/**
 * GET /api/v1/inventario/conteos/estadisticas
 * Estadísticas de conteos por período
 */
router.get('/conteos/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.estadisticasConteos),
    ConteosController.obtenerEstadisticas
);

/**
 * POST /api/v1/inventario/conteos
 * Crear nuevo conteo de inventario
 */
router.post('/conteos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.crearConteo),
    ConteosController.crear
);

/**
 * GET /api/v1/inventario/conteos/:id/buscar-item
 * Buscar item por código de barras o SKU
 */
router.get('/conteos/:id/buscar-item',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.buscarItemConteo),
    ConteosController.buscarItem
);

/**
 * GET /api/v1/inventario/conteos/:id
 * Obtener conteo por ID con items
 */
router.get('/conteos/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.obtenerConteoPorId),
    ConteosController.obtenerPorId
);

/**
 * GET /api/v1/inventario/conteos
 * Listar conteos con filtros
 */
router.get('/conteos',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.listarConteos),
    ConteosController.listar
);

/**
 * POST /api/v1/inventario/conteos/:id/iniciar
 * Iniciar conteo (genera items y cambia a en_proceso)
 */
router.post('/conteos/:id/iniciar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.iniciarConteo),
    ConteosController.iniciar
);

/**
 * PUT /api/v1/inventario/conteos/items/:itemId
 * Registrar cantidad contada para un item
 */
router.put('/conteos/items/:itemId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.registrarConteoItem),
    ConteosController.registrarConteo
);

/**
 * POST /api/v1/inventario/conteos/:id/completar
 * Completar conteo (validar que todos estén contados)
 */
router.post('/conteos/:id/completar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.completarConteo),
    ConteosController.completar
);

/**
 * POST /api/v1/inventario/conteos/:id/aplicar-ajustes
 * Aplicar ajustes de inventario basados en el conteo
 */
router.post('/conteos/:id/aplicar-ajustes',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.aplicarAjustesConteo),
    ConteosController.aplicarAjustes
);

/**
 * POST /api/v1/inventario/conteos/:id/cancelar
 * Cancelar conteo
 */
router.post('/conteos/:id/cancelar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.cancelarConteo),
    ConteosController.cancelar
);

// ===================================================================
// AJUSTES MASIVOS DE INVENTARIO (Dic 2025)
// Importación masiva de ajustes via CSV
// ===================================================================

/**
 * GET /api/v1/inventario/ajustes-masivos/plantilla
 * Descargar plantilla CSV
 */
router.get('/ajustes-masivos/plantilla',
    auth.authenticateToken,
    AjustesMasivosController.descargarPlantilla
);

/**
 * POST /api/v1/inventario/ajustes-masivos
 * Crear ajuste masivo desde items parseados
 */
router.post('/ajustes-masivos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.crearAjusteMasivo),
    AjustesMasivosController.crear
);

/**
 * GET /api/v1/inventario/ajustes-masivos
 * Listar ajustes masivos con filtros
 */
router.get('/ajustes-masivos',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.listarAjustesMasivos),
    AjustesMasivosController.listar
);

/**
 * GET /api/v1/inventario/ajustes-masivos/:id
 * Obtener ajuste masivo por ID
 */
router.get('/ajustes-masivos/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.obtenerAjusteMasivo),
    AjustesMasivosController.obtenerPorId
);

/**
 * POST /api/v1/inventario/ajustes-masivos/:id/validar
 * Validar items del ajuste masivo
 */
router.post('/ajustes-masivos/:id/validar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.validarAjusteMasivo),
    AjustesMasivosController.validar
);

/**
 * POST /api/v1/inventario/ajustes-masivos/:id/aplicar
 * Aplicar ajustes de inventario
 */
router.post('/ajustes-masivos/:id/aplicar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.heavyOperationRateLimit,
    validate(inventarioSchemas.aplicarAjusteMasivo),
    AjustesMasivosController.aplicar
);

/**
 * DELETE /api/v1/inventario/ajustes-masivos/:id
 * Cancelar/eliminar ajuste masivo
 */
router.delete('/ajustes-masivos/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.cancelarAjusteMasivo),
    AjustesMasivosController.cancelar
);

// ===================================================================
// REORDEN AUTOMATICO (Dic 2025)
// ===================================================================

/**
 * GET /api/v1/inventario/reorden/dashboard
 * Obtener metricas del dashboard de reorden
 */
router.get('/reorden/dashboard',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    ReordenController.obtenerDashboard
);

/**
 * GET /api/v1/inventario/reorden/productos-bajo-minimo
 * Listar productos que necesitan reabastecimiento
 */
router.get('/reorden/productos-bajo-minimo',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.listarProductosBajoMinimo),
    ReordenController.productosBajoMinimo
);

/**
 * GET /api/v1/inventario/reorden/rutas
 * Listar rutas de operacion disponibles
 */
router.get('/reorden/rutas',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    ReordenController.listarRutas
);

/**
 * GET /api/v1/inventario/reorden/reglas
 * Listar reglas de reabastecimiento
 */
router.get('/reorden/reglas',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.listarReglasReorden),
    ReordenController.listarReglas
);

/**
 * GET /api/v1/inventario/reorden/reglas/:id
 * Obtener regla por ID
 */
router.get('/reorden/reglas/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    ReordenController.obtenerRegla
);

/**
 * POST /api/v1/inventario/reorden/reglas
 * Crear nueva regla de reabastecimiento
 */
router.post('/reorden/reglas',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.crearReglaReorden),
    ReordenController.crearRegla
);

/**
 * PUT /api/v1/inventario/reorden/reglas/:id
 * Actualizar regla de reabastecimiento
 */
router.put('/reorden/reglas/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.actualizarReglaReorden),
    ReordenController.actualizarRegla
);

/**
 * DELETE /api/v1/inventario/reorden/reglas/:id
 * Eliminar regla de reabastecimiento
 */
router.delete('/reorden/reglas/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    ReordenController.eliminarRegla
);

/**
 * POST /api/v1/inventario/reorden/ejecutar
 * Ejecutar evaluacion de reorden manualmente
 */
router.post('/reorden/ejecutar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.heavyOperationRateLimit,
    ReordenController.ejecutarManual
);

/**
 * GET /api/v1/inventario/reorden/logs
 * Listar historial de ejecuciones de reorden
 */
router.get('/reorden/logs',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.listarLogsReorden),
    ReordenController.listarLogs
);

/**
 * GET /api/v1/inventario/reorden/logs/:id
 * Obtener detalle de un log de ejecucion
 */
router.get('/reorden/logs/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    ReordenController.obtenerLog
);

// ===================================================================
// DROPSHIPPING (Dic 2025)
// Flujo: Venta dropship -> OC automatica -> Proveedor envia a cliente
// ===================================================================

/**
 * GET /api/v1/inventario/dropship/estadisticas
 * Obtener estadisticas de dropship
 */
router.get('/dropship/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
    DropshipController.cancelar
);

// ===================================================================
// OPERACIONES DE ALMACEN - Rutas Multietapa (Dic 2025)
// Sistema multi-paso: Recepcion -> QC -> Almacenamiento | Picking -> Empaque -> Envio
// ===================================================================

/**
 * GET /api/v1/inventario/operaciones
 * Listar operaciones con filtros
 */
router.get('/operaciones',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    OperacionesAlmacenController.listar
);

/**
 * GET /api/v1/inventario/operaciones/pendientes/:sucursalId
 * Obtener operaciones pendientes de una sucursal
 */
router.get('/operaciones/pendientes/:sucursalId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    OperacionesAlmacenController.obtenerPendientes
);

/**
 * GET /api/v1/inventario/operaciones/estadisticas/:sucursalId
 * Obtener estadisticas por tipo
 */
router.get('/operaciones/estadisticas/:sucursalId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    OperacionesAlmacenController.obtenerEstadisticas
);

/**
 * GET /api/v1/inventario/operaciones/kanban/:sucursalId
 * Obtener resumen para vista Kanban
 */
router.get('/operaciones/kanban/:sucursalId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    OperacionesAlmacenController.obtenerResumenKanban
);

/**
 * GET /api/v1/inventario/operaciones/:id
 * Obtener operacion con items
 */
router.get('/operaciones/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    OperacionesAlmacenController.obtenerPorId
);

/**
 * GET /api/v1/inventario/operaciones/:id/cadena
 * Obtener cadena completa de operaciones (multi-step)
 */
router.get('/operaciones/:id/cadena',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    OperacionesAlmacenController.obtenerCadena
);

/**
 * POST /api/v1/inventario/operaciones
 * Crear operacion manual
 */
router.post('/operaciones',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    OperacionesAlmacenController.crear
);

/**
 * PUT /api/v1/inventario/operaciones/:id
 * Actualizar operacion
 */
router.put('/operaciones/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    OperacionesAlmacenController.actualizar
);

/**
 * POST /api/v1/inventario/operaciones/:id/asignar
 * Asignar operacion a usuario
 */
router.post('/operaciones/:id/asignar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    OperacionesAlmacenController.asignar
);

/**
 * POST /api/v1/inventario/operaciones/:id/iniciar
 * Iniciar procesamiento de operacion
 */
router.post('/operaciones/:id/iniciar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    OperacionesAlmacenController.iniciar
);

/**
 * POST /api/v1/inventario/operaciones/:id/completar
 * Completar operacion procesando items
 */
router.post('/operaciones/:id/completar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    OperacionesAlmacenController.completar
);

/**
 * POST /api/v1/inventario/operaciones/:id/cancelar
 * Cancelar operacion
 */
router.post('/operaciones/:id/cancelar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    OperacionesAlmacenController.cancelar
);

/**
 * POST /api/v1/inventario/operaciones/items/:itemId/procesar
 * Procesar item individual
 */
router.post('/operaciones/items/:itemId/procesar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    OperacionesAlmacenController.procesarItem
);

/**
 * POST /api/v1/inventario/operaciones/items/:itemId/cancelar
 * Cancelar item
 */
router.post('/operaciones/items/:itemId/cancelar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    OperacionesAlmacenController.cancelarItem
);

// ===================================================================
// BATCH PICKING - Wave Picking (Dic 2025)
// Agrupacion de operaciones de picking para procesamiento consolidado
// ===================================================================

/**
 * GET /api/v1/inventario/batch-picking
 * Listar batches con filtros
 */
router.get('/batch-picking',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    BatchPickingController.listar
);

/**
 * GET /api/v1/inventario/batch-picking/pendientes/:sucursalId
 * Obtener batches pendientes de una sucursal
 */
router.get('/batch-picking/pendientes/:sucursalId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    BatchPickingController.obtenerPendientes
);

/**
 * GET /api/v1/inventario/batch-picking/operaciones-disponibles/:sucursalId
 * Obtener operaciones de picking disponibles para batch
 */
router.get('/batch-picking/operaciones-disponibles/:sucursalId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    BatchPickingController.obtenerOperacionesDisponibles
);

/**
 * GET /api/v1/inventario/batch-picking/:id
 * Obtener batch con operaciones
 */
router.get('/batch-picking/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    BatchPickingController.obtenerPorId
);

/**
 * GET /api/v1/inventario/batch-picking/:id/lista-consolidada
 * Obtener lista consolidada de productos a recoger
 */
router.get('/batch-picking/:id/lista-consolidada',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    BatchPickingController.obtenerListaConsolidada
);

/**
 * GET /api/v1/inventario/batch-picking/:id/estadisticas
 * Obtener estadisticas del batch
 */
router.get('/batch-picking/:id/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    BatchPickingController.obtenerEstadisticas
);

/**
 * POST /api/v1/inventario/batch-picking
 * Crear batch de picking
 */
router.post('/batch-picking',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    BatchPickingController.crear
);

/**
 * PUT /api/v1/inventario/batch-picking/:id
 * Actualizar batch
 */
router.put('/batch-picking/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    BatchPickingController.actualizar
);

/**
 * DELETE /api/v1/inventario/batch-picking/:id
 * Eliminar batch (solo si esta en borrador)
 */
router.delete('/batch-picking/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    BatchPickingController.eliminar
);

/**
 * POST /api/v1/inventario/batch-picking/:id/operaciones
 * Agregar operacion al batch
 */
router.post('/batch-picking/:id/operaciones',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    BatchPickingController.agregarOperacion
);

/**
 * DELETE /api/v1/inventario/batch-picking/:id/operaciones/:operacionId
 * Quitar operacion del batch
 */
router.delete('/batch-picking/:id/operaciones/:operacionId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    BatchPickingController.quitarOperacion
);

/**
 * POST /api/v1/inventario/batch-picking/:id/iniciar
 * Iniciar procesamiento del batch
 */
router.post('/batch-picking/:id/iniciar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    BatchPickingController.iniciar
);

/**
 * POST /api/v1/inventario/batch-picking/:id/procesar-item
 * Procesar item del batch
 */
router.post('/batch-picking/:id/procesar-item',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    BatchPickingController.procesarItem
);

/**
 * POST /api/v1/inventario/batch-picking/:id/completar
 * Completar batch
 */
router.post('/batch-picking/:id/completar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    BatchPickingController.completar
);

/**
 * POST /api/v1/inventario/batch-picking/:id/cancelar
 * Cancelar batch
 */
router.post('/batch-picking/:id/cancelar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    BatchPickingController.cancelar
);

// ===================================================================
// CONFIGURACION DE ALMACEN - Pasos de Recepcion/Envio (Dic 2025)
// Configurar rutas multi-paso por sucursal
// ===================================================================

/**
 * GET /api/v1/inventario/configuracion-almacen
 * Listar configuraciones de todas las sucursales
 */
router.get('/configuracion-almacen',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    ConfiguracionAlmacenController.listar
);

/**
 * GET /api/v1/inventario/configuracion-almacen/descripciones-pasos
 * Obtener descripciones de todos los pasos disponibles
 */
router.get('/configuracion-almacen/descripciones-pasos',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    ConfiguracionAlmacenController.obtenerDescripcionesPasos
);

/**
 * GET /api/v1/inventario/configuracion-almacen/:sucursalId
 * Obtener configuracion por sucursal
 */
router.get('/configuracion-almacen/:sucursalId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    ConfiguracionAlmacenController.obtenerPorSucursal
);

/**
 * GET /api/v1/inventario/configuracion-almacen/:sucursalId/usa-multietapa
 * Verificar si la sucursal usa rutas multietapa
 */
router.get('/configuracion-almacen/:sucursalId/usa-multietapa',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    ConfiguracionAlmacenController.verificarMultietapa
);

/**
 * PUT /api/v1/inventario/configuracion-almacen/:sucursalId
 * Actualizar configuracion
 */
router.put('/configuracion-almacen/:sucursalId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    ConfiguracionAlmacenController.actualizar
);

/**
 * POST /api/v1/inventario/configuracion-almacen/:sucursalId/crear-ubicaciones
 * Crear ubicaciones por defecto para rutas multietapa
 */
router.post('/configuracion-almacen/:sucursalId/crear-ubicaciones',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    ConfiguracionAlmacenController.crearUbicacionesDefault
);

// ===================================================================
// PAQUETES DE ENVIO (Dic 2025)
// ===================================================================

/**
 * POST /api/v1/inventario/operaciones/:operacionId/paquetes
 * Crear paquete para operacion de empaque
 */
router.post('/operaciones/:operacionId/paquetes',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.crearPaquete),
    PaquetesController.crear
);

/**
 * GET /api/v1/inventario/operaciones/:operacionId/paquetes
 * Listar paquetes de una operacion
 */
router.get('/operaciones/:operacionId/paquetes',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    PaquetesController.listar
);

/**
 * GET /api/v1/inventario/operaciones/:operacionId/items-disponibles
 * Items disponibles para empacar
 */
router.get('/operaciones/:operacionId/items-disponibles',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    PaquetesController.itemsDisponibles
);

/**
 * GET /api/v1/inventario/operaciones/:operacionId/resumen-empaque
 * Resumen de empaque de la operacion
 */
router.get('/operaciones/:operacionId/resumen-empaque',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    PaquetesController.resumenEmpaque
);

/**
 * GET /api/v1/inventario/paquetes/:id
 * Obtener paquete por ID
 */
router.get('/paquetes/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    PaquetesController.obtener
);

/**
 * PUT /api/v1/inventario/paquetes/:id
 * Actualizar dimensiones/peso del paquete
 */
router.put('/paquetes/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.actualizarPaquete),
    PaquetesController.actualizar
);

/**
 * POST /api/v1/inventario/paquetes/:id/items
 * Agregar item al paquete
 */
router.post('/paquetes/:id/items',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.agregarItemPaquete),
    PaquetesController.agregarItem
);

/**
 * DELETE /api/v1/inventario/paquetes/:id/items/:itemId
 * Remover item del paquete
 */
router.delete('/paquetes/:id/items/:itemId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    PaquetesController.removerItem
);

/**
 * POST /api/v1/inventario/paquetes/:id/cerrar
 * Cerrar paquete
 */
router.post('/paquetes/:id/cerrar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    PaquetesController.cerrar
);

/**
 * POST /api/v1/inventario/paquetes/:id/cancelar
 * Cancelar paquete
 */
router.post('/paquetes/:id/cancelar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.cancelarPaquete),
    PaquetesController.cancelar
);

/**
 * POST /api/v1/inventario/paquetes/:id/etiquetar
 * Marcar paquete como etiquetado
 */
router.post('/paquetes/:id/etiquetar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.etiquetarPaquete),
    PaquetesController.etiquetar
);

/**
 * POST /api/v1/inventario/paquetes/:id/enviar
 * Marcar paquete como enviado
 */
router.post('/paquetes/:id/enviar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    PaquetesController.enviar
);

/**
 * GET /api/v1/inventario/paquetes/:id/etiqueta
 * Generar datos de etiqueta del paquete
 */
router.get('/paquetes/:id/etiqueta',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    PaquetesController.generarEtiqueta
);

// ===================================================================
// CONSIGNA - Inventario en Consignacion (Dic 2025)
// ===================================================================

// --- ACUERDOS DE CONSIGNA ---

/**
 * POST /api/v1/inventario/consigna/acuerdos
 * Crear nuevo acuerdo de consignacion
 */
router.post('/consigna/acuerdos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.crearAcuerdoConsigna),
    ConsignaController.crearAcuerdo
);

/**
 * GET /api/v1/inventario/consigna/acuerdos
 * Listar acuerdos de consignacion
 */
router.get('/consigna/acuerdos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    ConsignaController.listarAcuerdos
);

/**
 * GET /api/v1/inventario/consigna/acuerdos/:id
 * Obtener acuerdo por ID
 */
router.get('/consigna/acuerdos/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    ConsignaController.obtenerAcuerdo
);

/**
 * PUT /api/v1/inventario/consigna/acuerdos/:id
 * Actualizar acuerdo
 */
router.put('/consigna/acuerdos/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.actualizarAcuerdoConsigna),
    ConsignaController.actualizarAcuerdo
);

/**
 * POST /api/v1/inventario/consigna/acuerdos/:id/activar
 * Activar acuerdo
 */
router.post('/consigna/acuerdos/:id/activar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    ConsignaController.activarAcuerdo
);

/**
 * POST /api/v1/inventario/consigna/acuerdos/:id/pausar
 * Pausar acuerdo
 */
router.post('/consigna/acuerdos/:id/pausar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    ConsignaController.pausarAcuerdo
);

/**
 * POST /api/v1/inventario/consigna/acuerdos/:id/terminar
 * Terminar acuerdo
 */
router.post('/consigna/acuerdos/:id/terminar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    ConsignaController.terminarAcuerdo
);

// --- PRODUCTOS DEL ACUERDO ---

/**
 * POST /api/v1/inventario/consigna/acuerdos/:id/productos
 * Agregar producto al acuerdo
 */
router.post('/consigna/acuerdos/:id/productos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.agregarProductoConsigna),
    ConsignaController.agregarProducto
);

/**
 * GET /api/v1/inventario/consigna/acuerdos/:id/productos
 * Listar productos del acuerdo
 */
router.get('/consigna/acuerdos/:id/productos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    ConsignaController.listarProductos
);

/**
 * PUT /api/v1/inventario/consigna/acuerdos/:id/productos/:productoId
 * Actualizar producto del acuerdo
 */
router.put('/consigna/acuerdos/:id/productos/:productoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.actualizarProductoConsigna),
    ConsignaController.actualizarProducto
);

/**
 * DELETE /api/v1/inventario/consigna/acuerdos/:id/productos/:productoId
 * Remover producto del acuerdo
 */
router.delete('/consigna/acuerdos/:id/productos/:productoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    ConsignaController.removerProducto
);

// --- STOCK CONSIGNA ---

/**
 * POST /api/v1/inventario/consigna/acuerdos/:id/recibir
 * Recibir mercancia en consignacion
 */
router.post('/consigna/acuerdos/:id/recibir',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.recibirMercanciaConsigna),
    ConsignaController.recibirMercancia
);

/**
 * GET /api/v1/inventario/consigna/stock
 * Consultar stock en consignacion
 */
router.get('/consigna/stock',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    ConsignaController.consultarStock
);

/**
 * POST /api/v1/inventario/consigna/stock/:id/ajuste
 * Ajustar stock consigna
 */
router.post('/consigna/stock/:id/ajuste',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.ajustarStockConsigna),
    ConsignaController.ajustarStock
);

/**
 * POST /api/v1/inventario/consigna/acuerdos/:id/devolver
 * Devolver mercancia al proveedor
 */
router.post('/consigna/acuerdos/:id/devolver',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.devolverMercanciaConsigna),
    ConsignaController.devolverMercancia
);

// --- LIQUIDACIONES ---

/**
 * POST /api/v1/inventario/consigna/liquidaciones
 * Generar liquidacion
 */
router.post('/consigna/liquidaciones',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.generarLiquidacion),
    ConsignaController.generarLiquidacion
);

/**
 * GET /api/v1/inventario/consigna/liquidaciones
 * Listar liquidaciones
 */
router.get('/consigna/liquidaciones',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    ConsignaController.listarLiquidaciones
);

/**
 * GET /api/v1/inventario/consigna/liquidaciones/:id
 * Obtener liquidacion con detalle
 */
router.get('/consigna/liquidaciones/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    ConsignaController.obtenerLiquidacion
);

/**
 * POST /api/v1/inventario/consigna/liquidaciones/:id/confirmar
 * Confirmar liquidacion
 */
router.post('/consigna/liquidaciones/:id/confirmar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    ConsignaController.confirmarLiquidacion
);

/**
 * POST /api/v1/inventario/consigna/liquidaciones/:id/pagar
 * Registrar pago de liquidacion
 */
router.post('/consigna/liquidaciones/:id/pagar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.pagarLiquidacion),
    ConsignaController.pagarLiquidacion
);

/**
 * DELETE /api/v1/inventario/consigna/liquidaciones/:id
 * Cancelar liquidacion
 */
router.delete('/consigna/liquidaciones/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    ConsignaController.cancelarLiquidacion
);

// --- REPORTES CONSIGNA ---

/**
 * GET /api/v1/inventario/consigna/reportes/stock
 * Reporte de stock consigna
 */
router.get('/consigna/reportes/stock',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    ConsignaController.reporteStock
);

/**
 * GET /api/v1/inventario/consigna/reportes/ventas
 * Reporte de ventas consigna
 */
router.get('/consigna/reportes/ventas',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    ConsignaController.reporteVentas
);

/**
 * GET /api/v1/inventario/consigna/reportes/pendiente
 * Reporte pendiente de liquidar
 */
router.get('/consigna/reportes/pendiente',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.apiRateLimit,
    ConsignaController.reportePendiente
);

// ===================================================================
// COMBOS / KITS
// ===================================================================

const CombosController = require('../controllers/combos.controller');

/**
 * GET /api/v1/inventario/combos
 * Listar combos
 */
router.get('/combos',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    CombosController.listarCombos
);

/**
 * GET /api/v1/inventario/combos/verificar/:productoId
 * Verificar si un producto es combo
 */
router.get('/combos/verificar/:productoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    CombosController.verificarCombo
);

/**
 * GET /api/v1/inventario/combos/:productoId
 * Obtener combo por producto ID
 */
router.get('/combos/:productoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    CombosController.obtenerCombo
);

/**
 * POST /api/v1/inventario/combos
 * Crear combo
 */
router.post('/combos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    CombosController.crearCombo
);

/**
 * PUT /api/v1/inventario/combos/:productoId
 * Actualizar combo
 */
router.put('/combos/:productoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    CombosController.actualizarCombo
);

/**
 * DELETE /api/v1/inventario/combos/:productoId
 * Eliminar combo
 */
router.delete('/combos/:productoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    CombosController.eliminarCombo
);

/**
 * GET /api/v1/inventario/combos/:productoId/precio
 * Calcular precio de combo
 */
router.get('/combos/:productoId/precio',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    CombosController.calcularPrecio
);

/**
 * GET /api/v1/inventario/combos/:productoId/stock
 * Verificar stock de componentes
 */
router.get('/combos/:productoId/stock',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    CombosController.verificarStock
);

// ===================================================================
// MODIFICADORES
// ===================================================================

/**
 * GET /api/v1/inventario/modificadores/grupos
 * Listar grupos de modificadores
 */
router.get('/modificadores/grupos',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    CombosController.listarGrupos
);

/**
 * POST /api/v1/inventario/modificadores/grupos
 * Crear grupo de modificadores
 */
router.post('/modificadores/grupos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    CombosController.crearGrupo
);

/**
 * PUT /api/v1/inventario/modificadores/grupos/:id
 * Actualizar grupo de modificadores
 */
router.put('/modificadores/grupos/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    CombosController.actualizarGrupo
);

/**
 * DELETE /api/v1/inventario/modificadores/grupos/:id
 * Eliminar grupo de modificadores
 */
router.delete('/modificadores/grupos/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    CombosController.eliminarGrupo
);

/**
 * POST /api/v1/inventario/modificadores
 * Crear modificador
 */
router.post('/modificadores',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    CombosController.crearModificador
);

/**
 * PUT /api/v1/inventario/modificadores/:id
 * Actualizar modificador
 */
router.put('/modificadores/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    CombosController.actualizarModificador
);

/**
 * DELETE /api/v1/inventario/modificadores/:id
 * Eliminar modificador
 */
router.delete('/modificadores/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    CombosController.eliminarModificador
);

// ===================================================================
// MODIFICADORES - ASIGNACIONES A PRODUCTOS
// ===================================================================

/**
 * GET /api/v1/inventario/productos/:productoId/modificadores
 * Obtener modificadores de un producto
 */
router.get('/productos/:productoId/modificadores',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    CombosController.obtenerModificadoresProducto
);

/**
 * GET /api/v1/inventario/productos/:productoId/tiene-modificadores
 * Verificar si un producto tiene modificadores
 */
router.get('/productos/:productoId/tiene-modificadores',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    CombosController.tieneModificadores
);

/**
 * GET /api/v1/inventario/productos/:productoId/grupos
 * Listar asignaciones de grupos a producto
 */
router.get('/productos/:productoId/grupos',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    CombosController.listarAsignacionesProducto
);

/**
 * POST /api/v1/inventario/productos/:productoId/grupos
 * Asignar grupo a producto
 */
router.post('/productos/:productoId/grupos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    CombosController.asignarGrupoAProducto
);

/**
 * DELETE /api/v1/inventario/productos/:productoId/grupos/:grupoId
 * Eliminar asignación de grupo a producto
 */
router.delete('/productos/:productoId/grupos/:grupoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    CombosController.eliminarAsignacionProducto
);

/**
 * POST /api/v1/inventario/categorias/:categoriaId/grupos
 * Asignar grupo a categoría
 */
router.post('/categorias/:categoriaId/grupos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    CombosController.asignarGrupoACategoria
);

module.exports = router;

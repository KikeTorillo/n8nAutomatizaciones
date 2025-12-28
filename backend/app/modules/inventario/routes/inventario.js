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
    subscription.checkActiveSubscription,
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
    subscription.checkActiveSubscription,
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
    subscription.checkActiveSubscription,
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
    subscription.checkActiveSubscription,
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
    subscription.checkActiveSubscription,
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
    subscription.checkActiveSubscription,
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
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
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

module.exports = router;

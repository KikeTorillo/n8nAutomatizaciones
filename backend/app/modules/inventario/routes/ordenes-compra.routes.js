/**
 * ====================================================================
 * ROUTES - ORDENES DE COMPRA
 * ====================================================================
 */

const express = require('express');
const InventarioController = require('../controllers');
const { auth, tenant, rateLimiting, validation, subscription, modules } = require('../../../middleware');
const inventarioSchemas = require('../schemas/inventario.schemas');

const router = express.Router();
const validate = validation.validate;

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
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.crearOrdenCompra),
    InventarioController.crearOrdenCompra
);

/**
 * GET /api/v1/inventario/ordenes-compra/pendientes
 * Obtener ordenes pendientes de recibir
 */
router.get('/ordenes-compra/pendientes',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    InventarioController.obtenerOrdenesCompraPendientes
);

/**
 * GET /api/v1/inventario/ordenes-compra/pendientes-pago
 * Obtener ordenes pendientes de pago
 */
router.get('/ordenes-compra/pendientes-pago',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    InventarioController.obtenerOrdenesCompraPendientesPago
);

/**
 * GET /api/v1/inventario/ordenes-compra/reportes/por-proveedor
 * Estadisticas de compras por proveedor
 */
router.get('/ordenes-compra/reportes/por-proveedor',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
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
    rateLimiting.userRateLimit,
    InventarioController.obtenerSugerenciasOC
);

/**
 * POST /api/v1/inventario/ordenes-compra/auto-generar
 * Generar OCs automaticas para todos los productos con stock bajo
 */
router.post('/ordenes-compra/auto-generar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    InventarioController.autoGenerarOCs
);

/**
 * POST /api/v1/inventario/ordenes-compra/reabastecimiento-rutas
 * Generar reabastecimiento usando rutas de operacion
 * Query: ?sucursal_id=X (opcional)
 */
router.post('/ordenes-compra/reabastecimiento-rutas',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    InventarioController.generarReabastecimientoConRutas
);

/**
 * POST /api/v1/inventario/ordenes-compra/generar-desde-producto/:productoId
 * Generar OC desde un producto especifico con stock bajo
 */
router.post('/ordenes-compra/generar-desde-producto/:productoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
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
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.obtenerOrdenCompraPorId),
    InventarioController.obtenerOrdenCompraPorId
);

/**
 * GET /api/v1/inventario/ordenes-compra
 * Listar ordenes con filtros
 */
router.get('/ordenes-compra',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
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
    rateLimiting.userRateLimit,
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
    rateLimiting.userRateLimit,
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
    rateLimiting.userRateLimit,
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
    rateLimiting.userRateLimit,
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
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.eliminarItemOrdenCompra),
    InventarioController.eliminarItemOrdenCompra
);

/**
 * PATCH /api/v1/inventario/ordenes-compra/:id/enviar
 * Enviar orden al proveedor (borrador -> enviada)
 */
router.patch('/ordenes-compra/:id/enviar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
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
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.cancelarOrdenCompra),
    InventarioController.cancelarOrdenCompra
);

/**
 * POST /api/v1/inventario/ordenes-compra/:id/recibir
 * Recibir mercancia (parcial o total)
 * CRITICO: Actualiza stock y crea movimientos de inventario
 */
router.post('/ordenes-compra/:id/recibir',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
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
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.registrarPagoOrdenCompra),
    InventarioController.registrarPagoOrdenCompra
);

module.exports = router;

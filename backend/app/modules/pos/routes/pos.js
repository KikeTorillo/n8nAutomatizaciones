/**
 * ====================================================================
 * ROUTES - PUNTO DE VENTA (POS)
 * ====================================================================
 *
 * Rutas para gestión de ventas en punto de venta:
 * - Crear ventas con items
 * - Consultar ventas
 * - Actualizar estados
 * - Registrar pagos
 * - Cancelaciones y devoluciones
 * - Corte de caja
 */

const express = require('express');
const POSController = require('../controllers');
const { auth, tenant, rateLimiting, validation, subscription, modules } = require('../../../middleware');
const posSchemas = require('../schemas/pos.schemas');
const { verificarPermiso, verificarLimiteNumerico } = require('../../../middleware/permisos');

const router = express.Router();
const validate = validation.validate;

// ===================================================================
// VENTAS POS
// ===================================================================

/**
 * POST /api/v1/pos/ventas
 * Crear nueva venta con items
 * CRÍTICO: Actualiza stock automáticamente
 * Body:
 * - tipo_venta: directa | cita | apartado | cotizacion
 * - items: Array de { producto_id, cantidad, precio_unitario?, ... }
 * - metodo_pago: efectivo | tarjeta_debito | tarjeta_credito | transferencia | mixto | qr_mercadopago
 * - cliente_id (opcional)
 * - profesional_id (opcional)
 * - cita_id (opcional)
 */
router.post('/ventas',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('pos'),
    tenant.verifyTenantActive,
    subscription.checkActiveSubscription,
    subscription.checkResourceLimit('ventas_pos_mes'),
    verificarPermiso('pos.crear_ventas'),
    rateLimiting.userRateLimit,
    validate(posSchemas.crearVenta),
    POSController.crearVenta
);

/**
 * GET /api/v1/pos/corte-caja
 * Obtener corte de caja por período
 * Query params:
 * - fecha_inicio (requerido): YYYY-MM-DD
 * - fecha_fin (requerido): YYYY-MM-DD
 * - usuario_id (opcional): Filtrar por usuario
 * Returns: Resumen completo con totales por método de pago, ventas por hora, top productos
 */
router.get('/corte-caja',
    auth.authenticateToken,
    tenant.setTenantContext,
    verificarPermiso('pos.corte_caja', { usarSucursalDeQuery: true }),
    rateLimiting.userRateLimit,
    validate(posSchemas.corteCaja),
    POSController.generarCorteCaja
);

// ===================================================================
// SESIONES DE CAJA
// ===================================================================

/**
 * POST /api/v1/pos/sesiones-caja/abrir
 * Abrir nueva sesión de caja
 * Body:
 * - sucursal_id (opcional si se obtiene del contexto)
 * - monto_inicial: número >= 0
 * - nota_apertura (opcional)
 */
router.post('/sesiones-caja/abrir',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('pos'),
    tenant.verifyTenantActive,
    subscription.checkActiveSubscription,
    verificarPermiso('pos.gestionar_caja'),
    rateLimiting.userRateLimit,
    validate(posSchemas.abrirSesionCaja),
    POSController.abrirSesionCaja
);

/**
 * GET /api/v1/pos/sesiones-caja/activa
 * Obtener sesión de caja activa del usuario actual
 * Query params:
 * - sucursal_id (opcional si se obtiene del contexto)
 */
router.get('/sesiones-caja/activa',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(posSchemas.obtenerSesionActiva),
    POSController.obtenerSesionActiva
);

/**
 * POST /api/v1/pos/sesiones-caja/cerrar
 * Cerrar sesión de caja
 * Body:
 * - sesion_id (requerido)
 * - monto_contado (requerido)
 * - nota_cierre (opcional)
 * - desglose (opcional): desglose de billetes/monedas
 */
router.post('/sesiones-caja/cerrar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('pos'),
    tenant.verifyTenantActive,
    verificarPermiso('pos.gestionar_caja'),
    rateLimiting.userRateLimit,
    validate(posSchemas.cerrarSesionCaja),
    POSController.cerrarSesionCaja
);

/**
 * GET /api/v1/pos/sesiones-caja
 * Listar sesiones de caja con filtros
 * Query params:
 * - sucursal_id (opcional)
 * - usuario_id (opcional)
 * - estado: abierta | cerrada
 * - fecha_desde, fecha_hasta
 * - limit, offset
 */
router.get('/sesiones-caja',
    auth.authenticateToken,
    tenant.setTenantContext,
    verificarPermiso('pos.ver_historial', { usarSucursalDeQuery: true }),
    rateLimiting.userRateLimit,
    validate(posSchemas.listarSesionesCaja),
    POSController.listarSesionesCaja
);

/**
 * GET /api/v1/pos/sesiones-caja/:id
 * Obtener sesión de caja por ID
 */
router.get('/sesiones-caja/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(posSchemas.obtenerSesionPorId),
    POSController.obtenerSesionPorId
);

/**
 * GET /api/v1/pos/sesiones-caja/:id/resumen
 * Obtener resumen de sesión para cierre
 * Incluye totales, movimientos, ventas en efectivo
 */
router.get('/sesiones-caja/:id/resumen',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(posSchemas.obtenerSesionPorId),
    POSController.obtenerResumenSesion
);

/**
 * POST /api/v1/pos/sesiones-caja/:id/movimiento
 * Registrar entrada/salida de efectivo
 * Body:
 * - tipo: entrada | salida
 * - monto: número > 0
 * - motivo (requerido)
 */
router.post('/sesiones-caja/:id/movimiento',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('pos'),
    tenant.verifyTenantActive,
    verificarPermiso('pos.gestionar_caja'),
    rateLimiting.userRateLimit,
    validate(posSchemas.registrarMovimientoCaja),
    POSController.registrarMovimientoCaja
);

/**
 * GET /api/v1/pos/sesiones-caja/:id/movimientos
 * Listar movimientos de una sesión
 */
router.get('/sesiones-caja/:id/movimientos',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(posSchemas.obtenerSesionPorId),
    POSController.listarMovimientosCaja
);

/**
 * GET /api/v1/pos/ventas/:id
 * Obtener venta por ID con sus items
 */
router.get('/ventas/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(posSchemas.obtenerPorId),
    POSController.obtenerVentaPorId
);

/**
 * GET /api/v1/pos/ventas
 * Listar ventas con filtros
 * Query params:
 * - estado: cotizacion | apartado | completada | cancelada
 * - estado_pago: pendiente | parcial | pagado
 * - tipo_venta: directa | cita | apartado | cotizacion
 * - cliente_id
 * - profesional_id
 * - metodo_pago
 * - fecha_desde, fecha_hasta
 * - folio
 * - limit, offset
 */
router.get('/ventas',
    auth.authenticateToken,
    tenant.setTenantContext,
    verificarPermiso('pos.ver_historial', { usarSucursalDeQuery: true }),
    rateLimiting.userRateLimit,
    validate(posSchemas.listarVentas),
    POSController.listarVentas
);

/**
 * PATCH /api/v1/pos/ventas/:id/estado
 * Actualizar estado de venta
 * Body:
 * - estado: cotizacion | apartado | completada | cancelada
 */
router.patch('/ventas/:id/estado',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('pos'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(posSchemas.actualizarEstado),
    POSController.actualizarEstadoVenta
);

/**
 * POST /api/v1/pos/ventas/:id/pago
 * Registrar pago en venta
 * Body:
 * - monto_pago: número > 0
 * - metodo_pago: efectivo | tarjeta_debito | tarjeta_credito | transferencia | mixto | qr_mercadopago
 * - pago_id (opcional): ID del pago en tabla pagos
 */
router.post('/ventas/:id/pago',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('pos'),
    tenant.verifyTenantActive,
    subscription.checkActiveSubscription,
    rateLimiting.userRateLimit,
    validate(posSchemas.registrarPago),
    POSController.registrarPago
);

/**
 * POST /api/v1/pos/ventas/:id/cancelar
 * Cancelar venta y revertir stock
 * CRÍTICO: Revierte automáticamente el stock de todos los items
 * Body:
 * - motivo (opcional): string
 * - usuario_id (requerido): ID del usuario que cancela
 */
router.post('/ventas/:id/cancelar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('pos'),
    tenant.verifyTenantActive,
    verificarPermiso('pos.anular_ventas'),
    rateLimiting.userRateLimit,
    validate(posSchemas.cancelarVenta),
    POSController.cancelarVenta
);

/**
 * POST /api/v1/pos/ventas/:id/devolver
 * Procesar devolución parcial o total de items
 * CRÍTICO: Ajusta stock y genera nota de crédito
 * Body:
 * - items_devueltos: Array de { item_id, cantidad_devolver }
 * - motivo (opcional): string
 * - usuario_id (requerido): ID del usuario que procesa
 */
router.post('/ventas/:id/devolver',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('pos'),
    tenant.verifyTenantActive,
    subscription.checkActiveSubscription,
    verificarPermiso('pos.devolver_productos'),
    rateLimiting.userRateLimit,
    validate(posSchemas.devolverItems),
    POSController.devolverItems
);

/**
 * POST /api/v1/pos/ventas/:id/items
 * Agregar items a venta existente
 * Body:
 * - items: Array de { producto_id, cantidad, precio_unitario?, ... }
 * IMPORTANTE: Recalcula totales automáticamente
 */
router.post('/ventas/:id/items',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('pos'),
    tenant.verifyTenantActive,
    subscription.checkActiveSubscription,
    rateLimiting.userRateLimit,
    validate(posSchemas.agregarItems),
    POSController.agregarItems
);

/**
 * PUT /api/v1/pos/ventas/:id
 * Actualizar venta completa
 * Body: Campos a actualizar (tipo_venta, cliente_id, profesional_id, etc.)
 */
router.put('/ventas/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('pos'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(posSchemas.actualizarVenta),
    POSController.actualizarVenta
);

/**
 * DELETE /api/v1/pos/ventas/:id
 * Eliminar venta (marca como cancelada y revierte stock)
 * Body:
 * - motivo (requerido): Razón de eliminación
 * - usuario_id (requerido): Usuario que elimina
 * CRÍTICO: Revierte stock automáticamente
 */
router.delete('/ventas/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('pos'),
    tenant.verifyTenantActive,
    verificarPermiso('pos.anular_ventas'),
    rateLimiting.userRateLimit,
    validate(posSchemas.eliminarVenta),
    POSController.eliminarVenta
);

// ===================================================================
// REPORTES POS
// ===================================================================

/**
 * GET /api/v1/pos/reportes/ventas-diarias
 * Reporte de ventas del día
 * Query params:
 * - fecha (requerido): YYYY-MM-DD
 * - profesional_id (opcional)
 * - usuario_id (opcional)
 * Returns: Resumen, ventas por hora, top productos, detalle completo
 */
router.get('/reportes/ventas-diarias',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(posSchemas.reporteVentasDiarias),
    POSController.obtenerVentasDiarias
);

// ===================================================================
// TICKETS PDF
// ===================================================================

/**
 * GET /api/v1/pos/ventas/:id/ticket
 * Generar ticket de venta en PDF (formato térmico 58mm/80mm)
 * Query params:
 * - paper_size: '58mm' | '80mm' (default: '80mm')
 * - download: 'true' | 'false' (default: 'true')
 * Returns: PDF binary
 */
router.get('/ventas/:id/ticket',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(posSchemas.obtenerPorId),
    POSController.generarTicket
);

// ===================================================================
// PAGO SPLIT (Ene 2026)
// ===================================================================

/**
 * POST /api/v1/pos/ventas/:id/pagos-split
 * Registrar pagos split (múltiples métodos de pago)
 * Body:
 * - pagos: Array de { metodo_pago, monto, monto_recibido?, referencia? }
 * - cliente_id (opcional): Para pagos a cuenta/crédito
 */
router.post('/ventas/:id/pagos-split',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('pos'),
    tenant.verifyTenantActive,
    subscription.checkActiveSubscription,
    rateLimiting.userRateLimit,
    validate(posSchemas.registrarPagosSplit),
    POSController.registrarPagosSplit
);

/**
 * GET /api/v1/pos/ventas/:id/pagos
 * Obtener desglose de pagos de una venta
 * Returns: { venta, pagos, resumen }
 */
router.get('/ventas/:id/pagos',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(posSchemas.obtenerPagosVenta),
    POSController.obtenerPagosVenta
);

// ===================================================================
// CUPONES DE DESCUENTO (Ene 2026)
// ===================================================================

const CuponesController = require('../controllers/cupones.controller');

/**
 * GET /api/v1/pos/cupones/vigentes
 * Listar cupones vigentes (para selector en POS)
 * Returns: Array de cupones activos y dentro de fechas válidas
 */
router.get('/cupones/vigentes',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    CuponesController.listarVigentes
);

/**
 * POST /api/v1/pos/cupones/validar
 * Validar cupón sin aplicar (preview)
 * Body:
 * - codigo: string
 * - subtotal: number
 * - cliente_id (opcional)
 * - productos_ids (opcional)
 * Returns: { valido, cupon, descuento_calculado } o { valido: false, error, mensaje }
 */
router.post('/cupones/validar',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(posSchemas.validarCupon),
    CuponesController.validar
);

/**
 * POST /api/v1/pos/cupones/aplicar
 * Aplicar cupón a una venta
 * Body:
 * - cupon_id: number
 * - venta_pos_id: number
 * - cliente_id (opcional)
 * - subtotal_antes (opcional)
 * Returns: uso_cupones row
 */
router.post('/cupones/aplicar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('pos'),
    tenant.verifyTenantActive,
    subscription.checkActiveSubscription,
    rateLimiting.userRateLimit,
    validate(posSchemas.aplicarCupon),
    CuponesController.aplicar
);

/**
 * GET /api/v1/pos/cupones
 * Listar cupones con filtros y paginación
 * Query params:
 * - page, limit
 * - busqueda
 * - activo: true | false
 * - vigente: true | false
 * - ordenPor, orden
 */
router.get('/cupones',
    auth.authenticateToken,
    tenant.setTenantContext,
    verificarPermiso('pos.gestionar_cupones'),
    rateLimiting.userRateLimit,
    validate(posSchemas.listarCupones),
    CuponesController.listar
);

/**
 * POST /api/v1/pos/cupones
 * Crear nuevo cupón
 * Body: { codigo, nombre, tipo_descuento, valor, ... }
 */
router.post('/cupones',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('pos'),
    tenant.verifyTenantActive,
    subscription.checkActiveSubscription,
    verificarPermiso('pos.gestionar_cupones'),
    rateLimiting.userRateLimit,
    validate(posSchemas.crearCupon),
    CuponesController.crear
);

/**
 * GET /api/v1/pos/cupones/:id
 * Obtener cupón por ID
 */
router.get('/cupones/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(posSchemas.obtenerCupon),
    CuponesController.obtenerPorId
);

/**
 * PUT /api/v1/pos/cupones/:id
 * Actualizar cupón
 */
router.put('/cupones/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('pos'),
    tenant.verifyTenantActive,
    verificarPermiso('pos.gestionar_cupones'),
    rateLimiting.userRateLimit,
    validate(posSchemas.actualizarCupon),
    CuponesController.actualizar
);

/**
 * DELETE /api/v1/pos/cupones/:id
 * Eliminar cupón (solo si no tiene usos)
 */
router.delete('/cupones/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('pos'),
    tenant.verifyTenantActive,
    verificarPermiso('pos.gestionar_cupones'),
    rateLimiting.userRateLimit,
    validate(posSchemas.eliminarCupon),
    CuponesController.eliminar
);

/**
 * GET /api/v1/pos/cupones/:id/historial
 * Obtener historial de uso de un cupón
 */
router.get('/cupones/:id/historial',
    auth.authenticateToken,
    tenant.setTenantContext,
    verificarPermiso('pos.gestionar_cupones'),
    rateLimiting.userRateLimit,
    validate(posSchemas.historialCupon),
    CuponesController.obtenerHistorial
);

/**
 * GET /api/v1/pos/cupones/:id/estadisticas
 * Obtener estadísticas de un cupón
 */
router.get('/cupones/:id/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    verificarPermiso('pos.gestionar_cupones'),
    rateLimiting.userRateLimit,
    validate(posSchemas.obtenerCupon),
    CuponesController.obtenerEstadisticas
);

/**
 * PATCH /api/v1/pos/cupones/:id/estado
 * Activar/desactivar cupón
 */
router.patch('/cupones/:id/estado',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('pos'),
    tenant.verifyTenantActive,
    verificarPermiso('pos.gestionar_cupones'),
    rateLimiting.userRateLimit,
    validate(posSchemas.cambiarEstadoCupon),
    CuponesController.cambiarEstado
);

module.exports = router;

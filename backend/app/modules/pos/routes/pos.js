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
const { auth, tenant, rateLimiting, validation, subscription } = require('../../../middleware');
const posSchemas = require('../schemas/pos.schemas');

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
    tenant.verifyTenantActive,
    subscription.checkActiveSubscription,
    subscription.checkResourceLimit('ventas_pos_mes'),
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
    validate(posSchemas.corteCaja),
    POSController.generarCorteCaja
);

/**
 * GET /api/v1/pos/ventas/:id
 * Obtener venta por ID con sus items
 */
router.get('/ventas/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
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
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
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
    tenant.verifyTenantActive,
    subscription.checkActiveSubscription,
    rateLimiting.apiRateLimit,
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
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
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
    tenant.verifyTenantActive,
    subscription.checkActiveSubscription,
    rateLimiting.apiRateLimit,
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
    tenant.verifyTenantActive,
    subscription.checkActiveSubscription,
    rateLimiting.apiRateLimit,
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
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
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
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
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
    rateLimiting.apiRateLimit,
    validate(posSchemas.reporteVentasDiarias),
    POSController.obtenerVentasDiarias
);

// ===================================================================
// PENDIENTE: TICKETS PDF
// ===================================================================

/**
 * ⚠️ PENDIENTE DE IMPLEMENTACIÓN
 * GET /api/v1/pos/ventas/:id/ticket
 * Generar ticket de venta en PDF
 *
 * REQUERIMIENTOS:
 * 1. Instalar: npm install pdfkit
 * 2. Crear: models/pos/tickets.model.js
 * 3. Crear: controllers/pos/tickets.controller.js
 * 4. Implementar plantilla de ticket térmica (58mm o 80mm)
 * 5. Incluir: Folio, fecha, items, totales, código QR
 *
 * router.get('/ventas/:id/ticket',
 *     auth.authenticateToken,
 *     tenant.setTenantContext,
 *     rateLimiting.apiRateLimit,
 *     validate(posSchemas.obtenerPorId),
 *     POSController.generarTicket
 * );
 */

module.exports = router;

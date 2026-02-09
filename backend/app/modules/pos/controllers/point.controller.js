/**
 * ====================================================================
 * CONTROLLER: POINT TERMINAL (MercadoPago)
 * ====================================================================
 * Endpoints para cobros presenciales con terminal MercadoPago Point.
 *
 * @module pos/controllers/point
 * @version 1.0.0
 * @date Febrero 2026
 */

const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');
const { GatewayFactory } = require('../../suscripciones-negocio/gateways');
const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

class PointController {

    /**
     * Crear orden de pago para terminal Point
     * POST /api/v1/pos/point/orders
     */
    static crearOrden = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { terminal_id, venta_id, monto, descripcion, expiration_time = 'PT5M' } = req.body;

        logger.info('[PointController] Creando orden Point', {
            organizacionId,
            terminal_id,
            venta_id,
            monto
        });

        // 1. Verificar que la venta existe y está pendiente de pago
        const venta = await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(
                `SELECT id, total, estado_pago, estado FROM ventas_pos WHERE id = $1`,
                [venta_id]
            );
            return result.rows[0] || null;
        });

        if (!venta) {
            return ResponseHelper.error(res, 'Venta no encontrada', 404);
        }

        if (venta.estado === 'cancelada') {
            return ResponseHelper.error(res, 'No se puede cobrar una venta cancelada', 400);
        }

        // 2. Obtener gateway
        const gateway = await GatewayFactory.getGateway(organizacionId);

        // 3. Construir external_reference para tracking
        const externalReference = `pos_venta_${venta_id}_org_${organizacionId}`;

        // 4. Crear orden en MercadoPago
        const result = await gateway.createPointOrder({
            terminalId: terminal_id,
            monto,
            externalReference,
            descripcion: descripcion || `Venta #${venta_id}`,
            expirationTime: expiration_time
        });

        // 5. Registrar pago pendiente en venta_pagos
        await RLSContextManager.query(organizacionId, async (db) => {
            await db.query(
                `INSERT INTO venta_pagos (
                    organizacion_id, venta_id, metodo_pago, monto, referencia, notas
                ) VALUES ($1, $2, 'terminal_mercadopago', $3, $4, $5)`,
                [organizacionId, venta_id, monto, result.orderId, 'Pago con terminal Point - pendiente']
            );
        });

        logger.info('[PointController] Orden Point creada', {
            organizacionId,
            orderId: result.orderId,
            ventaId: venta_id
        });

        return ResponseHelper.success(res, {
            order_id: result.orderId,
            status: result.status,
            venta_id
        }, 'Orden de pago creada. Presente la tarjeta en el terminal.');
    });

    /**
     * Obtener estado de una orden Point
     * GET /api/v1/pos/point/orders/:orderId
     */
    static obtenerOrden = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { orderId } = req.params;

        const gateway = await GatewayFactory.getGateway(organizacionId);
        const order = await gateway.getOrder(orderId);

        if (!order) {
            return ResponseHelper.error(res, 'Orden no encontrada', 404);
        }

        return ResponseHelper.success(res, order);
    });

    /**
     * Cancelar una orden Point
     * DELETE /api/v1/pos/point/orders/:orderId
     */
    static cancelarOrden = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { orderId } = req.params;

        logger.info('[PointController] Cancelando orden Point', {
            organizacionId,
            orderId
        });

        const gateway = await GatewayFactory.getGateway(organizacionId);
        await gateway.cancelOrder(orderId);

        // Eliminar pago pendiente de venta_pagos
        await RLSContextManager.query(organizacionId, async (db) => {
            await db.query(
                `DELETE FROM venta_pagos WHERE referencia = $1 AND metodo_pago = 'terminal_mercadopago'`,
                [orderId]
            );
        });

        return ResponseHelper.success(res, { cancelled: true }, 'Orden cancelada');
    });

    /**
     * Listar terminales Point disponibles
     * GET /api/v1/pos/point/terminals
     */
    static listarTerminales = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const gateway = await GatewayFactory.getGateway(organizacionId);
        const terminals = await gateway.listTerminals();

        return ResponseHelper.success(res, terminals);
    });
}

module.exports = PointController;

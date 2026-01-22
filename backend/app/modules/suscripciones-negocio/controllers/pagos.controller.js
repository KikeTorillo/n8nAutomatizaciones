/**
 * ====================================================================
 * CONTROLLER: PAGOS DE SUSCRIPCIONES
 * ====================================================================
 * Gestión del historial de pagos de suscripciones.
 *
 * @module controllers/pagos
 */

const asyncHandler = require('../../../middleware/asyncHandler');
const { PagosModel } = require('../models');
const { ResponseHelper, ErrorHelper, ParseHelper } = require('../../../utils/helpers');

class PagosController {

    /**
     * Listar pagos con paginación y filtros
     * GET /api/v1/suscripciones-negocio/pagos
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            estado: req.query.estado,
            suscripcion_id: req.query.suscripcion_id ? parseInt(req.query.suscripcion_id) : undefined,
            gateway: req.query.gateway,
            fecha_desde: req.query.fecha_desde,
            fecha_hasta: req.query.fecha_hasta
        };

        const resultado = await PagosModel.listar(options, organizacionId);

        return ResponseHelper.success(res, resultado);
    });

    /**
     * Buscar pago por ID
     * GET /api/v1/suscripciones-negocio/pagos/:id
     */
    static buscarPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const pago = await PagosModel.buscarPorId(id, organizacionId);
        ErrorHelper.throwIfNotFound(pago, 'Pago');

        return ResponseHelper.success(res, pago);
    });

    /**
     * Crear registro de pago
     * POST /api/v1/suscripciones-negocio/pagos
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const pagoData = req.body;

        const nuevoPago = await PagosModel.crear(pagoData, organizacionId);

        return ResponseHelper.success(res, nuevoPago, 'Pago registrado exitosamente', 201);
    });

    /**
     * Actualizar estado del pago
     * PATCH /api/v1/suscripciones-negocio/pagos/:id/estado
     */
    static actualizarEstado = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { estado } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const pagoActualizado = await PagosModel.actualizarEstado(
            id,
            estado,
            organizacionId
        );

        return ResponseHelper.success(res, pagoActualizado, `Pago marcado como ${estado}`);
    });

    /**
     * Procesar reembolso
     * POST /api/v1/suscripciones-negocio/pagos/:id/reembolso
     */
    static procesarReembolso = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { monto_reembolso, razon } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const pagoReembolsado = await PagosModel.procesarReembolso(
            id,
            monto_reembolso,
            razon,
            organizacionId
        );

        return ResponseHelper.success(res, pagoReembolsado, 'Reembolso procesado exitosamente');
    });

    /**
     * Buscar pago por transaction_id del gateway
     * GET /api/v1/suscripciones-negocio/pagos/transaccion/:gateway/:transactionId
     */
    static buscarPorTransactionId = asyncHandler(async (req, res) => {
        const { gateway, transactionId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const pago = await PagosModel.buscarPorTransactionId(
            gateway,
            transactionId,
            organizacionId
        );

        if (!pago) {
            return ResponseHelper.success(res, null);
        }

        return ResponseHelper.success(res, pago);
    });

    /**
     * Obtener resumen de pagos (dashboard)
     * GET /api/v1/suscripciones-negocio/pagos/resumen
     */
    static obtenerResumen = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const options = {
            mes_actual: ParseHelper.parseBoolean(req.query.mes_actual) ?? true
        };

        const resumen = await PagosModel.obtenerResumen(options, organizacionId);

        return ResponseHelper.success(res, resumen);
    });
}

module.exports = PagosController;

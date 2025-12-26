const ReservasModel = require('../models/reservas.model');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');

/**
 * Controller para gestión de reservas de stock
 * Previene sobreventa en ventas concurrentes
 * @since Dic 2025 - Fase 1 Gaps Inventario
 */
class ReservasController {

    /**
     * Crear nueva reserva de stock
     * POST /api/v1/inventario/reservas
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user?.id || null;

        const reserva = await ReservasModel.crear(req.body, organizacionId, usuarioId);

        return ResponseHelper.success(
            res,
            reserva,
            'Reserva de stock creada exitosamente',
            201
        );
    });

    /**
     * Crear múltiples reservas en una transacción
     * POST /api/v1/inventario/reservas/multiple
     */
    static crearMultiple = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user?.id || null;
        const { items, tipo_origen, origen_id, sucursal_id } = req.body;

        const reservas = await ReservasModel.crearMultiple(
            items,
            tipo_origen,
            origen_id,
            organizacionId,
            sucursal_id,
            usuarioId
        );

        return ResponseHelper.success(
            res,
            reservas,
            `${reservas.length} reservas creadas exitosamente`,
            201
        );
    });

    /**
     * Obtener reserva por ID
     * GET /api/v1/inventario/reservas/:id
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const reserva = await ReservasModel.obtenerPorId(parseInt(id), organizacionId);

        if (!reserva) {
            return ResponseHelper.error(res, 'Reserva no encontrada', 404);
        }

        return ResponseHelper.success(res, reserva, 'Reserva obtenida exitosamente');
    });

    /**
     * Listar reservas con filtros
     * GET /api/v1/inventario/reservas
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            estado: req.query.estado || undefined,
            producto_id: req.query.producto_id ? parseInt(req.query.producto_id) : undefined,
            sucursal_id: req.query.sucursal_id ? parseInt(req.query.sucursal_id) : undefined,
            tipo_origen: req.query.tipo_origen || undefined,
            origen_id: req.query.origen_id ? parseInt(req.query.origen_id) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : 50,
            offset: req.query.offset ? parseInt(req.query.offset) : 0
        };

        const reservas = await ReservasModel.listar(filtros, organizacionId);

        return ResponseHelper.success(res, reservas, 'Reservas obtenidas exitosamente');
    });

    /**
     * Confirmar reserva (descuenta stock real)
     * PATCH /api/v1/inventario/reservas/:id/confirmar
     */
    static confirmar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const reserva = await ReservasModel.confirmar(parseInt(id), organizacionId);

        return ResponseHelper.success(
            res,
            reserva,
            'Reserva confirmada y stock descontado exitosamente'
        );
    });

    /**
     * Confirmar múltiples reservas
     * POST /api/v1/inventario/reservas/confirmar-multiple
     */
    static confirmarMultiple = asyncHandler(async (req, res) => {
        const { reserva_ids } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const confirmadas = await ReservasModel.confirmarMultiple(reserva_ids, organizacionId);

        return ResponseHelper.success(
            res,
            { confirmadas, total: confirmadas.length },
            `${confirmadas.length} reservas confirmadas exitosamente`
        );
    });

    /**
     * Cancelar reserva
     * DELETE /api/v1/inventario/reservas/:id
     */
    static cancelar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const resultado = await ReservasModel.cancelar(parseInt(id), organizacionId);

        if (!resultado) {
            return ResponseHelper.error(res, 'No se pudo cancelar la reserva', 400);
        }

        return ResponseHelper.success(
            res,
            { cancelada: true },
            'Reserva cancelada exitosamente'
        );
    });

    /**
     * Cancelar reservas por origen
     * DELETE /api/v1/inventario/reservas/origen/:tipoOrigen/:origenId
     */
    static cancelarPorOrigen = asyncHandler(async (req, res) => {
        const { tipoOrigen, origenId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const canceladas = await ReservasModel.cancelarPorOrigen(
            tipoOrigen,
            parseInt(origenId),
            organizacionId
        );

        return ResponseHelper.success(
            res,
            { canceladas, total: canceladas.length },
            `${canceladas.length} reservas canceladas`
        );
    });

    /**
     * Obtener stock disponible de un producto
     * GET /api/v1/inventario/productos/:id/stock-disponible
     */
    static stockDisponible = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;
        const sucursalId = req.query.sucursal_id ? parseInt(req.query.sucursal_id) : null;

        const disponible = await ReservasModel.stockDisponible(
            parseInt(id),
            organizacionId,
            sucursalId
        );

        return ResponseHelper.success(
            res,
            { producto_id: parseInt(id), stock_disponible: disponible },
            'Stock disponible obtenido exitosamente'
        );
    });

    /**
     * Obtener stock disponible de múltiples productos
     * POST /api/v1/inventario/productos/stock-disponible
     */
    static stockDisponibleMultiple = asyncHandler(async (req, res) => {
        const { producto_ids, sucursal_id } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const stockMap = await ReservasModel.stockDisponibleMultiple(
            producto_ids,
            organizacionId,
            sucursal_id || null
        );

        return ResponseHelper.success(
            res,
            stockMap,
            'Stock disponible obtenido exitosamente'
        );
    });

    /**
     * Verificar disponibilidad de un producto
     * GET /api/v1/inventario/productos/:id/verificar-disponibilidad
     */
    static verificarDisponibilidad = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;
        const cantidad = parseInt(req.query.cantidad) || 1;
        const sucursalId = req.query.sucursal_id ? parseInt(req.query.sucursal_id) : null;

        const resultado = await ReservasModel.verificarDisponibilidad(
            parseInt(id),
            cantidad,
            organizacionId,
            sucursalId
        );

        return ResponseHelper.success(
            res,
            resultado,
            resultado.suficiente ? 'Stock disponible' : 'Stock insuficiente'
        );
    });

    /**
     * Extender tiempo de expiración de una reserva
     * PATCH /api/v1/inventario/reservas/:id/extender
     */
    static extenderExpiracion = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { minutos_adicionales } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const reserva = await ReservasModel.extenderExpiracion(
            parseInt(id),
            minutos_adicionales || 15,
            organizacionId
        );

        if (!reserva) {
            return ResponseHelper.error(res, 'No se pudo extender la reserva', 400);
        }

        return ResponseHelper.success(
            res,
            reserva,
            'Tiempo de reserva extendido exitosamente'
        );
    });
}

module.exports = ReservasController;

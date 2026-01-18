const ReservasModel = require('../models/reservas.model');
const { ResponseHelper, ParseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');

/**
 * Controller para gestión de reservas de stock - Arquitectura Superior
 *
 * CARACTERÍSTICAS v2.0:
 * - Soporte completo para variantes de producto
 * - Reservas atómicas con SKIP LOCKED
 * - stock_disponible siempre calculado (no almacenado)
 *
 * @since Dic 2025 - Fase 1 Gaps Inventario
 * @version 2.0 - Arquitectura Superior (28 Dic 2025)
 */
class ReservasController {

    /**
     * Crear nueva reserva de stock (producto o variante)
     * POST /api/v1/inventario/reservas
     * Body: { producto_id?, variante_id?, cantidad, tipo_origen, sucursal_id?, ... }
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user?.id || null;

        const reserva = await ReservasModel.crear(organizacionId, req.body, usuarioId);

        return ResponseHelper.success(
            res,
            reserva,
            'Reserva de stock creada exitosamente',
            201
        );
    });

    /**
     * Crear múltiples reservas en una transacción atómica
     * POST /api/v1/inventario/reservas/multiple
     * Body: { items: [{ producto_id?, variante_id?, cantidad }], tipo_origen, ... }
     */
    static crearMultiple = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user?.id || null;
        const { items, tipo_origen, origen_id, origen_referencia, sucursal_id } = req.body;

        const reservas = await ReservasModel.crearMultiple(
            items,
            tipo_origen,
            organizacionId,
            {
                origen_id,
                origen_referencia,
                sucursal_id,
                usuario_id: usuarioId
            }
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

        const reserva = await ReservasModel.buscarPorId(organizacionId, parseInt(id));

        if (!reserva) {
            return ResponseHelper.error(res, 'Reserva no encontrada', 404);
        }

        return ResponseHelper.success(res, reserva, 'Reserva obtenida exitosamente');
    });

    /**
     * Listar reservas con filtros
     * GET /api/v1/inventario/reservas
     * Query: estado, producto_id, variante_id, sucursal_id, tipo_origen, solo_activas
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        // Parseo centralizado con ParseHelper
        const { limit, offset } = ParseHelper.parsePagination(req.query, { defaultLimit: 50 });

        const filtros = {
            estado: ParseHelper.parseString(req.query.estado),
            producto_id: ParseHelper.parseInt(req.query.producto_id),
            variante_id: ParseHelper.parseInt(req.query.variante_id),
            sucursal_id: ParseHelper.parseInt(req.query.sucursal_id),
            tipo_origen: ParseHelper.parseString(req.query.tipo_origen),
            origen_id: ParseHelper.parseInt(req.query.origen_id),
            solo_activas: ParseHelper.parseBoolean(req.query.solo_activas, false),
            limit,
            offset
        };

        const reservas = await ReservasModel.listar(organizacionId, filtros);

        return ResponseHelper.success(res, reservas, 'Reservas obtenidas exitosamente');
    });

    /**
     * Obtener resumen de reservas activas por tipo
     * GET /api/v1/inventario/reservas/resumen
     */
    static resumen = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const resumen = await ReservasModel.resumenActivas(organizacionId);

        return ResponseHelper.success(res, resumen, 'Resumen de reservas obtenido');
    });

    /**
     * Confirmar reserva
     * PATCH /api/v1/inventario/reservas/:id/confirmar
     */
    static confirmar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user?.id || null;

        const reserva = await ReservasModel.confirmar(parseInt(id), organizacionId, usuarioId);

        return ResponseHelper.success(
            res,
            reserva,
            'Reserva confirmada exitosamente'
        );
    });

    /**
     * Confirmar múltiples reservas
     * POST /api/v1/inventario/reservas/confirmar-multiple
     */
    static confirmarMultiple = asyncHandler(async (req, res) => {
        const { reserva_ids } = req.body;
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user?.id || null;

        const resultado = await ReservasModel.confirmarMultiple(reserva_ids, organizacionId, usuarioId);

        return ResponseHelper.success(
            res,
            resultado,
            `${resultado.confirmadas.length} reservas confirmadas`
        );
    });

    /**
     * Liberar reserva (cancelar manualmente)
     * DELETE /api/v1/inventario/reservas/:id
     */
    static liberar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;
        const motivo = req.body?.motivo || 'Liberada manualmente';

        const resultado = await ReservasModel.liberar(parseInt(id), organizacionId, motivo);

        if (!resultado) {
            return ResponseHelper.error(res, 'No se pudo liberar la reserva', 400);
        }

        return ResponseHelper.success(
            res,
            { liberada: true },
            'Reserva liberada exitosamente'
        );
    });

    /**
     * Alias de liberar para compatibilidad
     */
    static cancelar = ReservasController.liberar;

    /**
     * Liberar reservas por origen
     * DELETE /api/v1/inventario/reservas/origen/:tipoOrigen/:origenId
     */
    static liberarPorOrigen = asyncHandler(async (req, res) => {
        const { tipoOrigen, origenId } = req.params;
        const organizacionId = req.tenant.organizacionId;
        const motivo = req.body?.motivo || 'Liberada por origen';

        const cantidad = await ReservasModel.liberarPorOrigen(
            tipoOrigen,
            parseInt(origenId),
            organizacionId,
            motivo
        );

        return ResponseHelper.success(
            res,
            { liberadas: cantidad },
            `${cantidad} reservas liberadas`
        );
    });

    /**
     * Alias para compatibilidad
     */
    static cancelarPorOrigen = ReservasController.liberarPorOrigen;

    // =========================================================================
    // ENDPOINTS DE STOCK DISPONIBLE
    // =========================================================================

    /**
     * Obtener stock disponible de un producto o variante
     * GET /api/v1/inventario/stock-disponible
     * Query: producto_id?, variante_id?, sucursal_id?
     */
    static stockDisponible = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const productoId = ParseHelper.parseInt(req.query.producto_id);
        const varianteId = ParseHelper.parseInt(req.query.variante_id);
        const sucursalId = ParseHelper.parseInt(req.query.sucursal_id);

        if (!productoId && !varianteId) {
            return ResponseHelper.error(res, 'Debe especificar producto_id o variante_id', 400);
        }

        const disponible = await ReservasModel.stockDisponible(
            { productoId, varianteId, sucursalId },
            organizacionId
        );

        return ResponseHelper.success(
            res,
            {
                producto_id: productoId,
                variante_id: varianteId,
                sucursal_id: sucursalId,
                stock_disponible: disponible
            },
            'Stock disponible obtenido'
        );
    });

    /**
     * Obtener información completa de stock
     * GET /api/v1/inventario/stock-info
     * Query: producto_id?, variante_id?, sucursal_id?
     */
    static stockInfoCompleto = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const productoId = ParseHelper.parseInt(req.query.producto_id);
        const varianteId = ParseHelper.parseInt(req.query.variante_id);
        const sucursalId = ParseHelper.parseInt(req.query.sucursal_id);

        if (!productoId && !varianteId) {
            return ResponseHelper.error(res, 'Debe especificar producto_id o variante_id', 400);
        }

        const info = await ReservasModel.stockInfoCompleto(
            { productoId, varianteId, sucursalId },
            organizacionId
        );

        return ResponseHelper.success(
            res,
            {
                producto_id: productoId,
                variante_id: varianteId,
                sucursal_id: sucursalId,
                ...info
            },
            'Información de stock obtenida'
        );
    });

    /**
     * Obtener stock disponible de múltiples productos/variantes
     * POST /api/v1/inventario/stock-disponible/multiple
     * Body: { items: [{ producto_id?, variante_id? }], sucursal_id? }
     */
    static stockDisponibleMultiple = asyncHandler(async (req, res) => {
        const { items, sucursal_id } = req.body;
        const organizacionId = req.tenant.organizacionId;

        if (!items || items.length === 0) {
            return ResponseHelper.error(res, 'Debe proporcionar al menos un item', 400);
        }

        const stockMap = await ReservasModel.stockDisponibleMultiple(
            items,
            organizacionId,
            sucursal_id || null
        );

        return ResponseHelper.success(
            res,
            stockMap,
            'Stock disponible obtenido'
        );
    });

    /**
     * Verificar disponibilidad para una cantidad específica
     * GET /api/v1/inventario/verificar-disponibilidad
     * Query: producto_id?, variante_id?, cantidad, sucursal_id?
     */
    static verificarDisponibilidad = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const productoId = ParseHelper.parseInt(req.query.producto_id);
        const varianteId = ParseHelper.parseInt(req.query.variante_id);
        const cantidad = ParseHelper.parseInt(req.query.cantidad, 1);
        const sucursalId = ParseHelper.parseInt(req.query.sucursal_id);

        if (!productoId && !varianteId) {
            return ResponseHelper.error(res, 'Debe especificar producto_id o variante_id', 400);
        }

        const resultado = await ReservasModel.verificarDisponibilidad(
            { productoId, varianteId, cantidad, sucursalId },
            organizacionId
        );

        return ResponseHelper.success(
            res,
            {
                producto_id: productoId,
                variante_id: varianteId,
                cantidad_solicitada: cantidad,
                ...resultado
            },
            resultado.suficiente ? 'Stock disponible' : 'Stock insuficiente'
        );
    });

    /**
     * Obtener stock en tiempo real desde la vista
     * GET /api/v1/inventario/stock-tiempo-real
     * Query: nivel_stock?, producto_id?, solo_agotados?, solo_bajos?, limit?
     */
    static stockTiempoReal = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        // Parseo centralizado con ParseHelper
        const filtros = {
            nivel_stock: ParseHelper.parseString(req.query.nivel_stock),
            producto_id: ParseHelper.parseInt(req.query.producto_id),
            solo_agotados: ParseHelper.parseBoolean(req.query.solo_agotados, false),
            solo_bajos: ParseHelper.parseBoolean(req.query.solo_bajos, false),
            limit: ParseHelper.parseInt(req.query.limit, 100)
        };

        const stock = await ReservasModel.obtenerStockTiempoReal(organizacionId, filtros);

        return ResponseHelper.success(res, stock, 'Stock en tiempo real obtenido');
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
            'Tiempo de reserva extendido'
        );
    });
}

module.exports = ReservasController;

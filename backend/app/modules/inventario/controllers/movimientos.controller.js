const { MovimientosInventarioModel } = require('../models');
const { ResponseHelper, ParseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');

/**
 * Controller para gestión de movimientos de inventario
 * Registro de entradas/salidas y kardex
 */
class MovimientosInventarioController {

    /**
     * Registrar movimiento de inventario
     * POST /api/v1/inventario/movimientos
     */
    static registrar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const movimiento = await MovimientosInventarioModel.registrar(req.body, organizacionId);

        return ResponseHelper.success(
            res,
            movimiento,
            'Movimiento registrado exitosamente',
            201
        );
    });

    /**
     * Obtener kardex de un producto
     * GET /api/v1/inventario/movimientos/kardex/:producto_id
     */
    static obtenerKardex = asyncHandler(async (req, res) => {
        const { producto_id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        // Parseo centralizado con ParseHelper
        const { limit, offset } = ParseHelper.parsePagination(req.query, { defaultLimit: 100 });

        const filtros = {
            tipo_movimiento: ParseHelper.parseString(req.query.tipo_movimiento),
            fecha_desde: ParseHelper.parseString(req.query.fecha_desde),
            fecha_hasta: ParseHelper.parseString(req.query.fecha_hasta),
            proveedor_id: ParseHelper.parseInt(req.query.proveedor_id),
            limit,
            offset
        };

        const kardex = await MovimientosInventarioModel.obtenerKardex(
            parseInt(producto_id),
            organizacionId,
            filtros
        );

        return ResponseHelper.success(res, kardex, 'Kardex obtenido exitosamente');
    });

    /**
     * Listar movimientos con filtros
     * GET /api/v1/inventario/movimientos
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        // Parseo centralizado con ParseHelper
        const { limit, offset } = ParseHelper.parsePagination(req.query, { defaultLimit: 50 });

        const filtros = {
            tipo_movimiento: ParseHelper.parseString(req.query.tipo_movimiento),
            categoria: ParseHelper.parseString(req.query.categoria),
            producto_id: ParseHelper.parseInt(req.query.producto_id),
            proveedor_id: ParseHelper.parseInt(req.query.proveedor_id),
            fecha_desde: ParseHelper.parseString(req.query.fecha_desde),
            fecha_hasta: ParseHelper.parseString(req.query.fecha_hasta),
            limit,
            offset
        };

        const movimientos = await MovimientosInventarioModel.listar(organizacionId, filtros);

        return ResponseHelper.success(res, movimientos, 'Movimientos obtenidos exitosamente');
    });

    /**
     * Obtener estadísticas de movimientos
     * GET /api/v1/inventario/movimientos/estadisticas
     */
    static obtenerEstadisticas = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const { fecha_desde, fecha_hasta } = req.query;

        if (!fecha_desde || !fecha_hasta) {
            return ResponseHelper.error(
                res,
                'fecha_desde y fecha_hasta son requeridas',
                400
            );
        }

        const estadisticas = await MovimientosInventarioModel.obtenerEstadisticas(
            organizacionId,
            fecha_desde,
            fecha_hasta
        );

        return ResponseHelper.success(res, estadisticas, 'Estadísticas obtenidas exitosamente');
    });
}

module.exports = MovimientosInventarioController;

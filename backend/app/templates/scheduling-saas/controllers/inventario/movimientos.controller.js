const { MovimientosInventarioModel } = require('../../models/inventario');
const { ResponseHelper } = require('../../../../utils/helpers');
const { asyncHandler } = require('../../../../middleware');

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

        const filtros = {
            tipo_movimiento: req.query.tipo_movimiento || undefined,
            fecha_desde: req.query.fecha_desde || undefined,
            fecha_hasta: req.query.fecha_hasta || undefined,
            proveedor_id: req.query.proveedor_id ? parseInt(req.query.proveedor_id) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : 100,
            offset: req.query.offset ? parseInt(req.query.offset) : 0
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

        const filtros = {
            tipo_movimiento: req.query.tipo_movimiento || undefined,
            categoria: req.query.categoria || undefined, // 'entrada' o 'salida'
            producto_id: req.query.producto_id ? parseInt(req.query.producto_id) : undefined,
            proveedor_id: req.query.proveedor_id ? parseInt(req.query.proveedor_id) : undefined,
            fecha_desde: req.query.fecha_desde || undefined,
            fecha_hasta: req.query.fecha_hasta || undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : 50,
            offset: req.query.offset ? parseInt(req.query.offset) : 0
        };

        const movimientos = await MovimientosInventarioModel.listar(filtros, organizacionId);

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

const { ReportesInventarioModel } = require('../../models/inventario');
const { ResponseHelper } = require('../../../../utils/helpers');
const { asyncHandler } = require('../../../../middleware');

/**
 * Controller para reportes y analytics de inventario
 * Reportes de valor, ABC, rotación y alertas
 */
class ReportesInventarioController {

    /**
     * Obtener valor total del inventario
     * GET /api/v1/inventario/reportes/valor-inventario
     */
    static obtenerValorInventario = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const reporte = await ReportesInventarioModel.obtenerValorInventario(organizacionId);

        return ResponseHelper.success(
            res,
            reporte,
            'Valor del inventario calculado exitosamente'
        );
    });

    /**
     * Análisis ABC de productos (Pareto)
     * GET /api/v1/inventario/reportes/analisis-abc
     */
    static obtenerAnalisisABC = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            fecha_desde: req.query.fecha_desde,
            fecha_hasta: req.query.fecha_hasta,
            categoria_id: req.query.categoria_id ? parseInt(req.query.categoria_id) : undefined
        };

        const reporte = await ReportesInventarioModel.obtenerAnalisisABC(filtros, organizacionId);

        return ResponseHelper.success(
            res,
            reporte,
            'Análisis ABC generado exitosamente'
        );
    });

    /**
     * Reporte de rotación de inventario
     * GET /api/v1/inventario/reportes/rotacion
     */
    static obtenerRotacion = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            fecha_desde: req.query.fecha_desde,
            fecha_hasta: req.query.fecha_hasta,
            categoria_id: req.query.categoria_id ? parseInt(req.query.categoria_id) : undefined,
            top: req.query.top ? parseInt(req.query.top) : 20
        };

        const reporte = await ReportesInventarioModel.obtenerRotacion(filtros, organizacionId);

        return ResponseHelper.success(
            res,
            reporte,
            'Reporte de rotación generado exitosamente'
        );
    });

    /**
     * Resumen de alertas de inventario
     * GET /api/v1/inventario/reportes/alertas
     */
    static obtenerResumenAlertas = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const reporte = await ReportesInventarioModel.obtenerResumenAlertas(organizacionId);

        return ResponseHelper.success(
            res,
            reporte,
            'Resumen de alertas generado exitosamente'
        );
    });
}

module.exports = ReportesInventarioController;

const { ComisionesModel, ReportesComisionesModel } = require('../models');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');

/**
 * Controller para métricas y estadísticas de comisiones
 * Dashboard y visualización de datos agregados
 */
class EstadisticasComisionesController {

    /**
     * Obtener métricas para dashboard
     * GET /api/v1/comisiones/dashboard
     */
    static metricasDashboard = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const profesionalId = req.query.profesional_id && req.query.profesional_id !== ''
            ? parseInt(req.query.profesional_id)
            : undefined;

        const filtros = {
            fecha_desde: req.query.fecha_desde || undefined,
            fecha_hasta: req.query.fecha_hasta || undefined,
            profesional_id: profesionalId
        };

        const metricas = await ReportesComisionesModel.metricasDashboard(filtros, organizacionId);

        return ResponseHelper.success(
            res,
            metricas,
            'Métricas de dashboard obtenidas exitosamente'
        );
    });

    /**
     * Obtener estadísticas básicas de comisiones
     * GET /api/v1/comisiones/estadisticas
     */
    static estadisticasBasicas = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const profesionalId = req.query.profesional_id && req.query.profesional_id !== ''
            ? parseInt(req.query.profesional_id)
            : undefined;

        const filtros = {
            fecha_desde: req.query.fecha_desde || undefined,
            fecha_hasta: req.query.fecha_hasta || undefined,
            profesional_id: profesionalId
        };

        const stats = await ComisionesModel.obtenerEstadisticas(filtros, organizacionId);

        return ResponseHelper.success(
            res,
            stats,
            'Estadísticas obtenidas exitosamente'
        );
    });

    /**
     * Obtener datos para gráfica de comisiones por día
     * GET /api/v1/comisiones/grafica/por-dia
     */
    static graficaPorDia = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const profesionalId = req.query.profesional_id && req.query.profesional_id !== ''
            ? parseInt(req.query.profesional_id)
            : undefined;

        const filtros = {
            fecha_desde: req.query.fecha_desde,
            fecha_hasta: req.query.fecha_hasta,
            profesional_id: profesionalId
        };

        // Validar que se proporcionen las fechas
        if (!filtros.fecha_desde || !filtros.fecha_hasta) {
            return ResponseHelper.error(
                res,
                'Se requieren fecha_desde y fecha_hasta para generar la gráfica',
                400
            );
        }

        const datos = await ReportesComisionesModel.comisionesPorDia(filtros, organizacionId);

        return ResponseHelper.success(
            res,
            { grafica: datos },
            'Datos para gráfica obtenidos exitosamente'
        );
    });
}

module.exports = EstadisticasComisionesController;

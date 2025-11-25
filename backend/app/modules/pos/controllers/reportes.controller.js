const { ReportesPOSModel } = require('../models');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');
const ModulesCache = require('../../../core/ModulesCache');

/**
 * Controller para reportes de POS
 * Reportes de ventas diarias y analytics
 */
class ReportesPOSController {

    /**
     * Reporte de ventas diarias
     * GET /api/v1/pos/reportes/ventas-diarias
     */
    static obtenerVentasDiarias = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        // Verificar si módulo agendamiento está activo para incluir JOINs
        const modulosActivos = await ModulesCache.get(organizacionId);
        const incluirAgendamiento = modulosActivos?.agendamiento === true;

        const filtros = {
            profesional_id: req.query.profesional_id ? parseInt(req.query.profesional_id) : undefined,
            usuario_id: req.query.usuario_id ? parseInt(req.query.usuario_id) : undefined
        };

        const reporte = await ReportesPOSModel.obtenerVentasDiarias(
            req.query.fecha,
            organizacionId,
            filtros,
            { incluirAgendamiento }
        );

        return ResponseHelper.success(
            res,
            reporte,
            'Reporte de ventas diarias generado exitosamente'
        );
    });
}

module.exports = ReportesPOSController;

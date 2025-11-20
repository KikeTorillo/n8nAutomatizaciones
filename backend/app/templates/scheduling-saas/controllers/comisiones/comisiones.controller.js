const { ComisionesModel, ReportesComisionesModel } = require('../../models/comisiones');
const { ResponseHelper } = require('../../../../utils/helpers');
const { asyncHandler } = require('../../../../middleware');

/**
 * Controller para consultas y operaciones de comisiones profesionales
 * Maneja las comisiones generadas automáticamente por el trigger
 */
class ComisionesController {

    /**
     * Listar comisiones de un profesional
     * GET /api/v1/comisiones/profesional/:id
     */
    static listarPorProfesional = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            estado_pago: req.query.estado_pago || undefined,
            fecha_desde: req.query.fecha_desde || undefined,
            fecha_hasta: req.query.fecha_hasta || undefined,
            pagina: req.query.pagina ? parseInt(req.query.pagina) : 1,
            limite: req.query.limite ? parseInt(req.query.limite) : 20
        };

        const resultado = await ComisionesModel.listarPorProfesional(
            parseInt(id),
            filtros,
            organizacionId
        );

        return ResponseHelper.success(
            res,
            resultado,
            'Comisiones obtenidas exitosamente'
        );
    });

    /**
     * Consultar comisiones por período
     * GET /api/v1/comisiones/periodo
     */
    static consultarPorPeriodo = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            fecha_desde: req.query.fecha_desde,
            fecha_hasta: req.query.fecha_hasta,
            profesional_id: req.query.profesional_id ? parseInt(req.query.profesional_id) : undefined,
            estado_pago: req.query.estado_pago || undefined
        };

        const comisiones = await ComisionesModel.consultarPorPeriodo(filtros, organizacionId);

        return ResponseHelper.success(
            res,
            comisiones,
            'Comisiones del período obtenidas exitosamente'
        );
    });

    /**
     * Marcar comisión como pagada
     * PATCH /api/v1/comisiones/:id/pagar
     */
    static marcarComoPagada = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;
        const userId = req.user.id;

        const datosPago = {
            ...req.body,
            pagado_por: userId
        };

        const comisionActualizada = await ComisionesModel.marcarComoPagada(
            parseInt(id),
            datosPago,
            organizacionId
        );

        return ResponseHelper.success(
            res,
            comisionActualizada,
            'Comisión marcada como pagada exitosamente'
        );
    });

    /**
     * Obtener comisión por ID
     * GET /api/v1/comisiones/:id
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const comision = await ComisionesModel.obtenerPorId(parseInt(id), organizacionId);

        if (!comision) {
            return ResponseHelper.error(res, 'Comisión no encontrada', 404);
        }

        return ResponseHelper.success(res, comision, 'Comisión obtenida exitosamente');
    });

    /**
     * Generar reporte de comisiones
     * GET /api/v1/comisiones/reporte
     */
    static generarReporte = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            fecha_desde: req.query.fecha_desde,
            fecha_hasta: req.query.fecha_hasta,
            profesional_id: req.query.profesional_id ? parseInt(req.query.profesional_id) : undefined,
            estado_pago: req.query.estado_pago || undefined
        };

        const tipo = req.query.tipo || 'por_profesional';
        const formato = req.query.formato || 'json';

        let reporte;

        switch (tipo) {
            case 'por_profesional':
                reporte = await ReportesComisionesModel.reportePorProfesional(filtros, organizacionId);
                break;

            case 'detallado':
                reporte = await ReportesComisionesModel.detalleParaExportacion(filtros, organizacionId);
                break;

            case 'por_dia':
                reporte = await ReportesComisionesModel.comisionesPorDia(filtros, organizacionId);
                break;

            default:
                return ResponseHelper.error(res, 'Tipo de reporte no válido', 400);
        }

        // TODO: Implementar exportación Excel/PDF cuando se agreguen las librerías
        if (formato === 'excel' || formato === 'pdf') {
            return ResponseHelper.error(
                res,
                `Exportación a ${formato.toUpperCase()} pendiente de implementar`,
                501
            );
        }

        return ResponseHelper.success(res, reporte, 'Reporte generado exitosamente');
    });
}

module.exports = ComisionesController;

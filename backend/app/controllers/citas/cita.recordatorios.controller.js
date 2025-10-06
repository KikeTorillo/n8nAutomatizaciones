const CitaModel = require('../../database/citas');
const { ResponseHelper } = require('../../utils/helpers');
const { asyncHandler } = require('../../middleware');

class CitaRecordatoriosController {

    static obtenerRecordatorios = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const horasAnticipacion = parseInt(req.query.horas_anticipacion) || 2;
        const citasRecordatorio = await CitaModel.obtenerCitasParaRecordatorio(organizacionId, horasAnticipacion);

        return ResponseHelper.success(res, {
            citas: citasRecordatorio,
            meta: {
                total: citasRecordatorio.length,
                horas_anticipacion: horasAnticipacion
            }
        }, `${citasRecordatorio.length} citas requieren recordatorio`);
    });

    static marcarRecordatorioEnviado = asyncHandler(async (req, res) => {
        const { codigo } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const marcado = await CitaModel.marcarRecordatorioEnviado(codigo, organizacionId);

        if (!marcado) {
            return ResponseHelper.error(res, 'Cita no encontrada o recordatorio ya enviado', 404);
        }

        return ResponseHelper.success(res, null, 'Recordatorio marcado como enviado');
    });

    static calificarCliente = asyncHandler(async (req, res) => {
        const { codigo } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const calificacion = {
            puntuacion: req.body.puntuacion,
            comentario: req.body.comentario,
            profesional_id: req.user.id
        };

        const resultado = await CitaModel.calificarCliente(codigo, organizacionId, calificacion);

        return ResponseHelper.success(res, resultado, 'Calificación registrada exitosamente');
    });
}

module.exports = CitaRecordatoriosController;

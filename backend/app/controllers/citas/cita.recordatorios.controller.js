/**
 * Controller de Recordatorios de Citas - Sistemas auxiliares y notificaciones
 * Recordatorios, calificaciones, eventos del sistema
 */

const CitaModel = require('../../database/citas');
const logger = require('../../utils/logger');
const { ResponseHelper } = require('../../utils/helpers');

class CitaRecordatoriosController {

    /**
     * Obtener citas para recordatorio
     * Endpoint para sistemas automatizados de notificaciones
     */
    static async obtenerRecordatorios(req, res) {
        try {
            const organizacionId = req.tenant.organizacionId; // Del middleware tenant
            const horasAnticipacion = parseInt(req.query.horas_anticipacion) || 2;
            const citasRecordatorio = await CitaModel.obtenerCitasParaRecordatorio(organizacionId, horasAnticipacion);

            logger.info('Recordatorios obtenidos exitosamente', {
                organizacion_id: organizacionId,
                total_citas: citasRecordatorio.length,
                horas_anticipacion: horasAnticipacion
            });

            ResponseHelper.success(res, {
                citas: citasRecordatorio,
                meta: {
                    total: citasRecordatorio.length,
                    horas_anticipacion: horasAnticipacion
                }
            }, `${citasRecordatorio.length} citas requieren recordatorio`);

        } catch (error) {
            logger.error('Error al obtener recordatorios:', {
                error: error.message,
                stack: error.stack,
                query: req.query,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Marcar recordatorio como enviado
     * Endpoint para sistemas de notificaciones
     */
    static async marcarRecordatorioEnviado(req, res) {
        try {
            const { codigo } = req.params;
            const organizacionId = req.tenant.organizacionId; // Del middleware tenant

            const marcado = await CitaModel.marcarRecordatorioEnviado(codigo, organizacionId);

            if (marcado) {
                logger.info('Recordatorio marcado como enviado', {
                    codigo_cita: codigo,
                    organizacion_id: organizacionId,
                    usuario_marcador: req.user.id
                });

                ResponseHelper.success(res, null, 'Recordatorio marcado como enviado');
            } else {
                ResponseHelper.error(res, 'Cita no encontrada o recordatorio ya enviado', 404);
            }

        } catch (error) {
            logger.error('Error al marcar recordatorio:', {
                error: error.message,
                stack: error.stack,
                codigo: req.params.codigo,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Calificar cliente (por profesional)
     * Endpoint para sistemas de feedback profesional
     */
    static async calificarCliente(req, res) {
        try {
            const { codigo } = req.params;
            const organizacionId = req.tenant.organizacionId; // Del middleware tenant

            const calificacion = {
                puntuacion: req.body.puntuacion,
                comentario: req.body.comentario,
                profesional_id: req.user.id // El usuario autenticado debe ser el profesional
            };

            if (!calificacion.puntuacion || calificacion.puntuacion < 1 || calificacion.puntuacion > 5) {
                return ResponseHelper.error(res, 'La puntuación debe ser entre 1 y 5', 400);
            }

            const resultado = await CitaModel.calificarCliente(codigo, organizacionId, calificacion);

            logger.info('Cliente calificado exitosamente', {
                codigo_cita: codigo,
                organizacion_id: organizacionId,
                calificacion: calificacion.puntuacion,
                profesional_id: req.user.id
            });

            ResponseHelper.success(res, resultado, 'Calificación registrada exitosamente');

        } catch (error) {
            logger.error('Error al calificar cliente:', {
                error: error.message,
                stack: error.stack,
                codigo: req.params.codigo,
                calificacion: req.body,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, error.message || 'Error interno del servidor', 500);
        }
    }
}

module.exports = CitaRecordatoriosController;
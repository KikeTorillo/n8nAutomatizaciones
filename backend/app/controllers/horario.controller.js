
const { HorarioModel } = require('../database');
const logger = require('../utils/logger');
const { ResponseHelper } = require('../utils/helpers');
const HorarioHelpers = require('../utils/horarioHelpers');

class HorarioController {

    /**
     * Obtener disponibilidad de horarios (endpoint público para IA)
     * Validaciones Joi ya procesaron y convirtieron tipos
     */
    static async obtenerDisponibilidad(req, res) {
        try {
            const filtros = {
                organizacion_id: req.query.organizacion_id,
                profesional_id: req.query.profesional_id || null,
                servicio_id: req.query.servicio_id || null,
                fecha_inicio: req.query.fecha_inicio || null,
                fecha_fin: req.query.fecha_fin || null,
                dias_semana: req.query.dias_semana ? req.query.dias_semana.split(',') : null,
                hora_inicio: req.query.hora_inicio || null,
                hora_fin: req.query.hora_fin || null,
                duracion_servicio: req.query.duracion_servicio || 30,
                limite: req.query.limite || 50
            };

            const horarios = await HorarioModel.consultarDisponibilidad(filtros);

            ResponseHelper.success(res, horarios, 'Horarios disponibles obtenidos');

        } catch (error) {
            logger.error('Error obteniendo disponibilidad:', error);
            ResponseHelper.error(res, 'Error interno', 500);
        }
    }

    /**
     * Obtener disponibilidad con procesamiento NLP (endpoint IA)
     * Validaciones Joi ya procesaron parámetros
     * Helpers procesan la lógica NLP
     */
    static async obtenerDisponibilidadInteligente(req, res) {
        try {
            // Procesar texto natural de fecha
            const { fecha_inicio, fecha_fin } = HorarioHelpers.procesarFechaTexto(req.query.fecha_texto);

            // Determinar servicio_id (si es número, usarlo; si no, ignorar por ahora)
            let servicio_id = null;
            if (req.query.servicio && !isNaN(parseInt(req.query.servicio))) {
                servicio_id = parseInt(req.query.servicio);
            }

            const filtros = {
                organizacion_id: req.query.organizacion_id,
                servicio_id: servicio_id || null,
                fecha_inicio,
                fecha_fin,
                turno_preferido: req.query.turno || null,
                duracion_servicio: 30,
                limite: 20
            };

            const horarios = await HorarioModel.consultarDisponibilidad(filtros);

            // Formatear respuesta para IA
            const respuestaIA = HorarioHelpers.formatearParaIA(horarios);

            ResponseHelper.success(res, respuestaIA, 'Disponibilidad para IA');

        } catch (error) {
            logger.error('Error obteniendo disponibilidad inteligente:', error);
            ResponseHelper.error(res, 'Error interno', 500);
        }
    }

    /**
     * Reservar horario temporalmente (endpoint IA)
     * Validaciones Joi ya procesaron body
     */
    static async reservarTemporalmente(req, res) {
        try {
            const resultado = await HorarioModel.reservarTemporalmente(
                req.body.horario_id,
                req.body.organizacion_id,
                req.body.duracion_minutos || 15,
                req.body.motivo_reserva || 'Reserva IA'
            );

            ResponseHelper.success(res, resultado, 'Horario reservado temporalmente');

        } catch (error) {
            logger.error('Error reservando horario temporalmente:', error);
            ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Crear horario
     * Middleware tenant.setTenantContext ya determinó organizacion_id
     * Validaciones Joi ya procesaron y sanitizaron req.body
     */
    static async crear(req, res) {
        try {
            const datosHorario = {
                organizacion_id: req.tenant.organizacionId,
                ...req.body
            };

            // Información de auditoría
            const auditoria = {
                usuario_id: req.user.id,
                ip_origen: req.ip,
                user_agent: req.get('User-Agent')
            };

            const horarioCreado = await HorarioModel.crear(datosHorario, auditoria);

            ResponseHelper.success(res, horarioCreado, 'Horario creado exitosamente', 201);

        } catch (error) {
            logger.error('Error creando horario:', error);

            if (error.message.includes('conflicto') ||
                error.message.includes('no existe') ||
                error.message.includes('no pertenece')) {
                ResponseHelper.error(res, error.message, 400);
            } else {
                ResponseHelper.error(res, 'Error interno creando horario', 500);
            }
        }
    }

    /**
     * Obtener horarios con filtros
     * Middleware tenant.setTenantContext ya determinó organizacion_id
     * Validaciones Joi ya procesaron filtros
     */
    static async obtener(req, res) {
        try {
            const filtros = {
                organizacion_id: req.tenant.organizacionId,
                id: req.params.id || req.query.id || null,
                profesional_id: req.query.profesional_id || null,
                fecha: req.query.fecha || null,
                estado: req.query.estado || null,
                limite: req.query.limite || 50,
                offset: req.query.offset || 0
            };

            const resultado = await HorarioModel.obtener(filtros);

            ResponseHelper.success(res, resultado, 'Horarios obtenidos exitosamente');

        } catch (error) {
            logger.error('Error obteniendo horarios:', error);
            ResponseHelper.error(res, 'Error interno obteniendo horarios', 500);
        }
    }

    /**
     * Actualizar horario
     * Middleware tenant.setTenantContext ya determinó organizacion_id
     * Validaciones Joi ya validaron campos y formatos
     */
    static async actualizar(req, res) {
        try {
            const horarioId = req.params.id;

            // Información de auditoría
            const auditoria = {
                usuario_id: req.user.id,
                ip_origen: req.ip,
                user_agent: req.get('User-Agent')
            };

            const horarioActualizado = await HorarioModel.actualizar(
                horarioId,
                req.tenant.organizacionId,
                req.body,
                auditoria
            );

            ResponseHelper.success(res, horarioActualizado, 'Horario actualizado exitosamente');

        } catch (error) {
            logger.error('Error actualizando horario:', error);

            if (error.message.includes('no encontrado') ||
                error.message.includes('sin permisos') ||
                error.message.includes('conflicto') ||
                error.message.includes('No hay campos')) {
                ResponseHelper.error(res, error.message, 400);
            } else {
                ResponseHelper.error(res, 'Error interno actualizando horario', 500);
            }
        }
    }

    /**
     * Eliminar horario (lógicamente)
     * Middleware tenant.setTenantContext ya determinó organizacion_id
     */
    static async eliminar(req, res) {
        try {
            const horarioId = req.params.id;

            // Información de auditoría
            const auditoria = {
                usuario_id: req.user.id,
                ip_origen: req.ip,
                user_agent: req.get('User-Agent')
            };

            const resultado = await HorarioModel.eliminar(horarioId, req.tenant.organizacionId, auditoria);

            ResponseHelper.success(res, resultado, 'Horario eliminado exitosamente');

        } catch (error) {
            logger.error('Error eliminando horario:', error);

            if (error.message.includes('no encontrado') ||
                error.message.includes('sin permisos') ||
                error.message.includes('No se puede eliminar')) {
                ResponseHelper.error(res, error.message, 400);
            } else {
                ResponseHelper.error(res, 'Error interno eliminando horario', 500);
            }
        }
    }

    /**
     * Liberar reserva temporal
     * Middleware tenant.setTenantContext ya determinó organizacion_id (si autenticado)
     * Para endpoints públicos, organizacion_id viene en body validado por Joi
     */
    static async liberarReservaTemporal(req, res) {
        try {
            const organizacion_id = req.tenant?.organizacionId || req.body.organizacion_id;

            const resultado = await HorarioModel.liberarReservaTemporalHorario(
                req.body.horario_id,
                organizacion_id
            );

            if (resultado) {
                ResponseHelper.success(res, {
                    success: true,
                    mensaje: 'Reserva liberada exitosamente'
                }, 'Reserva temporal liberada');
            } else {
                ResponseHelper.error(res, 'No se pudo liberar la reserva', 400);
            }

        } catch (error) {
            logger.error('Error liberando reserva temporal:', error);
            ResponseHelper.error(res, 'Error interno', 500);
        }
    }

    /**
     * Limpiar reservas expiradas (mantenimiento)
     * Middleware tenant.setTenantContext ya determinó organizacion_id
     * Validaciones Joi ya procesaron body
     */
    static async limpiarReservasExpiradas(req, res) {
        try {
            const organizacion_id = req.tenant?.organizacionId || req.body.organizacion_id;

            const cantidad = await HorarioModel.limpiarReservasExpiradas(organizacion_id);

            ResponseHelper.success(res, {
                reservas_limpiadas: cantidad,
                mensaje: `Se limpiaron ${cantidad} reservas expiradas`
            }, 'Reservas expiradas limpiadas');

        } catch (error) {
            logger.error('Error limpiando reservas expiradas:', error);
            ResponseHelper.error(res, 'Error interno', 500);
        }
    }
}

module.exports = HorarioController;
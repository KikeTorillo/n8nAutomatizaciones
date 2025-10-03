/**
 * Controller Base de Citas - CRUD estándar autenticado
 * Operaciones básicas para frontend/mobile con validaciones completas
 */

const CitaModel = require('../../database/citas');
const logger = require('../../utils/logger');
const { ResponseHelper } = require('../../utils/helpers');

class CitaBaseController {

    /**
     * Crear cita estándar (requiere autenticación)
     * Endpoint para uso desde frontend/mobile con validaciones completas
     */
    static async crear(req, res) {
        try {
            const citaData = {
                ...req.body,
                organizacion_id: req.tenant.organizacionId // Del middleware tenant
            };

            // Crear cita usando método estándar del modelo
            const nuevaCita = await CitaModel.crearEstandar(citaData, req.user.id);

            logger.info('Cita creada via endpoint estándar', {
                cita_id: nuevaCita.id,
                codigo_cita: nuevaCita.codigo_cita,
                organizacion_id: citaData.organizacion_id,
                cliente_id: citaData.cliente_id,
                profesional_id: citaData.profesional_id,
                usuario_creador: req.user.id
            });

            ResponseHelper.success(res, nuevaCita, 'Cita creada exitosamente', 201);

        } catch (error) {
            logger.error('Error al crear cita via endpoint estándar:', {
                error: error.message,
                stack: error.stack,
                body: req.body,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            if (error.message.includes('no existe') || error.message.includes('no encontrado')) {
                return ResponseHelper.error(res, error.message, 404);
            }

            if (error.message.includes('ya ocupado') || error.message.includes('conflicto')) {
                return ResponseHelper.error(res, error.message, 409);
            }

            if (error.message.includes('validación') || error.message.includes('inválido')) {
                return ResponseHelper.error(res, error.message, 400);
            }

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Obtener cita por ID (requiere autenticación)
     * Endpoint para uso desde frontend/mobile
     */
    static async obtener(req, res) {
        try {
            const { id } = req.params;
            const organizacionId = req.tenant.organizacionId; // Del middleware tenant

            const cita = await CitaModel.obtenerPorId(parseInt(id), organizacionId);

            if (!cita) {
                return ResponseHelper.error(res, 'Cita no encontrada', 404);
            }

            ResponseHelper.success(res, cita, 'Cita obtenida exitosamente');

        } catch (error) {
            logger.error('Error al obtener cita por ID via endpoint estándar:', {
                error: error.message,
                stack: error.stack,
                cita_id: req.params.id,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Actualizar cita (requiere autenticación)
     * Endpoint para uso desde frontend/mobile
     */
    static async actualizar(req, res) {
        try {
            const { id } = req.params;
            const organizacionId = req.tenant.organizacionId; // Del middleware tenant
            const citaData = req.body;

            const citaActualizada = await CitaModel.actualizarEstandar(parseInt(id), citaData, organizacionId, req.user.id);

            if (!citaActualizada) {
                return ResponseHelper.error(res, 'Cita no encontrada', 404);
            }

            logger.info('Cita actualizada via endpoint estándar', {
                cita_id: citaActualizada.id,
                codigo_cita: citaActualizada.codigo_cita,
                organizacion_id: organizacionId,
                usuario_actualizador: req.user.id
            });

            ResponseHelper.success(res, citaActualizada, 'Cita actualizada exitosamente');

        } catch (error) {
            logger.error('Error al actualizar cita via endpoint estándar:', {
                error: error.message,
                stack: error.stack,
                cita_id: req.params.id,
                body: req.body,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            if (error.message.includes('no puede ser modificada')) {
                return ResponseHelper.error(res, error.message, 400);
            }

            if (error.message.includes('no encontrada')) {
                return ResponseHelper.error(res, error.message, 404);
            }

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Eliminar/cancelar cita (requiere autenticación)
     * Endpoint para uso desde frontend/mobile
     */
    static async eliminar(req, res) {
        try {
            const { id } = req.params;
            const organizacionId = req.tenant.organizacionId; // Del middleware tenant

            const eliminada = await CitaModel.eliminarEstandar(parseInt(id), organizacionId, req.user.id);

            if (!eliminada) {
                return ResponseHelper.error(res, 'Cita no encontrada', 404);
            }

            logger.info('Cita eliminada via endpoint estándar', {
                cita_id: parseInt(id),
                organizacion_id: organizacionId,
                usuario_eliminador: req.user.id
            });

            ResponseHelper.success(res, null, 'Cita cancelada exitosamente');

        } catch (error) {
            logger.error('Error al eliminar cita via endpoint estándar:', {
                error: error.message,
                stack: error.stack,
                cita_id: req.params.id,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            if (error.message.includes('no puede ser cancelada')) {
                return ResponseHelper.error(res, error.message, 400);
            }

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Confirmar asistencia a cita
     * Endpoint para uso desde frontend/mobile
     */
    static async confirmarAsistencia(req, res) {
        try {
            const { id } = req.params;
            const organizacionId = req.tenant.organizacionId; // Del middleware tenant

            const resultado = await CitaModel.confirmarAsistenciaEstandar(parseInt(id), organizacionId, req.user.id);

            if (!resultado.exito) {
                return ResponseHelper.error(res, resultado.mensaje || 'No se pudo confirmar asistencia', 400);
            }

            logger.info('Asistencia confirmada via endpoint estándar', {
                cita_id: parseInt(id),
                organizacion_id: organizacionId,
                usuario_confirmador: req.user.id
            });

            ResponseHelper.success(res, resultado, 'Asistencia confirmada exitosamente');

        } catch (error) {
            logger.error('Error al confirmar asistencia via endpoint estándar:', {
                error: error.message,
                stack: error.stack,
                cita_id: req.params.id,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Listar citas con filtros y paginación
     * Endpoint para uso desde frontend/mobile
     */
    static async listar(req, res) {
        try {
            const organizacionId = req.tenant.organizacionId; // Del middleware tenant

            // Parámetros de paginación y filtros (estandarizado REST: page/limit)
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            const orden = req.query.orden || 'fecha_cita';
            const direccion = req.query.direccion || 'DESC';

            const filtros = {
                organizacion_id: organizacionId,
                estado: req.query.estado,
                fecha_desde: req.query.fecha_desde,
                fecha_hasta: req.query.fecha_hasta,
                cliente_id: req.query.cliente_id ? parseInt(req.query.cliente_id) : null,
                profesional_id: req.query.profesional_id ? parseInt(req.query.profesional_id) : null,
                servicio_id: req.query.servicio_id ? parseInt(req.query.servicio_id) : null,
                busqueda: req.query.busqueda,
                limite: limit,
                offset,
                orden,
                direccion
            };

            const resultado = await CitaModel.listarConFiltros(filtros);

            logger.info('Citas listadas via endpoint estándar', {
                organizacion_id: organizacionId,
                total_resultados: resultado.total,
                page: page,
                usuario_consultor: req.user.id
            });

            ResponseHelper.success(res, {
                citas: resultado.citas,
                meta: {
                    total: resultado.total,
                    page: page,
                    limit: limit,
                    total_pages: Math.ceil(resultado.total / limit),
                    has_next: page * limit < resultado.total,
                    has_prev: page > 1
                }
            }, 'Citas obtenidas exitosamente');

        } catch (error) {
            logger.error('Error al listar citas via endpoint estándar:', {
                error: error.message,
                stack: error.stack,
                query: req.query,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }
}

module.exports = CitaBaseController;
/**
 * ====================================================================
 * CONTROLLER - EVENTOS DIGITALES
 * ====================================================================
 * Controlador para gestión de eventos con invitaciones digitales.
 *
 * ENDPOINTS (7):
 * - POST   /eventos              - Crear evento
 * - GET    /eventos              - Listar eventos
 * - GET    /eventos/:id          - Obtener evento por ID
 * - PUT    /eventos/:id          - Actualizar evento
 * - POST   /eventos/:id/publicar - Publicar evento
 * - GET    /eventos/:id/estadisticas - Estadísticas del evento
 * - DELETE /eventos/:id          - Eliminar evento
 *
 * NO MIGRADO A BaseCrudController - Ene 2026
 * Razón: Métodos custom publicar() y estadisticas(), lógica de
 * estados de evento, no sigue firma estándar del Model.
 *
 * Fecha creación: 4 Diciembre 2025
 */

const EventoModel = require('../models/evento.model');
const logger = require('../../../utils/logger');
const { ResponseHelper } = require('../../../utils/helpers');

class EventosController {

    /**
     * Crear evento
     * POST /api/v1/eventos-digitales/eventos
     */
    static async crear(req, res) {
        try {
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;
            const datos = {
                ...req.body,
                organizacion_id: organizacionId
            };

            const evento = await EventoModel.crear(datos);

            logger.info('[EventosController.crear] Evento creado', {
                evento_id: evento.id,
                organizacion_id: organizacionId,
                usuario_id: req.user.id
            });

            return ResponseHelper.success(res, evento, 'Evento creado exitosamente', 201);

        } catch (error) {
            logger.error('[EventosController.crear] Error', {
                error: error.message,
                stack: error.stack
            });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Listar eventos de la organización
     * GET /api/v1/eventos-digitales/eventos
     */
    static async listar(req, res) {
        try {
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;
            const filtros = req.query;

            const resultado = await EventoModel.listar(organizacionId, filtros);

            return ResponseHelper.success(res, resultado);

        } catch (error) {
            logger.error('[EventosController.listar] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Obtener evento por ID
     * GET /api/v1/eventos-digitales/eventos/:id
     */
    static async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            const evento = await EventoModel.obtenerPorId(parseInt(id), organizacionId);

            if (!evento) {
                return ResponseHelper.error(res, 'Evento no encontrado', 404);
            }

            return ResponseHelper.success(res, evento);

        } catch (error) {
            logger.error('[EventosController.obtenerPorId] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Actualizar evento
     * PUT /api/v1/eventos-digitales/eventos/:id
     */
    static async actualizar(req, res) {
        try {
            const { id } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            const evento = await EventoModel.actualizar(parseInt(id), req.body, organizacionId);

            if (!evento) {
                return ResponseHelper.error(res, 'Evento no encontrado', 404);
            }

            logger.info('[EventosController.actualizar] Evento actualizado', {
                evento_id: id,
                usuario_id: req.user.id
            });

            return ResponseHelper.success(res, evento, 'Evento actualizado exitosamente');

        } catch (error) {
            logger.error('[EventosController.actualizar] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Publicar evento
     * POST /api/v1/eventos-digitales/eventos/:id/publicar
     */
    static async publicar(req, res) {
        try {
            const { id } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            const evento = await EventoModel.publicar(parseInt(id), organizacionId);

            logger.info('[EventosController.publicar] Evento publicado', {
                evento_id: id,
                usuario_id: req.user.id
            });

            return ResponseHelper.success(res, evento, 'Evento publicado exitosamente');

        } catch (error) {
            logger.error('[EventosController.publicar] Error', { error: error.message });

            if (error.message.includes('no encontrado') || error.message.includes('no está en estado')) {
                return ResponseHelper.error(res, error.message, 400);
            }

            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Obtener estadísticas del evento
     * GET /api/v1/eventos-digitales/eventos/:id/estadisticas
     */
    static async estadisticas(req, res) {
        try {
            const { id } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            const estadisticas = await EventoModel.obtenerEstadisticas(parseInt(id), organizacionId);

            return ResponseHelper.success(res, estadisticas);

        } catch (error) {
            logger.error('[EventosController.estadisticas] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Eliminar evento (soft delete)
     * DELETE /api/v1/eventos-digitales/eventos/:id
     */
    static async eliminar(req, res) {
        try {
            const { id } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            const eliminado = await EventoModel.eliminar(parseInt(id), organizacionId);

            if (!eliminado) {
                return ResponseHelper.error(res, 'Evento no encontrado', 404);
            }

            logger.info('[EventosController.eliminar] Evento eliminado', {
                evento_id: id,
                usuario_id: req.user.id
            });

            return ResponseHelper.success(res, { id: parseInt(id) }, 'Evento eliminado exitosamente');

        } catch (error) {
            logger.error('[EventosController.eliminar] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }
}

module.exports = EventosController;

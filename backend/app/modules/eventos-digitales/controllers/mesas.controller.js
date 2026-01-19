/**
 * ====================================================================
 * CONTROLLER - MESAS (Seating Chart)
 * ====================================================================
 * Controlador para gestión de mesas y asignación de invitados.
 *
 * ENDPOINTS (9):
 * - POST   /eventos/:eventoId/mesas                  - Crear mesa
 * - GET    /eventos/:eventoId/mesas                  - Listar mesas
 * - GET    /mesas/:mesaId                            - Obtener mesa
 * - PUT    /eventos/:eventoId/mesas/:mesaId          - Actualizar mesa
 * - DELETE /mesas/:mesaId                            - Eliminar mesa
 * - PATCH  /eventos/:eventoId/mesas/posiciones       - Batch update posiciones
 * - POST   /eventos/:eventoId/mesas/:mesaId/asignar  - Asignar invitado
 * - DELETE /invitados/:invitadoId/mesa               - Desasignar invitado
 * - GET    /eventos/:eventoId/mesas/estadisticas     - Estadísticas
 *
 * NO MIGRADO A BaseCrudController - Ene 2026
 * Razón: Depende de eventoId, 4 métodos custom (actualizarPosiciones,
 * asignarInvitado, desasignarInvitado, estadísticas), lógica de
 * seating chart con capacidad y validaciones.
 *
 * Fecha creación: 8 Diciembre 2025
 */

const MesaModel = require('../models/mesa.model');
const EventoModel = require('../models/evento.model');
const logger = require('../../../utils/logger');
const { ResponseHelper } = require('../../../utils/helpers');

class MesasController {

    /**
     * Crear mesa
     * POST /api/v1/eventos-digitales/eventos/:eventoId/mesas
     */
    static async crear(req, res) {
        try {
            const { eventoId } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            // Verificar que el evento existe y pertenece a la organización
            const evento = await EventoModel.obtenerPorId(parseInt(eventoId), organizacionId);
            if (!evento) {
                return ResponseHelper.error(res, 'Evento no encontrado', 404);
            }

            const mesa = await MesaModel.crear({
                ...req.body,
                evento_id: parseInt(eventoId),
                organizacion_id: organizacionId
            });

            logger.info('[MesasController.crear] Mesa creada', {
                mesa_id: mesa.id,
                evento_id: eventoId,
                nombre: mesa.nombre
            });

            return ResponseHelper.success(res, mesa, 'Mesa creada exitosamente', 201);

        } catch (error) {
            logger.error('[MesasController.crear] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Listar mesas del evento
     * GET /api/v1/eventos-digitales/eventos/:eventoId/mesas
     */
    static async listar(req, res) {
        try {
            const { eventoId } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            const mesas = await MesaModel.listar(parseInt(eventoId), organizacionId);

            return ResponseHelper.success(res, mesas);

        } catch (error) {
            logger.error('[MesasController.listar] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Obtener mesa por ID
     * GET /api/v1/eventos-digitales/mesas/:mesaId
     */
    static async obtenerPorId(req, res) {
        try {
            const { mesaId } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            const mesa = await MesaModel.obtenerPorId(parseInt(mesaId), organizacionId);

            if (!mesa) {
                return ResponseHelper.error(res, 'Mesa no encontrada', 404);
            }

            return ResponseHelper.success(res, mesa);

        } catch (error) {
            logger.error('[MesasController.obtenerPorId] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Actualizar mesa
     * PUT /api/v1/eventos-digitales/eventos/:eventoId/mesas/:mesaId
     */
    static async actualizar(req, res) {
        try {
            const { mesaId } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            const mesa = await MesaModel.actualizar(parseInt(mesaId), req.body, organizacionId);

            if (!mesa) {
                return ResponseHelper.error(res, 'Mesa no encontrada', 404);
            }

            logger.info('[MesasController.actualizar] Mesa actualizada', { mesa_id: mesaId });

            return ResponseHelper.success(res, mesa, 'Mesa actualizada exitosamente');

        } catch (error) {
            logger.error('[MesasController.actualizar] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Eliminar mesa
     * DELETE /api/v1/eventos-digitales/mesas/:mesaId
     */
    static async eliminar(req, res) {
        try {
            const { mesaId } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            const eliminado = await MesaModel.eliminar(parseInt(mesaId), organizacionId);

            if (!eliminado) {
                return ResponseHelper.error(res, 'Mesa no encontrada', 404);
            }

            logger.info('[MesasController.eliminar] Mesa eliminada', { mesa_id: mesaId });

            return ResponseHelper.success(res, { eliminado: true }, 'Mesa eliminada exitosamente');

        } catch (error) {
            logger.error('[MesasController.eliminar] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Actualizar posiciones de múltiples mesas (batch)
     * PATCH /api/v1/eventos-digitales/eventos/:eventoId/mesas/posiciones
     */
    static async actualizarPosiciones(req, res) {
        try {
            const { eventoId } = req.params;
            const { posiciones } = req.body;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            const resultado = await MesaModel.actualizarPosiciones(
                parseInt(eventoId),
                posiciones,
                organizacionId
            );

            logger.info('[MesasController.actualizarPosiciones] Posiciones actualizadas', {
                evento_id: eventoId,
                total: resultado.actualizado
            });

            return ResponseHelper.success(res, resultado, 'Posiciones actualizadas');

        } catch (error) {
            logger.error('[MesasController.actualizarPosiciones] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Asignar invitado a mesa
     * POST /api/v1/eventos-digitales/eventos/:eventoId/mesas/:mesaId/asignar
     */
    static async asignarInvitado(req, res) {
        try {
            const { mesaId } = req.params;
            const { invitado_id } = req.body;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            const invitado = await MesaModel.asignarInvitado(
                parseInt(mesaId),
                parseInt(invitado_id),
                organizacionId
            );

            logger.info('[MesasController.asignarInvitado] Invitado asignado', {
                mesa_id: mesaId,
                invitado_id: invitado_id
            });

            return ResponseHelper.success(res, invitado, 'Invitado asignado a mesa exitosamente');

        } catch (error) {
            logger.error('[MesasController.asignarInvitado] Error', { error: error.message });

            // Errores de validación conocidos
            if (error.message.includes('Capacidad insuficiente') ||
                error.message.includes('no encontrad')) {
                return ResponseHelper.error(res, error.message, 400);
            }

            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Desasignar invitado de mesa
     * DELETE /api/v1/eventos-digitales/invitados/:invitadoId/mesa
     */
    static async desasignarInvitado(req, res) {
        try {
            const { invitadoId } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            const invitado = await MesaModel.desasignarInvitado(
                parseInt(invitadoId),
                organizacionId
            );

            logger.info('[MesasController.desasignarInvitado] Invitado desasignado', {
                invitado_id: invitadoId
            });

            return ResponseHelper.success(res, invitado, 'Invitado removido de mesa');

        } catch (error) {
            logger.error('[MesasController.desasignarInvitado] Error', { error: error.message });

            if (error.message.includes('no encontrado')) {
                return ResponseHelper.error(res, error.message, 404);
            }

            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Obtener estadísticas de ocupación
     * GET /api/v1/eventos-digitales/eventos/:eventoId/mesas/estadisticas
     */
    static async obtenerEstadisticas(req, res) {
        try {
            const { eventoId } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            const estadisticas = await MesaModel.obtenerEstadisticas(
                parseInt(eventoId),
                organizacionId
            );

            return ResponseHelper.success(res, estadisticas);

        } catch (error) {
            logger.error('[MesasController.obtenerEstadisticas] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }
}

module.exports = MesasController;

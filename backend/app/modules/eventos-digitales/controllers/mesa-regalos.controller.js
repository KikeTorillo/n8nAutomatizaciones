/**
 * ====================================================================
 * CONTROLLER: MESA DE REGALOS
 * ====================================================================
 * Gestión de mesa de regalos del evento.
 *
 * Fecha creación: 4 Diciembre 2025
 */

const MesaRegalosModel = require('../models/mesa-regalos.model');
const EventoModel = require('../models/evento.model');
const { ResponseHelper } = require('../../../utils/helpers');

class MesaRegalosController {
    /**
     * POST /eventos/:eventoId/mesa-regalos
     * Crear regalo
     */
    static async crear(req, res) {
        try {
            const { eventoId } = req.params;
            const organizacionId = req.user.organizacion_id;

            // Verificar que el evento existe
            const evento = await EventoModel.obtenerPorId(eventoId, organizacionId);
            if (!evento) {
                return ResponseHelper.error(res, 'Evento no encontrado', 404);
            }

            const regalo = await MesaRegalosModel.crear({
                ...req.body,
                evento_id: parseInt(eventoId),
                organizacion_id: organizacionId
            });

            return ResponseHelper.success(res, regalo, 'Regalo agregado exitosamente', 201);
        } catch (error) {
            console.error('Error al crear regalo:', error);
            return ResponseHelper.error(res, 'Error al agregar regalo', 500);
        }
    }

    /**
     * GET /eventos/:eventoId/mesa-regalos
     * Listar regalos del evento
     */
    static async listar(req, res) {
        try {
            const { eventoId } = req.params;
            const { disponibles } = req.query;
            const organizacionId = req.user.organizacion_id;

            // Verificar que el evento existe
            const evento = await EventoModel.obtenerPorId(eventoId, organizacionId);
            if (!evento) {
                return ResponseHelper.error(res, 'Evento no encontrado', 404);
            }

            const regalos = await MesaRegalosModel.listarPorEvento(eventoId, organizacionId, {
                soloDisponibles: disponibles === 'true'
            });

            const estadisticas = await MesaRegalosModel.obtenerEstadisticas(eventoId, organizacionId);

            return ResponseHelper.success(res, {
                regalos,
                estadisticas,
                total: regalos.length
            });
        } catch (error) {
            console.error('Error al listar regalos:', error);
            return ResponseHelper.error(res, 'Error al listar regalos', 500);
        }
    }

    /**
     * GET /mesa-regalos/:id
     * Obtener regalo por ID
     */
    static async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            const organizacionId = req.user.organizacion_id;

            const regalo = await MesaRegalosModel.obtenerPorId(id, organizacionId);

            if (!regalo) {
                return ResponseHelper.error(res, 'Regalo no encontrado', 404);
            }

            return ResponseHelper.success(res, regalo);
        } catch (error) {
            console.error('Error al obtener regalo:', error);
            return ResponseHelper.error(res, 'Error al obtener regalo', 500);
        }
    }

    /**
     * PUT /mesa-regalos/:id
     * Actualizar regalo
     */
    static async actualizar(req, res) {
        try {
            const { id } = req.params;
            const organizacionId = req.user.organizacion_id;

            // Verificar que existe
            const regaloExistente = await MesaRegalosModel.obtenerPorId(id, organizacionId);
            if (!regaloExistente) {
                return ResponseHelper.error(res, 'Regalo no encontrado', 404);
            }

            const regalo = await MesaRegalosModel.actualizar(id, req.body, organizacionId);

            return ResponseHelper.success(res, regalo, 'Regalo actualizado exitosamente');
        } catch (error) {
            console.error('Error al actualizar regalo:', error);
            return ResponseHelper.error(res, 'Error al actualizar regalo', 500);
        }
    }

    /**
     * PUT /mesa-regalos/:id/comprar
     * Marcar regalo como comprado
     */
    static async marcarComprado(req, res) {
        try {
            const { id } = req.params;
            const { comprado_por } = req.body;
            const organizacionId = req.user.organizacion_id;

            const regalo = await MesaRegalosModel.marcarComprado(id, comprado_por, organizacionId);

            if (!regalo) {
                return ResponseHelper.error(res, 'Regalo no encontrado o ya fue comprado', 404);
            }

            return ResponseHelper.success(res, regalo, 'Regalo marcado como comprado');
        } catch (error) {
            console.error('Error al marcar regalo:', error);
            return ResponseHelper.error(res, 'Error al marcar regalo', 500);
        }
    }

    /**
     * DELETE /mesa-regalos/:id
     * Eliminar regalo
     */
    static async eliminar(req, res) {
        try {
            const { id } = req.params;
            const organizacionId = req.user.organizacion_id;

            // Verificar que existe
            const regalo = await MesaRegalosModel.obtenerPorId(id, organizacionId);
            if (!regalo) {
                return ResponseHelper.error(res, 'Regalo no encontrado', 404);
            }

            await MesaRegalosModel.eliminar(id, organizacionId);

            return ResponseHelper.success(res, { id: parseInt(id) }, 'Regalo eliminado exitosamente');
        } catch (error) {
            console.error('Error al eliminar regalo:', error);
            return ResponseHelper.error(res, 'Error al eliminar regalo', 500);
        }
    }

    /**
     * GET /eventos/:eventoId/mesa-regalos/estadisticas
     * Estadísticas de mesa de regalos
     */
    static async estadisticas(req, res) {
        try {
            const { eventoId } = req.params;
            const organizacionId = req.user.organizacion_id;

            // Verificar que el evento existe
            const evento = await EventoModel.obtenerPorId(eventoId, organizacionId);
            if (!evento) {
                return ResponseHelper.error(res, 'Evento no encontrado', 404);
            }

            const estadisticas = await MesaRegalosModel.obtenerEstadisticas(eventoId, organizacionId);

            return ResponseHelper.success(res, estadisticas);
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            return ResponseHelper.error(res, 'Error al obtener estadísticas', 500);
        }
    }
}

module.exports = MesaRegalosController;

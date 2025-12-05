/**
 * ====================================================================
 * CONTROLLER: UBICACIONES DE EVENTOS DIGITALES
 * ====================================================================
 * Gestión de ubicaciones/lugares del evento.
 *
 * Fecha creación: 4 Diciembre 2025
 */

const UbicacionModel = require('../models/ubicacion.model');
const EventoModel = require('../models/evento.model');
const { ResponseHelper } = require('../../../utils/helpers');

class UbicacionesController {
    /**
     * POST /eventos/:eventoId/ubicaciones
     * Crear ubicación
     */
    static async crear(req, res) {
        try {
            const { eventoId } = req.params;
            const organizacionId = req.user.organizacion_id;

            // Verificar que el evento existe y pertenece a la organización
            const evento = await EventoModel.obtenerPorId(eventoId, organizacionId);
            if (!evento) {
                return ResponseHelper.error(res, 'Evento no encontrado', 404);
            }

            const ubicacion = await UbicacionModel.crear({
                ...req.body,
                evento_id: parseInt(eventoId),
                organizacion_id: organizacionId
            });

            return ResponseHelper.success(res, ubicacion, 'Ubicación creada exitosamente', 201);
        } catch (error) {
            console.error('Error al crear ubicación:', error);
            return ResponseHelper.error(res, 'Error al crear ubicación', 500);
        }
    }

    /**
     * GET /eventos/:eventoId/ubicaciones
     * Listar ubicaciones del evento
     */
    static async listar(req, res) {
        try {
            const { eventoId } = req.params;
            const organizacionId = req.user.organizacion_id;

            // Verificar que el evento existe
            const evento = await EventoModel.obtenerPorId(eventoId, organizacionId);
            if (!evento) {
                return ResponseHelper.error(res, 'Evento no encontrado', 404);
            }

            const ubicaciones = await UbicacionModel.listarPorEvento(eventoId, organizacionId);

            return ResponseHelper.success(res, {
                ubicaciones,
                total: ubicaciones.length
            });
        } catch (error) {
            console.error('Error al listar ubicaciones:', error);
            return ResponseHelper.error(res, 'Error al listar ubicaciones', 500);
        }
    }

    /**
     * GET /ubicaciones/:id
     * Obtener ubicación por ID
     */
    static async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            const organizacionId = req.user.organizacion_id;

            const ubicacion = await UbicacionModel.obtenerPorId(id, organizacionId);

            if (!ubicacion) {
                return ResponseHelper.error(res, 'Ubicación no encontrada', 404);
            }

            return ResponseHelper.success(res, ubicacion);
        } catch (error) {
            console.error('Error al obtener ubicación:', error);
            return ResponseHelper.error(res, 'Error al obtener ubicación', 500);
        }
    }

    /**
     * PUT /ubicaciones/:id
     * Actualizar ubicación
     */
    static async actualizar(req, res) {
        try {
            const { id } = req.params;
            const organizacionId = req.user.organizacion_id;

            // Verificar que existe
            const ubicacionExistente = await UbicacionModel.obtenerPorId(id, organizacionId);
            if (!ubicacionExistente) {
                return ResponseHelper.error(res, 'Ubicación no encontrada', 404);
            }

            const ubicacion = await UbicacionModel.actualizar(id, req.body, organizacionId);

            return ResponseHelper.success(res, ubicacion, 'Ubicación actualizada exitosamente');
        } catch (error) {
            console.error('Error al actualizar ubicación:', error);
            return ResponseHelper.error(res, 'Error al actualizar ubicación', 500);
        }
    }

    /**
     * DELETE /ubicaciones/:id
     * Eliminar ubicación
     */
    static async eliminar(req, res) {
        try {
            const { id } = req.params;
            const organizacionId = req.user.organizacion_id;

            // Verificar que existe
            const ubicacion = await UbicacionModel.obtenerPorId(id, organizacionId);
            if (!ubicacion) {
                return ResponseHelper.error(res, 'Ubicación no encontrada', 404);
            }

            await UbicacionModel.eliminar(id, organizacionId);

            return ResponseHelper.success(res, { id: parseInt(id) }, 'Ubicación eliminada exitosamente');
        } catch (error) {
            console.error('Error al eliminar ubicación:', error);
            return ResponseHelper.error(res, 'Error al eliminar ubicación', 500);
        }
    }

    /**
     * PUT /eventos/:eventoId/ubicaciones/reordenar
     * Reordenar ubicaciones
     */
    static async reordenar(req, res) {
        try {
            const { eventoId } = req.params;
            const { orden } = req.body; // Array de IDs en el nuevo orden
            const organizacionId = req.user.organizacion_id;

            // Verificar que el evento existe
            const evento = await EventoModel.obtenerPorId(eventoId, organizacionId);
            if (!evento) {
                return ResponseHelper.error(res, 'Evento no encontrado', 404);
            }

            await UbicacionModel.reordenar(eventoId, orden, organizacionId);

            return ResponseHelper.success(res, null, 'Ubicaciones reordenadas exitosamente');
        } catch (error) {
            console.error('Error al reordenar ubicaciones:', error);
            return ResponseHelper.error(res, 'Error al reordenar ubicaciones', 500);
        }
    }
}

module.exports = UbicacionesController;

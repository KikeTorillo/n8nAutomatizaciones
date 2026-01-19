/**
 * ====================================================================
 * CONTROLLER: FELICITACIONES (LIBRO DE VISITAS)
 * ====================================================================
 * Gestión de felicitaciones/mensajes del evento.
 *
 * ENDPOINTS (6):
 * - POST   /eventos/:eventoId/felicitaciones - Crear felicitación
 * - GET    /eventos/:eventoId/felicitaciones - Listar felicitaciones
 * - GET    /felicitaciones/:id               - Obtener felicitación
 * - PUT    /felicitaciones/:id/aprobar       - Aprobar felicitación
 * - PUT    /felicitaciones/:id/rechazar      - Rechazar felicitación
 * - DELETE /felicitaciones/:id               - Eliminar felicitación
 *
 * NO MIGRADO A BaseCrudController - Ene 2026
 * Razón: Depende de eventoId, métodos de moderación aprobar/rechazar,
 * verificación de evento padre, conteo por estado.
 *
 * Fecha creación: 4 Diciembre 2025
 */

const FelicitacionModel = require('../models/felicitacion.model');
const EventoModel = require('../models/evento.model');
const { ResponseHelper } = require('../../../utils/helpers');

class FelicitacionesController {
    /**
     * POST /eventos/:eventoId/felicitaciones
     * Crear felicitación (admin)
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

            const felicitacion = await FelicitacionModel.crear({
                ...req.body,
                evento_id: parseInt(eventoId),
                organizacion_id: organizacionId
            });

            return ResponseHelper.success(res, felicitacion, 'Felicitación creada exitosamente', 201);
        } catch (error) {
            console.error('Error al crear felicitación:', error);
            return ResponseHelper.error(res, 'Error al crear felicitación', 500);
        }
    }

    /**
     * GET /eventos/:eventoId/felicitaciones
     * Listar felicitaciones del evento
     */
    static async listar(req, res) {
        try {
            const { eventoId } = req.params;
            const { aprobadas, limit = 100, offset = 0 } = req.query;
            const organizacionId = req.user.organizacion_id;

            // Verificar que el evento existe
            const evento = await EventoModel.obtenerPorId(eventoId, organizacionId);
            if (!evento) {
                return ResponseHelper.error(res, 'Evento no encontrado', 404);
            }

            const resultado = await FelicitacionModel.listarPorEvento(eventoId, organizacionId, {
                aprobadas: aprobadas === 'true' ? true : aprobadas === 'false' ? false : undefined,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            const conteo = await FelicitacionModel.contarPorEstado(eventoId, organizacionId);

            return ResponseHelper.success(res, {
                ...resultado,
                estadisticas: conteo
            });
        } catch (error) {
            console.error('Error al listar felicitaciones:', error);
            return ResponseHelper.error(res, 'Error al listar felicitaciones', 500);
        }
    }

    /**
     * GET /felicitaciones/:id
     * Obtener felicitación por ID
     */
    static async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            const organizacionId = req.user.organizacion_id;

            const felicitacion = await FelicitacionModel.obtenerPorId(id, organizacionId);

            if (!felicitacion) {
                return ResponseHelper.error(res, 'Felicitación no encontrada', 404);
            }

            return ResponseHelper.success(res, felicitacion);
        } catch (error) {
            console.error('Error al obtener felicitación:', error);
            return ResponseHelper.error(res, 'Error al obtener felicitación', 500);
        }
    }

    /**
     * PUT /felicitaciones/:id/aprobar
     * Aprobar felicitación
     */
    static async aprobar(req, res) {
        try {
            const { id } = req.params;
            const organizacionId = req.user.organizacion_id;

            const felicitacion = await FelicitacionModel.cambiarAprobacion(id, true, organizacionId);

            if (!felicitacion) {
                return ResponseHelper.error(res, 'Felicitación no encontrada', 404);
            }

            return ResponseHelper.success(res, felicitacion, 'Felicitación aprobada');
        } catch (error) {
            console.error('Error al aprobar felicitación:', error);
            return ResponseHelper.error(res, 'Error al aprobar felicitación', 500);
        }
    }

    /**
     * PUT /felicitaciones/:id/rechazar
     * Rechazar felicitación
     */
    static async rechazar(req, res) {
        try {
            const { id } = req.params;
            const organizacionId = req.user.organizacion_id;

            const felicitacion = await FelicitacionModel.cambiarAprobacion(id, false, organizacionId);

            if (!felicitacion) {
                return ResponseHelper.error(res, 'Felicitación no encontrada', 404);
            }

            return ResponseHelper.success(res, felicitacion, 'Felicitación rechazada');
        } catch (error) {
            console.error('Error al rechazar felicitación:', error);
            return ResponseHelper.error(res, 'Error al rechazar felicitación', 500);
        }
    }

    /**
     * DELETE /felicitaciones/:id
     * Eliminar felicitación
     */
    static async eliminar(req, res) {
        try {
            const { id } = req.params;
            const organizacionId = req.user.organizacion_id;

            // Verificar que existe
            const felicitacion = await FelicitacionModel.obtenerPorId(id, organizacionId);
            if (!felicitacion) {
                return ResponseHelper.error(res, 'Felicitación no encontrada', 404);
            }

            await FelicitacionModel.eliminar(id, organizacionId);

            return ResponseHelper.success(res, { id: parseInt(id) }, 'Felicitación eliminada exitosamente');
        } catch (error) {
            console.error('Error al eliminar felicitación:', error);
            return ResponseHelper.error(res, 'Error al eliminar felicitación', 500);
        }
    }
}

module.exports = FelicitacionesController;

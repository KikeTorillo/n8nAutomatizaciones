/**
 * ====================================================================
 * CONTROLLER: GALERÍA COMPARTIDA
 * ====================================================================
 * Gestión de fotos del evento subidas por organizadores e invitados.
 *
 * ENDPOINTS (6):
 * - POST   /eventos/:eventoId/galeria     - Subir foto
 * - GET    /eventos/:eventoId/galeria     - Listar fotos
 * - GET    /galeria/:id                   - Obtener foto
 * - PUT    /galeria/:id/estado            - Cambiar estado (visible/oculta)
 * - DELETE /galeria/:id                   - Eliminar foto (soft)
 * - DELETE /galeria/:id/permanente        - Eliminar permanente
 *
 * NO MIGRADO A BaseCrudController - Ene 2026
 * Razón: Depende de eventoId, métodos custom cambiarEstado() y
 * eliminarPermanente(), conteo por estado, integración storage.
 *
 * Fecha creación: 14 Diciembre 2025
 */

const FotoEventoModel = require('../models/foto.model');
const EventoModel = require('../models/evento.model');
const { ResponseHelper } = require('../../../utils/helpers');

class GaleriaController {
    /**
     * POST /eventos/:eventoId/galeria
     * Subir foto (admin/organizador)
     */
    static async subir(req, res) {
        try {
            const { eventoId } = req.params;
            const organizacionId = req.user.organizacion_id;

            // Verificar que el evento existe
            const evento = await EventoModel.obtenerPorId(eventoId, organizacionId);
            if (!evento) {
                return ResponseHelper.error(res, 'Evento no encontrado', 404);
            }

            const foto = await FotoEventoModel.crear({
                ...req.body,
                evento_id: parseInt(eventoId),
                organizacion_id: organizacionId
            });

            return ResponseHelper.success(res, foto, 'Foto subida exitosamente', 201);
        } catch (error) {
            console.error('Error al subir foto:', error);
            return ResponseHelper.error(res, 'Error al subir foto', 500);
        }
    }

    /**
     * GET /eventos/:eventoId/galeria
     * Listar fotos del evento
     */
    static async listar(req, res) {
        try {
            const { eventoId } = req.params;
            const { estado, limit = 100, offset = 0 } = req.query;
            const organizacionId = req.user.organizacion_id;

            // Verificar que el evento existe
            const evento = await EventoModel.obtenerPorId(eventoId, organizacionId);
            if (!evento) {
                return ResponseHelper.error(res, 'Evento no encontrado', 404);
            }

            const resultado = await FotoEventoModel.listarPorEvento(eventoId, organizacionId, {
                estado,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            const conteo = await FotoEventoModel.contarPorEstado(eventoId, organizacionId);

            return ResponseHelper.success(res, {
                ...resultado,
                estadisticas: conteo
            });
        } catch (error) {
            console.error('Error al listar fotos:', error);
            return ResponseHelper.error(res, 'Error al listar fotos', 500);
        }
    }

    /**
     * GET /galeria/:id
     * Obtener foto por ID
     */
    static async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            const organizacionId = req.user.organizacion_id;

            const foto = await FotoEventoModel.obtenerPorId(id, organizacionId);

            if (!foto) {
                return ResponseHelper.error(res, 'Foto no encontrada', 404);
            }

            return ResponseHelper.success(res, foto);
        } catch (error) {
            console.error('Error al obtener foto:', error);
            return ResponseHelper.error(res, 'Error al obtener foto', 500);
        }
    }

    /**
     * PUT /galeria/:id/estado
     * Cambiar estado de foto (visible/oculta)
     */
    static async cambiarEstado(req, res) {
        try {
            const { id } = req.params;
            const { estado } = req.body;
            const organizacionId = req.user.organizacion_id;

            if (!['visible', 'oculta'].includes(estado)) {
                return ResponseHelper.error(res, 'Estado inválido. Use: visible, oculta', 400);
            }

            const foto = await FotoEventoModel.cambiarEstado(id, estado, organizacionId);

            if (!foto) {
                return ResponseHelper.error(res, 'Foto no encontrada', 404);
            }

            return ResponseHelper.success(res, foto, `Foto ${estado === 'visible' ? 'visible' : 'ocultada'}`);
        } catch (error) {
            console.error('Error al cambiar estado de foto:', error);
            return ResponseHelper.error(res, 'Error al cambiar estado de foto', 500);
        }
    }

    /**
     * DELETE /galeria/:id
     * Eliminar foto (soft delete)
     */
    static async eliminar(req, res) {
        try {
            const { id } = req.params;
            const organizacionId = req.user.organizacion_id;

            // Verificar que existe
            const foto = await FotoEventoModel.obtenerPorId(id, organizacionId);
            if (!foto) {
                return ResponseHelper.error(res, 'Foto no encontrada', 404);
            }

            await FotoEventoModel.eliminar(id, organizacionId);

            return ResponseHelper.success(res, { id: parseInt(id) }, 'Foto eliminada exitosamente');
        } catch (error) {
            console.error('Error al eliminar foto:', error);
            return ResponseHelper.error(res, 'Error al eliminar foto', 500);
        }
    }

    /**
     * DELETE /galeria/:id/permanente
     * Eliminar foto permanentemente (hard delete + borrar de storage)
     */
    static async eliminarPermanente(req, res) {
        try {
            const { id } = req.params;
            const organizacionId = req.user.organizacion_id;

            const foto = await FotoEventoModel.eliminarPermanente(id, organizacionId);

            if (!foto) {
                return ResponseHelper.error(res, 'Foto no encontrada', 404);
            }

            // TODO: Borrar archivos de MinIO (url y thumbnail_url)
            // await storageService.deleteFile(foto.url);
            // if (foto.thumbnail_url) await storageService.deleteFile(foto.thumbnail_url);

            return ResponseHelper.success(res, { id: parseInt(id) }, 'Foto eliminada permanentemente');
        } catch (error) {
            console.error('Error al eliminar foto permanentemente:', error);
            return ResponseHelper.error(res, 'Error al eliminar foto', 500);
        }
    }
}

module.exports = GaleriaController;

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
 * REFACTORIZADO Feb 2026:
 * - Eliminados try-catch redundantes (asyncHandler en rutas)
 * - Uso de ErrorHelper.throwIfNotFound para 404s
 *
 * Fecha creación: 14 Diciembre 2025
 */

const FotoEventoModel = require('../models/foto.model');
const EventoModel = require('../models/evento.model');
const { ResponseHelper, ErrorHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

class GaleriaController {
    /**
     * POST /eventos/:eventoId/galeria
     * Subir foto (admin/organizador)
     */
    static async subir(req, res) {
        const { eventoId } = req.params;
        const organizacionId = req.user.organizacion_id;

        // Verificar que el evento existe
        const evento = await EventoModel.obtenerPorId(eventoId, organizacionId);
        ErrorHelper.throwIfNotFound(evento, 'Evento');

        const foto = await FotoEventoModel.crear({
            ...req.body,
            evento_id: parseInt(eventoId),
            organizacion_id: organizacionId
        });

        return ResponseHelper.success(res, foto, 'Foto subida exitosamente', 201);
    }

    /**
     * GET /eventos/:eventoId/galeria
     * Listar fotos del evento
     */
    static async listar(req, res) {
        const { eventoId } = req.params;
        const { estado, limit = 100, offset = 0 } = req.query;
        const organizacionId = req.user.organizacion_id;

        // Verificar que el evento existe
        const evento = await EventoModel.obtenerPorId(eventoId, organizacionId);
        ErrorHelper.throwIfNotFound(evento, 'Evento');

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
    }

    /**
     * GET /galeria/:id
     * Obtener foto por ID
     */
    static async obtenerPorId(req, res) {
        const { id } = req.params;
        const organizacionId = req.user.organizacion_id;

        const foto = await FotoEventoModel.obtenerPorId(id, organizacionId);
        ErrorHelper.throwIfNotFound(foto, 'Foto');

        return ResponseHelper.success(res, foto);
    }

    /**
     * PUT /galeria/:id/estado
     * Cambiar estado de foto (visible/oculta)
     */
    static async cambiarEstado(req, res) {
        const { id } = req.params;
        const { estado } = req.body;
        const organizacionId = req.user.organizacion_id;

        if (!['visible', 'oculta'].includes(estado)) {
            throw new Error('Estado inválido. Use: visible, oculta');
        }

        const foto = await FotoEventoModel.cambiarEstado(id, estado, organizacionId);
        ErrorHelper.throwIfNotFound(foto, 'Foto');

        return ResponseHelper.success(res, foto, `Foto ${estado === 'visible' ? 'visible' : 'ocultada'}`);
    }

    /**
     * DELETE /galeria/:id
     * Eliminar foto (soft delete)
     */
    static async eliminar(req, res) {
        const { id } = req.params;
        const organizacionId = req.user.organizacion_id;

        // Verificar que existe
        const foto = await FotoEventoModel.obtenerPorId(id, organizacionId);
        ErrorHelper.throwIfNotFound(foto, 'Foto');

        await FotoEventoModel.eliminar(id, organizacionId);

        return ResponseHelper.success(res, { id: parseInt(id) }, 'Foto eliminada exitosamente');
    }

    /**
     * DELETE /galeria/:id/permanente
     * Eliminar foto permanentemente (hard delete + borrar de storage)
     */
    static async eliminarPermanente(req, res) {
        const { id } = req.params;
        const organizacionId = req.user.organizacion_id;

        const foto = await FotoEventoModel.eliminarPermanente(id, organizacionId);
        ErrorHelper.throwIfNotFound(foto, 'Foto');

        // TODO: Borrar archivos de MinIO (url y thumbnail_url)
        // await storageService.deleteFile(foto.url);
        // if (foto.thumbnail_url) await storageService.deleteFile(foto.thumbnail_url);

        return ResponseHelper.success(res, { id: parseInt(id) }, 'Foto eliminada permanentemente');
    }
}

module.exports = GaleriaController;

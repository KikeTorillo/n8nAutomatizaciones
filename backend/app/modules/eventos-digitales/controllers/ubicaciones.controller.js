/**
 * ====================================================================
 * CONTROLLER: UBICACIONES DE EVENTOS DIGITALES
 * ====================================================================
 * Gestión de ubicaciones/lugares del evento.
 *
 * NOTA: No migrado a BaseCrudController porque depende de evento_id
 * en la ruta (/eventos/:eventoId/ubicaciones) y tiene lógica de
 * verificación de evento que no encaja en el patrón CRUD simple.
 *
 * Fecha creación: 4 Diciembre 2025
 * Actualizado: Ene 2026 - asyncHandler + ErrorHelper
 */

const UbicacionModel = require('../models/ubicacion.model');
const EventoModel = require('../models/evento.model');
const asyncHandler = require('../../../middleware/asyncHandler');
const { ResponseHelper, ErrorHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

/**
 * Helper para verificar que el evento existe
 */
const verificarEvento = async (eventoId, organizacionId) => {
    const evento = await EventoModel.obtenerPorId(eventoId, organizacionId);
    ErrorHelper.throwIfNotFound(evento, 'Evento');
    return evento;
};

const UbicacionesController = {
    /**
     * POST /eventos/:eventoId/ubicaciones
     * Crear ubicación
     */
    crear: asyncHandler(async (req, res) => {
        const { eventoId } = req.params;
        const organizacionId = req.user.organizacion_id;

        await verificarEvento(eventoId, organizacionId);

        const ubicacion = await UbicacionModel.crear({
            ...req.body,
            evento_id: parseInt(eventoId),
            organizacion_id: organizacionId
        });

        logger.info('[UbicacionesController] Ubicación creada', {
            ubicacion_id: ubicacion.id,
            evento_id: eventoId
        });

        return ResponseHelper.success(res, ubicacion, 'Ubicación creada exitosamente', 201);
    }),

    /**
     * GET /eventos/:eventoId/ubicaciones
     * Listar ubicaciones del evento
     */
    listar: asyncHandler(async (req, res) => {
        const { eventoId } = req.params;
        const organizacionId = req.user.organizacion_id;

        await verificarEvento(eventoId, organizacionId);

        const ubicaciones = await UbicacionModel.listarPorEvento(eventoId, organizacionId);

        return ResponseHelper.success(res, {
            ubicaciones,
            total: ubicaciones.length
        });
    }),

    /**
     * GET /ubicaciones/:id
     * Obtener ubicación por ID
     */
    obtenerPorId: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.user.organizacion_id;

        const ubicacion = await UbicacionModel.obtenerPorId(id, organizacionId);
        ErrorHelper.throwIfNotFound(ubicacion, 'Ubicación');

        return ResponseHelper.success(res, ubicacion);
    }),

    /**
     * PUT /ubicaciones/:id
     * Actualizar ubicación
     */
    actualizar: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.user.organizacion_id;

        const ubicacionExistente = await UbicacionModel.obtenerPorId(id, organizacionId);
        ErrorHelper.throwIfNotFound(ubicacionExistente, 'Ubicación');

        const ubicacion = await UbicacionModel.actualizar(id, req.body, organizacionId);

        logger.info('[UbicacionesController] Ubicación actualizada', { ubicacion_id: id });

        return ResponseHelper.success(res, ubicacion, 'Ubicación actualizada exitosamente');
    }),

    /**
     * DELETE /ubicaciones/:id
     * Eliminar ubicación
     */
    eliminar: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.user.organizacion_id;

        const ubicacion = await UbicacionModel.obtenerPorId(id, organizacionId);
        ErrorHelper.throwIfNotFound(ubicacion, 'Ubicación');

        await UbicacionModel.eliminar(id, organizacionId);

        logger.info('[UbicacionesController] Ubicación eliminada', { ubicacion_id: id });

        return ResponseHelper.success(res, { id: parseInt(id) }, 'Ubicación eliminada exitosamente');
    }),

    /**
     * PUT /eventos/:eventoId/ubicaciones/reordenar
     * Reordenar ubicaciones
     */
    reordenar: asyncHandler(async (req, res) => {
        const { eventoId } = req.params;
        const { orden } = req.body;
        const organizacionId = req.user.organizacion_id;

        await verificarEvento(eventoId, organizacionId);

        await UbicacionModel.reordenar(eventoId, orden, organizacionId);

        return ResponseHelper.success(res, null, 'Ubicaciones reordenadas exitosamente');
    })
};

module.exports = UbicacionesController;

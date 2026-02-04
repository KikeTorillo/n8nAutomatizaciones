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
 * REFACTORIZADO Feb 2026: Migrado a asyncHandler
 *
 * Fecha creación: 4 Diciembre 2025
 */

const EventoModel = require('../models/evento.model');
const logger = require('../../../utils/logger');
const { ResponseHelper, LimitesHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');
const { ResourceNotFoundError } = require('../../../utils/errors');

class EventosController {

    /**
     * Crear evento
     * POST /api/v1/eventos-digitales/eventos
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        // Verificar límite de eventos activos
        await LimitesHelper.verificarLimiteOLanzar(organizacionId, 'eventos_activos', 1);

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
    });

    /**
     * Listar eventos de la organización
     * GET /api/v1/eventos-digitales/eventos
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;
        const filtros = req.query;

        const resultado = await EventoModel.listar(organizacionId, filtros);

        return ResponseHelper.success(res, resultado);
    });

    /**
     * Obtener evento por ID
     * GET /api/v1/eventos-digitales/eventos/:id
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        const evento = await EventoModel.obtenerPorId(parseInt(id), organizacionId);

        if (!evento) {
            throw new ResourceNotFoundError('Evento', id);
        }

        return ResponseHelper.success(res, evento);
    });

    /**
     * Actualizar evento
     * PUT /api/v1/eventos-digitales/eventos/:id
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        // Verificar límite de fotos si se actualiza galeria_urls
        if (req.body.galeria_urls && Array.isArray(req.body.galeria_urls)) {
            const cantidadFotos = req.body.galeria_urls.length;
            await LimitesHelper.verificarLimiteFotosGaleriaOLanzar(
                organizacionId,
                parseInt(id),
                cantidadFotos
            );
        }

        const evento = await EventoModel.actualizar(parseInt(id), req.body, organizacionId);

        if (!evento) {
            throw new ResourceNotFoundError('Evento', id);
        }

        logger.info('[EventosController.actualizar] Evento actualizado', {
            evento_id: id,
            usuario_id: req.user.id
        });

        return ResponseHelper.success(res, evento, 'Evento actualizado exitosamente');
    });

    /**
     * Publicar evento
     * POST /api/v1/eventos-digitales/eventos/:id/publicar
     */
    static publicar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        const evento = await EventoModel.publicar(parseInt(id), organizacionId);

        logger.info('[EventosController.publicar] Evento publicado', {
            evento_id: id,
            usuario_id: req.user.id
        });

        return ResponseHelper.success(res, evento, 'Evento publicado exitosamente');
    });

    /**
     * Obtener estadísticas del evento
     * GET /api/v1/eventos-digitales/eventos/:id/estadisticas
     */
    static estadisticas = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        const estadisticas = await EventoModel.obtenerEstadisticas(parseInt(id), organizacionId);

        return ResponseHelper.success(res, estadisticas);
    });

    /**
     * Eliminar evento (soft delete)
     * DELETE /api/v1/eventos-digitales/eventos/:id
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        const eliminado = await EventoModel.eliminar(parseInt(id), organizacionId);

        if (!eliminado) {
            throw new ResourceNotFoundError('Evento', id);
        }

        logger.info('[EventosController.eliminar] Evento eliminado', {
            evento_id: id,
            usuario_id: req.user.id
        });

        return ResponseHelper.success(res, { id: parseInt(id) }, 'Evento eliminado exitosamente');
    });
}

module.exports = EventosController;

/**
 * ====================================================================
 * CONTROLLER: MESA DE REGALOS
 * ====================================================================
 * Gestión de mesa de regalos del evento.
 *
 * ENDPOINTS (7):
 * - POST   /eventos/:eventoId/mesa-regalos       - Crear regalo
 * - GET    /eventos/:eventoId/mesa-regalos       - Listar regalos
 * - GET    /mesa-regalos/:id                     - Obtener regalo
 * - PUT    /mesa-regalos/:id                     - Actualizar regalo
 * - PUT    /mesa-regalos/:id/comprar             - Marcar como comprado
 * - DELETE /mesa-regalos/:id                     - Eliminar regalo
 * - GET    /eventos/:eventoId/mesa-regalos/estadisticas - Estadísticas
 *
 * NO MIGRADO A BaseCrudController - Ene 2026
 * Razón: Depende de eventoId, método custom marcarComprado(),
 * verificación de evento padre, estadísticas custom.
 *
 * REFACTORIZADO Feb 2026:
 * - asyncHandler inline en controller (consistente con patrón del proyecto)
 * - Uso de ErrorHelper.throwIfNotFound para 404s
 * - Estandarizado organizacionId via req.tenant
 *
 * Fecha creación: 4 Diciembre 2025
 */

const MesaRegalosModel = require('../models/mesa-regalos.model');
const { ResponseHelper, ErrorHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');
const logger = require('../../../utils/logger');

class MesaRegalosController {
    /**
     * POST /eventos/:eventoId/mesa-regalos
     * Crear regalo
     */
    static crear = asyncHandler(async (req, res) => {
        const { eventoId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const regalo = await MesaRegalosModel.crear({
            ...req.body,
            evento_id: parseInt(eventoId),
            organizacion_id: organizacionId
        });

        return ResponseHelper.success(res, regalo, 'Regalo agregado exitosamente', 201);
    });

    /**
     * GET /eventos/:eventoId/mesa-regalos
     * Listar regalos del evento
     */
    static listar = asyncHandler(async (req, res) => {
        const { eventoId } = req.params;
        const { disponibles } = req.query;
        const organizacionId = req.tenant.organizacionId;

        const regalos = await MesaRegalosModel.listarPorEvento(eventoId, organizacionId, {
            soloDisponibles: disponibles === 'true'
        });

        const estadisticas = await MesaRegalosModel.obtenerEstadisticas(eventoId, organizacionId);

        return ResponseHelper.success(res, {
            regalos,
            estadisticas,
            total: regalos.length
        });
    });

    /**
     * GET /mesa-regalos/:id
     * Obtener regalo por ID
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const regalo = await MesaRegalosModel.obtenerPorId(id, organizacionId);
        ErrorHelper.throwIfNotFound(regalo, 'Regalo');

        return ResponseHelper.success(res, regalo);
    });

    /**
     * PUT /mesa-regalos/:id
     * Actualizar regalo
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const regaloExistente = await MesaRegalosModel.obtenerPorId(id, organizacionId);
        ErrorHelper.throwIfNotFound(regaloExistente, 'Regalo');

        const regalo = await MesaRegalosModel.actualizar(id, req.body, organizacionId);

        return ResponseHelper.success(res, regalo, 'Regalo actualizado exitosamente');
    });

    /**
     * PUT /mesa-regalos/:id/comprar
     * Marcar regalo como comprado
     */
    static marcarComprado = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { comprado_por } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const regalo = await MesaRegalosModel.marcarComprado(id, comprado_por, organizacionId);
        ErrorHelper.throwIfNotFound(regalo, 'Regalo', 'Regalo no encontrado o ya fue comprado');

        return ResponseHelper.success(res, regalo, 'Regalo marcado como comprado');
    });

    /**
     * DELETE /mesa-regalos/:id
     * Eliminar regalo
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const regalo = await MesaRegalosModel.obtenerPorId(id, organizacionId);
        ErrorHelper.throwIfNotFound(regalo, 'Regalo');

        await MesaRegalosModel.eliminar(id, organizacionId);

        return ResponseHelper.success(res, { id: parseInt(id) }, 'Regalo eliminado exitosamente');
    });

    /**
     * GET /eventos/:eventoId/mesa-regalos/estadisticas
     * Estadísticas de mesa de regalos
     */
    static estadisticas = asyncHandler(async (req, res) => {
        const { eventoId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const estadisticas = await MesaRegalosModel.obtenerEstadisticas(eventoId, organizacionId);

        return ResponseHelper.success(res, estadisticas);
    });
}

module.exports = MesaRegalosController;

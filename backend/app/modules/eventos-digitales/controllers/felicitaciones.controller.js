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
 * REFACTORIZADO Feb 2026:
 * - asyncHandler inline en controller (consistente con patrón del proyecto)
 * - Uso de ErrorHelper.throwIfNotFound para 404s
 * - Estandarizado organizacionId via req.tenant
 *
 * Fecha creación: 4 Diciembre 2025
 */

const FelicitacionModel = require('../models/felicitacion.model');
const { ResponseHelper, ErrorHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');
const logger = require('../../../utils/logger');

class FelicitacionesController {
    /**
     * POST /eventos/:eventoId/felicitaciones
     * Crear felicitación (admin)
     */
    static crear = asyncHandler(async (req, res) => {
        const { eventoId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const felicitacion = await FelicitacionModel.crear({
            ...req.body,
            evento_id: parseInt(eventoId),
            organizacion_id: organizacionId
        });

        return ResponseHelper.success(res, felicitacion, 'Felicitación creada exitosamente', 201);
    });

    /**
     * GET /eventos/:eventoId/felicitaciones
     * Listar felicitaciones del evento
     */
    static listar = asyncHandler(async (req, res) => {
        const { eventoId } = req.params;
        const { aprobadas, limit = 100, offset = 0 } = req.query;
        const organizacionId = req.tenant.organizacionId;

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
    });

    /**
     * GET /felicitaciones/:id
     * Obtener felicitación por ID
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const felicitacion = await FelicitacionModel.obtenerPorId(id, organizacionId);
        ErrorHelper.throwIfNotFound(felicitacion, 'Felicitación');

        return ResponseHelper.success(res, felicitacion);
    });

    /**
     * PUT /felicitaciones/:id/aprobar
     * Aprobar felicitación
     */
    static aprobar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const felicitacion = await FelicitacionModel.cambiarAprobacion(id, true, organizacionId);
        ErrorHelper.throwIfNotFound(felicitacion, 'Felicitación');

        return ResponseHelper.success(res, felicitacion, 'Felicitación aprobada');
    });

    /**
     * PUT /felicitaciones/:id/rechazar
     * Rechazar felicitación
     */
    static rechazar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const felicitacion = await FelicitacionModel.cambiarAprobacion(id, false, organizacionId);
        ErrorHelper.throwIfNotFound(felicitacion, 'Felicitación');

        return ResponseHelper.success(res, felicitacion, 'Felicitación rechazada');
    });

    /**
     * DELETE /felicitaciones/:id
     * Eliminar felicitación
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const felicitacion = await FelicitacionModel.obtenerPorId(id, organizacionId);
        ErrorHelper.throwIfNotFound(felicitacion, 'Felicitación');

        await FelicitacionModel.eliminar(id, organizacionId);

        return ResponseHelper.success(res, { id: parseInt(id) }, 'Felicitación eliminada exitosamente');
    });
}

module.exports = FelicitacionesController;

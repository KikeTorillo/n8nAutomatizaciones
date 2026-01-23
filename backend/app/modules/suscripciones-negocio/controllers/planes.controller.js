/**
 * ====================================================================
 * CONTROLLER: PLANES DE SUSCRIPCIÓN
 * ====================================================================
 * Gestión de planes de suscripción configurables por organización.
 *
 * @module controllers/planes
 */

const asyncHandler = require('../../../middleware/asyncHandler');
const { PlanesModel } = require('../models');
const { ResponseHelper, ErrorHelper, ParseHelper } = require('../../../utils/helpers');
const { NEXO_TEAM_ORG_ID } = require('../../../config/constants');

class PlanesController {

    /**
     * Listar planes con paginación y filtros
     * GET /api/v1/suscripciones-negocio/planes
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            activo: ParseHelper.parseBoolean(req.query.activo),
            busqueda: req.query.busqueda
        };

        const resultado = await PlanesModel.listar(options, organizacionId);

        return ResponseHelper.success(res, resultado);
    });

    /**
     * Listar solo planes activos (sin paginación)
     * GET /api/v1/suscripciones-negocio/planes/activos
     */
    static listarActivos = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const planes = await PlanesModel.listarActivos(organizacionId);

        return ResponseHelper.success(res, planes);
    });

    /**
     * Listar planes públicos de Nexo Team (para página de checkout)
     * GET /api/v1/suscripciones-negocio/planes/publicos
     *
     * NO requiere autenticación. Retorna los planes activos de Nexo Team
     * para que cualquier visitante pueda ver las opciones de suscripción.
     */
    static listarPublicos = asyncHandler(async (req, res) => {
        // Siempre usar la organización Nexo Team para planes públicos
        const planes = await PlanesModel.listarActivos(NEXO_TEAM_ORG_ID);

        return ResponseHelper.success(res, planes);
    });

    /**
     * Buscar plan por ID
     * GET /api/v1/suscripciones-negocio/planes/:id
     */
    static buscarPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const plan = await PlanesModel.buscarPorId(id, organizacionId);
        ErrorHelper.throwIfNotFound(plan, 'Plan de suscripción');

        return ResponseHelper.success(res, plan);
    });

    /**
     * Crear nuevo plan
     * POST /api/v1/suscripciones-negocio/planes
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const creadoPorId = req.user.id;

        const planData = req.body;

        const nuevoPlan = await PlanesModel.crear(planData, organizacionId, creadoPorId);

        return ResponseHelper.success(res, nuevoPlan, 'Plan creado exitosamente', 201);
    });

    /**
     * Actualizar plan existente
     * PUT /api/v1/suscripciones-negocio/planes/:id
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const planData = req.body;

        const planActualizado = await PlanesModel.actualizar(id, planData, organizacionId);

        return ResponseHelper.success(res, planActualizado, 'Plan actualizado exitosamente');
    });

    /**
     * Eliminar plan (solo si no tiene suscripciones activas)
     * DELETE /api/v1/suscripciones-negocio/planes/:id
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        await PlanesModel.eliminar(id, organizacionId);

        return ResponseHelper.success(res, null, 'Plan eliminado exitosamente');
    });

    /**
     * Contar suscripciones activas de un plan
     * GET /api/v1/suscripciones-negocio/planes/:id/suscripciones-activas
     */
    static contarSuscripcionesActivas = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const total = await PlanesModel.contarSuscripcionesActivas(id, organizacionId);

        return ResponseHelper.success(res, { total });
    });
}

module.exports = PlanesController;

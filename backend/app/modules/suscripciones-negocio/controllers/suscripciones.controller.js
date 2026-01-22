/**
 * ====================================================================
 * CONTROLLER: SUSCRIPCIONES
 * ====================================================================
 * Gestión de suscripciones de clientes con operaciones de estado.
 *
 * @module controllers/suscripciones
 */

const asyncHandler = require('../../../middleware/asyncHandler');
const { SuscripcionesModel } = require('../models');
const { ResponseHelper, ErrorHelper, ParseHelper } = require('../../../utils/helpers');

class SuscripcionesController {

    /**
     * Listar suscripciones con paginación y filtros
     * GET /api/v1/suscripciones-negocio/suscripciones
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            estado: req.query.estado,
            plan_id: req.query.plan_id ? parseInt(req.query.plan_id) : undefined,
            cliente_id: req.query.cliente_id ? parseInt(req.query.cliente_id) : undefined,
            periodo: req.query.periodo,
            es_trial: ParseHelper.parseBoolean(req.query.es_trial),
            gateway: req.query.gateway,
            auto_cobro: ParseHelper.parseBoolean(req.query.auto_cobro),
            busqueda: req.query.busqueda,
            fecha_desde: req.query.fecha_desde,
            fecha_hasta: req.query.fecha_hasta
        };

        const resultado = await SuscripcionesModel.listar(options, organizacionId);

        return ResponseHelper.success(res, resultado);
    });

    /**
     * Buscar suscripción por ID
     * GET /api/v1/suscripciones-negocio/suscripciones/:id
     */
    static buscarPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const suscripcion = await SuscripcionesModel.buscarPorId(id, organizacionId);
        ErrorHelper.throwIfNotFound(suscripcion, 'Suscripción');

        return ResponseHelper.success(res, suscripcion);
    });

    /**
     * Crear nueva suscripción
     * POST /api/v1/suscripciones-negocio/suscripciones
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const creadoPorId = req.user.id;

        const suscripcionData = req.body;

        const nuevaSuscripcion = await SuscripcionesModel.crear(
            suscripcionData,
            organizacionId,
            creadoPorId
        );

        return ResponseHelper.success(res, nuevaSuscripcion, 'Suscripción creada exitosamente', 201);
    });

    /**
     * Actualizar suscripción existente
     * PUT /api/v1/suscripciones-negocio/suscripciones/:id
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const suscripcionData = req.body;

        const suscripcionActualizada = await SuscripcionesModel.actualizar(
            id,
            suscripcionData,
            organizacionId
        );

        return ResponseHelper.success(res, suscripcionActualizada, 'Suscripción actualizada exitosamente');
    });

    /**
     * Cambiar estado de suscripción
     * PATCH /api/v1/suscripciones-negocio/suscripciones/:id/estado
     */
    static cambiarEstado = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { nuevo_estado, razon } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const suscripcionActualizada = await SuscripcionesModel.cambiarEstado(
            id,
            nuevo_estado,
            organizacionId,
            { razon }
        );

        return ResponseHelper.success(res, suscripcionActualizada, `Suscripción ${nuevo_estado}`);
    });

    /**
     * Cambiar plan de suscripción
     * PATCH /api/v1/suscripciones-negocio/suscripciones/:id/cambiar-plan
     */
    static cambiarPlan = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { nuevo_plan_id, periodo, cambio_inmediato = false } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const suscripcionActualizada = await SuscripcionesModel.cambiarPlan(
            id,
            nuevo_plan_id,
            organizacionId,
            { periodo, cambio_inmediato }
        );

        return ResponseHelper.success(res, suscripcionActualizada, 'Plan cambiado exitosamente');
    });

    /**
     * Cancelar suscripción
     * POST /api/v1/suscripciones-negocio/suscripciones/:id/cancelar
     */
    static cancelar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { razon, inmediato = false } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const suscripcionCancelada = await SuscripcionesModel.cancelar(
            id,
            organizacionId,
            { razon, inmediato }
        );

        return ResponseHelper.success(
            res,
            suscripcionCancelada,
            inmediato ? 'Suscripción cancelada inmediatamente' : 'Suscripción programada para cancelar'
        );
    });

    /**
     * Pausar suscripción
     * POST /api/v1/suscripciones-negocio/suscripciones/:id/pausar
     */
    static pausar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { razon } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const suscripcionPausada = await SuscripcionesModel.pausar(id, organizacionId, razon);

        return ResponseHelper.success(res, suscripcionPausada, 'Suscripción pausada');
    });

    /**
     * Reactivar suscripción pausada
     * POST /api/v1/suscripciones-negocio/suscripciones/:id/reactivar
     */
    static reactivar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const suscripcionReactivada = await SuscripcionesModel.reactivar(id, organizacionId);

        return ResponseHelper.success(res, suscripcionReactivada, 'Suscripción reactivada');
    });

    /**
     * Actualizar fecha de próximo cobro
     * PATCH /api/v1/suscripciones-negocio/suscripciones/:id/proximo-cobro
     */
    static actualizarProximoCobro = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { fecha_proximo_cobro } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const suscripcionActualizada = await SuscripcionesModel.actualizarProximoCobro(
            id,
            fecha_proximo_cobro,
            organizacionId
        );

        return ResponseHelper.success(res, suscripcionActualizada, 'Fecha de cobro actualizada');
    });

    /**
     * Obtener historial de cambios de una suscripción
     * GET /api/v1/suscripciones-negocio/suscripciones/:id/historial
     */
    static obtenerHistorial = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const historial = await SuscripcionesModel.obtenerHistorial(id, organizacionId);

        return ResponseHelper.success(res, historial);
    });

    /**
     * Buscar suscripciones de un cliente
     * GET /api/v1/suscripciones-negocio/suscripciones/cliente/:clienteId
     */
    static buscarPorCliente = asyncHandler(async (req, res) => {
        const { clienteId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const suscripciones = await SuscripcionesModel.buscarPorCliente(
            clienteId,
            organizacionId
        );

        return ResponseHelper.success(res, suscripciones);
    });
}

module.exports = SuscripcionesController;

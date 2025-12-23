/**
 * ====================================================================
 * CONTROLLER - APROBACIONES
 * ====================================================================
 *
 * Endpoints para gestión de aprobaciones de workflow:
 * - Bandeja de aprobaciones pendientes
 * - Aprobar/Rechazar solicitudes
 * - Historial de aprobaciones
 * - Gestión de delegaciones
 */

const { WorkflowInstanciasModel } = require('../models');
const WorkflowEngine = require('../services/workflow.engine');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');

class AprobacionesController {

    // ========================================================================
    // BANDEJA DE APROBACIONES
    // ========================================================================

    /**
     * Listar aprobaciones pendientes para el usuario actual
     * GET /api/v1/workflows/pendientes
     */
    static listarPendientes = asyncHandler(async (req, res) => {
        const usuarioId = req.user.id;
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            entidad_tipo: req.query.entidad_tipo || undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : 20,
            offset: req.query.offset ? parseInt(req.query.offset) : 0
        };

        const resultado = await WorkflowInstanciasModel.obtenerPendientes(
            usuarioId,
            organizacionId,
            filtros
        );

        return ResponseHelper.success(
            res,
            resultado,
            'Aprobaciones pendientes obtenidas exitosamente'
        );
    });

    /**
     * Contar aprobaciones pendientes (para badge)
     * GET /api/v1/workflows/pendientes/count
     */
    static contarPendientes = asyncHandler(async (req, res) => {
        const usuarioId = req.user.id;
        const organizacionId = req.tenant.organizacionId;

        const total = await WorkflowInstanciasModel.contarPendientes(
            usuarioId,
            organizacionId
        );

        return ResponseHelper.success(res, { total }, 'Conteo obtenido exitosamente');
    });

    /**
     * Obtener detalle de una instancia
     * GET /api/v1/workflows/instancias/:id
     */
    static obtenerInstancia = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const instancia = await WorkflowInstanciasModel.obtenerPorId(
            parseInt(id),
            organizacionId
        );

        if (!instancia) {
            return ResponseHelper.error(res, 'Instancia no encontrada', 404);
        }

        return ResponseHelper.success(res, instancia, 'Instancia obtenida exitosamente');
    });

    // ========================================================================
    // ACCIONES DE APROBACIÓN
    // ========================================================================

    /**
     * Aprobar una solicitud
     * POST /api/v1/workflows/instancias/:id/aprobar
     */
    static aprobar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { comentario } = req.body;
        const usuarioId = req.user.id;
        const organizacionId = req.tenant.organizacionId;

        const instancia = await WorkflowEngine.aprobar(
            parseInt(id),
            usuarioId,
            comentario,
            organizacionId
        );

        return ResponseHelper.success(
            res,
            instancia,
            'Solicitud aprobada exitosamente'
        );
    });

    /**
     * Rechazar una solicitud
     * POST /api/v1/workflows/instancias/:id/rechazar
     */
    static rechazar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { motivo } = req.body;
        const usuarioId = req.user.id;
        const organizacionId = req.tenant.organizacionId;

        const instancia = await WorkflowEngine.rechazar(
            parseInt(id),
            usuarioId,
            motivo,
            organizacionId
        );

        return ResponseHelper.success(
            res,
            instancia,
            'Solicitud rechazada'
        );
    });

    // ========================================================================
    // HISTORIAL
    // ========================================================================

    /**
     * Obtener historial de aprobaciones
     * GET /api/v1/workflows/historial
     */
    static listarHistorial = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            entidad_tipo: req.query.entidad_tipo || undefined,
            estado: req.query.estado || undefined,
            fecha_desde: req.query.fecha_desde || undefined,
            fecha_hasta: req.query.fecha_hasta || undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : 50,
            offset: req.query.offset ? parseInt(req.query.offset) : 0
        };

        const resultado = await WorkflowInstanciasModel.obtenerHistorial(
            organizacionId,
            filtros
        );

        return ResponseHelper.success(
            res,
            resultado,
            'Historial obtenido exitosamente'
        );
    });

    // ========================================================================
    // DELEGACIONES
    // ========================================================================

    /**
     * Crear delegación
     * POST /api/v1/workflows/delegaciones
     */
    static crearDelegacion = asyncHandler(async (req, res) => {
        const usuarioId = req.user.id;
        const organizacionId = req.tenant.organizacionId;

        const delegacion = await WorkflowInstanciasModel.crearDelegacion(
            req.body,
            usuarioId,
            organizacionId
        );

        return ResponseHelper.success(
            res,
            delegacion,
            'Delegación creada exitosamente',
            201
        );
    });

    /**
     * Listar delegaciones del usuario
     * GET /api/v1/workflows/delegaciones
     */
    static listarDelegaciones = asyncHandler(async (req, res) => {
        const usuarioId = req.user.id;
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            activas: req.query.activas === 'true' ? true :
                     req.query.activas === 'false' ? false : undefined,
            como_delegado: req.query.como_delegado === 'true'
        };

        const delegaciones = await WorkflowInstanciasModel.listarDelegaciones(
            usuarioId,
            organizacionId,
            filtros
        );

        return ResponseHelper.success(
            res,
            delegaciones,
            'Delegaciones obtenidas exitosamente'
        );
    });

    /**
     * Actualizar delegación
     * PUT /api/v1/workflows/delegaciones/:id
     */
    static actualizarDelegacion = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const usuarioId = req.user.id;
        const organizacionId = req.tenant.organizacionId;

        const delegacion = await WorkflowInstanciasModel.actualizarDelegacion(
            parseInt(id),
            req.body,
            usuarioId,
            organizacionId
        );

        return ResponseHelper.success(
            res,
            delegacion,
            'Delegación actualizada exitosamente'
        );
    });

    /**
     * Eliminar delegación
     * DELETE /api/v1/workflows/delegaciones/:id
     */
    static eliminarDelegacion = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const usuarioId = req.user.id;
        const organizacionId = req.tenant.organizacionId;

        const delegacion = await WorkflowInstanciasModel.eliminarDelegacion(
            parseInt(id),
            usuarioId,
            organizacionId
        );

        return ResponseHelper.success(
            res,
            delegacion,
            'Delegación eliminada exitosamente'
        );
    });

    // ========================================================================
    // DEFINICIONES (LECTURA)
    // ========================================================================

    /**
     * Listar definiciones de workflows
     * GET /api/v1/workflows/definiciones
     */
    static listarDefiniciones = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            entidad_tipo: req.query.entidad_tipo || undefined,
            activo: req.query.activo === 'true' ? true :
                    req.query.activo === 'false' ? false : undefined
        };

        const definiciones = await WorkflowInstanciasModel.listarDefiniciones(
            organizacionId,
            filtros
        );

        return ResponseHelper.success(
            res,
            definiciones,
            'Definiciones obtenidas exitosamente'
        );
    });

    /**
     * Obtener definición por ID
     * GET /api/v1/workflows/definiciones/:id
     */
    static obtenerDefinicion = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const definicion = await WorkflowInstanciasModel.obtenerDefinicionPorId(
            parseInt(id),
            organizacionId
        );

        if (!definicion) {
            return ResponseHelper.error(res, 'Definición no encontrada', 404);
        }

        return ResponseHelper.success(
            res,
            definicion,
            'Definición obtenida exitosamente'
        );
    });
}

module.exports = AprobacionesController;

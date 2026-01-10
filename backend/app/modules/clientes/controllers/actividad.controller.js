/**
 * ====================================================================
 * CONTROLLER DE ACTIVIDADES CLIENTE (Timeline)
 * ====================================================================
 *
 * Fase 4A - Timeline de Actividad (Ene 2026)
 * CRUD para notas, llamadas, tareas y timeline unificado
 *
 * ====================================================================
 */

const ActividadClienteModel = require('../models/actividad.model');
const ClienteModel = require('../models/cliente.model');
const { ResponseHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');

class ActividadClienteController {

    // ====================================================================
    // CRUD ACTIVIDADES
    // ====================================================================

    /**
     * Crear nueva actividad
     * POST /clientes/:clienteId/actividades
     */
    static crear = asyncHandler(async (req, res) => {
        const { clienteId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        // Verificar que el cliente existe
        const cliente = await ClienteModel.obtenerPorId(parseInt(clienteId), organizacionId);
        if (!cliente) {
            return ResponseHelper.notFound(res, 'Cliente no encontrado');
        }

        const actividadData = {
            ...req.body,
            organizacion_id: organizacionId,
            cliente_id: parseInt(clienteId),
            usuario_id: req.user?.id || null
        };

        const nuevaActividad = await ActividadClienteModel.crear(actividadData);

        return ResponseHelper.success(res, nuevaActividad, 'Actividad creada exitosamente', 201);
    });

    /**
     * Listar actividades de un cliente
     * GET /clientes/:clienteId/actividades
     */
    static listar = asyncHandler(async (req, res) => {
        const { clienteId } = req.params;
        const {
            page = 1,
            limit = 20,
            tipo,
            estado,
            soloTareas
        } = req.query;

        const resultado = await ActividadClienteModel.listarPorCliente(
            req.tenant.organizacionId,
            parseInt(clienteId),
            {
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 100),
                tipo,
                estado,
                soloTareas: soloTareas === 'true'
            }
        );

        return ResponseHelper.paginated(
            res,
            resultado.actividades,
            resultado.paginacion,
            'Actividades listadas exitosamente'
        );
    });

    /**
     * Obtener timeline unificado (actividades + citas + ventas)
     * GET /clientes/:clienteId/timeline
     */
    static obtenerTimeline = asyncHandler(async (req, res) => {
        const { clienteId } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        // Verificar que el cliente existe
        const cliente = await ClienteModel.obtenerPorId(
            parseInt(clienteId),
            req.tenant.organizacionId
        );
        if (!cliente) {
            return ResponseHelper.notFound(res, 'Cliente no encontrado');
        }

        const timeline = await ActividadClienteModel.obtenerTimeline(
            req.tenant.organizacionId,
            parseInt(clienteId),
            parseInt(limit),
            parseInt(offset)
        );

        return ResponseHelper.success(res, {
            cliente: {
                id: cliente.id,
                nombre: cliente.nombre
            },
            timeline,
            total: timeline.length
        }, 'Timeline obtenido exitosamente');
    });

    /**
     * Obtener actividad por ID
     * GET /clientes/:clienteId/actividades/:actividadId
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { actividadId } = req.params;

        const actividad = await ActividadClienteModel.obtenerPorId(
            req.tenant.organizacionId,
            parseInt(actividadId)
        );

        if (!actividad) {
            return ResponseHelper.notFound(res, 'Actividad no encontrada');
        }

        return ResponseHelper.success(res, actividad, 'Actividad obtenida exitosamente');
    });

    /**
     * Actualizar actividad
     * PUT /clientes/:clienteId/actividades/:actividadId
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { actividadId } = req.params;

        const actividadActualizada = await ActividadClienteModel.actualizar(
            req.tenant.organizacionId,
            parseInt(actividadId),
            req.body
        );

        if (!actividadActualizada) {
            return ResponseHelper.notFound(res, 'Actividad no encontrada');
        }

        return ResponseHelper.success(res, actividadActualizada, 'Actividad actualizada exitosamente');
    });

    /**
     * Eliminar actividad
     * DELETE /clientes/:clienteId/actividades/:actividadId
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { actividadId } = req.params;

        const eliminada = await ActividadClienteModel.eliminar(
            req.tenant.organizacionId,
            parseInt(actividadId)
        );

        if (!eliminada) {
            return ResponseHelper.notFound(res, 'Actividad no encontrada');
        }

        return ResponseHelper.success(res, null, 'Actividad eliminada exitosamente');
    });

    // ====================================================================
    // TAREAS
    // ====================================================================

    /**
     * Marcar tarea como completada
     * PATCH /clientes/:clienteId/actividades/:actividadId/completar
     */
    static marcarCompletada = asyncHandler(async (req, res) => {
        const { actividadId } = req.params;

        const tareaCompletada = await ActividadClienteModel.marcarCompletada(
            req.tenant.organizacionId,
            parseInt(actividadId)
        );

        if (!tareaCompletada) {
            return ResponseHelper.notFound(res, 'Tarea no encontrada o no es una tarea válida');
        }

        return ResponseHelper.success(res, tareaCompletada, 'Tarea marcada como completada');
    });

    /**
     * Obtener mis tareas pendientes
     * GET /actividades/mis-tareas
     */
    static obtenerMisTareas = asyncHandler(async (req, res) => {
        const { limit = 50 } = req.query;
        const usuarioId = req.user?.id;

        if (!usuarioId) {
            return ResponseHelper.error(res, 'Usuario no autenticado', 401);
        }

        const tareas = await ActividadClienteModel.obtenerTareasPendientesUsuario(
            req.tenant.organizacionId,
            usuarioId,
            parseInt(limit)
        );

        return ResponseHelper.success(res, tareas, 'Tareas pendientes obtenidas exitosamente');
    });

    /**
     * Contar actividades de un cliente
     * GET /clientes/:clienteId/actividades/conteo
     */
    static contarActividades = asyncHandler(async (req, res) => {
        const { clienteId } = req.params;

        const conteo = await ActividadClienteModel.contarActividades(
            req.tenant.organizacionId,
            parseInt(clienteId)
        );

        return ResponseHelper.success(res, conteo, 'Conteo de actividades obtenido exitosamente');
    });
}

module.exports = ActividadClienteController;

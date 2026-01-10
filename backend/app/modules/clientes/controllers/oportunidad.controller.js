/**
 * ====================================================================
 * CONTROLLER DE OPORTUNIDADES B2B
 * ====================================================================
 *
 * Fase 5 - Pipeline de Oportunidades (Ene 2026)
 * CRUD para oportunidades comerciales y pipeline Kanban
 *
 * ====================================================================
 */

const OportunidadModel = require('../models/oportunidad.model');
const ClienteModel = require('../models/cliente.model');
const { ResponseHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');

class OportunidadController {

    // ====================================================================
    // ETAPAS DEL PIPELINE
    // ====================================================================

    /**
     * Listar etapas del pipeline
     * GET /oportunidades/etapas
     */
    static listarEtapas = asyncHandler(async (req, res) => {
        const { incluirInactivas } = req.query;

        const etapas = await OportunidadModel.listarEtapas(
            req.tenant.organizacionId,
            incluirInactivas === 'true'
        );

        return ResponseHelper.success(res, etapas, 'Etapas obtenidas exitosamente');
    });

    /**
     * Crear etapa
     * POST /oportunidades/etapas
     */
    static crearEtapa = asyncHandler(async (req, res) => {
        const etapaData = {
            ...req.body,
            organizacion_id: req.tenant.organizacionId
        };

        const nuevaEtapa = await OportunidadModel.crearEtapa(etapaData);

        return ResponseHelper.success(res, nuevaEtapa, 'Etapa creada exitosamente', 201);
    });

    /**
     * Actualizar etapa
     * PUT /oportunidades/etapas/:etapaId
     */
    static actualizarEtapa = asyncHandler(async (req, res) => {
        const { etapaId } = req.params;

        const etapaActualizada = await OportunidadModel.actualizarEtapa(
            req.tenant.organizacionId,
            parseInt(etapaId),
            req.body
        );

        if (!etapaActualizada) {
            return ResponseHelper.notFound(res, 'Etapa no encontrada');
        }

        return ResponseHelper.success(res, etapaActualizada, 'Etapa actualizada exitosamente');
    });

    /**
     * Eliminar etapa
     * DELETE /oportunidades/etapas/:etapaId
     */
    static eliminarEtapa = asyncHandler(async (req, res) => {
        const { etapaId } = req.params;

        try {
            const resultado = await OportunidadModel.eliminarEtapa(
                req.tenant.organizacionId,
                parseInt(etapaId)
            );

            if (!resultado) {
                return ResponseHelper.notFound(res, 'Etapa no encontrada');
            }

            return ResponseHelper.success(res, null, 'Etapa eliminada exitosamente');
        } catch (error) {
            if (error.message.includes('oportunidades activas')) {
                return ResponseHelper.error(res, error.message, 400);
            }
            throw error;
        }
    });

    /**
     * Reordenar etapas
     * PUT /oportunidades/etapas/reordenar
     */
    static reordenarEtapas = asyncHandler(async (req, res) => {
        const { orden } = req.body; // Array de IDs en el orden deseado

        if (!Array.isArray(orden) || orden.length === 0) {
            return ResponseHelper.error(res, 'Se requiere un array de IDs de etapas', 400);
        }

        await OportunidadModel.reordenarEtapas(req.tenant.organizacionId, orden);

        return ResponseHelper.success(res, null, 'Etapas reordenadas exitosamente');
    });

    // ====================================================================
    // CRUD OPORTUNIDADES
    // ====================================================================

    /**
     * Crear oportunidad
     * POST /oportunidades
     * POST /clientes/:clienteId/oportunidades
     */
    static crear = asyncHandler(async (req, res) => {
        const clienteId = req.params.clienteId || req.body.cliente_id;
        const organizacionId = req.tenant.organizacionId;

        if (!clienteId) {
            return ResponseHelper.error(res, 'Se requiere cliente_id', 400);
        }

        // Verificar que el cliente existe
        const cliente = await ClienteModel.obtenerPorId(parseInt(clienteId), organizacionId);
        if (!cliente) {
            return ResponseHelper.notFound(res, 'Cliente no encontrado');
        }

        const oportunidadData = {
            ...req.body,
            organizacion_id: organizacionId,
            cliente_id: parseInt(clienteId),
            creado_por: req.user?.id || null
        };

        const nuevaOportunidad = await OportunidadModel.crear(oportunidadData);

        return ResponseHelper.success(res, nuevaOportunidad, 'Oportunidad creada exitosamente', 201);
    });

    /**
     * Listar oportunidades
     * GET /oportunidades
     */
    static listar = asyncHandler(async (req, res) => {
        const {
            page = 1,
            limit = 20,
            cliente_id,
            etapa_id,
            vendedor_id,
            estado,
            prioridad,
            fecha_desde,
            fecha_hasta,
            busqueda
        } = req.query;

        const resultado = await OportunidadModel.listar(
            req.tenant.organizacionId,
            {
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 100),
                cliente_id: cliente_id ? parseInt(cliente_id) : undefined,
                etapa_id: etapa_id ? parseInt(etapa_id) : undefined,
                vendedor_id: vendedor_id ? parseInt(vendedor_id) : undefined,
                estado,
                prioridad,
                fecha_desde,
                fecha_hasta,
                busqueda
            }
        );

        return ResponseHelper.paginated(
            res,
            resultado.oportunidades,
            resultado.paginacion,
            'Oportunidades listadas exitosamente'
        );
    });

    /**
     * Listar oportunidades de un cliente
     * GET /clientes/:clienteId/oportunidades
     */
    static listarPorCliente = asyncHandler(async (req, res) => {
        const { clienteId } = req.params;
        const { page = 1, limit = 20, estado } = req.query;

        const resultado = await OportunidadModel.listarPorCliente(
            req.tenant.organizacionId,
            parseInt(clienteId),
            {
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 100),
                estado
            }
        );

        return ResponseHelper.paginated(
            res,
            resultado.oportunidades,
            resultado.paginacion,
            'Oportunidades del cliente listadas exitosamente'
        );
    });

    /**
     * Obtener oportunidad por ID
     * GET /oportunidades/:oportunidadId
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { oportunidadId } = req.params;

        const oportunidad = await OportunidadModel.obtenerPorId(
            req.tenant.organizacionId,
            parseInt(oportunidadId)
        );

        if (!oportunidad) {
            return ResponseHelper.notFound(res, 'Oportunidad no encontrada');
        }

        return ResponseHelper.success(res, oportunidad, 'Oportunidad obtenida exitosamente');
    });

    /**
     * Actualizar oportunidad
     * PUT /oportunidades/:oportunidadId
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { oportunidadId } = req.params;

        const oportunidadActualizada = await OportunidadModel.actualizar(
            req.tenant.organizacionId,
            parseInt(oportunidadId),
            req.body
        );

        if (!oportunidadActualizada) {
            return ResponseHelper.notFound(res, 'Oportunidad no encontrada');
        }

        return ResponseHelper.success(res, oportunidadActualizada, 'Oportunidad actualizada exitosamente');
    });

    /**
     * Eliminar oportunidad
     * DELETE /oportunidades/:oportunidadId
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { oportunidadId } = req.params;

        const eliminada = await OportunidadModel.eliminar(
            req.tenant.organizacionId,
            parseInt(oportunidadId)
        );

        if (!eliminada) {
            return ResponseHelper.notFound(res, 'Oportunidad no encontrada');
        }

        return ResponseHelper.success(res, null, 'Oportunidad eliminada exitosamente');
    });

    // ====================================================================
    // OPERACIONES PIPELINE (KANBAN)
    // ====================================================================

    /**
     * Obtener pipeline completo para Kanban
     * GET /oportunidades/pipeline
     */
    static obtenerPipeline = asyncHandler(async (req, res) => {
        const { vendedor_id } = req.query;

        const pipeline = await OportunidadModel.obtenerPipeline(
            req.tenant.organizacionId,
            vendedor_id ? parseInt(vendedor_id) : null
        );

        return ResponseHelper.success(res, pipeline, 'Pipeline obtenido exitosamente');
    });

    /**
     * Mover oportunidad a otra etapa (drag & drop)
     * PATCH /oportunidades/:oportunidadId/mover
     */
    static moverAEtapa = asyncHandler(async (req, res) => {
        const { oportunidadId } = req.params;
        const { etapa_id } = req.body;

        if (!etapa_id) {
            return ResponseHelper.error(res, 'Se requiere etapa_id', 400);
        }

        const oportunidad = await OportunidadModel.moverAEtapa(
            req.tenant.organizacionId,
            parseInt(oportunidadId),
            parseInt(etapa_id)
        );

        if (!oportunidad) {
            return ResponseHelper.notFound(res, 'Oportunidad no encontrada');
        }

        return ResponseHelper.success(res, oportunidad, 'Oportunidad movida exitosamente');
    });

    /**
     * Marcar como ganada
     * PATCH /oportunidades/:oportunidadId/ganar
     */
    static marcarGanada = asyncHandler(async (req, res) => {
        const { oportunidadId } = req.params;

        try {
            const oportunidad = await OportunidadModel.marcarGanada(
                req.tenant.organizacionId,
                parseInt(oportunidadId)
            );

            if (!oportunidad) {
                return ResponseHelper.notFound(res, 'Oportunidad no encontrada');
            }

            return ResponseHelper.success(res, oportunidad, 'Oportunidad marcada como ganada');
        } catch (error) {
            if (error.message.includes('etapa')) {
                return ResponseHelper.error(res, error.message, 400);
            }
            throw error;
        }
    });

    /**
     * Marcar como perdida
     * PATCH /oportunidades/:oportunidadId/perder
     */
    static marcarPerdida = asyncHandler(async (req, res) => {
        const { oportunidadId } = req.params;
        const { motivo_perdida } = req.body;

        try {
            const oportunidad = await OportunidadModel.marcarPerdida(
                req.tenant.organizacionId,
                parseInt(oportunidadId),
                motivo_perdida || null
            );

            if (!oportunidad) {
                return ResponseHelper.notFound(res, 'Oportunidad no encontrada');
            }

            return ResponseHelper.success(res, oportunidad, 'Oportunidad marcada como perdida');
        } catch (error) {
            if (error.message.includes('etapa')) {
                return ResponseHelper.error(res, error.message, 400);
            }
            throw error;
        }
    });

    // ====================================================================
    // ESTADÍSTICAS Y REPORTES
    // ====================================================================

    /**
     * Obtener estadísticas de oportunidades por cliente
     * GET /clientes/:clienteId/oportunidades/estadisticas
     */
    static obtenerEstadisticasCliente = asyncHandler(async (req, res) => {
        const { clienteId } = req.params;

        const estadisticas = await OportunidadModel.obtenerEstadisticasCliente(
            req.tenant.organizacionId,
            parseInt(clienteId)
        );

        return ResponseHelper.success(res, estadisticas, 'Estadísticas obtenidas exitosamente');
    });

    /**
     * Obtener pronóstico de ventas
     * GET /oportunidades/pronostico
     */
    static obtenerPronostico = asyncHandler(async (req, res) => {
        const { fecha_inicio, fecha_fin } = req.query;

        const pronostico = await OportunidadModel.obtenerPronostico(
            req.tenant.organizacionId,
            fecha_inicio || null,
            fecha_fin || null
        );

        return ResponseHelper.success(res, pronostico, 'Pronóstico obtenido exitosamente');
    });

    /**
     * Obtener estadísticas del pipeline
     * GET /oportunidades/estadisticas
     */
    static obtenerEstadisticasPipeline = asyncHandler(async (req, res) => {
        const { vendedor_id } = req.query;

        const estadisticas = await OportunidadModel.obtenerEstadisticasPipeline(
            req.tenant.organizacionId,
            vendedor_id ? parseInt(vendedor_id) : null
        );

        return ResponseHelper.success(res, estadisticas, 'Estadísticas del pipeline obtenidas exitosamente');
    });
}

module.exports = OportunidadController;

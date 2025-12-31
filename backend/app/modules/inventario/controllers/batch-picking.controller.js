/**
 * Controller para Batch Picking (Wave Picking)
 * Agrupacion de operaciones de picking para procesamiento consolidado
 * Fecha: 31 Diciembre 2025
 */

const { asyncHandler } = require('../../../middleware');
const { ResponseHelper } = require('../../../utils/helpers');
const BatchPickingModel = require('../models/batch-picking.model');

class BatchPickingController {
    // ==================== CRUD ====================

    /**
     * GET /api/v1/inventario/batch-picking
     * Listar batches con filtros
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { sucursal_id, estado, estados, asignado_a, limit } = req.query;

        const filtros = {};
        if (sucursal_id) filtros.sucursal_id = parseInt(sucursal_id);
        if (estado) filtros.estado = estado;
        if (estados) filtros.estados = estados.split(',');
        if (asignado_a) filtros.asignado_a = parseInt(asignado_a);
        if (limit) filtros.limit = parseInt(limit);

        const batches = await BatchPickingModel.listar(organizacionId, filtros);

        return ResponseHelper.success(res, batches, 'Batches obtenidos');
    });

    /**
     * GET /api/v1/inventario/batch-picking/:id
     * Obtener batch con operaciones
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id } = req.params;

        const batch = await BatchPickingModel.obtenerPorId(parseInt(id), organizacionId);

        if (!batch) {
            return ResponseHelper.notFound(res, 'Batch no encontrado');
        }

        return ResponseHelper.success(res, batch, 'Batch obtenido');
    });

    /**
     * POST /api/v1/inventario/batch-picking
     * Crear batch de picking
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;
        const { sucursal_id, operacion_ids, nombre } = req.body;

        if (!operacion_ids || !Array.isArray(operacion_ids) || operacion_ids.length === 0) {
            return ResponseHelper.error(res, 'Se requiere array de operacion_ids', 400);
        }

        try {
            const batchId = await BatchPickingModel.crear(
                { sucursal_id, operacion_ids, nombre },
                organizacionId,
                usuarioId
            );

            const batch = await BatchPickingModel.obtenerPorId(batchId, organizacionId);

            return ResponseHelper.created(res, batch, 'Batch creado');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    });

    /**
     * PUT /api/v1/inventario/batch-picking/:id
     * Actualizar batch
     */
    static actualizar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id } = req.params;

        const batch = await BatchPickingModel.actualizar(parseInt(id), req.body, organizacionId);

        if (!batch) {
            return ResponseHelper.notFound(res, 'Batch no encontrado');
        }

        return ResponseHelper.success(res, batch, 'Batch actualizado');
    });

    /**
     * DELETE /api/v1/inventario/batch-picking/:id
     * Eliminar batch (solo si esta en borrador)
     */
    static eliminar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id } = req.params;

        const eliminado = await BatchPickingModel.eliminar(parseInt(id), organizacionId);

        if (!eliminado) {
            return ResponseHelper.error(res, 'No se puede eliminar. Batch no encontrado o no esta en borrador', 400);
        }

        return ResponseHelper.success(res, { id: parseInt(id) }, 'Batch eliminado');
    });

    // ==================== GESTION DE OPERACIONES ====================

    /**
     * POST /api/v1/inventario/batch-picking/:id/operaciones
     * Agregar operacion al batch
     */
    static agregarOperacion = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id } = req.params;
        const { operacion_id } = req.body;

        const relacion = await BatchPickingModel.agregarOperacion(
            parseInt(id),
            parseInt(operacion_id),
            organizacionId
        );

        if (!relacion) {
            return ResponseHelper.error(res, 'No se pudo agregar la operacion', 400);
        }

        return ResponseHelper.success(res, relacion, 'Operacion agregada al batch');
    });

    /**
     * DELETE /api/v1/inventario/batch-picking/:id/operaciones/:operacionId
     * Quitar operacion del batch
     */
    static quitarOperacion = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id, operacionId } = req.params;

        const removido = await BatchPickingModel.quitarOperacion(
            parseInt(id),
            parseInt(operacionId),
            organizacionId
        );

        if (!removido) {
            return ResponseHelper.notFound(res, 'Relacion no encontrada');
        }

        return ResponseHelper.success(res, { batch_id: parseInt(id), operacion_id: parseInt(operacionId) }, 'Operacion removida del batch');
    });

    // ==================== PROCESAMIENTO ====================

    /**
     * POST /api/v1/inventario/batch-picking/:id/iniciar
     * Iniciar procesamiento del batch
     */
    static iniciar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;
        const { id } = req.params;

        const resultado = await BatchPickingModel.iniciar(parseInt(id), usuarioId, organizacionId);

        if (!resultado.exito) {
            return ResponseHelper.error(res, resultado.error, 400);
        }

        return ResponseHelper.success(res, resultado, resultado.mensaje);
    });

    /**
     * POST /api/v1/inventario/batch-picking/:id/procesar-item
     * Procesar item del batch
     */
    static procesarItem = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;
        const { id } = req.params;
        const { producto_id, variante_id, ubicacion_id, cantidad } = req.body;

        if (!producto_id || !cantidad) {
            return ResponseHelper.error(res, 'Se requiere producto_id y cantidad', 400);
        }

        const resultado = await BatchPickingModel.procesarItem(
            parseInt(id),
            parseInt(producto_id),
            variante_id ? parseInt(variante_id) : null,
            ubicacion_id ? parseInt(ubicacion_id) : null,
            parseInt(cantidad),
            usuarioId,
            organizacionId
        );

        if (!resultado.exito) {
            return ResponseHelper.error(res, resultado.error || resultado.mensaje, 400);
        }

        return ResponseHelper.success(res, resultado, resultado.mensaje);
    });

    /**
     * POST /api/v1/inventario/batch-picking/:id/completar
     * Completar batch
     */
    static completar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;
        const { id } = req.params;

        const resultado = await BatchPickingModel.completar(parseInt(id), usuarioId, organizacionId);

        if (!resultado.exito) {
            return ResponseHelper.error(res, resultado.error, 400);
        }

        return ResponseHelper.success(res, resultado, resultado.mensaje);
    });

    /**
     * POST /api/v1/inventario/batch-picking/:id/cancelar
     * Cancelar batch
     */
    static cancelar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id } = req.params;

        const batch = await BatchPickingModel.cancelar(parseInt(id), organizacionId);

        if (!batch) {
            return ResponseHelper.error(res, 'Batch no encontrado o ya esta finalizado', 400);
        }

        return ResponseHelper.success(res, batch, 'Batch cancelado');
    });

    // ==================== LISTA CONSOLIDADA ====================

    /**
     * GET /api/v1/inventario/batch-picking/:id/lista-consolidada
     * Obtener lista consolidada de productos a recoger
     */
    static obtenerListaConsolidada = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id } = req.params;

        const lista = await BatchPickingModel.obtenerListaConsolidada(parseInt(id), organizacionId);

        return ResponseHelper.success(res, lista, 'Lista consolidada obtenida');
    });

    // ==================== ESTADISTICAS ====================

    /**
     * GET /api/v1/inventario/batch-picking/:id/estadisticas
     * Obtener estadisticas del batch
     */
    static obtenerEstadisticas = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id } = req.params;

        const estadisticas = await BatchPickingModel.obtenerEstadisticas(parseInt(id), organizacionId);

        if (!estadisticas) {
            return ResponseHelper.notFound(res, 'Batch no encontrado');
        }

        return ResponseHelper.success(res, estadisticas, 'Estadisticas obtenidas');
    });

    /**
     * GET /api/v1/inventario/batch-picking/pendientes/:sucursalId
     * Obtener batches pendientes de una sucursal
     */
    static obtenerPendientes = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { sucursalId } = req.params;

        const batches = await BatchPickingModel.obtenerPendientes(parseInt(sucursalId), organizacionId);

        return ResponseHelper.success(res, batches, 'Batches pendientes obtenidos');
    });

    /**
     * GET /api/v1/inventario/batch-picking/operaciones-disponibles/:sucursalId
     * Obtener operaciones de picking disponibles para batch
     */
    static obtenerOperacionesDisponibles = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { sucursalId } = req.params;

        const operaciones = await BatchPickingModel.obtenerOperacionesDisponibles(
            parseInt(sucursalId),
            organizacionId
        );

        return ResponseHelper.success(res, operaciones, 'Operaciones disponibles obtenidas');
    });
}

module.exports = BatchPickingController;

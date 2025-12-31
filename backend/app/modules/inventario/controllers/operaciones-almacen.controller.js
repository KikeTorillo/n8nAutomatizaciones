/**
 * Controller para Operaciones de Almacen
 * Sistema multi-paso: Recepcion, QC, Picking, Empaque, Envio
 * Fecha: 31 Diciembre 2025
 */

const { asyncHandler } = require('../../../middleware');
const { ResponseHelper } = require('../../../utils/helpers');
const OperacionesAlmacenModel = require('../models/operaciones-almacen.model');

class OperacionesAlmacenController {
    // ==================== CRUD ====================

    /**
     * GET /api/v1/inventario/operaciones
     * Listar operaciones con filtros
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { sucursal_id, tipo_operacion, estado, estados, asignado_a, origen_tipo, limit } = req.query;

        const filtros = {};
        if (sucursal_id) filtros.sucursal_id = parseInt(sucursal_id);
        if (tipo_operacion) filtros.tipo_operacion = tipo_operacion;
        if (estado) filtros.estado = estado;
        if (estados) filtros.estados = estados.split(',');
        if (asignado_a) filtros.asignado_a = parseInt(asignado_a);
        if (origen_tipo) filtros.origen_tipo = origen_tipo;
        if (limit) filtros.limit = parseInt(limit);

        const operaciones = await OperacionesAlmacenModel.listar(organizacionId, filtros);

        return ResponseHelper.success(res, operaciones, 'Operaciones obtenidas');
    });

    /**
     * GET /api/v1/inventario/operaciones/:id
     * Obtener operacion con items
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id } = req.params;

        const operacion = await OperacionesAlmacenModel.obtenerPorId(parseInt(id), organizacionId);

        if (!operacion) {
            return ResponseHelper.notFound(res, 'Operacion no encontrada');
        }

        return ResponseHelper.success(res, operacion, 'Operacion obtenida');
    });

    /**
     * POST /api/v1/inventario/operaciones
     * Crear operacion manual
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const operacion = await OperacionesAlmacenModel.crear(req.body, organizacionId, usuarioId);

        return ResponseHelper.created(res, operacion, 'Operacion creada');
    });

    /**
     * PUT /api/v1/inventario/operaciones/:id
     * Actualizar operacion
     */
    static actualizar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id } = req.params;

        const operacion = await OperacionesAlmacenModel.actualizar(parseInt(id), req.body, organizacionId);

        if (!operacion) {
            return ResponseHelper.notFound(res, 'Operacion no encontrada');
        }

        return ResponseHelper.success(res, operacion, 'Operacion actualizada');
    });

    // ==================== ACCIONES ====================

    /**
     * POST /api/v1/inventario/operaciones/:id/asignar
     * Asignar operacion a usuario
     */
    static asignar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id } = req.params;
        const { usuario_id } = req.body;

        const operacion = await OperacionesAlmacenModel.asignar(
            parseInt(id),
            usuario_id || req.user.id,
            organizacionId
        );

        if (!operacion) {
            return ResponseHelper.notFound(res, 'Operacion no encontrada');
        }

        return ResponseHelper.success(res, operacion, 'Operacion asignada');
    });

    /**
     * POST /api/v1/inventario/operaciones/:id/iniciar
     * Iniciar procesamiento de operacion
     */
    static iniciar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;
        const { id } = req.params;

        const operacion = await OperacionesAlmacenModel.iniciar(parseInt(id), usuarioId, organizacionId);

        if (!operacion) {
            return ResponseHelper.notFound(res, 'Operacion no encontrada');
        }

        return ResponseHelper.success(res, operacion, 'Operacion iniciada');
    });

    /**
     * POST /api/v1/inventario/operaciones/:id/completar
     * Completar operacion procesando items
     */
    static completar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;
        const { id } = req.params;
        const { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return ResponseHelper.error(res, 'Se requiere array de items a procesar', 400);
        }

        const resultado = await OperacionesAlmacenModel.completarOperacion(
            parseInt(id),
            items,
            usuarioId,
            organizacionId
        );

        if (!resultado.exito) {
            return ResponseHelper.error(res, resultado.error, 400);
        }

        return ResponseHelper.success(res, resultado, resultado.mensaje);
    });

    /**
     * POST /api/v1/inventario/operaciones/:id/cancelar
     * Cancelar operacion
     */
    static cancelar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;
        const { id } = req.params;
        const { motivo } = req.body;

        const operacion = await OperacionesAlmacenModel.cancelar(
            parseInt(id),
            motivo,
            usuarioId,
            organizacionId
        );

        if (!operacion) {
            return ResponseHelper.notFound(res, 'Operacion no encontrada');
        }

        return ResponseHelper.success(res, operacion, 'Operacion cancelada');
    });

    // ==================== ITEMS ====================

    /**
     * POST /api/v1/inventario/operaciones/items/:itemId/procesar
     * Procesar item individual
     */
    static procesarItem = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;
        const { itemId } = req.params;
        const { cantidad_procesada, ubicacion_destino_id } = req.body;

        const item = await OperacionesAlmacenModel.procesarItem(
            parseInt(itemId),
            parseInt(cantidad_procesada),
            ubicacion_destino_id ? parseInt(ubicacion_destino_id) : null,
            usuarioId,
            organizacionId
        );

        if (!item) {
            return ResponseHelper.notFound(res, 'Item no encontrado');
        }

        return ResponseHelper.success(res, item, 'Item procesado');
    });

    /**
     * POST /api/v1/inventario/operaciones/items/:itemId/cancelar
     * Cancelar item
     */
    static cancelarItem = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { itemId } = req.params;

        const item = await OperacionesAlmacenModel.cancelarItem(parseInt(itemId), organizacionId);

        if (!item) {
            return ResponseHelper.notFound(res, 'Item no encontrado');
        }

        return ResponseHelper.success(res, item, 'Item cancelado');
    });

    // ==================== CADENA MULTI-STEP ====================

    /**
     * GET /api/v1/inventario/operaciones/:id/cadena
     * Obtener cadena completa de operaciones
     */
    static obtenerCadena = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id } = req.params;

        const cadena = await OperacionesAlmacenModel.obtenerCadenaOperaciones(parseInt(id), organizacionId);

        return ResponseHelper.success(res, cadena, 'Cadena de operaciones obtenida');
    });

    // ==================== PENDIENTES Y ESTADISTICAS ====================

    /**
     * GET /api/v1/inventario/operaciones/pendientes/:sucursalId
     * Obtener operaciones pendientes de una sucursal
     */
    static obtenerPendientes = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { sucursalId } = req.params;

        const operaciones = await OperacionesAlmacenModel.obtenerPendientes(
            parseInt(sucursalId),
            organizacionId
        );

        return ResponseHelper.success(res, operaciones, 'Operaciones pendientes obtenidas');
    });

    /**
     * GET /api/v1/inventario/operaciones/estadisticas/:sucursalId
     * Obtener estadisticas por tipo
     */
    static obtenerEstadisticas = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { sucursalId } = req.params;

        const estadisticas = await OperacionesAlmacenModel.obtenerEstadisticas(
            parseInt(sucursalId),
            organizacionId
        );

        return ResponseHelper.success(res, estadisticas, 'Estadisticas obtenidas');
    });

    /**
     * GET /api/v1/inventario/operaciones/kanban/:sucursalId
     * Obtener resumen para vista Kanban
     */
    static obtenerResumenKanban = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { sucursalId } = req.params;

        const resumen = await OperacionesAlmacenModel.obtenerResumenKanban(
            parseInt(sucursalId),
            organizacionId
        );

        return ResponseHelper.success(res, resumen, 'Resumen Kanban obtenido');
    });
}

module.exports = OperacionesAlmacenController;

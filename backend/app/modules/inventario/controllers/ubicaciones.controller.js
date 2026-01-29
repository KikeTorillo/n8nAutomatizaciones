/**
 * ====================================================================
 * CONTROLLER: Ubicaciones de Almacén (WMS)
 * ====================================================================
 * Endpoints para gestión de ubicaciones jerárquicas y stock por ubicación
 */

const { UbicacionesAlmacenModel } = require('../models');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');

class UbicacionesAlmacenController {

    // ========================================================================
    // CRUD UBICACIONES
    // ========================================================================

    /**
     * Crear nueva ubicación
     * POST /api/v1/inventario/ubicaciones
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const ubicacion = await UbicacionesAlmacenModel.crear(organizacionId, {
            ...req.body,
            creado_por: req.user.id
        });

        return ResponseHelper.success(
            res,
            ubicacion,
            'Ubicación creada exitosamente',
            201
        );
    });

    /**
     * Obtener ubicación por ID
     * GET /api/v1/inventario/ubicaciones/:id
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const ubicacion = await UbicacionesAlmacenModel.buscarPorId(organizacionId, parseInt(id));

        if (!ubicacion) {
            return ResponseHelper.error(res, 'Ubicación no encontrada', 404);
        }

        return ResponseHelper.success(res, ubicacion, 'Ubicación obtenida exitosamente');
    });

    /**
     * Listar ubicaciones con filtros
     * GET /api/v1/inventario/ubicaciones
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        // Helper para parsear booleans de query params (Joi puede convertirlos a boolean)
        const parseBoolean = (value) => {
            if (value === undefined) return undefined;
            if (typeof value === 'boolean') return value;
            return value === 'true';
        };

        const filtros = {
            sucursal_id: req.query.sucursal_id ? parseInt(req.query.sucursal_id) : undefined,
            tipo: req.query.tipo || undefined,
            parent_id: req.query.parent_id !== undefined
                ? (req.query.parent_id === 'null' ? null : parseInt(req.query.parent_id))
                : undefined,
            es_picking: parseBoolean(req.query.es_picking),
            es_recepcion: parseBoolean(req.query.es_recepcion),
            activo: parseBoolean(req.query.activo),
            bloqueada: parseBoolean(req.query.bloqueada),
            busqueda: req.query.busqueda || undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : 100,
            offset: req.query.offset ? parseInt(req.query.offset) : 0
        };

        const resultado = await UbicacionesAlmacenModel.listar(organizacionId, filtros);

        return ResponseHelper.success(res, resultado, 'Ubicaciones obtenidas exitosamente');
    });

    /**
     * Obtener árbol de ubicaciones de una sucursal
     * GET /api/v1/inventario/ubicaciones/arbol/:sucursalId
     */
    static obtenerArbol = asyncHandler(async (req, res) => {
        const { sucursalId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const arbol = await UbicacionesAlmacenModel.obtenerArbol(parseInt(sucursalId), organizacionId);

        return ResponseHelper.success(res, arbol, 'Árbol de ubicaciones obtenido exitosamente');
    });

    /**
     * Actualizar ubicación
     * PUT /api/v1/inventario/ubicaciones/:id
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const ubicacion = await UbicacionesAlmacenModel.actualizar(organizacionId, parseInt(id), req.body);

        return ResponseHelper.success(res, ubicacion, 'Ubicación actualizada exitosamente');
    });

    /**
     * Eliminar ubicación
     * DELETE /api/v1/inventario/ubicaciones/:id
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const ubicacion = await UbicacionesAlmacenModel.eliminar(organizacionId, parseInt(id));

        return ResponseHelper.success(res, ubicacion, 'Ubicación eliminada exitosamente');
    });

    /**
     * Bloquear/Desbloquear ubicación
     * PATCH /api/v1/inventario/ubicaciones/:id/bloquear
     */
    static toggleBloqueo = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { bloqueada, motivo_bloqueo } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const ubicacion = await UbicacionesAlmacenModel.actualizar(
            organizacionId,
            parseInt(id),
            { bloqueada, motivo_bloqueo: bloqueada ? motivo_bloqueo : null }
        );

        const mensaje = bloqueada ? 'Ubicación bloqueada' : 'Ubicación desbloqueada';
        return ResponseHelper.success(res, ubicacion, mensaje);
    });

    // ========================================================================
    // STOCK POR UBICACIÓN
    // ========================================================================

    /**
     * Obtener stock de una ubicación
     * GET /api/v1/inventario/ubicaciones/:id/stock
     */
    static obtenerStock = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const stock = await UbicacionesAlmacenModel.obtenerStock(parseInt(id), organizacionId);

        return ResponseHelper.success(res, stock, 'Stock de ubicación obtenido exitosamente');
    });

    /**
     * Obtener ubicaciones donde está un producto
     * GET /api/v1/inventario/productos/:productoId/ubicaciones
     */
    static obtenerUbicacionesProducto = asyncHandler(async (req, res) => {
        const { productoId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const ubicaciones = await UbicacionesAlmacenModel.obtenerUbicacionesProducto(
            parseInt(productoId),
            organizacionId
        );

        return ResponseHelper.success(res, ubicaciones, 'Ubicaciones del producto obtenidas exitosamente');
    });

    /**
     * Obtener ubicaciones disponibles para almacenar
     * GET /api/v1/inventario/ubicaciones/disponibles/:sucursalId
     */
    static obtenerDisponibles = asyncHandler(async (req, res) => {
        const { sucursalId } = req.params;
        const cantidad = req.query.cantidad ? parseInt(req.query.cantidad) : 1;
        const organizacionId = req.tenant.organizacionId;

        const ubicaciones = await UbicacionesAlmacenModel.obtenerDisponibles(
            parseInt(sucursalId),
            cantidad,
            organizacionId
        );

        return ResponseHelper.success(res, ubicaciones, 'Ubicaciones disponibles obtenidas exitosamente');
    });

    /**
     * Agregar stock a una ubicación
     * POST /api/v1/inventario/ubicaciones/:id/stock
     */
    static agregarStock = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const stock = await UbicacionesAlmacenModel.agregarStock({
            ubicacion_id: parseInt(id),
            ...req.body
        }, organizacionId);

        return ResponseHelper.success(res, stock, 'Stock agregado a ubicación exitosamente', 201);
    });

    /**
     * Mover stock entre ubicaciones
     * POST /api/v1/inventario/ubicaciones/mover-stock
     */
    static moverStock = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        await UbicacionesAlmacenModel.moverStock({
            ...req.body,
            usuario_id: req.user.id
        }, organizacionId);

        return ResponseHelper.success(res, { success: true }, 'Stock movido exitosamente');
    });

    // ========================================================================
    // ESTADÍSTICAS
    // ========================================================================

    /**
     * Obtener estadísticas de ubicaciones
     * GET /api/v1/inventario/ubicaciones/estadisticas/:sucursalId
     */
    static obtenerEstadisticas = asyncHandler(async (req, res) => {
        const { sucursalId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const estadisticas = await UbicacionesAlmacenModel.obtenerEstadisticas(
            parseInt(sucursalId),
            organizacionId
        );

        return ResponseHelper.success(res, estadisticas, 'Estadísticas obtenidas exitosamente');
    });
}

module.exports = UbicacionesAlmacenController;

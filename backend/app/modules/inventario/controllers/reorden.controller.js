/**
 * Controller para Sistema de Reorden Automatico
 * Endpoints para gestion de reglas, ejecucion y monitoreo
 * Fecha: 29 Diciembre 2025
 */

const { asyncHandler } = require('../../../middleware');
const { ResponseHelper } = require('../../../utils/helpers');
const ReordenModel = require('../models/reorden.model');
const RutasOperacionModel = require('../models/rutas-operacion.model');

class ReordenController {
    // ==================== REGLAS ====================

    /**
     * GET /api/v1/inventario/reorden/reglas
     * Listar reglas de reabastecimiento
     */
    static listarReglas = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { activo, producto_id } = req.query;

        const filtros = {};
        if (activo !== undefined) filtros.activo = activo === 'true';
        if (producto_id) filtros.producto_id = parseInt(producto_id);

        const reglas = await RutasOperacionModel.listarReglas(organizacionId, filtros);

        return ResponseHelper.success(res, reglas, 'Reglas de reabastecimiento obtenidas');
    });

    /**
     * GET /api/v1/inventario/reorden/reglas/:id
     * Obtener regla por ID
     */
    static obtenerRegla = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id } = req.params;

        const regla = await RutasOperacionModel.obtenerReglaPorId(parseInt(id), organizacionId);

        if (!regla) {
            return ResponseHelper.notFound(res, 'Regla no encontrada');
        }

        return ResponseHelper.success(res, regla, 'Regla obtenida');
    });

    /**
     * POST /api/v1/inventario/reorden/reglas
     * Crear nueva regla de reabastecimiento
     */
    static crearRegla = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const regla = await RutasOperacionModel.crearRegla(req.body, organizacionId, usuarioId);

        return ResponseHelper.created(res, regla, 'Regla de reabastecimiento creada');
    });

    /**
     * PUT /api/v1/inventario/reorden/reglas/:id
     * Actualizar regla
     */
    static actualizarRegla = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id } = req.params;

        const regla = await RutasOperacionModel.actualizarRegla(parseInt(id), req.body, organizacionId);

        if (!regla) {
            return ResponseHelper.notFound(res, 'Regla no encontrada');
        }

        return ResponseHelper.success(res, regla, 'Regla actualizada');
    });

    /**
     * DELETE /api/v1/inventario/reorden/reglas/:id
     * Eliminar regla
     */
    static eliminarRegla = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id } = req.params;

        const eliminado = await RutasOperacionModel.eliminarRegla(parseInt(id), organizacionId);

        if (!eliminado) {
            return ResponseHelper.notFound(res, 'Regla no encontrada');
        }

        return ResponseHelper.success(res, { id: parseInt(id) }, 'Regla eliminada');
    });

    // ==================== EJECUCION ====================

    /**
     * POST /api/v1/inventario/reorden/ejecutar
     * Ejecutar evaluacion de reorden manualmente
     */
    static ejecutarManual = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const resultado = await ReordenModel.ejecutarManual(organizacionId, usuarioId);

        if (!resultado.exito) {
            return ResponseHelper.error(res, resultado.mensaje, 500);
        }

        return ResponseHelper.success(res, {
            reglas_evaluadas: resultado.reglas_evaluadas,
            ordenes_generadas: resultado.ordenes_generadas,
            errores: resultado.errores,
            detalles: resultado.detalles
        }, resultado.mensaje);
    });

    // ==================== LOGS ====================

    /**
     * GET /api/v1/inventario/reorden/logs
     * Listar historial de ejecuciones
     */
    static listarLogs = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { tipo, fecha_desde, fecha_hasta, limit = 50, offset = 0 } = req.query;

        const filtros = {
            limit: parseInt(limit),
            offset: parseInt(offset)
        };

        if (tipo) filtros.tipo = tipo;
        if (fecha_desde) filtros.fecha_desde = fecha_desde;
        if (fecha_hasta) filtros.fecha_hasta = fecha_hasta;

        const logs = await ReordenModel.listarLogs(organizacionId, filtros);

        return ResponseHelper.success(res, logs, 'Logs de reorden obtenidos');
    });

    /**
     * GET /api/v1/inventario/reorden/logs/:id
     * Obtener detalle de un log
     */
    static obtenerLog = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id } = req.params;

        const log = await ReordenModel.obtenerLogPorId(parseInt(id), organizacionId);

        if (!log) {
            return ResponseHelper.notFound(res, 'Log no encontrado');
        }

        return ResponseHelper.success(res, log, 'Log obtenido');
    });

    // ==================== DASHBOARD ====================

    /**
     * GET /api/v1/inventario/reorden/dashboard
     * Obtener metricas consolidadas del dashboard
     */
    static obtenerDashboard = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const [dashboard, resumenReglas, estadoJob] = await Promise.all([
            ReordenModel.obtenerDashboard(organizacionId),
            ReordenModel.obtenerResumenReglas(organizacionId),
            ReordenModel.obtenerEstadoJob()
        ]);

        return ResponseHelper.success(res, {
            metricas: dashboard,
            reglas: resumenReglas,
            job: estadoJob
        }, 'Dashboard de reorden obtenido');
    });

    // ==================== PRODUCTOS BAJO MINIMO ====================

    /**
     * GET /api/v1/inventario/reorden/productos-bajo-minimo
     * Listar productos que necesitan reabastecimiento
     */
    static productosBajoMinimo = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { solo_sin_oc = 'true', categoria_id, proveedor_id, limit = 100 } = req.query;

        const filtros = {
            solo_sin_oc: solo_sin_oc === 'true',
            limit: parseInt(limit)
        };

        if (categoria_id) filtros.categoria_id = parseInt(categoria_id);
        if (proveedor_id) filtros.proveedor_id = parseInt(proveedor_id);

        const productos = await ReordenModel.obtenerProductosBajoMinimo(organizacionId, filtros);

        return ResponseHelper.success(res, productos, 'Productos bajo minimo obtenidos');
    });

    // ==================== RUTAS DE OPERACION ====================

    /**
     * GET /api/v1/inventario/reorden/rutas
     * Listar rutas de operacion disponibles
     */
    static listarRutas = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { tipo, activo } = req.query;

        const filtros = {};
        if (tipo) filtros.tipo = tipo;
        if (activo !== undefined) filtros.activo = activo === 'true';

        const rutas = await RutasOperacionModel.listarRutas(organizacionId, filtros);

        return ResponseHelper.success(res, rutas, 'Rutas de operacion obtenidas');
    });
}

module.exports = ReordenController;

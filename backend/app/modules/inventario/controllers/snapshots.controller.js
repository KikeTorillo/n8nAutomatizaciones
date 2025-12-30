/**
 * @fileoverview Controller para Inventory at Date (Snapshots)
 * @description Endpoints para consultar inventario historico
 * @version 1.0.0
 * @date Diciembre 2025
 */

const SnapshotsModel = require('../models/snapshots.model');
const { ResponseHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

class SnapshotsController {

    /**
     * GET /api/v1/inventario/snapshots
     * Listar snapshots disponibles
     */
    static async listar(req, res) {
        const { limit, offset } = req.query;
        const organizacionId = req.tenant.organizacionId;

        const snapshots = await SnapshotsModel.listar(organizacionId, {
            limit: parseInt(limit) || 90,
            offset: parseInt(offset) || 0
        });

        return ResponseHelper.success(res, snapshots, 'Snapshots obtenidos');
    }

    /**
     * GET /api/v1/inventario/snapshots/fechas
     * Obtener fechas disponibles para selector
     */
    static async fechasDisponibles(req, res) {
        const organizacionId = req.tenant.organizacionId;

        const fechas = await SnapshotsModel.obtenerFechasDisponibles(organizacionId);

        return ResponseHelper.success(res, fechas, 'Fechas disponibles');
    }

    /**
     * GET /api/v1/inventario/at-date
     * Consultar stock en fecha especifica
     * @query fecha - Fecha en formato YYYY-MM-DD (requerido)
     * @query producto_id - Filtrar por producto (opcional)
     * @query categoria_id - Filtrar por categoria (opcional)
     * @query solo_con_stock - Solo productos con stock > 0 (opcional)
     */
    static async stockEnFecha(req, res) {
        const { fecha, producto_id, categoria_id, solo_con_stock, limit, offset } = req.query;
        const organizacionId = req.tenant.organizacionId;

        if (!fecha) {
            return ResponseHelper.error(res, 'Se requiere el parametro fecha (YYYY-MM-DD)', 400);
        }

        // Validar formato de fecha
        const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!fechaRegex.test(fecha)) {
            return ResponseHelper.error(res, 'Formato de fecha invalido. Use YYYY-MM-DD', 400);
        }

        try {
            const resultado = await SnapshotsModel.obtenerStockEnFecha(organizacionId, fecha, {
                producto_id: producto_id ? parseInt(producto_id) : null,
                categoria_id: categoria_id ? parseInt(categoria_id) : null,
                solo_con_stock: solo_con_stock === 'true',
                limit: parseInt(limit) || 1000,
                offset: parseInt(offset) || 0
            });

            return ResponseHelper.success(res, resultado, 'Stock en fecha obtenido');
        } catch (error) {
            if (error.message.includes('No existe snapshot')) {
                return ResponseHelper.error(res, error.message, 404);
            }
            throw error;
        }
    }

    /**
     * GET /api/v1/inventario/comparar
     * Comparar inventario entre dos fechas
     * @query fecha_desde - Fecha inicial (requerido)
     * @query fecha_hasta - Fecha final (requerido)
     * @query solo_cambios - Solo productos con cambios (default: true)
     */
    static async comparar(req, res) {
        const { fecha_desde, fecha_hasta, solo_cambios } = req.query;
        const organizacionId = req.tenant.organizacionId;

        if (!fecha_desde || !fecha_hasta) {
            return ResponseHelper.error(res, 'Se requieren fecha_desde y fecha_hasta', 400);
        }

        // Validar formato
        const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!fechaRegex.test(fecha_desde) || !fechaRegex.test(fecha_hasta)) {
            return ResponseHelper.error(res, 'Formato de fecha invalido. Use YYYY-MM-DD', 400);
        }

        try {
            const resultado = await SnapshotsModel.compararFechas(
                organizacionId,
                fecha_desde,
                fecha_hasta,
                solo_cambios !== 'false'
            );

            return ResponseHelper.success(res, resultado, 'Comparacion completada');
        } catch (error) {
            if (error.message.includes('No existe snapshot')) {
                return ResponseHelper.error(res, error.message, 404);
            }
            throw error;
        }
    }

    /**
     * POST /api/v1/inventario/snapshots
     * Generar snapshot manualmente
     * @body fecha - Fecha del snapshot (default: hoy)
     * @body descripcion - Descripcion opcional
     */
    static async generar(req, res) {
        const { fecha, descripcion } = req.body;
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        logger.info('[SnapshotsController.generar] Generando snapshot manual', {
            organizacion_id: organizacionId,
            usuario_id: usuarioId,
            fecha
        });

        const snapshot = await SnapshotsModel.generar(
            organizacionId,
            usuarioId,
            fecha,
            descripcion
        );

        return ResponseHelper.success(res, snapshot, 'Snapshot generado exitosamente', 201);
    }
}

module.exports = SnapshotsController;

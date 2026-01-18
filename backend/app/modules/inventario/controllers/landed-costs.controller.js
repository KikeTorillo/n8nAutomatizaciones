/**
 * Controller para Landed Costs (Costos en Destino)
 * Endpoints para CRUD de costos adicionales y distribucion
 * Fecha: 30 Diciembre 2025
 */

const { asyncHandler } = require('../../../middleware');
const { ResponseHelper } = require('../../../utils/helpers');
const LandedCostsModel = require('../models/landed-costs.model');

class LandedCostsController {
    // ==================== COSTOS ADICIONALES ====================

    /**
     * GET /api/v1/inventario/ordenes-compra/:id/costos
     * Listar costos adicionales de una OC
     */
    static listarCostos = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id: ordenCompraId } = req.params;

        const costos = await LandedCostsModel.listarPorOC(organizacionId, parseInt(ordenCompraId));

        return ResponseHelper.success(res, costos, 'Costos adicionales obtenidos');
    });

    /**
     * GET /api/v1/inventario/ordenes-compra/:id/costos/:costoId
     * Obtener un costo adicional por ID
     */
    static obtenerCosto = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { costoId } = req.params;

        const costo = await LandedCostsModel.buscarPorId(organizacionId, parseInt(costoId));

        if (!costo) {
            return ResponseHelper.notFound(res, 'Costo adicional no encontrado');
        }

        return ResponseHelper.success(res, costo, 'Costo adicional obtenido');
    });

    /**
     * POST /api/v1/inventario/ordenes-compra/:id/costos
     * Crear costo adicional
     */
    static crearCosto = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;
        const { id: ordenCompraId } = req.params;

        const data = {
            ...req.body,
            orden_compra_id: parseInt(ordenCompraId)
        };

        const costo = await LandedCostsModel.crear(organizacionId, data, usuarioId);

        return ResponseHelper.created(res, costo, 'Costo adicional creado');
    });

    /**
     * PUT /api/v1/inventario/ordenes-compra/:id/costos/:costoId
     * Actualizar costo adicional
     */
    static actualizarCosto = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { costoId } = req.params;

        const costo = await LandedCostsModel.actualizar(
            organizacionId,
            parseInt(costoId),
            req.body
        );

        if (!costo) {
            return ResponseHelper.notFound(res, 'Costo adicional no encontrado');
        }

        return ResponseHelper.success(res, costo, 'Costo adicional actualizado');
    });

    /**
     * DELETE /api/v1/inventario/ordenes-compra/:id/costos/:costoId
     * Eliminar costo adicional
     */
    static eliminarCosto = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { costoId } = req.params;

        const eliminado = await LandedCostsModel.eliminar(organizacionId, parseInt(costoId));

        if (!eliminado) {
            return ResponseHelper.notFound(res, 'Costo adicional no encontrado');
        }

        return ResponseHelper.success(res, { id: parseInt(costoId) }, 'Costo adicional eliminado');
    });

    // ==================== DISTRIBUCION ====================

    /**
     * POST /api/v1/inventario/ordenes-compra/:id/costos/:costoId/distribuir
     * Distribuir un costo adicional a los items
     */
    static distribuirCosto = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { costoId } = req.params;

        const resultado = await LandedCostsModel.distribuir(parseInt(costoId), organizacionId);

        return ResponseHelper.success(res, resultado, resultado.mensaje);
    });

    /**
     * POST /api/v1/inventario/ordenes-compra/:id/distribuir-costos
     * Distribuir todos los costos pendientes de una OC
     */
    static distribuirTodos = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id: ordenCompraId } = req.params;

        const resultado = await LandedCostsModel.distribuirTodos(
            parseInt(ordenCompraId),
            organizacionId
        );

        return ResponseHelper.success(
            res,
            resultado,
            `${resultado.total_distribuidos} costos distribuidos`
        );
    });

    /**
     * GET /api/v1/inventario/ordenes-compra/:id/costos/:costoId/distribucion
     * Obtener detalle de distribucion de un costo
     */
    static obtenerDistribucion = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { costoId } = req.params;

        const distribucion = await LandedCostsModel.obtenerDistribucion(
            parseInt(costoId),
            organizacionId
        );

        return ResponseHelper.success(res, distribucion, 'Distribucion obtenida');
    });

    // ==================== RESUMEN ====================

    /**
     * GET /api/v1/inventario/ordenes-compra/:id/costos/resumen
     * Obtener resumen de costos de una OC
     */
    static obtenerResumen = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id: ordenCompraId } = req.params;

        const resumen = await LandedCostsModel.obtenerResumenOC(
            parseInt(ordenCompraId),
            organizacionId
        );

        return ResponseHelper.success(res, resumen, 'Resumen de costos obtenido');
    });

    /**
     * GET /api/v1/inventario/ordenes-compra/:id/costos-por-items
     * Obtener costos totales desglosados por item
     */
    static obtenerCostosPorItems = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id: ordenCompraId } = req.params;

        const items = await LandedCostsModel.obtenerCostosPorItems(
            parseInt(ordenCompraId),
            organizacionId
        );

        return ResponseHelper.success(res, items, 'Costos por items obtenidos');
    });
}

module.exports = LandedCostsController;

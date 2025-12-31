const asyncHandler = require('../../../middleware/asyncHandler');
const DropshipModel = require('../models/dropship.model');
const logger = require('../../../utils/logger');

/**
 * Controller para Dropshipping
 * Endpoints para gestion de OC dropship
 * Fecha: 30 Diciembre 2025
 */
class DropshipController {

    /**
     * POST /api/v1/inventario/dropship/desde-venta/:ventaId
     * Crear OC dropship desde una venta
     */
    static crearDesdeVenta = asyncHandler(async (req, res) => {
        const { ventaId } = req.params;
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        logger.info('[DropshipController.crearDesdeVenta] Request', {
            venta_id: ventaId,
            usuario_id: usuarioId
        });

        const resultado = await DropshipModel.crearOCDesdeVenta(
            parseInt(ventaId),
            usuarioId,
            organizacionId
        );

        res.status(201).json({
            success: true,
            message: resultado.mensaje,
            data: resultado
        });
    });

    /**
     * GET /api/v1/inventario/dropship/pendientes
     * Listar ventas pendientes de generar OC
     */
    static obtenerVentasPendientes = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const ventas = await DropshipModel.obtenerVentasPendientes(organizacionId);

        res.json({
            success: true,
            data: ventas
        });
    });

    /**
     * GET /api/v1/inventario/dropship/ordenes
     * Listar OC dropship
     */
    static listarOrdenes = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { estado, proveedor_id, fecha_desde, fecha_hasta } = req.query;

        const ordenes = await DropshipModel.listarOCDropship(organizacionId, {
            estado,
            proveedor_id: proveedor_id ? parseInt(proveedor_id) : null,
            fecha_desde,
            fecha_hasta
        });

        res.json({
            success: true,
            data: ordenes,
            total: ordenes.length
        });
    });

    /**
     * GET /api/v1/inventario/dropship/ordenes/:id
     * Obtener detalle de OC dropship
     */
    static obtenerOrden = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const orden = await DropshipModel.obtenerDetalle(
            parseInt(id),
            organizacionId
        );

        if (!orden) {
            return res.status(404).json({
                success: false,
                message: 'Orden dropship no encontrada'
            });
        }

        res.json({
            success: true,
            data: orden
        });
    });

    /**
     * PATCH /api/v1/inventario/dropship/ordenes/:id/confirmar-entrega
     * Confirmar que el cliente recibio el envio
     */
    static confirmarEntrega = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { notas } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const resultado = await DropshipModel.confirmarEntrega(
            parseInt(id),
            { notas },
            organizacionId
        );

        res.json({
            success: true,
            message: resultado.mensaje,
            data: resultado
        });
    });

    /**
     * PATCH /api/v1/inventario/dropship/ordenes/:id/cancelar
     * Cancelar OC dropship
     */
    static cancelar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { motivo } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const resultado = await DropshipModel.cancelar(
            parseInt(id),
            motivo,
            organizacionId
        );

        res.json({
            success: true,
            message: resultado.mensaje,
            data: resultado
        });
    });

    /**
     * GET /api/v1/inventario/dropship/configuracion
     * Obtener configuracion dropship
     */
    static obtenerConfiguracion = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const config = await DropshipModel.obtenerConfiguracion(organizacionId);

        res.json({
            success: true,
            data: config
        });
    });

    /**
     * PATCH /api/v1/inventario/dropship/configuracion
     * Actualizar configuracion dropship
     */
    static actualizarConfiguracion = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { dropship_auto_generar_oc } = req.body;

        const config = await DropshipModel.actualizarConfiguracion(
            organizacionId,
            dropship_auto_generar_oc
        );

        res.json({
            success: true,
            message: 'Configuracion actualizada',
            data: config
        });
    });

    /**
     * GET /api/v1/inventario/dropship/estadisticas
     * Obtener estadisticas de dropship
     */
    static obtenerEstadisticas = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const stats = await DropshipModel.obtenerEstadisticas(organizacionId);

        res.json({
            success: true,
            data: stats
        });
    });
}

module.exports = DropshipController;

/**
 * Controller para Consigna (Inventario en Consignación)
 * Endpoints para gestión de acuerdos, stock y liquidaciones
 * Fecha: 31 Diciembre 2025
 */

const asyncHandler = require('../../../middleware/asyncHandler');
const ConsignaModel = require('../models/consigna.model');
const { ResponseHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

const ConsignaController = {
    // ==================== ACUERDOS ====================

    /**
     * POST /consigna/acuerdos
     * Crear nuevo acuerdo de consignación
     */
    crearAcuerdo: asyncHandler(async (req, res) => {
        const { organizacion_id, id: usuarioId } = req.user;

        const resultado = await ConsignaModel.crearAcuerdo(
            req.body,
            organizacion_id,
            usuarioId
        );

        ResponseHelper.created(res, resultado, 'Acuerdo de consignación creado');
    }),

    /**
     * GET /consigna/acuerdos
     * Listar acuerdos con filtros
     */
    listarAcuerdos: asyncHandler(async (req, res) => {
        const { organizacion_id } = req.user;
        const filtros = {
            proveedor_id: req.query.proveedor_id,
            estado: req.query.estado,
            busqueda: req.query.busqueda,
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0
        };

        const resultado = await ConsignaModel.listarAcuerdos(filtros, organizacion_id);
        ResponseHelper.success(res, resultado);
    }),

    /**
     * GET /consigna/acuerdos/:id
     * Obtener acuerdo por ID
     */
    obtenerAcuerdo: asyncHandler(async (req, res) => {
        const { organizacion_id } = req.user;
        const { id } = req.params;

        const resultado = await ConsignaModel.obtenerAcuerdo(id, organizacion_id);

        if (!resultado) {
            return ResponseHelper.notFound(res, 'Acuerdo no encontrado');
        }

        ResponseHelper.success(res, resultado);
    }),

    /**
     * PUT /consigna/acuerdos/:id
     * Actualizar acuerdo
     */
    actualizarAcuerdo: asyncHandler(async (req, res) => {
        const { organizacion_id } = req.user;
        const { id } = req.params;

        const resultado = await ConsignaModel.actualizarAcuerdo(id, req.body, organizacion_id);

        if (!resultado) {
            return ResponseHelper.notFound(res, 'Acuerdo no encontrado');
        }

        ResponseHelper.success(res, resultado, 'Acuerdo actualizado');
    }),

    /**
     * POST /consigna/acuerdos/:id/activar
     * Activar acuerdo
     */
    activarAcuerdo: asyncHandler(async (req, res) => {
        const { organizacion_id, id: usuarioId } = req.user;
        const { id } = req.params;

        const resultado = await ConsignaModel.activarAcuerdo(id, organizacion_id, usuarioId);

        if (!resultado) {
            return ResponseHelper.notFound(res, 'Acuerdo no encontrado');
        }

        ResponseHelper.success(res, resultado, 'Acuerdo activado');
    }),

    /**
     * POST /consigna/acuerdos/:id/pausar
     * Pausar acuerdo
     */
    pausarAcuerdo: asyncHandler(async (req, res) => {
        const { organizacion_id } = req.user;
        const { id } = req.params;

        const resultado = await ConsignaModel.pausarAcuerdo(id, organizacion_id);

        if (!resultado) {
            return ResponseHelper.notFound(res, 'Acuerdo no encontrado o no está activo');
        }

        ResponseHelper.success(res, resultado, 'Acuerdo pausado');
    }),

    /**
     * POST /consigna/acuerdos/:id/terminar
     * Terminar acuerdo
     */
    terminarAcuerdo: asyncHandler(async (req, res) => {
        const { organizacion_id } = req.user;
        const { id } = req.params;

        const resultado = await ConsignaModel.terminarAcuerdo(id, organizacion_id);

        if (!resultado) {
            return ResponseHelper.notFound(res, 'Acuerdo no encontrado');
        }

        ResponseHelper.success(res, resultado, 'Acuerdo terminado');
    }),

    // ==================== PRODUCTOS DEL ACUERDO ====================

    /**
     * POST /consigna/acuerdos/:id/productos
     * Agregar producto al acuerdo
     */
    agregarProducto: asyncHandler(async (req, res) => {
        const { organizacion_id } = req.user;
        const { id } = req.params;

        const resultado = await ConsignaModel.agregarProducto(id, req.body, organizacion_id);
        ResponseHelper.created(res, resultado, 'Producto agregado al acuerdo');
    }),

    /**
     * GET /consigna/acuerdos/:id/productos
     * Listar productos del acuerdo
     */
    listarProductos: asyncHandler(async (req, res) => {
        const { organizacion_id } = req.user;
        const { id } = req.params;

        const resultado = await ConsignaModel.listarProductosAcuerdo(id, organizacion_id);
        ResponseHelper.success(res, resultado);
    }),

    /**
     * PUT /consigna/acuerdos/:id/productos/:productoId
     * Actualizar producto del acuerdo
     */
    actualizarProducto: asyncHandler(async (req, res) => {
        const { organizacion_id } = req.user;
        const { id, productoId } = req.params;
        const varianteId = req.query.variante_id || null;

        const resultado = await ConsignaModel.actualizarProducto(
            id, productoId, varianteId, req.body, organizacion_id
        );

        if (!resultado) {
            return ResponseHelper.notFound(res, 'Producto no encontrado en el acuerdo');
        }

        ResponseHelper.success(res, resultado, 'Producto actualizado');
    }),

    /**
     * DELETE /consigna/acuerdos/:id/productos/:productoId
     * Remover producto del acuerdo
     */
    removerProducto: asyncHandler(async (req, res) => {
        const { organizacion_id } = req.user;
        const { id, productoId } = req.params;
        const varianteId = req.query.variante_id || null;

        const resultado = await ConsignaModel.removerProducto(
            id, productoId, varianteId, organizacion_id
        );

        if (!resultado) {
            return ResponseHelper.notFound(res, 'Producto no encontrado en el acuerdo');
        }

        ResponseHelper.success(res, resultado, 'Producto removido del acuerdo');
    }),

    // ==================== STOCK CONSIGNA ====================

    /**
     * POST /consigna/acuerdos/:id/recibir
     * Recibir mercancía en consignación
     */
    recibirMercancia: asyncHandler(async (req, res) => {
        const { organizacion_id, id: usuarioId } = req.user;
        const { id } = req.params;
        const { items } = req.body;

        const resultado = await ConsignaModel.recibirMercancia(
            id, items, organizacion_id, usuarioId
        );

        ResponseHelper.created(res, resultado, 'Mercancía recibida en consignación');
    }),

    /**
     * GET /consigna/stock
     * Consultar stock en consignación
     */
    consultarStock: asyncHandler(async (req, res) => {
        const { organizacion_id } = req.user;
        const filtros = {
            acuerdo_id: req.query.acuerdo_id,
            proveedor_id: req.query.proveedor_id,
            producto_id: req.query.producto_id,
            almacen_id: req.query.almacen_id,
            solo_disponible: req.query.solo_disponible !== 'false',
            limit: parseInt(req.query.limit) || 100,
            offset: parseInt(req.query.offset) || 0
        };

        const resultado = await ConsignaModel.consultarStock(filtros, organizacion_id);
        ResponseHelper.success(res, resultado);
    }),

    /**
     * POST /consigna/stock/:id/ajuste
     * Ajustar stock consigna
     */
    ajustarStock: asyncHandler(async (req, res) => {
        const { organizacion_id, id: usuarioId } = req.user;
        const { id } = req.params;
        const { cantidad, motivo } = req.body;

        const resultado = await ConsignaModel.ajustarStock(
            id, cantidad, motivo, organizacion_id, usuarioId
        );

        ResponseHelper.success(res, resultado, 'Stock ajustado');
    }),

    /**
     * POST /consigna/acuerdos/:id/devolver
     * Devolver mercancía al proveedor
     */
    devolverMercancia: asyncHandler(async (req, res) => {
        const { organizacion_id, id: usuarioId } = req.user;
        const { id } = req.params;
        const { items } = req.body;

        const resultado = await ConsignaModel.devolverMercancia(
            id, items, organizacion_id, usuarioId
        );

        ResponseHelper.success(res, resultado, 'Devolución registrada');
    }),

    // ==================== LIQUIDACIONES ====================

    /**
     * POST /consigna/liquidaciones
     * Generar liquidación
     */
    generarLiquidacion: asyncHandler(async (req, res) => {
        const { organizacion_id, id: usuarioId } = req.user;
        const { acuerdo_id, fecha_desde, fecha_hasta } = req.body;

        const resultado = await ConsignaModel.generarLiquidacion(
            acuerdo_id, fecha_desde, fecha_hasta, organizacion_id, usuarioId
        );

        ResponseHelper.created(res, resultado, 'Liquidación generada');
    }),

    /**
     * GET /consigna/liquidaciones
     * Listar liquidaciones
     */
    listarLiquidaciones: asyncHandler(async (req, res) => {
        const { organizacion_id } = req.user;
        const filtros = {
            acuerdo_id: req.query.acuerdo_id,
            proveedor_id: req.query.proveedor_id,
            estado: req.query.estado,
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0
        };

        const resultado = await ConsignaModel.listarLiquidaciones(filtros, organizacion_id);
        ResponseHelper.success(res, resultado);
    }),

    /**
     * GET /consigna/liquidaciones/:id
     * Obtener liquidación con detalle
     */
    obtenerLiquidacion: asyncHandler(async (req, res) => {
        const { organizacion_id } = req.user;
        const { id } = req.params;

        const resultado = await ConsignaModel.obtenerLiquidacion(id, organizacion_id);

        if (!resultado) {
            return ResponseHelper.notFound(res, 'Liquidación no encontrada');
        }

        ResponseHelper.success(res, resultado);
    }),

    /**
     * POST /consigna/liquidaciones/:id/confirmar
     * Confirmar liquidación
     */
    confirmarLiquidacion: asyncHandler(async (req, res) => {
        const { organizacion_id, id: usuarioId } = req.user;
        const { id } = req.params;

        const resultado = await ConsignaModel.confirmarLiquidacion(id, organizacion_id, usuarioId);
        ResponseHelper.success(res, resultado, 'Liquidación confirmada');
    }),

    /**
     * POST /consigna/liquidaciones/:id/pagar
     * Registrar pago de liquidación
     */
    pagarLiquidacion: asyncHandler(async (req, res) => {
        const { organizacion_id, id: usuarioId } = req.user;
        const { id } = req.params;

        const resultado = await ConsignaModel.pagarLiquidacion(
            id, req.body, organizacion_id, usuarioId
        );

        ResponseHelper.success(res, resultado, 'Pago registrado');
    }),

    /**
     * DELETE /consigna/liquidaciones/:id
     * Cancelar liquidación
     */
    cancelarLiquidacion: asyncHandler(async (req, res) => {
        const { organizacion_id } = req.user;
        const { id } = req.params;

        const resultado = await ConsignaModel.cancelarLiquidacion(id, organizacion_id);

        if (!resultado) {
            return ResponseHelper.notFound(res, 'Liquidación no encontrada');
        }

        ResponseHelper.success(res, resultado, 'Liquidación cancelada');
    }),

    // ==================== REPORTES ====================

    /**
     * GET /consigna/reportes/stock
     * Reporte de stock consigna
     */
    reporteStock: asyncHandler(async (req, res) => {
        const { organizacion_id } = req.user;
        const filtros = {
            proveedor_id: req.query.proveedor_id
        };

        const resultado = await ConsignaModel.reporteStock(filtros, organizacion_id);
        ResponseHelper.success(res, resultado);
    }),

    /**
     * GET /consigna/reportes/ventas
     * Reporte de ventas consigna
     */
    reporteVentas: asyncHandler(async (req, res) => {
        const { organizacion_id } = req.user;
        const { fecha_desde, fecha_hasta } = req.query;

        if (!fecha_desde || !fecha_hasta) {
            return ResponseHelper.badRequest(res, 'Se requieren fecha_desde y fecha_hasta');
        }

        const resultado = await ConsignaModel.reporteVentas(
            fecha_desde, fecha_hasta, organizacion_id
        );

        ResponseHelper.success(res, resultado);
    }),

    /**
     * GET /consigna/reportes/pendiente
     * Reporte pendiente de liquidar
     */
    reportePendiente: asyncHandler(async (req, res) => {
        const { organizacion_id } = req.user;

        const resultado = await ConsignaModel.reportePendiente(organizacion_id);
        ResponseHelper.success(res, resultado);
    })
};

module.exports = ConsignaController;

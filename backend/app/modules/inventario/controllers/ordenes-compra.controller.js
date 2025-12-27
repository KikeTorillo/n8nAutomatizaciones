const { OrdenesCompraModel, AlertasInventarioModel } = require('../models');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');
const logger = require('../../../utils/logger');

/**
 * Controller para gestión de Órdenes de Compra
 * CRUD completo + recepción de mercancía + reportes
 */
class OrdenesCompraController {

    // ========================================================================
    // CRUD BÁSICO
    // ========================================================================

    /**
     * Crear nueva orden de compra
     * POST /api/v1/inventario/ordenes-compra
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const orden = await OrdenesCompraModel.crear({
            ...req.body,
            usuario_id: req.user.id
        }, organizacionId);

        return ResponseHelper.success(
            res,
            orden,
            'Orden de compra creada exitosamente',
            201
        );
    });

    /**
     * Obtener orden por ID
     * GET /api/v1/inventario/ordenes-compra/:id
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const orden = await OrdenesCompraModel.obtenerPorId(parseInt(id), organizacionId);

        if (!orden) {
            return ResponseHelper.error(res, 'Orden de compra no encontrada', 404);
        }

        return ResponseHelper.success(res, orden, 'Orden obtenida exitosamente');
    });

    /**
     * Listar órdenes con filtros
     * GET /api/v1/inventario/ordenes-compra
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            proveedor_id: req.query.proveedor_id ? parseInt(req.query.proveedor_id) : undefined,
            estado: req.query.estado || undefined,
            estado_pago: req.query.estado_pago || undefined,
            fecha_desde: req.query.fecha_desde || undefined,
            fecha_hasta: req.query.fecha_hasta || undefined,
            folio: req.query.folio || undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : 50,
            offset: req.query.offset ? parseInt(req.query.offset) : 0
        };

        const resultado = await OrdenesCompraModel.listar(filtros, organizacionId);

        return ResponseHelper.success(res, resultado, 'Órdenes obtenidas exitosamente');
    });

    /**
     * Actualizar orden (solo borradores)
     * PUT /api/v1/inventario/ordenes-compra/:id
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const orden = await OrdenesCompraModel.actualizar(parseInt(id), req.body, organizacionId);

        return ResponseHelper.success(res, orden, 'Orden actualizada exitosamente');
    });

    /**
     * Eliminar orden (solo borradores)
     * DELETE /api/v1/inventario/ordenes-compra/:id
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const orden = await OrdenesCompraModel.eliminar(parseInt(id), organizacionId);

        return ResponseHelper.success(res, orden, 'Orden eliminada exitosamente');
    });

    // ========================================================================
    // GESTIÓN DE ITEMS
    // ========================================================================

    /**
     * Agregar items a orden
     * POST /api/v1/inventario/ordenes-compra/:id/items
     */
    static agregarItems = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const items = await OrdenesCompraModel.agregarItems(
            parseInt(id),
            req.body.items,
            organizacionId
        );

        return ResponseHelper.success(
            res,
            items,
            `${items.length} item(s) agregado(s) exitosamente`,
            201
        );
    });

    /**
     * Actualizar item de orden
     * PUT /api/v1/inventario/ordenes-compra/:id/items/:itemId
     */
    static actualizarItem = asyncHandler(async (req, res) => {
        const { id, itemId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const item = await OrdenesCompraModel.actualizarItem(
            parseInt(id),
            parseInt(itemId),
            req.body,
            organizacionId
        );

        return ResponseHelper.success(res, item, 'Item actualizado exitosamente');
    });

    /**
     * Eliminar item de orden
     * DELETE /api/v1/inventario/ordenes-compra/:id/items/:itemId
     */
    static eliminarItem = asyncHandler(async (req, res) => {
        const { id, itemId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const item = await OrdenesCompraModel.eliminarItem(
            parseInt(id),
            parseInt(itemId),
            organizacionId
        );

        return ResponseHelper.success(res, item, 'Item eliminado exitosamente');
    });

    // ========================================================================
    // CAMBIOS DE ESTADO
    // ========================================================================

    /**
     * Enviar orden al proveedor
     * PATCH /api/v1/inventario/ordenes-compra/:id/enviar
     * Si requiere aprobación, la orden pasa a 'pendiente_aprobacion'
     */
    static enviar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const orden = await OrdenesCompraModel.enviar(parseInt(id), usuarioId, organizacionId);

        // Mensaje diferenciado según si requiere aprobación
        const mensaje = orden.requiere_aprobacion
            ? 'Orden enviada a aprobación. Recibirás una notificación cuando sea procesada.'
            : 'Orden enviada exitosamente';

        return ResponseHelper.success(res, orden, mensaje);
    });

    /**
     * Cancelar orden
     * PATCH /api/v1/inventario/ordenes-compra/:id/cancelar
     */
    static cancelar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { motivo } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const orden = await OrdenesCompraModel.cancelar(
            parseInt(id),
            motivo,
            req.user.id,
            organizacionId
        );

        return ResponseHelper.success(res, orden, 'Orden cancelada exitosamente');
    });

    // ========================================================================
    // RECEPCIÓN DE MERCANCÍA
    // ========================================================================

    /**
     * Recibir mercancía (parcial o total)
     * POST /api/v1/inventario/ordenes-compra/:id/recibir
     */
    static recibirMercancia = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { recepciones } = req.body;
        const organizacionId = req.tenant.organizacionId;

        // DEBUG: Ver payload de recepciones con números de serie
        logger.info('[DEBUG] recibirMercancia payload:', {
            ordenId: id,
            recepciones: JSON.stringify(recepciones, null, 2)
        });

        const resultado = await OrdenesCompraModel.recibirMercancia(
            parseInt(id),
            recepciones,
            req.user.id,
            organizacionId
        );

        return ResponseHelper.success(
            res,
            resultado,
            `${resultado.items_recibidos.length} item(s) recibido(s) exitosamente`
        );
    });

    // ========================================================================
    // REPORTES Y CONSULTAS
    // ========================================================================

    /**
     * Obtener órdenes pendientes de recibir
     * GET /api/v1/inventario/ordenes-compra/pendientes
     */
    static obtenerPendientes = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const ordenes = await OrdenesCompraModel.obtenerPendientes(organizacionId);

        return ResponseHelper.success(res, ordenes, 'Órdenes pendientes obtenidas exitosamente');
    });

    /**
     * Obtener órdenes pendientes de pago
     * GET /api/v1/inventario/ordenes-compra/pendientes-pago
     */
    static obtenerPendientesPago = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const ordenes = await OrdenesCompraModel.obtenerPendientesPago(organizacionId);

        return ResponseHelper.success(res, ordenes, 'Órdenes pendientes de pago obtenidas exitosamente');
    });

    /**
     * Registrar pago de orden
     * POST /api/v1/inventario/ordenes-compra/:id/pago
     */
    static registrarPago = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { monto } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const orden = await OrdenesCompraModel.registrarPago(
            parseInt(id),
            monto,
            organizacionId
        );

        return ResponseHelper.success(res, orden, 'Pago registrado exitosamente');
    });

    /**
     * Estadísticas de compras por proveedor
     * GET /api/v1/inventario/ordenes-compra/reportes/por-proveedor
     */
    static estadisticasPorProveedor = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            fecha_desde: req.query.fecha_desde || undefined,
            fecha_hasta: req.query.fecha_hasta || undefined
        };

        const estadisticas = await OrdenesCompraModel.estadisticasPorProveedor(
            organizacionId,
            filtros
        );

        return ResponseHelper.success(res, estadisticas, 'Estadísticas obtenidas exitosamente');
    });

    // ========================================================================
    // AUTO-GENERACIÓN DE OC (Dic 2025 - Fase 2 Gaps)
    // ========================================================================

    /**
     * Generar OC desde producto con stock bajo
     * POST /api/v1/inventario/ordenes-compra/generar-desde-producto/:productoId
     *
     * IMPORTANTE: Verifica si ya existe una OC pendiente para este producto
     * y retorna error con información de la OC existente si es el caso.
     */
    static generarDesdeProducto = asyncHandler(async (req, res) => {
        const { productoId } = req.params;
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;
        const productoIdInt = parseInt(productoId);

        // Verificar si ya existe OC pendiente para este producto
        const stockProyectado = await AlertasInventarioModel.tieneOCPendiente(
            productoIdInt,
            organizacionId
        );

        if (stockProyectado.tiene_oc_pendiente) {
            return ResponseHelper.error(
                res,
                `Ya existe una OC pendiente (${stockProyectado.folio}) para este producto. ` +
                `Stock actual: ${stockProyectado.stock_actual}, ` +
                `En camino: ${stockProyectado.oc_pendientes}, ` +
                `Stock proyectado: ${stockProyectado.stock_proyectado}`,
                409  // Conflict
            );
        }

        const orden = await OrdenesCompraModel.generarDesdeAlerta(
            productoIdInt,
            usuarioId,
            organizacionId
        );

        return ResponseHelper.success(
            res,
            orden,
            'Orden de compra generada exitosamente desde alerta de stock',
            201
        );
    });

    /**
     * Generar OCs automáticas para todos los productos con stock bajo
     * POST /api/v1/inventario/ordenes-compra/auto-generar
     */
    static autoGenerarOCs = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const resultado = await OrdenesCompraModel.generarOCsAutomaticas(
            organizacionId,
            usuarioId
        );

        return ResponseHelper.success(
            res,
            resultado,
            `${resultado.ordenes_creadas} orden(es) de compra generada(s) automáticamente`
        );
    });

    /**
     * Obtener sugerencias de OC (productos con stock bajo)
     * GET /api/v1/inventario/ordenes-compra/sugerencias
     */
    static obtenerSugerenciasOC = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const sugerencias = await OrdenesCompraModel.obtenerSugerenciasOC(organizacionId);

        return ResponseHelper.success(
            res,
            sugerencias,
            'Sugerencias de OC obtenidas exitosamente'
        );
    });
}

module.exports = OrdenesCompraController;

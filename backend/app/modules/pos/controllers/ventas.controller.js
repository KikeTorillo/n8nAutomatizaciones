const { VentasPOSModel } = require('../models');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');
const ModulesCache = require('../../../core/ModulesCache');
const ProfesionalModel = require('../../profesionales/models/profesional.model');
const TicketPDFService = require('../../../services/ticketPDF.service');
const RLSContextManager = require('../../../utils/rlsContextManager');

/**
 * Controller para gestión de ventas POS
 * Operaciones completas de punto de venta
 */
class VentasPOSController {

    /**
     * Crear nueva venta con items
     * POST /api/v1/pos/ventas
     *
     * Nov 2025: Auto-asigna profesional_id si el usuario tiene
     * un profesional vinculado con acceso al módulo POS
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user?.id;

        // Nov 2025: Auto-asignar profesional si el usuario tiene uno vinculado
        let ventaData = { ...req.body };

        if (usuarioId && !ventaData.profesional_id) {
            const profesional = await ProfesionalModel.buscarPorUsuario(usuarioId, organizacionId);

            if (profesional && profesional.modulos_acceso?.pos === true) {
                ventaData.profesional_id = profesional.id;
            }
        }

        const venta = await VentasPOSModel.crear(ventaData, organizacionId);

        return ResponseHelper.success(
            res,
            venta,
            'Venta creada exitosamente',
            201
        );
    });

    /**
     * Obtener venta por ID con items
     * GET /api/v1/pos/ventas/:id
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        // Verificar si módulo agendamiento está activo para incluir JOINs
        const modulosActivos = await ModulesCache.get(organizacionId);
        const incluirAgendamiento = modulosActivos?.agendamiento === true;

        const venta = await VentasPOSModel.obtenerPorId(parseInt(id), organizacionId, {
            incluirAgendamiento
        });

        if (!venta) {
            return ResponseHelper.error(res, 'Venta no encontrada', 404);
        }

        return ResponseHelper.success(res, venta, 'Venta obtenida exitosamente');
    });

    /**
     * Listar ventas con filtros
     * GET /api/v1/pos/ventas
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        // Verificar si módulo agendamiento está activo para incluir JOINs
        const modulosActivos = await ModulesCache.get(organizacionId);
        const incluirAgendamiento = modulosActivos?.agendamiento === true;

        const filtros = {
            estado: req.query.estado || undefined,
            estado_pago: req.query.estado_pago || undefined,
            tipo_venta: req.query.tipo_venta || undefined,
            cliente_id: req.query.cliente_id ? parseInt(req.query.cliente_id) : undefined,
            profesional_id: req.query.profesional_id ? parseInt(req.query.profesional_id) : undefined,
            metodo_pago: req.query.metodo_pago || undefined,
            fecha_desde: req.query.fecha_desde || undefined,
            fecha_hasta: req.query.fecha_hasta || undefined,
            folio: req.query.folio || undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : 50,
            offset: req.query.offset ? parseInt(req.query.offset) : 0
        };

        const ventas = await VentasPOSModel.listar(filtros, organizacionId, {
            incluirAgendamiento
        });

        return ResponseHelper.success(res, ventas, 'Ventas obtenidas exitosamente');
    });

    /**
     * Actualizar estado de venta
     * PATCH /api/v1/pos/ventas/:id/estado
     */
    static actualizarEstado = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { estado } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const venta = await VentasPOSModel.actualizarEstado(parseInt(id), estado, organizacionId);

        return ResponseHelper.success(res, venta, 'Estado de venta actualizado exitosamente');
    });

    /**
     * Registrar pago en venta
     * POST /api/v1/pos/ventas/:id/pago
     */
    static registrarPago = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { monto_pago, metodo_pago, pago_id } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const venta = await VentasPOSModel.registrarPago(
            parseInt(id),
            monto_pago,
            metodo_pago,
            pago_id || null,
            organizacionId
        );

        return ResponseHelper.success(res, venta, 'Pago registrado exitosamente');
    });

    /**
     * Cancelar venta y revertir stock
     * POST /api/v1/pos/ventas/:id/cancelar
     */
    static cancelar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { motivo, usuario_id } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const venta = await VentasPOSModel.cancelar(
            parseInt(id),
            motivo,
            usuario_id,
            organizacionId
        );

        return ResponseHelper.success(res, venta, 'Venta cancelada exitosamente');
    });

    /**
     * Procesar devolución de items
     * POST /api/v1/pos/ventas/:id/devolver
     */
    static devolver = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { items_devueltos, motivo, usuario_id } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const resultado = await VentasPOSModel.devolver(
            parseInt(id),
            items_devueltos,
            motivo,
            usuario_id,
            organizacionId
        );

        return ResponseHelper.success(res, resultado, 'Devolución procesada exitosamente');
    });

    /**
     * Obtener corte de caja
     * GET /api/v1/pos/corte-caja
     */
    static corteCaja = asyncHandler(async (req, res) => {
        const { fecha_inicio, fecha_fin, usuario_id } = req.query;
        const organizacionId = req.tenant.organizacionId;

        const corte = await VentasPOSModel.obtenerParaCorteCaja(
            fecha_inicio,
            fecha_fin,
            organizacionId,
            usuario_id ? parseInt(usuario_id) : null
        );

        return ResponseHelper.success(res, corte, 'Corte de caja generado exitosamente');
    });

    /**
     * Agregar items a venta existente
     * POST /api/v1/pos/ventas/:id/items
     */
    static agregarItems = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const resultado = await VentasPOSModel.agregarItems(
            parseInt(id),
            req.body,
            organizacionId
        );

        return ResponseHelper.success(
            res,
            resultado,
            `${resultado.items_agregados.length} items agregados exitosamente`
        );
    });

    /**
     * Actualizar venta completa
     * PUT /api/v1/pos/ventas/:id
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const venta = await VentasPOSModel.actualizar(
            parseInt(id),
            req.body,
            organizacionId
        );

        return ResponseHelper.success(res, venta, 'Venta actualizada exitosamente');
    });

    /**
     * Eliminar venta (marca como cancelada y revierte stock)
     * DELETE /api/v1/pos/ventas/:id
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const resultado = await VentasPOSModel.eliminar(
            parseInt(id),
            req.body,
            organizacionId
        );

        return ResponseHelper.success(res, resultado, resultado.mensaje);
    });

    /**
     * Generar ticket PDF de una venta
     * GET /api/v1/pos/ventas/:id/ticket
     * Query params:
     * - paper_size: '58mm' | '80mm' (default: '80mm')
     * - download: 'true' para forzar descarga, 'false' para inline (default: 'true')
     */
    static generarTicket = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;
        const paperSize = req.query.paper_size || '80mm';
        const download = req.query.download !== 'false';

        // Obtener datos de la venta
        const ventaData = await VentasPOSModel.obtenerPorId(parseInt(id), organizacionId, {
            incluirAgendamiento: true
        });

        if (!ventaData || !ventaData.venta) {
            return ResponseHelper.error(res, 'Venta no encontrada', 404);
        }

        // Obtener datos de la organización
        const organizacion = await RLSContextManager.withBypass(async (db) => {
            const result = await db.query(`
                SELECT
                    o.nombre_comercial,
                    o.razon_social,
                    o.rfc_nif,
                    o.telefono,
                    o.email_admin,
                    o.logo_url,
                    CONCAT_WS(', ',
                        c.nombre,
                        e.nombre,
                        p.nombre
                    ) AS direccion
                FROM organizaciones o
                LEFT JOIN ciudades c ON c.id = o.ciudad_id
                LEFT JOIN estados e ON e.id = o.estado_id
                LEFT JOIN paises p ON p.id = o.pais_id
                WHERE o.id = $1
            `, [organizacionId]);
            return result.rows[0];
        });

        if (!organizacion) {
            return ResponseHelper.error(res, 'Organización no encontrada', 404);
        }

        // Generar PDF
        const pdfBuffer = await TicketPDFService.generarTicket({
            venta: ventaData.venta,
            items: ventaData.items,
            organizacion
        }, { paperSize });

        // Configurar headers de respuesta
        const filename = `ticket-${ventaData.venta.folio}.pdf`;
        const disposition = download ? 'attachment' : 'inline';

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        return res.send(pdfBuffer);
    });
}

module.exports = VentasPOSController;

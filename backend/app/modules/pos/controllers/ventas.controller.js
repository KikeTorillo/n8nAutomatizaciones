const { VentasPOSModel } = require('../models');
const LealtadModel = require('../models/lealtad.model');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');
const ModulesCache = require('../../../core/ModulesCache');
const profesionalAdapter = require('../../../services/profesionalAdapter');
const TicketPDFService = require('../../../services/ticketPDF.service');
const RLSContextManager = require('../../../utils/rlsContextManager');
const OrganizacionModel = require('../../core/models/organizacion.model');
const DropshipModel = require('../../inventario/models/dropship.model');
const logger = require('../../../utils/logger');

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
     * Dic 2025: Valida configuración pos_requiere_profesional
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user?.id;

        // Nov 2025: Auto-asignar profesional si el usuario tiene uno vinculado
        let ventaData = { ...req.body };
        let profesional = null;

        if (usuarioId && !ventaData.profesional_id) {
            profesional = await profesionalAdapter.buscarPorUsuario(usuarioId, organizacionId);

            if (profesional) {
                ventaData.profesional_id = profesional.id;
            }
        }

        // Dic 2025: Verificar si la organización requiere profesional para ventas
        if (!ventaData.profesional_id) {
            const organizacion = await OrganizacionModel.obtenerPorId(organizacionId);
            if (organizacion?.pos_requiere_profesional) {
                return ResponseHelper.error(
                    res,
                    'Para realizar ventas necesitas tener un perfil de profesional vinculado. Contacta al administrador.',
                    403,
                    { codigo: 'POS_REQUIERE_PROFESIONAL' }
                );
            }
        }

        const venta = await VentasPOSModel.crear(ventaData, organizacionId);

        // Dic 2025: Auto-generar OC dropship si la venta contiene productos dropship
        let dropshipResult = null;
        if (venta?.venta?.es_dropship) {
            try {
                // Verificar configuración de auto-generación
                const configDropship = await DropshipModel.obtenerConfiguracion(organizacionId);

                if (configDropship.dropship_auto_generar_oc) {
                    logger.info('[VentasPOSController.crear] Generando OC dropship automáticamente', {
                        venta_id: venta.id,
                        folio: venta.folio
                    });

                    dropshipResult = await DropshipModel.crearOCDesdeVenta(
                        venta.id,
                        usuarioId,
                        organizacionId
                    );

                    logger.info('[VentasPOSController.crear] OC dropship generada', {
                        venta_id: venta.id,
                        ocs_creadas: dropshipResult.ocs_creadas
                    });
                }
            } catch (dropshipError) {
                // No fallar la venta si falla el dropship, solo loguear
                logger.error('[VentasPOSController.crear] Error al generar OC dropship', {
                    venta_id: venta.id,
                    error: dropshipError.message
                });
            }
        }

        // Ene 2026: Canjear puntos de lealtad si se especificaron
        // NOTA: VentasPOSModel.crear() retorna {...venta, items, reservas} (spread)
        let canjeResult = null;
        const clienteIdVenta = venta?.cliente_id;
        logger.info('[VentasPOSController.crear] DEBUG CANJE - Verificando condiciones', {
            cliente_id_venta: clienteIdVenta,
            cliente_id_ventaData: ventaData.cliente_id,
            puntos_canjeados: ventaData.puntos_canjeados,
            descuento_puntos: ventaData.descuento_puntos,
            condicion1: !!clienteIdVenta,
            condicion2: ventaData.puntos_canjeados > 0,
            condicion3: ventaData.descuento_puntos > 0
        });
        if (clienteIdVenta && ventaData.puntos_canjeados > 0 && ventaData.descuento_puntos > 0) {
            try {
                canjeResult = await LealtadModel.canjearPuntos({
                    cliente_id: venta.cliente_id,
                    venta_pos_id: venta.id,
                    puntos: ventaData.puntos_canjeados,
                    descuento: ventaData.descuento_puntos
                }, organizacionId, usuarioId);

                logger.info('[VentasPOSController.crear] Puntos de lealtad canjeados', {
                    venta_id: venta.id,
                    cliente_id: venta.cliente_id,
                    puntos: ventaData.puntos_canjeados,
                    descuento: ventaData.descuento_puntos
                });
            } catch (canjeError) {
                // No fallar la venta si falla el canje, solo loguear
                logger.error('[VentasPOSController.crear] Error al canjear puntos de lealtad', {
                    venta_id: venta.id,
                    cliente_id: venta.cliente_id,
                    error: canjeError.message
                });
            }
        }

        // Ene 2026: Auto-acumular puntos de lealtad si hay cliente asociado
        let lealtadResult = null;
        if (venta?.cliente_id) {
            try {
                // Verificar si el programa de lealtad está activo
                const configLealtad = await LealtadModel.obtenerConfiguracion(organizacionId);

                if (configLealtad?.activo) {
                    // Verificar si aplica con cupones (si la venta tiene cupón)
                    const tieneCupon = venta.cupon_id || ventaData.cupon_codigo;

                    if (!tieneCupon || configLealtad.aplica_con_cupones) {
                        // Calcular puntos basados en el total de la venta
                        const puntosCalculo = await LealtadModel.calcularPuntosVenta({
                            cliente_id: venta.cliente_id,
                            monto: venta.total,
                            tiene_cupon: !!tieneCupon
                        }, organizacionId);

                        if (puntosCalculo?.puntos > 0) {
                            // Acumular puntos
                            lealtadResult = await LealtadModel.acumularPuntos({
                                cliente_id: venta.cliente_id,
                                venta_pos_id: venta.id,
                                monto_venta: venta.total,
                                puntos: puntosCalculo.puntos
                            }, organizacionId, usuarioId);

                            logger.info('[VentasPOSController.crear] Puntos de lealtad acumulados', {
                                venta_id: venta.id,
                                cliente_id: venta.cliente_id,
                                puntos: puntosCalculo.puntos
                            });
                        }
                    }
                }
            } catch (lealtadError) {
                // No fallar la venta si falla la lealtad, solo loguear
                logger.error('[VentasPOSController.crear] Error al acumular puntos de lealtad', {
                    venta_id: venta.id,
                    cliente_id: venta.cliente_id,
                    error: lealtadError.message
                });
            }
        }

        // Construir mensaje de éxito
        let mensaje = 'Venta creada exitosamente';
        if (dropshipResult) {
            mensaje += `. ${dropshipResult.ocs_creadas} OC(s) dropship generada(s)`;
        }
        if (canjeResult?.puntos) {
            mensaje += `. Cliente canjeó ${canjeResult.puntos} puntos`;
        }
        if (lealtadResult?.puntos) {
            mensaje += `. Cliente ganó ${lealtadResult.puntos} puntos de lealtad`;
        }

        return ResponseHelper.success(
            res,
            {
                ...venta,
                dropship: dropshipResult,
                canje: canjeResult,
                lealtad: lealtadResult
            },
            mensaje,
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

        // Obtener datos de la organización (lógica movida al modelo)
        const organizacion = await OrganizacionModel.obtenerParaTicket(organizacionId);

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

    // =========================================================================
    // PAGO SPLIT - Múltiples métodos de pago (Ene 2026)
    // =========================================================================

    /**
     * Registrar pagos split (múltiples métodos de pago)
     * POST /api/v1/pos/ventas/:id/pagos-split
     */
    static registrarPagosSplit = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { pagos, cliente_id } = req.body;
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user?.id;

        const resultado = await VentasPOSModel.registrarPagosSplit(
            parseInt(id),
            pagos,
            usuarioId,
            organizacionId,
            cliente_id || null
        );

        return ResponseHelper.success(
            res,
            resultado,
            `${resultado.pagos.length} pago(s) registrado(s) exitosamente`
        );
    });

    /**
     * Obtener desglose de pagos de una venta
     * GET /api/v1/pos/ventas/:id/pagos
     */
    static obtenerPagosVenta = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const resultado = await VentasPOSModel.obtenerPagosVenta(
            parseInt(id),
            organizacionId
        );

        return ResponseHelper.success(
            res,
            resultado,
            'Pagos de venta obtenidos exitosamente'
        );
    });
}

module.exports = VentasPOSController;

/**
 * ====================================================================
 * CONTROLLER: SUSCRIPCIONES
 * ====================================================================
 * Gestión de suscripciones de clientes con operaciones de estado.
 *
 * Incluye Customer Billing (Admin crea suscripción para cliente):
 * - POST /suscripciones/cliente - Genera link de checkout
 * - GET /suscripciones/tokens - Lista tokens generados
 *
 * @module controllers/suscripciones
 */

const asyncHandler = require('../../../middleware/asyncHandler');
const { SuscripcionesModel, PlanesModel, CuponesModel, CheckoutTokensModel } = require('../models');
const { ResponseHelper, ErrorHelper, ParseHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

// URL del frontend
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

class SuscripcionesController {

    /**
     * Listar suscripciones con paginación y filtros
     * GET /api/v1/suscripciones-negocio/suscripciones
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            estado: req.query.estado,
            plan_id: req.query.plan_id ? parseInt(req.query.plan_id) : undefined,
            cliente_id: req.query.cliente_id ? parseInt(req.query.cliente_id) : undefined,
            periodo: req.query.periodo,
            es_trial: ParseHelper.parseBoolean(req.query.es_trial),
            gateway: req.query.gateway,
            auto_cobro: ParseHelper.parseBoolean(req.query.auto_cobro),
            busqueda: req.query.busqueda,
            fecha_desde: req.query.fecha_desde,
            fecha_hasta: req.query.fecha_hasta
        };

        const resultado = await SuscripcionesModel.listar(options, organizacionId);

        return ResponseHelper.success(res, resultado);
    });

    /**
     * Buscar suscripción por ID
     * GET /api/v1/suscripciones-negocio/suscripciones/:id
     */
    static buscarPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const suscripcion = await SuscripcionesModel.buscarPorId(id, organizacionId);
        ErrorHelper.throwIfNotFound(suscripcion, 'Suscripción');

        return ResponseHelper.success(res, suscripcion);
    });

    /**
     * Crear nueva suscripción
     * POST /api/v1/suscripciones-negocio/suscripciones
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const creadoPorId = req.user.id;

        const suscripcionData = req.body;

        const nuevaSuscripcion = await SuscripcionesModel.crear(
            suscripcionData,
            organizacionId,
            creadoPorId
        );

        return ResponseHelper.success(res, nuevaSuscripcion, 'Suscripción creada exitosamente', 201);
    });

    /**
     * Actualizar suscripción existente
     * PUT /api/v1/suscripciones-negocio/suscripciones/:id
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const suscripcionData = req.body;

        const suscripcionActualizada = await SuscripcionesModel.actualizar(
            id,
            suscripcionData,
            organizacionId
        );

        return ResponseHelper.success(res, suscripcionActualizada, 'Suscripción actualizada exitosamente');
    });

    /**
     * Cambiar estado de suscripción
     * PATCH /api/v1/suscripciones-negocio/suscripciones/:id/estado
     */
    static cambiarEstado = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { nuevo_estado, razon } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const suscripcionActualizada = await SuscripcionesModel.cambiarEstado(
            id,
            nuevo_estado,
            organizacionId,
            { razon }
        );

        return ResponseHelper.success(res, suscripcionActualizada, `Suscripción ${nuevo_estado}`);
    });

    /**
     * Cambiar plan de suscripción
     * PATCH /api/v1/suscripciones-negocio/suscripciones/:id/cambiar-plan
     */
    static cambiarPlan = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { nuevo_plan_id, periodo, cambio_inmediato = false } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const suscripcionActualizada = await SuscripcionesModel.cambiarPlan(
            id,
            nuevo_plan_id,
            organizacionId,
            { periodo, cambio_inmediato }
        );

        return ResponseHelper.success(res, suscripcionActualizada, 'Plan cambiado exitosamente');
    });

    /**
     * Cambiar plan de mi propia suscripción
     * PATCH /api/v1/suscripciones-negocio/suscripciones/mi-suscripcion/cambiar-plan
     * Disponible para cualquier usuario autenticado
     */
    static cambiarMiPlan = asyncHandler(async (req, res) => {
        const { nuevo_plan_id, periodo, cambio_inmediato = false } = req.body;
        const organizacionId = req.user.organizacion_id;

        // Buscar la suscripción activa del usuario
        const miSuscripcion = await SuscripcionesModel.buscarActivaPorOrganizacion(organizacionId);

        if (!miSuscripcion) {
            return ResponseHelper.error(res, 'No tienes una suscripción activa', 404);
        }

        // Cambiar el plan usando el método existente
        // Nota: usamos NEXO_TEAM_ORG_ID porque las suscripciones pertenecen a Nexo Team
        const { NEXO_TEAM_ORG_ID } = require('../../../config/constants');

        const suscripcionActualizada = await SuscripcionesModel.cambiarPlan(
            miSuscripcion.id,
            nuevo_plan_id,
            NEXO_TEAM_ORG_ID,
            { periodo, cambio_inmediato }
        );

        return ResponseHelper.success(res, suscripcionActualizada, 'Plan cambiado exitosamente');
    });

    /**
     * Cancelar suscripción (Customer Billing - admin cancela suscripción de cliente)
     * POST /api/v1/suscripciones-negocio/suscripciones/:id/cancelar
     */
    static cancelar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { motivo_cancelacion, inmediato = false } = req.body;
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user?.id;

        const suscripcionCancelada = await SuscripcionesModel.cancelar(
            id,
            motivo_cancelacion,
            organizacionId,
            usuarioId
        );

        return ResponseHelper.success(
            res,
            suscripcionCancelada,
            inmediato ? 'Suscripción cancelada inmediatamente' : 'Suscripción programada para cancelar'
        );
    });

    /**
     * Cancelar mi propia suscripción (Dogfooding - usuario cancela su plan)
     * POST /api/v1/suscripciones-negocio/suscripciones/mi-suscripcion/cancelar
     *
     * Este endpoint permite a usuarios cancelar la suscripción de su organización.
     * Usa bypass porque la suscripción pertenece al vendor (Nexo Team org 1)
     * pero el cliente está vinculado a la org del usuario.
     */
    static cancelarMiSuscripcion = asyncHandler(async (req, res) => {
        const { motivo_cancelacion } = req.body;
        const organizacionId = req.user.organizacion_id;
        const usuarioId = req.user?.id;
        const usuarioEmail = req.user?.email;
        const usuarioNombre = req.user?.nombre;

        // Buscar la suscripción activa del usuario usando el método que ya usa bypass
        const miSuscripcion = await SuscripcionesModel.buscarActivaPorOrganizacion(organizacionId);

        if (!miSuscripcion) {
            return ResponseHelper.error(res, 'No tienes una suscripción activa', 404);
        }

        // Cancelar usando método bypass (la suscripción pertenece a Nexo Team, no a la org del usuario)
        // Pasamos email y nombre del usuario para las notificaciones
        const suscripcionCancelada = await SuscripcionesModel.cancelarBypass(
            miSuscripcion.id,
            motivo_cancelacion,
            usuarioId,
            { email: usuarioEmail, nombre: usuarioNombre }
        );

        return ResponseHelper.success(
            res,
            suscripcionCancelada,
            'Suscripción cancelada. Mantendrás acceso hasta el final del período actual.'
        );
    });

    /**
     * Pausar suscripción
     * POST /api/v1/suscripciones-negocio/suscripciones/:id/pausar
     */
    static pausar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { razon } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const suscripcionPausada = await SuscripcionesModel.pausar(id, organizacionId, razon);

        return ResponseHelper.success(res, suscripcionPausada, 'Suscripción pausada');
    });

    /**
     * Reactivar suscripción pausada
     * POST /api/v1/suscripciones-negocio/suscripciones/:id/reactivar
     */
    static reactivar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const suscripcionReactivada = await SuscripcionesModel.reactivar(id, organizacionId);

        return ResponseHelper.success(res, suscripcionReactivada, 'Suscripción reactivada');
    });

    /**
     * Actualizar fecha de próximo cobro
     * PATCH /api/v1/suscripciones-negocio/suscripciones/:id/proximo-cobro
     */
    static actualizarProximoCobro = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { fecha_proximo_cobro } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const suscripcionActualizada = await SuscripcionesModel.actualizarProximoCobro(
            id,
            fecha_proximo_cobro,
            organizacionId
        );

        return ResponseHelper.success(res, suscripcionActualizada, 'Fecha de cobro actualizada');
    });

    /**
     * Obtener historial de cambios de una suscripción
     * GET /api/v1/suscripciones-negocio/suscripciones/:id/historial
     */
    static obtenerHistorial = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const historial = await SuscripcionesModel.obtenerHistorial(id, organizacionId);

        return ResponseHelper.success(res, historial);
    });

    /**
     * Buscar suscripciones de un cliente
     * GET /api/v1/suscripciones-negocio/suscripciones/cliente/:clienteId
     */
    static buscarPorCliente = asyncHandler(async (req, res) => {
        const { clienteId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const suscripciones = await SuscripcionesModel.buscarPorCliente(
            clienteId,
            organizacionId
        );

        return ResponseHelper.success(res, suscripciones);
    });

    // ========================================================================
    // CUSTOMER BILLING: Admin crea suscripción para cliente
    // ========================================================================

    /**
     * Crear suscripción para un cliente (Customer Billing)
     * POST /api/v1/suscripciones-negocio/suscripciones/cliente
     *
     * Genera un token/link de checkout para que el cliente pague sin login.
     *
     * Flujo:
     * 1. Validar que cliente pertenece a la org
     * 2. Validar que org tiene MercadoPago configurado
     * 3. Calcular precio con cupón si aplica
     * 4. Crear token de checkout
     * 5. Retornar URL para enviar al cliente
     */
    static crearParaCliente = asyncHandler(async (req, res) => {
        const { cliente_id, plan_id, periodo, cupon_codigo, notificar_cliente, dias_expiracion } = req.body;
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        logger.info(`[CustomerBilling] Admin ${usuarioId} creando suscripción para cliente ${cliente_id}`);

        // 1. Validar que cliente existe en la org
        const ClienteModel = require('../../clientes/models/cliente.model');
        const cliente = await ClienteModel.buscarPorId(cliente_id, organizacionId);
        ErrorHelper.throwIfNotFound(cliente, 'Cliente');

        // 2. Validar que org tiene conector MercadoPago
        const ConectoresModel = require('../models/conectores.model');
        const conector = await ConectoresModel.obtenerConectorPrincipal(organizacionId, 'mercadopago');

        if (!conector) {
            ErrorHelper.throwValidation(
                'Para vender suscripciones necesitas configurar MercadoPago. ' +
                'Ve a Configuración > Conectores de Pago.'
            );
        }

        // 3. Obtener plan y validar
        const plan = await PlanesModel.buscarPorId(plan_id, organizacionId);
        ErrorHelper.throwIfNotFound(plan, 'Plan de suscripción');

        if (!plan.activo) {
            ErrorHelper.throwValidation('El plan seleccionado no está disponible');
        }

        // 4. Calcular precio según período
        let precioBase;
        switch (periodo) {
            case 'mensual':
                precioBase = parseFloat(plan.precio_mensual);
                break;
            case 'trimestral':
                precioBase = parseFloat(plan.precio_trimestral) || parseFloat(plan.precio_mensual) * 3;
                break;
            case 'semestral':
                precioBase = parseFloat(plan.precio_mensual) * 6;
                break;
            case 'anual':
                precioBase = parseFloat(plan.precio_anual) || parseFloat(plan.precio_mensual) * 12;
                break;
            default:
                precioBase = parseFloat(plan.precio_mensual);
        }

        // 5. Aplicar cupón si existe
        let descuento = 0;
        let cuponValidado = null;

        if (cupon_codigo) {
            const validacion = await CuponesModel.validar(cupon_codigo, organizacionId, { plan_id });

            if (validacion.valido) {
                cuponValidado = validacion.cupon;

                if (cuponValidado.tipo_descuento === 'porcentaje') {
                    descuento = (precioBase * cuponValidado.porcentaje_descuento) / 100;
                } else {
                    descuento = parseFloat(cuponValidado.monto_descuento) || 0;
                }

                descuento = Math.min(descuento, precioBase);
            }
        }

        const precioFinal = Math.max(0, precioBase - descuento);

        // 6. Crear token de checkout
        const checkoutToken = await CheckoutTokensModel.crear({
            cliente_id,
            plan_id,
            periodo,
            cupon_codigo: cuponValidado ? cupon_codigo : null,
            precio_calculado: precioFinal,
            moneda: plan.moneda || 'MXN',
            dias_expiracion: dias_expiracion || 7
        }, organizacionId, usuarioId);

        // 7. Generar URL
        const checkoutUrl = `${FRONTEND_URL}/checkout/${checkoutToken.token}`;

        // 8. Notificar cliente (TODO: implementar servicio de notificaciones)
        if (notificar_cliente) {
            logger.info(`[CustomerBilling] TODO: Enviar email a ${cliente.email} con link ${checkoutUrl}`);
            // await NotificacionesService.enviarLinkPago(cliente, checkoutUrl, plan);
        }

        logger.info(`[CustomerBilling] Token creado para cliente ${cliente_id}, plan ${plan.nombre}, precio ${precioFinal}`);

        return ResponseHelper.success(res, {
            checkout_url: checkoutUrl,
            token: checkoutToken.token,
            expira_en: checkoutToken.expira_en,
            cliente: {
                id: cliente.id,
                nombre: cliente.nombre,
                email: cliente.email
            },
            plan: {
                id: plan.id,
                nombre: plan.nombre,
                codigo: plan.codigo
            },
            precio: {
                base: precioBase,
                descuento: descuento,
                final: precioFinal,
                moneda: plan.moneda || 'MXN'
            },
            cupon_aplicado: cuponValidado ? {
                codigo: cuponValidado.codigo,
                tipo: cuponValidado.tipo_descuento,
                valor: cuponValidado.tipo_descuento === 'porcentaje'
                    ? `${cuponValidado.porcentaje_descuento}%`
                    : `$${cuponValidado.monto_descuento}`
            } : null
        }, 'Link de checkout generado exitosamente', 201);
    });

    /**
     * Listar tokens de checkout generados
     * GET /api/v1/suscripciones-negocio/suscripciones/tokens
     */
    static listarCheckoutTokens = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            estado: req.query.estado,
            cliente_id: req.query.cliente_id ? parseInt(req.query.cliente_id) : undefined
        };

        const resultado = await CheckoutTokensModel.listar(options, organizacionId);

        return ResponseHelper.success(res, resultado);
    });

    /**
     * Cancelar token de checkout
     * DELETE /api/v1/suscripciones-negocio/suscripciones/tokens/:tokenId
     */
    static cancelarCheckoutToken = asyncHandler(async (req, res) => {
        const { tokenId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const tokenCancelado = await CheckoutTokensModel.cancelar(tokenId, organizacionId);

        if (!tokenCancelado) {
            return ResponseHelper.error(res, 'Token no encontrado o ya no está pendiente', 404);
        }

        return ResponseHelper.success(res, tokenCancelado, 'Token cancelado exitosamente');
    });

    // ========================================================================
    // SUSCRIPCIONES PROPIAS (MiPlan)
    // ========================================================================

    /**
     * Obtener mi suscripción activa (para página MiPlan)
     * GET /api/v1/suscripciones-negocio/suscripciones/mi-suscripcion
     *
     * Busca la suscripción activa donde el cliente está vinculado
     * a la organización del usuario que hace la petición.
     */
    static obtenerMiSuscripcion = asyncHandler(async (req, res) => {
        const organizacionId = req.user.organizacion_id;

        const suscripcion = await SuscripcionesModel.buscarActivaPorOrganizacion(organizacionId);

        if (!suscripcion) {
            return ResponseHelper.success(res, null, 'No tienes una suscripción activa');
        }

        // Calcular días restantes de trial si aplica
        let diasTrialRestantes = null;
        if (suscripcion.es_trial && suscripcion.fecha_fin_trial) {
            const hoy = new Date();
            const finTrial = new Date(suscripcion.fecha_fin_trial);
            const diffTime = finTrial - hoy;
            diasTrialRestantes = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }

        return ResponseHelper.success(res, {
            ...suscripcion,
            dias_trial_restantes: diasTrialRestantes
        });
    });
}

module.exports = SuscripcionesController;

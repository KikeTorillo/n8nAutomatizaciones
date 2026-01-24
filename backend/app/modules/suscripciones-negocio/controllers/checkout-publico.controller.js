/**
 * ====================================================================
 * CONTROLLER: CHECKOUT PÚBLICO
 * ====================================================================
 * Controlador para checkout público sin autenticación.
 * Permite que clientes de organizaciones paguen suscripciones
 * mediante un link único generado por el admin.
 *
 * Flujo:
 * 1. GET /checkout/link/:token - Obtener datos del checkout
 * 2. POST /checkout/link/:token/pagar - Iniciar pago con MercadoPago
 *
 * @module controllers/checkout-publico
 * @version 1.0.0
 * @date Enero 2026
 */

const asyncHandler = require('../../../middleware/asyncHandler');
const CheckoutTokensModel = require('../models/checkout-tokens.model');
const SuscripcionesModel = require('../models/suscripciones.model');
const PagosModel = require('../models/pagos.model');
const CuponesModel = require('../models/cupones.model');
const MercadoPagoService = require('../../../services/mercadopago.service');
const { ResponseHelper, ErrorHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

// URL del frontend
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

class CheckoutPublicoController {

    /**
     * GET /checkout/link/:token
     *
     * Obtiene los datos del checkout para mostrar al cliente.
     * NO requiere autenticación.
     *
     * Retorna:
     * - Información del plan (nombre, precio, features)
     * - Información del cliente (nombre, email)
     * - Información de la organización (nombre, logo)
     * - Fecha de expiración del link
     */
    static obtenerDatosCheckout = asyncHandler(async (req, res) => {
        const { token } = req.params;

        // Verificar token
        const verificacion = await CheckoutTokensModel.verificar(token);

        if (!verificacion.valido) {
            return ResponseHelper.error(res, verificacion.razon, 400);
        }

        const checkout = verificacion.checkout;

        // Formatear respuesta (solo datos necesarios, sin exponer IDs internos)
        const response = {
            plan: {
                nombre: checkout.plan_nombre,
                codigo: checkout.plan_codigo,
                precio: parseFloat(checkout.precio_calculado),
                precio_original: parseFloat(checkout.plan_precio_mensual),
                features: checkout.plan_features || [],
                color: checkout.plan_color,
                icono: checkout.plan_icono
            },
            cliente: {
                nombre: checkout.cliente_nombre,
                email: checkout.cliente_email
            },
            organizacion: {
                nombre: checkout.organizacion_nombre,
                logo_url: checkout.organizacion_logo_url
            },
            periodo: checkout.periodo,
            moneda: checkout.moneda,
            cupon_aplicado: checkout.cupon_codigo ? {
                codigo: checkout.cupon_codigo,
                descuento: parseFloat(checkout.plan_precio_mensual) - parseFloat(checkout.precio_calculado)
            } : null,
            expira_en: checkout.expira_en
        };

        logger.info(`[CheckoutPublico] Datos obtenidos para token: ${token.substring(0, 8)}...`);

        return ResponseHelper.success(res, response);
    });

    /**
     * POST /checkout/link/:token/pagar
     *
     * Inicia el proceso de pago con MercadoPago.
     * NO requiere autenticación.
     *
     * Flujo:
     * 1. Verifica que el token sea válido
     * 2. Crea suscripción en estado pendiente_pago
     * 3. Crea preferencia en MercadoPago
     * 4. Marca token como usado
     * 5. Retorna init_point para redirección
     */
    static iniciarPago = asyncHandler(async (req, res) => {
        const { token } = req.params;

        // Verificar token
        const verificacion = await CheckoutTokensModel.verificar(token);

        if (!verificacion.valido) {
            return ResponseHelper.error(res, verificacion.razon, 400);
        }

        const checkout = verificacion.checkout;
        const organizacionId = checkout.organizacion_id;
        const clienteId = checkout.cliente_id;
        const planId = checkout.plan_id;

        logger.info(`[CheckoutPublico] Iniciando pago para token: ${token.substring(0, 8)}..., cliente: ${clienteId}, plan: ${planId}`);

        // ═══════════════════════════════════════════════════════════════
        // PASO 1: Verificar que el cliente no tenga suscripción activa al mismo plan
        // ═══════════════════════════════════════════════════════════════
        const suscripcionExistente = await SuscripcionesModel.buscarActivaPorClienteYPlan(
            clienteId,
            planId,
            organizacionId,
            checkout.cliente_email
        );

        if (suscripcionExistente) {
            if (['activa', 'trial', 'pausada'].includes(suscripcionExistente.estado)) {
                return ResponseHelper.error(
                    res,
                    `Ya tienes una suscripción ${suscripcionExistente.estado === 'activa' ? 'activa' : suscripcionExistente.estado === 'trial' ? 'en período de prueba' : 'pausada'} para este plan.`,
                    409
                );
            }

            // Si está pendiente_pago, retornar init_point existente
            if (suscripcionExistente.estado === 'pendiente_pago' && suscripcionExistente.subscription_id_gateway) {
                logger.info(`[CheckoutPublico] Retornando init_point existente para suscripción ${suscripcionExistente.id}`);

                try {
                    const mpService = await MercadoPagoService.getForOrganization(organizacionId);
                    const mpSuscripcion = await mpService.obtenerSuscripcion(suscripcionExistente.subscription_id_gateway);

                    return ResponseHelper.success(res, {
                        init_point: mpSuscripcion.init_point,
                        suscripcion_id: suscripcionExistente.id,
                        existente: true
                    });
                } catch (mpError) {
                    logger.warn(`[CheckoutPublico] No se pudo obtener suscripción de MP: ${mpError.message}. Creando nueva.`);
                }
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // PASO 2: Crear suscripción en estado pendiente_pago
        // ═══════════════════════════════════════════════════════════════
        const suscripcion = await SuscripcionesModel.crearPendienteBypass({
            plan_id: planId,
            cliente_id: clienteId,
            periodo: checkout.periodo,
            precio_actual: parseFloat(checkout.precio_calculado),
            moneda: checkout.moneda,
            gateway: 'mercadopago',
            cupon_codigo: checkout.cupon_codigo
        }, organizacionId);

        // ═══════════════════════════════════════════════════════════════
        // PASO 3: Crear registro de pago pendiente
        // ═══════════════════════════════════════════════════════════════
        const pago = await PagosModel.crearBypass({
            suscripcion_id: suscripcion.id,
            monto: parseFloat(checkout.precio_calculado),
            moneda: checkout.moneda,
            estado: 'pendiente',
            gateway: 'mercadopago'
        }, organizacionId);

        // ═══════════════════════════════════════════════════════════════
        // PASO 4: Crear preferencia en MercadoPago
        // ═══════════════════════════════════════════════════════════════
        const externalReference = `org_${organizacionId}_sus_${suscripcion.id}_pago_${pago.id}_cb`;
        const mpService = await MercadoPagoService.getForOrganization(organizacionId);

        // Determinar email del pagador
        let emailPagador;
        if (process.env.MERCADOPAGO_ENVIRONMENT === 'sandbox') {
            emailPagador = process.env.MERCADOPAGO_TEST_PAYER_EMAIL;
            logger.info(`[CheckoutPublico] Sandbox activo, usando email: ${emailPagador}`);
        } else {
            emailPagador = checkout.cliente_email;
        }

        const mpResponse = await mpService.crearSuscripcionConInitPoint({
            nombre: `Suscripción ${checkout.plan_nombre} - ${checkout.periodo}`,
            precio: parseFloat(checkout.precio_calculado),
            moneda: checkout.moneda,
            email: emailPagador,
            returnUrl: `${FRONTEND_URL}/payment/callback`,
            externalReference
        });

        // ═══════════════════════════════════════════════════════════════
        // PASO 5: Actualizar suscripción con ID de MercadoPago
        // ═══════════════════════════════════════════════════════════════
        await SuscripcionesModel.actualizarGatewayIdsBypass(suscripcion.id, {
            subscription_id_gateway: mpResponse.id
        });

        // ═══════════════════════════════════════════════════════════════
        // PASO 6: Marcar token como usado
        // ═══════════════════════════════════════════════════════════════
        await CheckoutTokensModel.marcarComoUsado(checkout.id, suscripcion.id);

        logger.info(`[CheckoutPublico] Pago iniciado - Suscripción: ${suscripcion.id}, Plan: ${checkout.plan_nombre}, Precio: ${checkout.precio_calculado}`);

        return ResponseHelper.success(res, {
            init_point: mpResponse.init_point,
            suscripcion_id: suscripcion.id,
            pago_id: pago.id
        }, 'Checkout iniciado correctamente');
    });
}

module.exports = CheckoutPublicoController;

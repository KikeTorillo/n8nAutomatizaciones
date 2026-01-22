/**
 * ====================================================================
 * CONTROLLER: WEBHOOKS
 * ====================================================================
 * Gestión de webhooks públicos de Stripe y MercadoPago.
 * CRÍTICO: Validación HMAC obligatoria para seguridad.
 *
 * @module controllers/webhooks
 */

const asyncHandler = require('../../../middleware/asyncHandler');
const { PagosModel, SuscripcionesModel } = require('../models');
const StripeService = require('../services/stripe.service');
const MercadoPagoService = require('../services/mercadopago.service');
const NotificacionesService = require('../services/notificaciones.service');
const { ResponseHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

class WebhooksController {

    /**
     * Webhook de Stripe
     * POST /api/v1/suscripciones-negocio/webhooks/stripe
     *
     * CRÍTICO: Endpoint público (sin auth), validación HMAC obligatoria
     */
    static webhookStripe = asyncHandler(async (req, res) => {
        const signature = req.headers['stripe-signature'];

        if (!signature) {
            logger.error('Webhook Stripe sin signature header');
            return ResponseHelper.error(res, 'Missing signature', 400);
        }

        try {
            // Validar webhook usando HMAC (requiere raw body)
            const event = StripeService.validarWebhook(req.body, signature);

            logger.info(`Webhook Stripe recibido: ${event.type}`, {
                event_id: event.id
            });

            // Procesar evento según tipo
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await this._procesarPaymentIntentSucceeded(event.data.object);
                    break;

                case 'payment_intent.payment_failed':
                    await this._procesarPaymentIntentFailed(event.data.object);
                    break;

                case 'customer.subscription.deleted':
                    await this._procesarSuscripcionCancelada(event.data.object);
                    break;

                case 'customer.subscription.updated':
                    await this._procesarSuscripcionActualizada(event.data.object);
                    break;

                default:
                    logger.debug(`Evento Stripe no manejado: ${event.type}`);
            }

            return ResponseHelper.success(res, { received: true });

        } catch (error) {
            logger.error('Error procesando webhook Stripe', { error: error.message });
            return ResponseHelper.error(res, 'Webhook validation failed', 400);
        }
    });

    /**
     * Webhook de MercadoPago
     * POST /api/v1/suscripciones-negocio/webhooks/mercadopago
     *
     * CRÍTICO: Endpoint público (sin auth), validación HMAC obligatoria
     */
    static webhookMercadoPago = asyncHandler(async (req, res) => {
        const signature = req.headers['x-signature'];
        const requestId = req.headers['x-request-id'];
        const dataId = req.query['data.id'];

        logger.info('Webhook MercadoPago recibido', {
            action: req.body.action,
            type: req.body.type,
            data_id: dataId
        });

        // Validar webhook usando HMAC
        const esValido = MercadoPagoService.validarWebhook(signature, requestId, dataId);

        if (!esValido) {
            logger.warn('Webhook MercadoPago inválido', {
                signature: signature?.substring(0, 20) + '...',
                requestId
            });
            return ResponseHelper.error(res, 'Invalid signature', 400);
        }

        try {
            // Procesar según tipo de evento
            const { type, action, data } = req.body;

            if (type === 'payment') {
                await this._procesarPagoMercadoPago(data.id);
            } else if (type === 'subscription_preapproval') {
                await this._procesarSuscripcionMercadoPago(data.id, action);
            }

            return ResponseHelper.success(res, { received: true });

        } catch (error) {
            logger.error('Error procesando webhook MercadoPago', { error: error.message });
            return ResponseHelper.error(res, 'Webhook processing failed', 500);
        }
    });

    // ====================================================================
    // PROCESADORES DE EVENTOS STRIPE
    // ====================================================================

    /**
     * Procesar PaymentIntent exitoso (Stripe)
     */
    static async _procesarPaymentIntentSucceeded(paymentIntent) {
        try {
            const { suscripcion_id, pago_id, organizacion_id } = paymentIntent.metadata;

            if (!pago_id || !organizacion_id) {
                logger.warn('PaymentIntent sin metadata completo', { payment_intent_id: paymentIntent.id });
                return;
            }

            // Actualizar pago a completado
            await PagosModel.actualizarEstado(pago_id, 'completado', organizacion_id);

            // Actualizar suscripción
            if (suscripcion_id) {
                await SuscripcionesModel.procesarCobroExitoso(suscripcion_id, organizacion_id);
            }

            logger.info(`PaymentIntent exitoso procesado: ${paymentIntent.id}`);

        } catch (error) {
            logger.error('Error procesando PaymentIntent exitoso', { error: error.message });
        }
    }

    /**
     * Procesar PaymentIntent fallido (Stripe)
     */
    static async _procesarPaymentIntentFailed(paymentIntent) {
        try {
            const { suscripcion_id, pago_id, organizacion_id } = paymentIntent.metadata;

            if (!pago_id || !organizacion_id) {
                return;
            }

            // Actualizar pago a fallido
            await PagosModel.actualizarEstado(pago_id, 'fallido', organizacion_id);

            // Registrar fallo en suscripción
            if (suscripcion_id) {
                await SuscripcionesModel.registrarFalloCobro(
                    suscripcion_id,
                    organizacion_id,
                    paymentIntent.last_payment_error?.message || 'Payment failed'
                );
            }

            logger.info(`PaymentIntent fallido procesado: ${paymentIntent.id}`);

        } catch (error) {
            logger.error('Error procesando PaymentIntent fallido', { error: error.message });
        }
    }

    /**
     * Procesar suscripción cancelada (Stripe)
     */
    static async _procesarSuscripcionCancelada(subscription) {
        try {
            const { suscripcion_id, organizacion_id } = subscription.metadata;

            if (!suscripcion_id || !organizacion_id) {
                return;
            }

            await SuscripcionesModel.cambiarEstado(
                suscripcion_id,
                'cancelada',
                organizacion_id,
                { razon: 'Cancelada desde Stripe' }
            );

            logger.info(`Suscripción Stripe cancelada: ${subscription.id}`);

        } catch (error) {
            logger.error('Error procesando cancelación Stripe', { error: error.message });
        }
    }

    /**
     * Procesar suscripción actualizada (Stripe)
     */
    static async _procesarSuscripcionActualizada(subscription) {
        logger.debug(`Suscripción Stripe actualizada: ${subscription.id}`, {
            status: subscription.status
        });
        // TODO: Implementar lógica de actualización si es necesario
    }

    // ====================================================================
    // PROCESADORES DE EVENTOS MERCADOPAGO
    // ====================================================================

    /**
     * Procesar pago de MercadoPago
     */
    static async _procesarPagoMercadoPago(paymentId) {
        try {
            const pago = await MercadoPagoService.obtenerPago(paymentId);

            logger.info('Procesando pago MercadoPago', {
                payment_id: paymentId,
                status: pago.status
            });

            // Buscar pago en nuestra BD por transaction_id
            const pagoLocal = await PagosModel.buscarPorTransactionId(
                'mercadopago',
                paymentId.toString(),
                pago.metadata?.organizacion_id
            );

            if (!pagoLocal) {
                logger.warn('Pago MercadoPago no encontrado en BD', { payment_id: paymentId });
                return;
            }

            // Actualizar estado según MercadoPago
            if (pago.status === 'approved') {
                await PagosModel.actualizarEstado(pagoLocal.id, 'completado', pagoLocal.organizacion_id);

                // Actualizar suscripción
                if (pagoLocal.suscripcion_id) {
                    await SuscripcionesModel.procesarCobroExitoso(
                        pagoLocal.suscripcion_id,
                        pagoLocal.organizacion_id
                    );
                }
            } else if (pago.status === 'rejected' || pago.status === 'cancelled') {
                await PagosModel.actualizarEstado(pagoLocal.id, 'fallido', pagoLocal.organizacion_id);
            }

        } catch (error) {
            logger.error('Error procesando pago MercadoPago', { error: error.message });
        }
    }

    /**
     * Procesar evento de suscripción MercadoPago
     */
    static async _procesarSuscripcionMercadoPago(subscriptionId, action) {
        logger.info('Procesando suscripción MercadoPago', {
            subscription_id: subscriptionId,
            action
        });
        // TODO: Implementar lógica de suscripciones MercadoPago si es necesario
    }
}

module.exports = WebhooksController;

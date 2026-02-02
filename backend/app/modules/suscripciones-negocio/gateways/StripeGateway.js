/**
 * ====================================================================
 * STRIPE GATEWAY - PLACEHOLDER PARA IMPLEMENTACIÓN FUTURA
 * ====================================================================
 * Estructura preparada para la integración con Stripe.
 * Todos los métodos lanzan error indicando que no está implementado.
 *
 * TODO: Implementar cuando se requiera soporte para Stripe
 *
 * @module suscripciones-negocio/gateways/StripeGateway
 * @version 1.0.0
 * @date Febrero 2026
 */

const PaymentGateway = require('./PaymentGateway');
const { NormalizedEvent, EventTypes } = require('./events/NormalizedEvent');
const logger = require('../../../utils/logger');

/**
 * Gateway de Stripe (Placeholder)
 * @extends PaymentGateway
 */
class StripeGateway extends PaymentGateway {

    /**
     * @param {number} organizacionId - ID de la organización
     */
    constructor(organizacionId) {
        super(organizacionId);
        this._stripeService = null;
    }

    /**
     * Factory: Crear instancia para una organización
     * @param {number} organizacionId
     * @returns {Promise<StripeGateway>}
     */
    static async create(organizacionId) {
        // TODO: Obtener credenciales de Stripe del conector
        const gateway = new StripeGateway(organizacionId);
        logger.warn('[StripeGateway] Gateway de Stripe creado pero no implementado', {
            organizacionId
        });
        return gateway;
    }

    /**
     * Lanzar error de no implementado
     * @private
     */
    _throwNotImplemented(methodName) {
        const error = new Error(
            `Stripe gateway not implemented: ${methodName}. ` +
            `El soporte para Stripe está en desarrollo. ` +
            `Por favor use MercadoPago como gateway de pago.`
        );
        error.code = 'GATEWAY_NOT_IMPLEMENTED';
        error.gateway = 'stripe';
        throw error;
    }

    // ====================================================================
    // IDENTIFICACIÓN
    // ====================================================================

    /**
     * @override
     * @returns {string}
     */
    getGatewayName() {
        return 'stripe';
    }

    /**
     * @override
     * @returns {boolean}
     */
    isSandbox() {
        // TODO: Detectar basado en la clave de API (sk_test_ vs sk_live_)
        return true;
    }

    // ====================================================================
    // SUSCRIPCIONES
    // ====================================================================

    /**
     * @override
     */
    async createSubscription(params) {
        this._throwNotImplemented('createSubscription');
    }

    /**
     * @override
     */
    async getSubscription(subscriptionId) {
        this._throwNotImplemented('getSubscription');
    }

    /**
     * @override
     */
    async updateSubscriptionAmount(subscriptionId, amount, currency = 'MXN') {
        this._throwNotImplemented('updateSubscriptionAmount');
    }

    /**
     * @override
     */
    async cancelSubscription(subscriptionId) {
        this._throwNotImplemented('cancelSubscription');
    }

    /**
     * @override
     */
    async pauseSubscription(subscriptionId) {
        this._throwNotImplemented('pauseSubscription');
    }

    /**
     * @override
     */
    async resumeSubscription(subscriptionId) {
        this._throwNotImplemented('resumeSubscription');
    }

    // ====================================================================
    // PAGOS
    // ====================================================================

    /**
     * @override
     */
    async getPayment(paymentId) {
        this._throwNotImplemented('getPayment');
    }

    /**
     * @override
     * Stripe no tiene concepto de "authorized payment" como MercadoPago
     */
    async getAuthorizedPayment(authorizedPaymentId) {
        return null;
    }

    // ====================================================================
    // WEBHOOKS
    // ====================================================================

    /**
     * @override
     * @param {Object} params
     * @returns {boolean}
     */
    validateWebhook(params) {
        // TODO: Implementar validación HMAC de Stripe
        // const { signature, payload } = params;
        // return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        logger.warn('[StripeGateway] validateWebhook no implementado');
        return false;
    }

    /**
     * @override
     * Normalizar eventos de Stripe al formato estándar
     * @param {Object} rawEvent - Evento de Stripe
     * @returns {NormalizedEvent}
     */
    normalizeEvent(rawEvent) {
        const { type, data } = rawEvent;

        logger.debug('[StripeGateway] Normalizando evento (placeholder)', { type });

        // Mapeo básico de eventos de Stripe
        // TODO: Implementar mapeo completo cuando se integre Stripe

        switch (type) {
            // Suscripciones
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                return new NormalizedEvent({
                    type: EventTypes.SUBSCRIPTION_UPDATED,
                    gateway: 'stripe',
                    resourceId: data?.object?.id,
                    resourceType: 'subscription',
                    data: { stripeStatus: data?.object?.status },
                    raw: rawEvent
                });

            case 'customer.subscription.deleted':
                return NormalizedEvent.subscriptionCancelled(
                    'stripe',
                    data?.object?.id,
                    { reason: 'Cancelled via Stripe' },
                    rawEvent
                );

            // Pagos
            case 'payment_intent.succeeded':
            case 'invoice.payment_succeeded':
                return NormalizedEvent.paymentApproved(
                    'stripe',
                    data?.object?.id,
                    {
                        amount: data?.object?.amount_received || data?.object?.amount_paid,
                        currency: data?.object?.currency
                    },
                    rawEvent
                );

            case 'payment_intent.payment_failed':
            case 'invoice.payment_failed':
                return NormalizedEvent.paymentFailed(
                    'stripe',
                    data?.object?.id,
                    {
                        reason: data?.object?.last_payment_error?.message || 'Payment failed'
                    },
                    rawEvent
                );

            default:
                return NormalizedEvent.unknown('stripe', type, rawEvent);
        }
    }

    // ====================================================================
    // VERIFICACIÓN
    // ====================================================================

    /**
     * @override
     * @returns {Promise<ConnectivityResult>}
     */
    async verifyConnectivity() {
        return {
            success: false,
            message: 'Stripe gateway not implemented',
            details: {
                error: 'GATEWAY_NOT_IMPLEMENTED',
                gateway: 'stripe'
            }
        };
    }
}

module.exports = StripeGateway;

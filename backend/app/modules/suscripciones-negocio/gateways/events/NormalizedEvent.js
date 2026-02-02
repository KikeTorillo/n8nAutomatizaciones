/**
 * ====================================================================
 * NORMALIZED EVENT - EVENTOS DE PAGO ESTANDARIZADOS
 * ====================================================================
 * Normaliza los eventos de diferentes gateways (MercadoPago, Stripe)
 * a un formato estándar para procesamiento uniforme.
 *
 * MAPEO DE EVENTOS:
 *
 * MercadoPago -> Normalizado:
 * - subscription_preapproval (status=authorized) -> SUBSCRIPTION_AUTHORIZED
 * - subscription_preapproval (status=cancelled) -> SUBSCRIPTION_CANCELLED
 * - subscription_preapproval (status=paused) -> SUBSCRIPTION_PAUSED
 * - subscription_authorized_payment (approved) -> PAYMENT_APPROVED
 * - subscription_authorized_payment (rejected) -> PAYMENT_FAILED
 * - payment (approved) -> PAYMENT_APPROVED
 * - payment (rejected) -> PAYMENT_FAILED
 *
 * Stripe -> Normalizado:
 * - customer.subscription.created -> SUBSCRIPTION_AUTHORIZED
 * - customer.subscription.deleted -> SUBSCRIPTION_CANCELLED
 * - customer.subscription.paused -> SUBSCRIPTION_PAUSED
 * - payment_intent.succeeded -> PAYMENT_APPROVED
 * - payment_intent.payment_failed -> PAYMENT_FAILED
 * - invoice.payment_succeeded -> PAYMENT_APPROVED
 * - invoice.payment_failed -> PAYMENT_FAILED
 *
 * @module suscripciones-negocio/gateways/events/NormalizedEvent
 * @version 1.0.0
 * @date Febrero 2026
 */

/**
 * Tipos de eventos normalizados
 * @enum {string}
 */
const EventTypes = Object.freeze({
    // Suscripciones
    SUBSCRIPTION_AUTHORIZED: 'subscription.authorized',
    SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
    SUBSCRIPTION_PAUSED: 'subscription.paused',
    SUBSCRIPTION_RESUMED: 'subscription.resumed',
    SUBSCRIPTION_UPDATED: 'subscription.updated',
    SUBSCRIPTION_PENDING: 'subscription.pending',

    // Pagos
    PAYMENT_APPROVED: 'payment.approved',
    PAYMENT_FAILED: 'payment.failed',
    PAYMENT_PENDING: 'payment.pending',
    PAYMENT_REFUNDED: 'payment.refunded',
    PAYMENT_CANCELLED: 'payment.cancelled',

    // Otros
    UNKNOWN: 'unknown'
});

/**
 * Mapeo de estados de suscripción de gateways a estados internos
 * @enum {string}
 */
const SubscriptionStatusMap = Object.freeze({
    // Estados normalizados -> Estados internos de la BD
    'authorized': 'activa',
    'pending': 'pendiente_pago',
    'cancelled': 'cancelada',
    'paused': 'pausada',
    'active': 'activa',        // Stripe
    'trialing': 'trial',       // Stripe
    'past_due': 'grace_period' // Stripe
});

/**
 * Mapeo de estados de pago de gateways a estados internos
 * @enum {string}
 */
const PaymentStatusMap = Object.freeze({
    // Estados de MP
    'approved': 'completado',
    'processed': 'completado',  // MP subscription_authorized_payment
    'pending': 'pendiente',
    'in_process': 'pendiente',
    'rejected': 'fallido',
    'cancelled': 'fallido',
    'refunded': 'reembolsado',

    // Estados de Stripe
    'succeeded': 'completado',
    'requires_payment_method': 'pendiente',
    'requires_confirmation': 'pendiente',
    'requires_action': 'pendiente',
    'processing': 'pendiente',
    'canceled': 'fallido'       // Stripe usa 'canceled' con una 'l'
});

/**
 * Clase que representa un evento normalizado de webhook
 */
class NormalizedEvent {

    /**
     * @param {Object} params
     * @param {string} params.type - Tipo de evento normalizado (EventTypes)
     * @param {string} params.gateway - Nombre del gateway ('mercadopago'|'stripe')
     * @param {string} params.resourceId - ID del recurso (suscripción o pago)
     * @param {string} params.resourceType - Tipo de recurso ('subscription'|'payment')
     * @param {Object} params.data - Datos específicos del evento
     * @param {Object} params.raw - Evento crudo original
     * @param {Object} [params.metadata] - Metadata adicional
     */
    constructor({ type, gateway, resourceId, resourceType, data, raw, metadata = {} }) {
        this.type = type;
        this.gateway = gateway;
        this.resourceId = resourceId;
        this.resourceType = resourceType;
        this.data = data;
        this.raw = raw;
        this.metadata = metadata;
        this.timestamp = new Date();
    }

    /**
     * Verificar si es un evento de suscripción
     * @returns {boolean}
     */
    isSubscriptionEvent() {
        return this.type.startsWith('subscription.');
    }

    /**
     * Verificar si es un evento de pago
     * @returns {boolean}
     */
    isPaymentEvent() {
        return this.type.startsWith('payment.');
    }

    /**
     * Verificar si es un evento desconocido
     * @returns {boolean}
     */
    isUnknown() {
        return this.type === EventTypes.UNKNOWN;
    }

    /**
     * Obtener estado interno de suscripción basado en el evento
     * @returns {string|null}
     */
    getInternalSubscriptionStatus() {
        switch (this.type) {
            case EventTypes.SUBSCRIPTION_AUTHORIZED:
                return 'activa';
            case EventTypes.SUBSCRIPTION_CANCELLED:
                return 'cancelada';
            case EventTypes.SUBSCRIPTION_PAUSED:
                return 'pausada';
            case EventTypes.SUBSCRIPTION_RESUMED:
                return 'activa';
            case EventTypes.SUBSCRIPTION_PENDING:
                return 'pendiente_pago';
            default:
                return null;
        }
    }

    /**
     * Obtener estado interno de pago basado en el evento
     * @returns {string|null}
     */
    getInternalPaymentStatus() {
        switch (this.type) {
            case EventTypes.PAYMENT_APPROVED:
                return 'completado';
            case EventTypes.PAYMENT_FAILED:
            case EventTypes.PAYMENT_CANCELLED:
                return 'fallido';
            case EventTypes.PAYMENT_PENDING:
                return 'pendiente';
            case EventTypes.PAYMENT_REFUNDED:
                return 'reembolsado';
            default:
                return null;
        }
    }

    /**
     * Convertir a objeto plano (para logging/serialización)
     * @returns {Object}
     */
    toJSON() {
        return {
            type: this.type,
            gateway: this.gateway,
            resourceId: this.resourceId,
            resourceType: this.resourceType,
            data: this.data,
            metadata: this.metadata,
            timestamp: this.timestamp.toISOString()
            // Omitimos 'raw' para evitar logs muy grandes
        };
    }

    /**
     * Factory: Crear evento de suscripción autorizada
     * @param {string} gateway
     * @param {string} subscriptionId
     * @param {Object} data
     * @param {Object} raw
     * @returns {NormalizedEvent}
     */
    static subscriptionAuthorized(gateway, subscriptionId, data, raw) {
        return new NormalizedEvent({
            type: EventTypes.SUBSCRIPTION_AUTHORIZED,
            gateway,
            resourceId: subscriptionId,
            resourceType: 'subscription',
            data,
            raw
        });
    }

    /**
     * Factory: Crear evento de suscripción cancelada
     * @param {string} gateway
     * @param {string} subscriptionId
     * @param {Object} data
     * @param {Object} raw
     * @returns {NormalizedEvent}
     */
    static subscriptionCancelled(gateway, subscriptionId, data, raw) {
        return new NormalizedEvent({
            type: EventTypes.SUBSCRIPTION_CANCELLED,
            gateway,
            resourceId: subscriptionId,
            resourceType: 'subscription',
            data,
            raw
        });
    }

    /**
     * Factory: Crear evento de suscripción pausada
     * @param {string} gateway
     * @param {string} subscriptionId
     * @param {Object} data
     * @param {Object} raw
     * @returns {NormalizedEvent}
     */
    static subscriptionPaused(gateway, subscriptionId, data, raw) {
        return new NormalizedEvent({
            type: EventTypes.SUBSCRIPTION_PAUSED,
            gateway,
            resourceId: subscriptionId,
            resourceType: 'subscription',
            data,
            raw
        });
    }

    /**
     * Factory: Crear evento de pago aprobado
     * @param {string} gateway
     * @param {string} paymentId
     * @param {Object} data - { amount, currency, subscriptionId, etc. }
     * @param {Object} raw
     * @returns {NormalizedEvent}
     */
    static paymentApproved(gateway, paymentId, data, raw) {
        return new NormalizedEvent({
            type: EventTypes.PAYMENT_APPROVED,
            gateway,
            resourceId: paymentId,
            resourceType: 'payment',
            data,
            raw
        });
    }

    /**
     * Factory: Crear evento de pago fallido
     * @param {string} gateway
     * @param {string} paymentId
     * @param {Object} data - { reason, subscriptionId, etc. }
     * @param {Object} raw
     * @returns {NormalizedEvent}
     */
    static paymentFailed(gateway, paymentId, data, raw) {
        return new NormalizedEvent({
            type: EventTypes.PAYMENT_FAILED,
            gateway,
            resourceId: paymentId,
            resourceType: 'payment',
            data,
            raw
        });
    }

    /**
     * Factory: Crear evento desconocido
     * @param {string} gateway
     * @param {string} originalType
     * @param {Object} raw
     * @returns {NormalizedEvent}
     */
    static unknown(gateway, originalType, raw) {
        return new NormalizedEvent({
            type: EventTypes.UNKNOWN,
            gateway,
            resourceId: raw?.data?.id?.toString() || 'unknown',
            resourceType: 'unknown',
            data: { originalType },
            raw
        });
    }
}

module.exports = {
    NormalizedEvent,
    EventTypes,
    SubscriptionStatusMap,
    PaymentStatusMap
};

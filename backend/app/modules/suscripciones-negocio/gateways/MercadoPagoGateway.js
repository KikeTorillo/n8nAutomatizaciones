/**
 * ====================================================================
 * MERCADOPAGO GATEWAY - IMPLEMENTACIÓN DE PAYMENT GATEWAY
 * ====================================================================
 * Wrapper sobre MercadoPagoService existente que implementa la interfaz
 * PaymentGateway para uniformizar el acceso a MercadoPago.
 *
 * IMPORTANTE: Este gateway NO modifica MercadoPagoService, solo lo envuelve.
 *
 * @module suscripciones-negocio/gateways/MercadoPagoGateway
 * @version 1.0.0
 * @date Febrero 2026
 */

const PaymentGateway = require('./PaymentGateway');
const { NormalizedEvent, EventTypes } = require('./events/NormalizedEvent');
const MercadoPagoService = require('../../../services/mercadopago.service');
const logger = require('../../../utils/logger');

/**
 * Gateway de MercadoPago
 * @extends PaymentGateway
 */
class MercadoPagoGateway extends PaymentGateway {

    /**
     * @param {number} organizacionId - ID de la organización
     * @param {MercadoPagoService} mpService - Instancia del servicio MP (opcional, se obtiene automáticamente)
     */
    constructor(organizacionId, mpService = null) {
        super(organizacionId);
        this._mpService = mpService;
        this._initialized = false;
    }

    /**
     * Factory: Crear instancia para una organización
     * @param {number} organizacionId
     * @returns {Promise<MercadoPagoGateway>}
     */
    static async create(organizacionId) {
        const mpService = await MercadoPagoService.getForOrganization(organizacionId);
        const gateway = new MercadoPagoGateway(organizacionId, mpService);
        gateway._initialized = true;
        return gateway;
    }

    /**
     * Asegurar que el servicio MP está inicializado
     * @private
     */
    async _ensureInitialized() {
        if (!this._initialized || !this._mpService) {
            this._mpService = await MercadoPagoService.getForOrganization(this.organizacionId);
            this._initialized = true;
        }
    }

    // ====================================================================
    // IDENTIFICACIÓN
    // ====================================================================

    /**
     * @override
     * @returns {string}
     */
    getGatewayName() {
        return 'mercadopago';
    }

    /**
     * @override
     * @returns {boolean}
     */
    isSandbox() {
        if (!this._mpService) {
            logger.warn('[MercadoPagoGateway] Servicio no inicializado, asumiendo production');
            return false;
        }
        return this._mpService.isSandbox();
    }

    /**
     * @override
     * @returns {string|null}
     */
    getTestPayerEmail() {
        return this._mpService?.getTestPayerEmail() || null;
    }

    // ====================================================================
    // SUSCRIPCIONES
    // ====================================================================

    /**
     * @override
     * @param {Object} params
     * @returns {Promise<SubscriptionResult>}
     */
    async createSubscription(params) {
        await this._ensureInitialized();

        const { nombre, precio, moneda = 'MXN', email, returnUrl, externalReference } = params;

        logger.info('[MercadoPagoGateway] Creando suscripción', {
            organizacionId: this.organizacionId,
            nombre,
            precio,
            email
        });

        const result = await this._mpService.crearSuscripcionConInitPoint({
            nombre,
            precio,
            moneda,
            email,
            returnUrl,
            externalReference
        });

        return {
            subscriptionId: result.id,
            checkoutUrl: result.init_point,
            status: result.status,
            raw: result
        };
    }

    /**
     * @override
     * @param {string} subscriptionId
     * @returns {Promise<SubscriptionDetails>}
     */
    async getSubscription(subscriptionId) {
        await this._ensureInitialized();

        const mpSub = await this._mpService.obtenerSuscripcion(subscriptionId);

        return {
            subscriptionId: mpSub.id,
            status: mpSub.status,
            payerEmail: mpSub.payer_email,
            amount: mpSub.auto_recurring?.transaction_amount || 0,
            currency: mpSub.auto_recurring?.currency_id || 'MXN',
            nextBillingDate: mpSub.next_payment_date ? new Date(mpSub.next_payment_date) : null,
            raw: mpSub
        };
    }

    /**
     * @override
     * @param {string} subscriptionId
     * @param {number} amount
     * @param {string} currency
     * @returns {Promise<SubscriptionDetails>}
     */
    async updateSubscriptionAmount(subscriptionId, amount, currency = 'MXN') {
        await this._ensureInitialized();

        logger.info('[MercadoPagoGateway] Actualizando monto de suscripción', {
            organizacionId: this.organizacionId,
            subscriptionId,
            amount,
            currency
        });

        const result = await this._mpService.actualizarMontoPreapproval(subscriptionId, amount, currency);

        return {
            subscriptionId: result.id,
            status: result.status,
            payerEmail: result.payer_email,
            amount: result.auto_recurring?.transaction_amount || amount,
            currency: result.auto_recurring?.currency_id || currency,
            nextBillingDate: result.next_payment_date ? new Date(result.next_payment_date) : null,
            raw: result
        };
    }

    /**
     * @override
     * @param {string} subscriptionId
     * @returns {Promise<SubscriptionDetails>}
     */
    async cancelSubscription(subscriptionId) {
        await this._ensureInitialized();

        logger.info('[MercadoPagoGateway] Cancelando suscripción', {
            organizacionId: this.organizacionId,
            subscriptionId
        });

        const result = await this._mpService.cancelarSuscripcion(subscriptionId);

        return {
            subscriptionId: result.id,
            status: 'cancelled',
            payerEmail: result.payer_email,
            amount: result.auto_recurring?.transaction_amount || 0,
            currency: result.auto_recurring?.currency_id || 'MXN',
            nextBillingDate: null,
            raw: result
        };
    }

    /**
     * @override
     * @param {string} subscriptionId
     * @returns {Promise<SubscriptionDetails>}
     */
    async pauseSubscription(subscriptionId) {
        await this._ensureInitialized();

        logger.info('[MercadoPagoGateway] Pausando suscripción', {
            organizacionId: this.organizacionId,
            subscriptionId
        });

        const result = await this._mpService.pausarSuscripcion(subscriptionId);

        return {
            subscriptionId: result.id,
            status: 'paused',
            payerEmail: result.payer_email,
            amount: result.auto_recurring?.transaction_amount || 0,
            currency: result.auto_recurring?.currency_id || 'MXN',
            nextBillingDate: null,
            raw: result
        };
    }

    /**
     * @override
     * @param {string} subscriptionId
     * @returns {Promise<SubscriptionDetails>}
     */
    async resumeSubscription(subscriptionId) {
        await this._ensureInitialized();

        logger.info('[MercadoPagoGateway] Reanudando suscripción', {
            organizacionId: this.organizacionId,
            subscriptionId
        });

        // MercadoPago usa actualizarSuscripcion con status='authorized' para reanudar
        const result = await this._mpService.actualizarSuscripcion(subscriptionId, null);

        return {
            subscriptionId: result.id,
            status: result.status,
            payerEmail: result.payer_email,
            amount: result.auto_recurring?.transaction_amount || 0,
            currency: result.auto_recurring?.currency_id || 'MXN',
            nextBillingDate: result.next_payment_date ? new Date(result.next_payment_date) : null,
            raw: result
        };
    }

    // ====================================================================
    // PAGOS
    // ====================================================================

    /**
     * @override
     * @param {string} paymentId
     * @returns {Promise<PaymentDetails>}
     */
    async getPayment(paymentId) {
        await this._ensureInitialized();

        const pago = await this._mpService.obtenerPago(paymentId);

        return {
            paymentId: pago.id?.toString(),
            status: pago.status,
            statusDetail: pago.status_detail,
            amount: pago.transaction_amount,
            currency: pago.currency_id,
            payerEmail: pago.payer?.email,
            createdAt: pago.date_created ? new Date(pago.date_created) : null,
            approvedAt: pago.date_approved ? new Date(pago.date_approved) : null,
            raw: pago
        };
    }

    /**
     * @override
     * Obtener pago autorizado de suscripción (específico de MercadoPago)
     * @param {string} authorizedPaymentId
     * @returns {Promise<AuthorizedPaymentDetails|null>}
     */
    async getAuthorizedPayment(authorizedPaymentId) {
        await this._ensureInitialized();

        const pago = await this._mpService.obtenerPagoAutorizado(authorizedPaymentId);

        if (!pago) {
            return null;
        }

        return {
            authorizedPaymentId: pago.id?.toString(),
            subscriptionId: pago.preapproval_id,
            status: pago.status,
            amount: pago.transaction_amount,
            currency: pago.currency_id || 'MXN',
            rejectionCode: pago.rejection_code,
            raw: pago
        };
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
        const { signature, requestId, dataId } = params;

        if (!this._mpService) {
            logger.error('[MercadoPagoGateway] Servicio no inicializado para validar webhook');
            return false;
        }

        return this._mpService.validarWebhook(signature, requestId, dataId);
    }

    /**
     * @override
     * Normalizar evento de webhook de MercadoPago
     * @param {Object} rawEvent
     * @returns {NormalizedEvent}
     */
    normalizeEvent(rawEvent) {
        const { type, action, data } = rawEvent;
        const dataId = data?.id?.toString();

        logger.debug('[MercadoPagoGateway] Normalizando evento', {
            type,
            action,
            dataId
        });

        // Eventos de suscripción (subscription_preapproval)
        if (type === 'subscription_preapproval') {
            return this._normalizeSubscriptionPreapproval(rawEvent);
        }

        // Eventos de pago de suscripción (subscription_authorized_payment)
        if (type === 'subscription_authorized_payment') {
            return this._normalizeAuthorizedPayment(rawEvent);
        }

        // Eventos de pago directo (payment)
        if (type === 'payment') {
            return this._normalizePayment(rawEvent);
        }

        // Evento desconocido
        logger.debug('[MercadoPagoGateway] Evento no manejado', { type, action });
        return NormalizedEvent.unknown('mercadopago', type, rawEvent);
    }

    /**
     * Normalizar evento subscription_preapproval
     * @private
     */
    _normalizeSubscriptionPreapproval(rawEvent) {
        const { action, data } = rawEvent;
        const subscriptionId = data?.id?.toString();

        // El estado real de la suscripción se obtiene consultando la API
        // Por ahora, basamos la normalización en la acción
        // Los estados se verificarán en el procesador de webhooks

        // Posibles acciones: created, updated
        // El estado (authorized, cancelled, paused) viene al consultar la suscripción
        return new NormalizedEvent({
            type: EventTypes.SUBSCRIPTION_UPDATED,
            gateway: 'mercadopago',
            resourceId: subscriptionId,
            resourceType: 'subscription',
            data: {
                action,
                subscriptionId
            },
            raw: rawEvent,
            metadata: {
                requiresStatusCheck: true
            }
        });
    }

    /**
     * Normalizar evento subscription_authorized_payment
     * @private
     */
    _normalizeAuthorizedPayment(rawEvent) {
        const { data } = rawEvent;
        const paymentId = data?.id?.toString();

        // Este evento indica un pago de suscripción
        // El estado real se obtiene consultando la API
        return new NormalizedEvent({
            type: EventTypes.PAYMENT_PENDING, // Se actualizará al consultar el estado
            gateway: 'mercadopago',
            resourceId: paymentId,
            resourceType: 'authorized_payment',
            data: {
                paymentId
            },
            raw: rawEvent,
            metadata: {
                requiresStatusCheck: true,
                isSubscriptionPayment: true
            }
        });
    }

    /**
     * Normalizar evento payment
     * @private
     */
    _normalizePayment(rawEvent) {
        const { data } = rawEvent;
        const paymentId = data?.id?.toString();

        return new NormalizedEvent({
            type: EventTypes.PAYMENT_PENDING, // Se actualizará al consultar el estado
            gateway: 'mercadopago',
            resourceId: paymentId,
            resourceType: 'payment',
            data: {
                paymentId
            },
            raw: rawEvent,
            metadata: {
                requiresStatusCheck: true
            }
        });
    }

    // ====================================================================
    // VERIFICACIÓN
    // ====================================================================

    /**
     * @override
     * @returns {Promise<ConnectivityResult>}
     */
    async verifyConnectivity() {
        await this._ensureInitialized();
        return await this._mpService.verificarConectividad();
    }
}

module.exports = MercadoPagoGateway;

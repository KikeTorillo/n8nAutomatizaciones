/**
 * ====================================================================
 * SERVICE: STRIPE
 * ====================================================================
 * Integración con Stripe para procesamiento de pagos de suscripciones.
 *
 * @module services/stripe
 */

const Stripe = require('stripe');
const logger = require('../../../utils/logger');

class StripeService {
    constructor() {
        const apiKey = process.env.STRIPE_SECRET_KEY;

        if (!apiKey) {
            logger.warn('STRIPE_SECRET_KEY no configurada, Stripe deshabilitado');
            this.stripe = null;
        } else {
            this.stripe = new Stripe(apiKey, {
                apiVersion: '2024-11-20.acacia'
            });
        }

        this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    }

    /**
     * Verificar si Stripe está habilitado
     *
     * @returns {boolean}
     */
    isEnabled() {
        return this.stripe !== null;
    }

    /**
     * Crear cliente en Stripe
     *
     * @param {Object} data - Datos del cliente
     * @returns {Promise<Object>} - Customer de Stripe
     */
    async crearCliente(data) {
        if (!this.isEnabled()) {
            throw new Error('Stripe no está configurado');
        }

        try {
            const customer = await this.stripe.customers.create({
                email: data.email,
                name: data.nombre,
                phone: data.telefono,
                metadata: {
                    organizacion_id: data.organizacion_id,
                    cliente_id: data.cliente_id
                }
            });

            logger.info(`Cliente Stripe creado: ${customer.id}`);

            return customer;
        } catch (error) {
            logger.error('Error creando cliente Stripe', { error: error.message });
            throw error;
        }
    }

    /**
     * Actualizar cliente en Stripe
     *
     * @param {string} customerId - ID del customer en Stripe
     * @param {Object} data - Datos a actualizar
     * @returns {Promise<Object>} - Customer actualizado
     */
    async actualizarCliente(customerId, data) {
        if (!this.isEnabled()) {
            throw new Error('Stripe no está configurado');
        }

        try {
            const customer = await this.stripe.customers.update(customerId, {
                email: data.email,
                name: data.nombre,
                phone: data.telefono
            });

            return customer;
        } catch (error) {
            logger.error('Error actualizando cliente Stripe', { error: error.message });
            throw error;
        }
    }

    /**
     * Adjuntar método de pago a cliente
     *
     * @param {string} paymentMethodId - ID del payment method
     * @param {string} customerId - ID del customer
     * @returns {Promise<Object>} - Payment Method adjunto
     */
    async adjuntarMetodoPago(paymentMethodId, customerId) {
        if (!this.isEnabled()) {
            throw new Error('Stripe no está configurado');
        }

        try {
            const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
                customer: customerId
            });

            // Configurar como método de pago por defecto
            await this.stripe.customers.update(customerId, {
                invoice_settings: {
                    default_payment_method: paymentMethodId
                }
            });

            logger.info(`Payment Method ${paymentMethodId} adjuntado a ${customerId}`);

            return paymentMethod;
        } catch (error) {
            logger.error('Error adjuntando payment method', { error: error.message });
            throw error;
        }
    }

    /**
     * Crear Payment Intent (cobro único)
     *
     * @param {Object} data - Datos del pago
     * @returns {Promise<Object>} - Payment Intent
     */
    async crearPaymentIntent(data) {
        if (!this.isEnabled()) {
            throw new Error('Stripe no está configurado');
        }

        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: data.amount, // En centavos
                currency: data.currency || 'mxn',
                customer: data.customer,
                payment_method: data.payment_method,
                off_session: data.off_session || false,
                confirm: data.confirm || false,
                metadata: data.metadata || {},
                description: data.description
            });

            logger.info(`PaymentIntent creado: ${paymentIntent.id}`);

            return paymentIntent;
        } catch (error) {
            logger.error('Error creando PaymentIntent', { error: error.message });
            throw error;
        }
    }

    /**
     * Confirmar Payment Intent
     *
     * @param {string} paymentIntentId - ID del Payment Intent
     * @returns {Promise<Object>} - Payment Intent confirmado
     */
    async confirmarPaymentIntent(paymentIntentId) {
        if (!this.isEnabled()) {
            throw new Error('Stripe no está configurado');
        }

        try {
            const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);

            logger.info(`PaymentIntent confirmado: ${paymentIntentId}`);

            return paymentIntent;
        } catch (error) {
            logger.error('Error confirmando PaymentIntent', { error: error.message });
            throw error;
        }
    }

    /**
     * Obtener Payment Intent
     *
     * @param {string} paymentIntentId - ID del Payment Intent
     * @returns {Promise<Object>} - Payment Intent
     */
    async obtenerPaymentIntent(paymentIntentId) {
        if (!this.isEnabled()) {
            throw new Error('Stripe no está configurado');
        }

        try {
            return await this.stripe.paymentIntents.retrieve(paymentIntentId);
        } catch (error) {
            logger.error('Error obteniendo PaymentIntent', { error: error.message });
            throw error;
        }
    }

    /**
     * Crear reembolso
     *
     * @param {Object} data - Datos del reembolso
     * @returns {Promise<Object>} - Refund de Stripe
     */
    async crearReembolso(data) {
        if (!this.isEnabled()) {
            throw new Error('Stripe no está configurado');
        }

        try {
            const refund = await this.stripe.refunds.create({
                payment_intent: data.payment_intent_id,
                amount: data.amount, // En centavos (opcional, refund total si se omite)
                reason: data.reason || 'requested_by_customer',
                metadata: data.metadata || {}
            });

            logger.info(`Reembolso creado: ${refund.id}`);

            return refund;
        } catch (error) {
            logger.error('Error creando reembolso', { error: error.message });
            throw error;
        }
    }

    /**
     * Validar webhook de Stripe usando HMAC
     *
     * @param {string|Buffer} payload - Payload del webhook (raw body)
     * @param {string} signature - Header stripe-signature
     * @returns {Object} - Evento validado
     */
    validarWebhook(payload, signature) {
        if (!this.isEnabled()) {
            throw new Error('Stripe no está configurado');
        }

        if (!this.webhookSecret) {
            throw new Error('STRIPE_WEBHOOK_SECRET no configurado');
        }

        try {
            const event = this.stripe.webhooks.constructEvent(
                payload,
                signature,
                this.webhookSecret
            );

            logger.info(`Webhook Stripe validado: ${event.type}`);

            return event;
        } catch (error) {
            logger.error('Error validando webhook Stripe', { error: error.message });
            throw new Error(`Webhook signature verification failed: ${error.message}`);
        }
    }

    /**
     * Obtener lista de payment methods de un cliente
     *
     * @param {string} customerId - ID del customer
     * @returns {Promise<Array>} - Lista de payment methods
     */
    async listarMetodosPago(customerId) {
        if (!this.isEnabled()) {
            throw new Error('Stripe no está configurado');
        }

        try {
            const paymentMethods = await this.stripe.paymentMethods.list({
                customer: customerId,
                type: 'card'
            });

            return paymentMethods.data;
        } catch (error) {
            logger.error('Error listando payment methods', { error: error.message });
            throw error;
        }
    }

    /**
     * Desvincular payment method de cliente
     *
     * @param {string} paymentMethodId - ID del payment method
     * @returns {Promise<Object>} - Payment Method desvinculado
     */
    async desvincularMetodoPago(paymentMethodId) {
        if (!this.isEnabled()) {
            throw new Error('Stripe no está configurado');
        }

        try {
            const paymentMethod = await this.stripe.paymentMethods.detach(paymentMethodId);

            logger.info(`Payment Method ${paymentMethodId} desvinculado`);

            return paymentMethod;
        } catch (error) {
            logger.error('Error desvinculando payment method', { error: error.message });
            throw error;
        }
    }
}

// Exportar instancia singleton
module.exports = new StripeService();

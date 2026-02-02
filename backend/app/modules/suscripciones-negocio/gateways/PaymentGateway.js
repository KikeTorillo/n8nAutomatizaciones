/**
 * ====================================================================
 * PAYMENT GATEWAY - INTERFAZ BASE ABSTRACTA
 * ====================================================================
 * Define la interfaz que deben implementar todos los gateways de pago
 * (MercadoPago, Stripe, etc.) para garantizar consistencia.
 *
 * PATRÓN: Strategy + Adapter
 * - Strategy: Permite intercambiar gateways en runtime
 * - Adapter: Normaliza las diferencias entre APIs de gateways
 *
 * USO:
 * ```javascript
 * const gateway = await GatewayFactory.getGateway(organizacionId);
 * const result = await gateway.createSubscription(params);
 * ```
 *
 * @module suscripciones-negocio/gateways/PaymentGateway
 * @version 1.0.0
 * @date Febrero 2026
 */

/**
 * Interfaz base abstracta para gateways de pago
 * @abstract
 */
class PaymentGateway {

    /**
     * @param {number} organizacionId - ID de la organización
     */
    constructor(organizacionId) {
        if (new.target === PaymentGateway) {
            throw new Error('PaymentGateway es una clase abstracta y no puede ser instanciada directamente');
        }
        this.organizacionId = organizacionId;
    }

    // ====================================================================
    // IDENTIFICACIÓN DEL GATEWAY
    // ====================================================================

    /**
     * Obtener nombre del gateway
     * @returns {string} 'mercadopago' | 'stripe'
     * @abstract
     */
    getGatewayName() {
        throw new Error('Método abstracto getGatewayName() debe ser implementado');
    }

    /**
     * Verificar si está en modo sandbox/test
     * @returns {boolean}
     * @abstract
     */
    isSandbox() {
        throw new Error('Método abstracto isSandbox() debe ser implementado');
    }

    /**
     * Obtener el entorno como string
     * @returns {string} 'sandbox' | 'production'
     */
    getEnvironment() {
        return this.isSandbox() ? 'sandbox' : 'production';
    }

    // ====================================================================
    // SUSCRIPCIONES
    // ====================================================================

    /**
     * Crear una suscripción en el gateway
     *
     * @param {Object} params - Parámetros de la suscripción
     * @param {string} params.nombre - Nombre/descripción de la suscripción
     * @param {number} params.precio - Precio a cobrar
     * @param {string} [params.moneda='MXN'] - Código de moneda (ISO 4217)
     * @param {string} params.email - Email del pagador
     * @param {string} params.returnUrl - URL de retorno después del pago
     * @param {string} params.externalReference - Referencia externa para tracking
     * @returns {Promise<SubscriptionResult>}
     * @abstract
     *
     * @typedef {Object} SubscriptionResult
     * @property {string} subscriptionId - ID de la suscripción en el gateway
     * @property {string|null} checkoutUrl - URL para completar el pago (init_point)
     * @property {string} status - Estado inicial de la suscripción
     * @property {Object} [raw] - Respuesta completa del gateway (para debugging)
     */
    async createSubscription(params) {
        throw new Error('Método abstracto createSubscription() debe ser implementado');
    }

    /**
     * Obtener información de una suscripción
     *
     * @param {string} subscriptionId - ID de la suscripción en el gateway
     * @returns {Promise<SubscriptionDetails>}
     * @abstract
     *
     * @typedef {Object} SubscriptionDetails
     * @property {string} subscriptionId - ID en el gateway
     * @property {string} status - Estado ('pending'|'authorized'|'paused'|'cancelled')
     * @property {string} payerEmail - Email del pagador
     * @property {number} amount - Monto de cobro
     * @property {string} currency - Moneda
     * @property {Date|null} nextBillingDate - Fecha del próximo cobro
     * @property {Object} [raw] - Respuesta completa del gateway
     */
    async getSubscription(subscriptionId) {
        throw new Error('Método abstracto getSubscription() debe ser implementado');
    }

    /**
     * Actualizar monto de una suscripción (para seat-based billing)
     *
     * @param {string} subscriptionId - ID de la suscripción
     * @param {number} amount - Nuevo monto a cobrar
     * @param {string} [currency='MXN'] - Moneda
     * @returns {Promise<SubscriptionDetails>}
     * @abstract
     */
    async updateSubscriptionAmount(subscriptionId, amount, currency = 'MXN') {
        throw new Error('Método abstracto updateSubscriptionAmount() debe ser implementado');
    }

    /**
     * Cancelar una suscripción
     *
     * @param {string} subscriptionId - ID de la suscripción
     * @returns {Promise<SubscriptionDetails>}
     * @abstract
     */
    async cancelSubscription(subscriptionId) {
        throw new Error('Método abstracto cancelSubscription() debe ser implementado');
    }

    /**
     * Pausar una suscripción
     *
     * @param {string} subscriptionId - ID de la suscripción
     * @returns {Promise<SubscriptionDetails>}
     * @abstract
     */
    async pauseSubscription(subscriptionId) {
        throw new Error('Método abstracto pauseSubscription() debe ser implementado');
    }

    /**
     * Reanudar una suscripción pausada
     *
     * @param {string} subscriptionId - ID de la suscripción
     * @returns {Promise<SubscriptionDetails>}
     * @abstract
     */
    async resumeSubscription(subscriptionId) {
        throw new Error('Método abstracto resumeSubscription() debe ser implementado');
    }

    // ====================================================================
    // PAGOS
    // ====================================================================

    /**
     * Obtener información de un pago
     *
     * @param {string} paymentId - ID del pago en el gateway
     * @returns {Promise<PaymentDetails>}
     * @abstract
     *
     * @typedef {Object} PaymentDetails
     * @property {string} paymentId - ID del pago
     * @property {string} status - Estado ('pending'|'approved'|'rejected'|'cancelled')
     * @property {string} statusDetail - Detalle del estado
     * @property {number} amount - Monto del pago
     * @property {string} currency - Moneda
     * @property {string} payerEmail - Email del pagador
     * @property {Date} createdAt - Fecha de creación
     * @property {Date|null} approvedAt - Fecha de aprobación
     * @property {Object} [raw] - Respuesta completa del gateway
     */
    async getPayment(paymentId) {
        throw new Error('Método abstracto getPayment() debe ser implementado');
    }

    /**
     * Obtener pago autorizado de suscripción
     * NOTA: Específico de MercadoPago (preapproval), retorna null en otros gateways
     *
     * @param {string} authorizedPaymentId - ID del pago autorizado
     * @returns {Promise<AuthorizedPaymentDetails|null>}
     *
     * @typedef {Object} AuthorizedPaymentDetails
     * @property {string} authorizedPaymentId - ID del pago autorizado
     * @property {string} subscriptionId - ID de la suscripción (preapproval_id)
     * @property {string} status - Estado del pago
     * @property {number} amount - Monto
     * @property {string} currency - Moneda
     * @property {Object} [raw] - Respuesta completa
     */
    async getAuthorizedPayment(authorizedPaymentId) {
        // Implementación por defecto: retorna null (no todos los gateways lo soportan)
        return null;
    }

    // ====================================================================
    // WEBHOOKS
    // ====================================================================

    /**
     * Validar firma de webhook (CRÍTICO PARA SEGURIDAD)
     *
     * @param {Object} params - Parámetros de validación
     * @param {string} params.signature - Header de firma del webhook
     * @param {string} params.requestId - ID del request (MercadoPago: x-request-id)
     * @param {string} params.dataId - ID del recurso notificado
     * @param {string|Buffer} [params.payload] - Payload del webhook (para Stripe)
     * @returns {boolean} true si la firma es válida
     * @abstract
     */
    validateWebhook(params) {
        throw new Error('Método abstracto validateWebhook() debe ser implementado');
    }

    /**
     * Normalizar evento de webhook a formato estándar
     *
     * @param {Object} rawEvent - Evento crudo del gateway
     * @param {string} rawEvent.type - Tipo de evento original
     * @param {string} rawEvent.action - Acción (MercadoPago)
     * @param {Object} rawEvent.data - Datos del evento
     * @returns {NormalizedEvent}
     * @abstract
     */
    normalizeEvent(rawEvent) {
        throw new Error('Método abstracto normalizeEvent() debe ser implementado');
    }

    // ====================================================================
    // VERIFICACIÓN
    // ====================================================================

    /**
     * Verificar conectividad con el gateway
     *
     * @returns {Promise<ConnectivityResult>}
     *
     * @typedef {Object} ConnectivityResult
     * @property {boolean} success - true si la conexión es exitosa
     * @property {string} message - Mensaje descriptivo
     * @property {Object} [details] - Detalles adicionales (userId, email, etc.)
     */
    async verifyConnectivity() {
        throw new Error('Método abstracto verifyConnectivity() debe ser implementado');
    }

    /**
     * Obtener email de pagador de prueba (para sandbox)
     * @returns {string|null}
     */
    getTestPayerEmail() {
        return null;
    }
}

module.exports = PaymentGateway;

/**
 * ====================================================================
 * SERVICE: MERCADOPAGO (SUSCRIPCIONES)
 * ====================================================================
 * Wrapper del servicio MercadoPago global para el módulo de suscripciones.
 * Adapta las funcionalidades del servicio principal para cobros automáticos.
 *
 * @module suscripciones-negocio/services/mercadopago
 */

const MercadoPagoGlobal = require('../../../services/mercadopago.service');
const logger = require('../../../utils/logger');

class MercadoPagoSuscripcionesService {

    /**
     * Crear pago recurrente con card token
     *
     * @param {Object} data - Datos del pago
     * @returns {Promise<Object>} - Pago de MercadoPago
     */
    async crearPago(data) {
        try {
            // Asegurarse de que el servicio global esté inicializado
            MercadoPagoGlobal._ensureInitialized();

            logger.info('Creando pago recurrente MercadoPago', {
                monto: data.transaction_amount,
                email: data.payer?.email
            });

            const { MercadoPagoConfig, Payment } = require('mercadopago');
            const config = require('../../../config/mercadopago');

            const client = new MercadoPagoConfig({
                accessToken: config.accessToken
            });

            const payment = new Payment(client);

            const pagoData = {
                transaction_amount: data.transaction_amount,
                token: data.token,
                description: data.description,
                installments: data.installments || 1,
                payment_method_id: data.payment_method_id,
                payer: {
                    email: data.payer.email
                },
                metadata: data.metadata || {}
            };

            const response = await payment.create({ body: pagoData });

            logger.info('Pago MercadoPago creado', {
                pago_id: response.id,
                status: response.status,
                status_detail: response.status_detail
            });

            return response;

        } catch (error) {
            logger.error('Error creando pago MercadoPago', { error: error.message });
            throw error;
        }
    }

    /**
     * Obtener información de un pago
     *
     * @param {string} paymentId - ID del pago
     * @returns {Promise<Object>} - Datos del pago
     */
    async obtenerPago(paymentId) {
        return await MercadoPagoGlobal.obtenerPago(paymentId);
    }

    /**
     * Validar webhook de MercadoPago
     *
     * @param {string} signature - Header x-signature
     * @param {string} requestId - Header x-request-id
     * @param {string} dataId - ID del recurso notificado
     * @returns {boolean} - true si es válido
     */
    validarWebhook(signature, requestId, dataId) {
        return MercadoPagoGlobal.validarWebhook(signature, requestId, dataId);
    }

    /**
     * Crear suscripción recurrente con init_point
     *
     * @param {Object} params - Parámetros de la suscripción
     * @returns {Promise<Object>} - {id, status, init_point}
     */
    async crearSuscripcionRecurrente(params) {
        return await MercadoPagoGlobal.crearSuscripcionConInitPoint(params);
    }

    /**
     * Obtener suscripción por ID
     *
     * @param {string} subscriptionId - ID de la suscripción
     * @returns {Promise<Object>} - Datos de la suscripción
     */
    async obtenerSuscripcion(subscriptionId) {
        return await MercadoPagoGlobal.obtenerSuscripcion(subscriptionId);
    }

    /**
     * Cancelar suscripción
     *
     * @param {string} subscriptionId - ID de la suscripción
     * @returns {Promise<Object>} - Suscripción cancelada
     */
    async cancelarSuscripcion(subscriptionId) {
        return await MercadoPagoGlobal.cancelarSuscripcion(subscriptionId);
    }

    /**
     * Pausar suscripción
     *
     * @param {string} subscriptionId - ID de la suscripción
     * @returns {Promise<Object>} - Suscripción pausada
     */
    async pausarSuscripcion(subscriptionId) {
        return await MercadoPagoGlobal.pausarSuscripcion(subscriptionId);
    }
}

// Exportar instancia singleton
module.exports = new MercadoPagoSuscripcionesService();

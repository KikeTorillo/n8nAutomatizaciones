/**
 * ====================================================================
 * SERVICE: MERCADOPAGO (SUSCRIPCIONES) - MULTI-TENANT
 * ====================================================================
 * Wrapper del servicio MercadoPago global para el módulo de suscripciones.
 * Adapta las funcionalidades del servicio principal para cobros automáticos.
 *
 * MULTI-TENANT:
 * - Cada organización puede tener sus propias credenciales de MercadoPago
 * - Si no tiene, usa las credenciales globales (env vars)
 *
 * @module suscripciones-negocio/services/mercadopago
 * @version 2.0.0 - Multi-tenant support
 * @date Enero 2026
 */

const MercadoPagoService = require('../../../services/mercadopago.service');
const logger = require('../../../utils/logger');

class MercadoPagoSuscripcionesService {

    /**
     * Crear pago recurrente con card token
     *
     * @param {Object} data - Datos del pago
     * @param {number} organizacionId - ID de la organización (para multi-tenant)
     * @returns {Promise<Object>} - Pago de MercadoPago
     */
    async crearPago(data, organizacionId = null) {
        try {
            // Obtener instancia multi-tenant
            const mpService = organizacionId
                ? await MercadoPagoService.getForOrganization(organizacionId)
                : MercadoPagoService.getGlobalInstance();

            mpService._ensureInitialized();

            logger.info('Creando pago recurrente MercadoPago', {
                monto: data.transaction_amount,
                email: data.payer?.email,
                organizacionId
            });

            const { Payment } = require('mercadopago');
            const payment = new Payment(mpService.client);

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
                status_detail: response.status_detail,
                organizacionId
            });

            return response;

        } catch (error) {
            logger.error('Error creando pago MercadoPago', {
                error: error.message,
                organizacionId
            });
            throw error;
        }
    }

    /**
     * Obtener información de un pago
     *
     * @param {string} paymentId - ID del pago
     * @param {number} organizacionId - ID de la organización (para multi-tenant)
     * @returns {Promise<Object>} - Datos del pago
     */
    async obtenerPago(paymentId, organizacionId = null) {
        const mpService = organizacionId
            ? await MercadoPagoService.getForOrganization(organizacionId)
            : MercadoPagoService.getGlobalInstance();

        return await mpService.obtenerPago(paymentId);
    }

    /**
     * Validar webhook de MercadoPago
     *
     * @param {string} signature - Header x-signature
     * @param {string} requestId - Header x-request-id
     * @param {string} dataId - ID del recurso notificado
     * @param {number} organizacionId - ID de la organización (para multi-tenant)
     * @returns {boolean} - true si es válido
     */
    validarWebhook(signature, requestId, dataId, organizacionId = null) {
        // Para webhooks, usamos la instancia global por defecto
        // ya que MercadoPago no envía el organizacionId en el webhook
        const mpService = MercadoPagoService.getGlobalInstance();
        return mpService.validarWebhook(signature, requestId, dataId);
    }

    /**
     * Crear suscripción recurrente con init_point
     *
     * @param {Object} params - Parámetros de la suscripción
     * @param {number} organizacionId - ID de la organización (para multi-tenant)
     * @returns {Promise<Object>} - {id, status, init_point}
     */
    async crearSuscripcionRecurrente(params, organizacionId = null) {
        const mpService = organizacionId
            ? await MercadoPagoService.getForOrganization(organizacionId)
            : MercadoPagoService.getGlobalInstance();

        return await mpService.crearSuscripcionConInitPoint(params);
    }

    /**
     * Obtener suscripción por ID
     *
     * @param {string} subscriptionId - ID de la suscripción
     * @param {number} organizacionId - ID de la organización (para multi-tenant)
     * @returns {Promise<Object>} - Datos de la suscripción
     */
    async obtenerSuscripcion(subscriptionId, organizacionId = null) {
        const mpService = organizacionId
            ? await MercadoPagoService.getForOrganization(organizacionId)
            : MercadoPagoService.getGlobalInstance();

        return await mpService.obtenerSuscripcion(subscriptionId);
    }

    /**
     * Cancelar suscripción
     *
     * @param {string} subscriptionId - ID de la suscripción
     * @param {number} organizacionId - ID de la organización (para multi-tenant)
     * @returns {Promise<Object>} - Suscripción cancelada
     */
    async cancelarSuscripcion(subscriptionId, organizacionId = null) {
        const mpService = organizacionId
            ? await MercadoPagoService.getForOrganization(organizacionId)
            : MercadoPagoService.getGlobalInstance();

        return await mpService.cancelarSuscripcion(subscriptionId);
    }

    /**
     * Pausar suscripción
     *
     * @param {string} subscriptionId - ID de la suscripción
     * @param {number} organizacionId - ID de la organización (para multi-tenant)
     * @returns {Promise<Object>} - Suscripción pausada
     */
    async pausarSuscripcion(subscriptionId, organizacionId = null) {
        const mpService = organizacionId
            ? await MercadoPagoService.getForOrganization(organizacionId)
            : MercadoPagoService.getGlobalInstance();

        return await mpService.pausarSuscripcion(subscriptionId);
    }

    /**
     * Verificar conectividad con credenciales de una organización
     *
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} - {success, message, details}
     */
    async verificarConectividad(organizacionId) {
        const mpService = await MercadoPagoService.getForOrganization(organizacionId);
        return await mpService.verificarConectividad();
    }
}

// Exportar instancia singleton
module.exports = new MercadoPagoSuscripcionesService();

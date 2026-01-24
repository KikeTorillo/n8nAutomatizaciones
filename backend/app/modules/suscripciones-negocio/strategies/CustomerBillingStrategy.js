/**
 * ====================================================================
 * CUSTOMER BILLING STRATEGY
 * ====================================================================
 * Estrategia para Customer Billing.
 *
 * En este modelo:
 * - La organización del usuario es el VENDOR (vendedor)
 * - Los clientes del CRM de la organización son quienes se suscriben
 * - La organización debe tener un conector de pago configurado
 *
 * Caso de uso:
 * - Un gimnasio (org) vende suscripciones a sus clientes
 * - Un SaaS (org) cobra a sus usuarios finales
 *
 * NOTA: Esta estrategia está PREPARADA pero NO ACTIVA.
 * Se activará cuando se implemente el endpoint correspondiente.
 *
 * @module strategies/CustomerBillingStrategy
 * @author Nexo Team
 * @version 1.0.0
 * @date Enero 2026
 */

const BillingStrategy = require('./BillingStrategy');
const { ErrorHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

class CustomerBillingStrategy extends BillingStrategy {

    /**
     * El vendor es la organización del usuario
     *
     * @param {Object} context - Contexto del checkout
     * @param {number} context.organizacionId - ID de la organización del usuario
     * @returns {number} ID de la organización (vendor)
     */
    getVendorId(context) {
        return context.organizacionId;
    }

    /**
     * Obtiene el cliente_id proporcionado en el request
     *
     * @param {Object} context - Contexto del checkout
     * @param {number} context.clienteId - ID del cliente
     * @param {number} context.organizacionId - ID de la organización
     * @returns {Promise<number>} ID del cliente
     * @throws {Error} Si no se proporciona cliente_id o no existe
     */
    async getClienteId(context) {
        const { clienteId, organizacionId } = context;

        if (!clienteId) {
            ErrorHelper.throwValidation(
                'Se requiere cliente_id para Customer Billing. ' +
                'Especifica el cliente que se está suscribiendo.'
            );
        }

        // Verificar que el cliente existe en la organización
        // Lazy load para evitar dependencias circulares
        const ClienteModel = require('../../clientes/models/cliente.model');
        const cliente = await ClienteModel.buscarPorId(clienteId, organizacionId);

        if (!cliente) {
            ErrorHelper.throwNotFound('Cliente');
        }

        logger.debug(`[CustomerBilling] Cliente ${cliente.id} validado en org ${organizacionId}`);
        return cliente.id;
    }

    /**
     * Valida que la organización puede usar Customer Billing
     *
     * @param {Object} context - Contexto del checkout
     * @param {number} context.clienteId - ID del cliente
     * @param {number} context.organizacionId - ID de la organización
     * @throws {Error} Si no se proporciona cliente_id
     */
    async validateSubscriber(context) {
        const { clienteId } = context;

        if (!clienteId) {
            ErrorHelper.throwValidation(
                'Customer Billing requiere especificar el cliente que se suscribe. ' +
                'Proporciona el campo cliente_id.'
            );
        }

        // La validación del conector de pago se hace en MercadoPagoService.getForOrganization()
        // No es necesario duplicarla aquí
    }

    /**
     * @returns {string} 'customer'
     */
    getBillingType() {
        return 'customer';
    }

    /**
     * En Customer Billing tampoco hay suscriptor externo, siempre hay cliente_id
     *
     * @returns {null}
     */
    buildSuscriptorExterno() {
        return null;
    }
}

module.exports = CustomerBillingStrategy;

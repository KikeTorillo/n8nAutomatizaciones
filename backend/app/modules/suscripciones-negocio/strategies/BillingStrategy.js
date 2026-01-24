/**
 * ====================================================================
 * BILLING STRATEGY - INTERFACE BASE
 * ====================================================================
 * Clase base abstracta para estrategias de billing.
 * Define el contrato que deben implementar todas las estrategias.
 *
 * @module strategies/BillingStrategy
 * @author Nexo Team
 * @version 1.0.0
 * @date Enero 2026
 */

class BillingStrategy {

    /**
     * Obtiene el ID de la organización vendedora
     *
     * @param {Object} context - Contexto del checkout
     * @param {number} context.organizacionId - ID de la organización del usuario
     * @returns {number} ID de la organización vendedora
     * @throws {Error} Si no está implementado
     */
    getVendorId(context) {
        throw new Error('Method getVendorId() must be implemented');
    }

    /**
     * Obtiene el ID del cliente que se suscribe
     *
     * @param {Object} context - Contexto del checkout
     * @param {number} context.organizacionId - ID de la organización del usuario
     * @param {number} [context.clienteId] - ID del cliente (para CustomerBilling)
     * @returns {Promise<number>} ID del cliente
     * @throws {Error} Si no está implementado o no se encuentra el cliente
     */
    async getClienteId(context) {
        throw new Error('Method getClienteId() must be implemented');
    }

    /**
     * Valida que el suscriptor puede usar este flujo de billing
     *
     * @param {Object} context - Contexto del checkout
     * @param {number} context.organizacionId - ID de la organización del usuario
     * @param {number} [context.clienteId] - ID del cliente
     * @throws {Error} Si la validación falla
     */
    async validateSubscriber(context) {
        throw new Error('Method validateSubscriber() must be implemented');
    }

    /**
     * Obtiene el tipo de billing para logging y debugging
     *
     * @returns {string} Tipo de billing ('platform' o 'customer')
     */
    getBillingType() {
        throw new Error('Method getBillingType() must be implemented');
    }

    /**
     * Construye los datos del suscriptor externo (si aplica)
     *
     * @param {Object} context - Contexto del checkout
     * @param {Object} context.user - Usuario autenticado
     * @returns {Object|null} Datos del suscriptor externo o null
     */
    buildSuscriptorExterno(context) {
        // Por defecto no hay suscriptor externo cuando hay cliente_id
        return null;
    }
}

module.exports = BillingStrategy;

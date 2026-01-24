/**
 * ====================================================================
 * BILLING STRATEGIES - FACTORY & EXPORTS
 * ====================================================================
 * Factory para crear la estrategia de billing correcta según el contexto.
 *
 * Actualmente soporta:
 * - Platform Billing: Nexo Team → Organizaciones (dogfooding)
 * - Customer Billing: Organización → Sus Clientes (preparado, no activo)
 *
 * @module strategies/index
 * @author Nexo Team
 * @version 1.0.0
 * @date Enero 2026
 */

const PlatformBillingStrategy = require('./PlatformBillingStrategy');
const CustomerBillingStrategy = require('./CustomerBillingStrategy');

// Singleton instances para evitar crear objetos repetidos
const platformStrategy = new PlatformBillingStrategy();
const customerStrategy = new CustomerBillingStrategy();

/**
 * Factory para crear la estrategia de billing correcta
 *
 * Por defecto usa Platform Billing (dogfooding).
 * Customer Billing se activa explícitamente con es_venta_propia = true.
 *
 * @param {Object} context - Contexto del checkout
 * @param {boolean} [context.esVentaPropia=false] - Si true, usa CustomerBilling
 * @param {number} [context.clienteId] - ID del cliente (requerido para CustomerBilling)
 * @returns {BillingStrategy} Instancia de la estrategia correcta
 *
 * @example
 * // Platform Billing (default)
 * const strategy = createBillingStrategy({ organizacionId: 5 });
 *
 * @example
 * // Customer Billing (explícito)
 * const strategy = createBillingStrategy({
 *     organizacionId: 5,
 *     esVentaPropia: true,
 *     clienteId: 123
 * });
 */
function createBillingStrategy(context = {}) {
    const { esVentaPropia = false, clienteId } = context;

    // Customer Billing: cuando es venta propia Y hay cliente_id
    if (esVentaPropia && clienteId) {
        return customerStrategy;
    }

    // Default: Platform Billing (Nexo Team es el vendor)
    return platformStrategy;
}

/**
 * Determina el tipo de billing basado en el contexto
 * Útil para logging y debugging sin crear la estrategia
 *
 * @param {Object} context - Contexto del checkout
 * @returns {string} 'platform' o 'customer'
 */
function getBillingTypeFromContext(context = {}) {
    const { esVentaPropia = false, clienteId } = context;
    return (esVentaPropia && clienteId) ? 'customer' : 'platform';
}

module.exports = {
    createBillingStrategy,
    getBillingTypeFromContext,
    PlatformBillingStrategy,
    CustomerBillingStrategy,
};

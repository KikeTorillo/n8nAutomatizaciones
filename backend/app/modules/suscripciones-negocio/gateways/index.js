/**
 * ====================================================================
 * GATEWAY FACTORY - PUNTO DE ENTRADA PARA GATEWAYS DE PAGO
 * ====================================================================
 * Factory centralizado para obtener instancias de gateways de pago.
 * Implementa cache por organización+gateway con TTL de 5 minutos.
 *
 * USO:
 * ```javascript
 * const { GatewayFactory } = require('./gateways');
 *
 * // Obtener gateway por defecto de la organización
 * const gateway = await GatewayFactory.getGateway(organizacionId);
 *
 * // Obtener gateway específico
 * const mpGateway = await GatewayFactory.getGateway(organizacionId, 'mercadopago');
 *
 * // Limpiar cache (cuando se actualizan credenciales)
 * GatewayFactory.clearCache(organizacionId);
 * ```
 *
 * @module suscripciones-negocio/gateways
 * @version 1.0.0
 * @date Febrero 2026
 */

const MercadoPagoGateway = require('./MercadoPagoGateway');
const StripeGateway = require('./StripeGateway');
const PaymentGateway = require('./PaymentGateway');
const { NormalizedEvent, EventTypes, SubscriptionStatusMap, PaymentStatusMap } = require('./events/NormalizedEvent');
const logger = require('../../../utils/logger');

// Cache de instancias de gateways
// Estructura: Map<string, { instance: PaymentGateway, timestamp: number }>
const gatewayCache = new Map();

// TTL del cache: 5 minutos
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Gateways soportados
 * @type {Object<string, typeof PaymentGateway>}
 */
const SUPPORTED_GATEWAYS = {
    mercadopago: MercadoPagoGateway,
    stripe: StripeGateway
};

/**
 * Gateway por defecto cuando no se especifica
 */
const DEFAULT_GATEWAY = 'mercadopago';

/**
 * Factory para crear y cachear instancias de gateways de pago
 */
class GatewayFactory {

    /**
     * Obtener gateway para una organización
     *
     * @param {number} organizacionId - ID de la organización
     * @param {string} [gatewayName] - Nombre del gateway ('mercadopago'|'stripe')
     *                                 Si no se especifica, usa el gateway por defecto
     * @returns {Promise<PaymentGateway>}
     * @throws {Error} Si el gateway no está soportado o no hay credenciales
     */
    static async getGateway(organizacionId, gatewayName = null) {
        if (!organizacionId) {
            throw new Error('GatewayFactory: organizacionId es requerido');
        }

        // Determinar gateway a usar
        const gateway = gatewayName || DEFAULT_GATEWAY;

        // Validar que el gateway está soportado
        if (!SUPPORTED_GATEWAYS[gateway]) {
            throw new Error(
                `Gateway '${gateway}' no soportado. ` +
                `Gateways disponibles: ${Object.keys(SUPPORTED_GATEWAYS).join(', ')}`
            );
        }

        // Generar clave de cache
        const cacheKey = `${organizacionId}:${gateway}`;

        // Verificar cache
        const cached = gatewayCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
            logger.debug('[GatewayFactory] Usando gateway cacheado', {
                organizacionId,
                gateway,
                environment: cached.instance.getEnvironment()
            });
            return cached.instance;
        }

        // Crear nueva instancia
        logger.info('[GatewayFactory] Creando nueva instancia de gateway', {
            organizacionId,
            gateway
        });

        const GatewayClass = SUPPORTED_GATEWAYS[gateway];
        const instance = await GatewayClass.create(organizacionId);

        // Guardar en cache
        gatewayCache.set(cacheKey, {
            instance,
            timestamp: Date.now()
        });

        return instance;
    }

    /**
     * Obtener gateway de MercadoPago (atajo)
     *
     * @param {number} organizacionId
     * @returns {Promise<MercadoPagoGateway>}
     */
    static async getMercadoPago(organizacionId) {
        return await this.getGateway(organizacionId, 'mercadopago');
    }

    /**
     * Obtener gateway de Stripe (atajo)
     *
     * @param {number} organizacionId
     * @returns {Promise<StripeGateway>}
     */
    static async getStripe(organizacionId) {
        return await this.getGateway(organizacionId, 'stripe');
    }

    /**
     * Limpiar cache de gateways
     *
     * @param {number} [organizacionId] - Si se especifica, solo limpia esa organización
     * @param {string} [gatewayName] - Si se especifica, solo limpia ese gateway
     */
    static clearCache(organizacionId = null, gatewayName = null) {
        if (organizacionId && gatewayName) {
            // Limpiar específico
            const cacheKey = `${organizacionId}:${gatewayName}`;
            gatewayCache.delete(cacheKey);
            logger.debug('[GatewayFactory] Cache limpiado', { organizacionId, gatewayName });

        } else if (organizacionId) {
            // Limpiar todos los gateways de una organización
            for (const key of gatewayCache.keys()) {
                if (key.startsWith(`${organizacionId}:`)) {
                    gatewayCache.delete(key);
                }
            }
            logger.debug('[GatewayFactory] Cache limpiado para organización', { organizacionId });

        } else {
            // Limpiar todo el cache
            gatewayCache.clear();
            logger.debug('[GatewayFactory] Cache global limpiado');
        }
    }

    /**
     * Obtener estadísticas del cache
     * @returns {Object}
     */
    static getCacheStats() {
        const now = Date.now();
        let active = 0;
        let expired = 0;

        for (const [key, value] of gatewayCache.entries()) {
            if ((now - value.timestamp) < CACHE_TTL) {
                active++;
            } else {
                expired++;
            }
        }

        return {
            total: gatewayCache.size,
            active,
            expired,
            ttlMs: CACHE_TTL
        };
    }

    /**
     * Verificar si un gateway está disponible para una organización
     * (tiene credenciales configuradas)
     *
     * @param {number} organizacionId
     * @param {string} gatewayName
     * @returns {Promise<boolean>}
     */
    static async isGatewayAvailable(organizacionId, gatewayName) {
        try {
            const gateway = await this.getGateway(organizacionId, gatewayName);
            const connectivity = await gateway.verifyConnectivity();
            return connectivity.success;
        } catch (error) {
            logger.debug('[GatewayFactory] Gateway no disponible', {
                organizacionId,
                gatewayName,
                error: error.message
            });
            return false;
        }
    }

    /**
     * Obtener lista de gateways soportados
     * @returns {string[]}
     */
    static getSupportedGateways() {
        return Object.keys(SUPPORTED_GATEWAYS);
    }

    /**
     * Obtener gateway por defecto
     * @returns {string}
     */
    static getDefaultGateway() {
        return DEFAULT_GATEWAY;
    }
}

// Exportar todo
module.exports = {
    GatewayFactory,
    PaymentGateway,
    MercadoPagoGateway,
    StripeGateway,
    NormalizedEvent,
    EventTypes,
    SubscriptionStatusMap,
    PaymentStatusMap
};

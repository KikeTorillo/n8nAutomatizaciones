/**
 * ====================================================================
 * PLATFORM BILLING STRATEGY
 * ====================================================================
 * Estrategia para Platform Billing (Dogfooding).
 *
 * En este modelo:
 * - Nexo Team (org 1) es el VENDOR (vendedor)
 * - Las organizaciones registradas son CLIENTES de Nexo Team
 * - Todas las suscripciones se crean en org 1 con cliente_id vinculado
 * - La vinculación es via clientes.organizacion_vinculada_id
 *
 * Flujo:
 * 1. Usuario de org X inicia checkout
 * 2. Se busca el cliente en Nexo Team que tiene organizacion_vinculada_id = X
 * 3. Se crea suscripción en Nexo Team con ese cliente_id
 *
 * @module strategies/PlatformBillingStrategy
 * @author Nexo Team
 * @version 1.0.0
 * @date Enero 2026
 */

const BillingStrategy = require('./BillingStrategy');
const DogfoodingService = require('../../../services/dogfoodingService');
const { NEXO_TEAM_ORG_ID } = require('../../../config/constants');
const { ErrorHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

class PlatformBillingStrategy extends BillingStrategy {

    /**
     * El vendor siempre es Nexo Team en Platform Billing
     *
     * @returns {number} ID de Nexo Team
     */
    getVendorId() {
        return NEXO_TEAM_ORG_ID;
    }

    /**
     * Busca el cliente en Nexo Team vinculado a la organización del usuario
     *
     * @param {Object} context - Contexto del checkout
     * @param {number} context.organizacionId - ID de la organización del usuario
     * @returns {Promise<number>} ID del cliente vinculado
     * @throws {Error} Si no se encuentra el cliente vinculado
     */
    async getClienteId(context) {
        const { organizacionId } = context;

        // Buscar el cliente en Nexo Team vinculado a esta organización
        const cliente = await DogfoodingService.buscarClienteVinculado(organizacionId);

        if (!cliente) {
            logger.error(`[PlatformBilling] No se encontró cliente vinculado para org ${organizacionId}`);
            ErrorHelper.throwValidation(
                'No se encontró tu organización como cliente de la plataforma. ' +
                'Esto puede ocurrir si tu cuenta fue creada antes del sistema de dogfooding. ' +
                'Por favor contacta soporte para vincular tu organización.'
            );
        }

        logger.debug(`[PlatformBilling] Cliente ${cliente.id} encontrado para org ${organizacionId}`);
        return cliente.id;
    }

    /**
     * Valida que la organización puede usar Platform Billing
     *
     * @param {Object} context - Contexto del checkout
     * @param {number} context.organizacionId - ID de la organización del usuario
     * @throws {Error} Si Nexo Team intenta suscribirse a sí misma
     */
    async validateSubscriber(context) {
        const { organizacionId } = context;

        // Nexo Team no puede suscribirse a sí misma
        if (organizacionId === NEXO_TEAM_ORG_ID) {
            ErrorHelper.throwValidation(
                'Nexo Team es la organización vendedora y no puede suscribirse a sus propios planes. ' +
                'Este flujo es para organizaciones clientes.'
            );
        }

        // Verificar que exista el cliente vinculado (fail-fast)
        const cliente = await DogfoodingService.buscarClienteVinculado(organizacionId);
        if (!cliente) {
            ErrorHelper.throwValidation(
                'Tu organización no está registrada como cliente de la plataforma. ' +
                'Por favor contacta soporte.'
            );
        }
    }

    /**
     * @returns {string} 'platform'
     */
    getBillingType() {
        return 'platform';
    }

    /**
     * En Platform Billing no hay suscriptor externo, siempre hay cliente_id
     *
     * @returns {null}
     */
    buildSuscriptorExterno() {
        return null;
    }
}

module.exports = PlatformBillingStrategy;

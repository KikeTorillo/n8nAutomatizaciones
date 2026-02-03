/**
 * @fileoverview Subscriber para eventos de dogfooding
 * @description Vincula organizaciones como clientes en Nexo Team
 * @version 1.0.0
 *
 * Este subscriber escucha 'auth:organizacion.creada' y:
 * - Crea la organización como cliente en la org principal (Nexo Team)
 * - Crea una suscripción trial para la nueva organización
 *
 * Es async y no bloquea el flujo principal (usa setImmediate internamente).
 */

const authEvents = require('../authEvents');
const logger = require('../../utils/logger');

/**
 * Registra el subscriber de dogfooding
 */
function register() {
    authEvents.on('auth:organizacion.creada', async (data) => {
        const { organizacion, usuario } = data;

        // Ejecutar de forma asíncrona para no bloquear
        setImmediate(async () => {
            try {
                // Importar dinámicamente para evitar dependencias circulares
                const DogfoodingService = require('../../services/dogfoodingService');

                await DogfoodingService.vincularOrganizacionComoCliente({
                    id: organizacion.id,
                    nombre_comercial: organizacion.nombre_comercial,
                    email_admin: usuario.email,
                    telefono: null,
                    razon_social: organizacion.nombre_comercial
                });

                logger.info('[DogfoodingSubscriber] Organización vinculada como cliente', {
                    organizacion_id: organizacion.id,
                    nombre: organizacion.nombre_comercial
                });

            } catch (error) {
                // No fallar el flujo principal si dogfooding falla
                logger.error('[DogfoodingSubscriber] Error vinculando organización:', {
                    error: error.message,
                    organizacion_id: organizacion.id
                });
            }
        });
    });

    logger.info('[DogfoodingSubscriber] Registrado correctamente');
}

module.exports = { register };

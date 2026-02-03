/**
 * @fileoverview Registro central de eventos y subscribers
 * @description Inicializa el sistema de eventos de la aplicación
 * @version 1.0.0
 *
 * Uso en app.js:
 *   require('./events').initialize();
 */

const logger = require('../utils/logger');

// Subscribers disponibles
const subscribers = {
    dogfooding: require('./subscribers/dogfoodingSubscriber'),
    inventario: require('./subscribers/inventarioSubscriber')
};

/**
 * Inicializa todos los subscribers de eventos
 *
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.dogfooding - Habilitar dogfooding subscriber (default: true)
 * @param {boolean} options.inventario - Habilitar inventario subscriber (default: true)
 */
function initialize(options = {}) {
    const {
        dogfooding = true,
        inventario = true
    } = options;

    logger.info('[Events] Inicializando sistema de eventos...');

    if (dogfooding) {
        subscribers.dogfooding.register();
    }

    if (inventario) {
        subscribers.inventario.register();
    }

    logger.info('[Events] Sistema de eventos inicializado');
}

module.exports = {
    initialize,
    // Re-export desde módulo auth
    authEvents: require('../modules/auth/events/authEvents')
};

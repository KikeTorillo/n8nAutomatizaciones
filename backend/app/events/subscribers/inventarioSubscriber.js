/**
 * @fileoverview Subscriber para crear rutas de operación de inventario
 * @description Crea rutas default cuando se crea una nueva organización
 * @version 1.0.0
 *
 * Este subscriber escucha 'auth:organizacion.creada' y:
 * - Crea las rutas de operación default para inventario (entrada, salida, transferencia, etc.)
 *
 * Es async y no bloquea el flujo principal.
 */

const authEvents = require('../authEvents');
const logger = require('../../utils/logger');

/**
 * Registra el subscriber de inventario
 */
function register() {
    authEvents.on('auth:organizacion.creada', async (data) => {
        const { organizacion, usuario } = data;

        // Ejecutar de forma asíncrona para no bloquear
        setImmediate(async () => {
            try {
                // Importar dinámicamente para evitar dependencias circulares
                const RutasOperacionModel = require('../../modules/inventario/models/rutas-operacion.model');

                await RutasOperacionModel.crearRutasDefault(organizacion.id, usuario.id);

                logger.info('[InventarioSubscriber] Rutas de operación creadas', {
                    organizacion_id: organizacion.id
                });

            } catch (error) {
                // No fallar el flujo principal si la creación falla
                // Las rutas se pueden crear manualmente después
                logger.warn('[InventarioSubscriber] Error creando rutas de operación:', {
                    error: error.message,
                    organizacion_id: organizacion.id
                });
            }
        });
    });

    logger.info('[InventarioSubscriber] Registrado correctamente');
}

module.exports = { register };

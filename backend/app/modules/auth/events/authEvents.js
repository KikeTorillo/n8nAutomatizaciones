/**
 * @fileoverview Event Emitter para eventos de autenticación
 * @description Sistema de eventos para desacoplar efectos secundarios
 * @version 1.0.0
 *
 * Eventos disponibles:
 * - auth:organizacion.creada - Cuando se crea una nueva organización (onboarding)
 * - auth:usuario.registrado - Cuando se registra un nuevo usuario
 * - auth:login.exitoso - Cuando un usuario hace login exitosamente
 * - auth:password.reset - Cuando se resetea una contraseña
 *
 * Uso:
 *   const authEvents = require('./events/authEvents');
 *
 *   // Emitir evento
 *   authEvents.emitOrganizacionCreada(organizacion, usuario);
 *
 *   // Suscribirse (en app.js o subscriber)
 *   authEvents.on('auth:organizacion.creada', async (data) => { ... });
 */

const EventEmitter = require('events');
const logger = require('../../../utils/logger');

class AuthEventEmitter extends EventEmitter {
    constructor() {
        super();
        // Aumentar límite de listeners para evitar warnings
        this.setMaxListeners(20);
    }

    /**
     * Emite evento cuando se crea una nueva organización
     *
     * @param {Object} organizacion - Datos de la organización creada
     * @param {number} organizacion.id - ID de la organización
     * @param {string} organizacion.codigo_tenant - Código único del tenant
     * @param {string} organizacion.slug - Slug de la organización
     * @param {string} organizacion.nombre_comercial - Nombre comercial
     * @param {Object} usuario - Datos del usuario que la creó
     * @param {number} usuario.id - ID del usuario
     * @param {string} usuario.email - Email del usuario
     * @param {string} usuario.nombre - Nombre del usuario
     */
    emitOrganizacionCreada(organizacion, usuario) {
        logger.info('[AuthEvents] Emitiendo auth:organizacion.creada', {
            organizacion_id: organizacion.id,
            usuario_id: usuario.id
        });

        this.emit('auth:organizacion.creada', {
            organizacion,
            usuario,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Emite evento cuando se registra un nuevo usuario
     *
     * @param {Object} usuario - Datos del usuario registrado
     * @param {string} metodo - Método de registro (email, google, etc.)
     */
    emitUsuarioRegistrado(usuario, metodo = 'email') {
        logger.info('[AuthEvents] Emitiendo auth:usuario.registrado', {
            usuario_id: usuario.id,
            metodo
        });

        this.emit('auth:usuario.registrado', {
            usuario,
            metodo,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Emite evento cuando un usuario hace login exitoso
     *
     * @param {Object} usuario - Datos del usuario
     * @param {string} metodo - Método de login (password, google, magic_link)
     * @param {string|null} ipAddress - IP del cliente
     */
    emitLoginExitoso(usuario, metodo = 'password', ipAddress = null) {
        this.emit('auth:login.exitoso', {
            usuario,
            metodo,
            ipAddress,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Emite evento cuando se resetea una contraseña
     *
     * @param {number} usuarioId - ID del usuario
     * @param {string} email - Email del usuario
     * @param {string|null} ipAddress - IP del cliente
     */
    emitPasswordReset(usuarioId, email, ipAddress = null) {
        this.emit('auth:password.reset', {
            usuarioId,
            email,
            ipAddress,
            timestamp: new Date().toISOString()
        });
    }
}

// Singleton - una instancia compartida
module.exports = new AuthEventEmitter();

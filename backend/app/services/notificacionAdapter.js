/**
 * NotificacionAdapter - Adaptador para envío de notificaciones
 *
 * Proporciona acceso al sistema de notificaciones sin acoplar
 * directamente al módulo de notificaciones.
 *
 * Usado por: workflows, otros módulos que necesiten notificar
 *
 * @module services/notificacionAdapter
 */

const logger = require('../utils/logger');

// Cache del servicio (lazy loaded)
let _notificacionesService = null;

/**
 * Obtener servicio de notificaciones (lazy load)
 * @returns {Object|null}
 */
function getNotificacionesService() {
    if (_notificacionesService === null) {
        try {
            _notificacionesService = require('../modules/notificaciones/services/notificaciones.service');
            logger.debug('[NotificacionAdapter] NotificacionesService cargado');
        } catch (error) {
            logger.warn('[NotificacionAdapter] NotificacionesService no disponible:', error.message);
            _notificacionesService = false;
        }
    }
    return _notificacionesService || null;
}

/**
 * Crear una notificación individual
 *
 * @param {Object} params
 * @param {number} params.organizacionId
 * @param {number} params.usuarioId - Usuario destinatario
 * @param {string} params.tipo - Tipo de notificación
 * @param {string} params.categoria - Categoría (sistema, citas, ventas, etc.)
 * @param {string} params.titulo
 * @param {string} params.mensaje
 * @param {string} [params.nivel] - info, success, warning, error
 * @param {string} [params.icono]
 * @param {string} [params.accionUrl]
 * @param {string} [params.entidadTipo]
 * @param {number} [params.entidadId]
 * @returns {Promise<number|null>} ID de notificación creada o null
 */
async function crear(params) {
    const service = getNotificacionesService();

    if (!service) {
        logger.debug('[NotificacionAdapter] Notificaciones no disponibles, omitiendo');
        return null;
    }

    try {
        return await service.crear(params);
    } catch (error) {
        logger.error('[NotificacionAdapter] Error creando notificación:', error);
        return null;
    }
}

/**
 * Crear notificaciones masivas para múltiples usuarios
 *
 * @param {Object} params
 * @param {number} params.organizacionId
 * @param {number[]} params.usuarioIds - IDs de usuarios destinatarios
 * @param {string} params.tipo
 * @param {string} params.categoria
 * @param {string} params.titulo
 * @param {string} params.mensaje
 * @param {string} [params.nivel]
 * @param {string} [params.icono]
 * @param {string} [params.accionUrl]
 * @returns {Promise<Object>} Resultado con cantidad de notificaciones creadas
 */
async function crearMasiva(params) {
    const service = getNotificacionesService();

    if (!service) {
        logger.debug('[NotificacionAdapter] Notificaciones no disponibles, omitiendo');
        return { creadas: 0, omitidas: params.usuarioIds?.length || 0 };
    }

    try {
        return await service.crearMasiva(params);
    } catch (error) {
        logger.error('[NotificacionAdapter] Error creando notificaciones masivas:', error);
        return { creadas: 0, omitidas: params.usuarioIds?.length || 0, error: error.message };
    }
}

/**
 * Verificar si el módulo está disponible
 * @returns {boolean}
 */
function isAvailable() {
    return getNotificacionesService() !== null;
}

module.exports = {
    crear,
    crearMasiva,
    isAvailable
};

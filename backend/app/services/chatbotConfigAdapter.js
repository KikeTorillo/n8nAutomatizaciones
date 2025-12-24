/**
 * ChatbotConfigAdapter - Adaptador para configuración de chatbots
 *
 * Proporciona acceso a la configuración de chatbots sin acoplar
 * directamente al módulo de agendamiento.
 *
 * Usado por: recordatorios, notificaciones
 *
 * @module services/chatbotConfigAdapter
 */

const logger = require('../utils/logger');

// Cache del modelo (lazy loaded)
let _chatbotConfigModel = null;

/**
 * Obtener modelo de configuración de chatbot (lazy load)
 * @returns {Object|null}
 */
function getChatbotConfigModel() {
    if (_chatbotConfigModel === null) {
        try {
            _chatbotConfigModel = require('../modules/agendamiento/models/chatbot-config.model');
            logger.debug('[ChatbotConfigAdapter] ChatbotConfigModel cargado');
        } catch (error) {
            logger.warn('[ChatbotConfigAdapter] ChatbotConfigModel no disponible:', error.message);
            _chatbotConfigModel = false;
        }
    }
    return _chatbotConfigModel || null;
}

/**
 * Listar chatbots activos de una organización
 *
 * @param {number} organizacionId
 * @param {Object} filtros - { activo: boolean, plataforma: string }
 * @returns {Promise<Array>} Lista de chatbots o array vacío
 */
async function listarChatbotsActivos(organizacionId, filtros = { activo: true }) {
    const model = getChatbotConfigModel();

    if (!model) {
        logger.debug('[ChatbotConfigAdapter] Módulo agendamiento no disponible');
        return [];
    }

    try {
        const resultado = await model.listarPorOrganizacion(organizacionId, filtros);
        return resultado?.chatbots || [];
    } catch (error) {
        logger.error('[ChatbotConfigAdapter] Error listando chatbots:', error);
        return [];
    }
}

/**
 * Obtener el primer chatbot activo de la organización
 *
 * @param {number} organizacionId
 * @returns {Promise<Object|null>} Chatbot o null
 */
async function obtenerChatbotPrincipal(organizacionId) {
    const chatbots = await listarChatbotsActivos(organizacionId);
    return chatbots.length > 0 ? chatbots[0] : null;
}

/**
 * Verificar si hay chatbot configurado
 *
 * @param {number} organizacionId
 * @returns {Promise<boolean>}
 */
async function tieneChatbotActivo(organizacionId) {
    const chatbots = await listarChatbotsActivos(organizacionId);
    return chatbots.length > 0;
}

/**
 * Verificar si el módulo está disponible
 * @returns {boolean}
 */
function isAvailable() {
    return getChatbotConfigModel() !== null;
}

module.exports = {
    listarChatbotsActivos,
    obtenerChatbotPrincipal,
    tieneChatbotActivo,
    isAvailable
};

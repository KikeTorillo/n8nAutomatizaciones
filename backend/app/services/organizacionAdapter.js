/**
 * OrganizacionAdapter - Adaptador para operaciones con organizaciones
 *
 * Proporciona acceso al módulo core/organizaciones sin acoplamiento directo.
 * Usado por: chatbots (gestión de MCP credentials)
 *
 * @module services/organizacionAdapter
 */

const logger = require('../utils/logger');

// Cache del modelo (lazy loaded)
let _organizacionModel = null;

/**
 * Obtener modelo de organización (lazy load)
 * @returns {Object|null}
 */
function getOrganizacionModel() {
    if (_organizacionModel === null) {
        try {
            _organizacionModel = require('../modules/core/models/organizacion.model');
            logger.debug('[OrganizacionAdapter] OrganizacionModel cargado');
        } catch (error) {
            logger.warn('[OrganizacionAdapter] OrganizacionModel no disponible:', error.message);
            _organizacionModel = false;
        }
    }
    return _organizacionModel || null;
}

/**
 * Obtener organización por ID
 *
 * @param {number} organizacionId
 * @returns {Promise<Object|null>}
 */
async function obtenerPorId(organizacionId) {
    const model = getOrganizacionModel();

    if (!model) {
        logger.error('[OrganizacionAdapter] Módulo core no disponible');
        return null;
    }

    try {
        return await model.obtenerPorId(organizacionId);
    } catch (error) {
        logger.error('[OrganizacionAdapter] Error obteniendo organización:', error);
        return null;
    }
}

/**
 * Actualizar datos de organización
 *
 * @param {number} organizacionId
 * @param {Object} datos - Campos a actualizar
 * @returns {Promise<Object|null>} Organización actualizada
 */
async function actualizar(organizacionId, datos) {
    const model = getOrganizacionModel();

    if (!model) {
        throw new Error('Módulo core no disponible');
    }

    return await model.actualizar(organizacionId, datos);
}

/**
 * Obtener campo específico de organización (optimizado)
 *
 * @param {number} organizacionId
 * @param {string} campo - Nombre del campo (ej: 'mcp_credential_id')
 * @returns {Promise<any>} Valor del campo o null
 */
async function obtenerCampo(organizacionId, campo) {
    const org = await obtenerPorId(organizacionId);
    return org ? org[campo] : null;
}

/**
 * Verificar si el módulo está disponible
 * @returns {boolean}
 */
function isAvailable() {
    return getOrganizacionModel() !== null;
}

module.exports = {
    obtenerPorId,
    actualizar,
    obtenerCampo,
    isAvailable
};

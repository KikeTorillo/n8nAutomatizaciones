/**
 * ProfesionalAdapter - Adaptador para acceso a profesionales
 *
 * Proporciona acceso a datos de profesionales sin acoplar
 * directamente al módulo de profesionales/agendamiento.
 *
 * Usado por: POS (auto-asignar profesional en ventas)
 *
 * @module services/profesionalAdapter
 */

const logger = require('../utils/logger');

// Cache del modelo (lazy loaded)
let _profesionalModel = null;

/**
 * Obtener modelo de profesional (lazy load)
 * @returns {Object|null}
 */
function getProfesionalModel() {
    if (_profesionalModel === null) {
        try {
            _profesionalModel = require('../modules/profesionales/models/profesional.model');
            logger.debug('[ProfesionalAdapter] ProfesionalModel cargado');
        } catch (error) {
            logger.warn('[ProfesionalAdapter] ProfesionalModel no disponible:', error.message);
            _profesionalModel = false;
        }
    }
    return _profesionalModel || null;
}

/**
 * Buscar profesional vinculado a un usuario
 *
 * @param {number} usuarioId - ID del usuario
 * @param {number} organizacionId - ID de la organización
 * @returns {Promise<Object|null>} Profesional vinculado o null
 */
async function buscarPorUsuario(usuarioId, organizacionId) {
    const model = getProfesionalModel();

    if (!model) {
        logger.debug('[ProfesionalAdapter] Módulo profesionales no disponible');
        return null;
    }

    try {
        return await model.buscarPorUsuario(usuarioId, organizacionId);
    } catch (error) {
        logger.error('[ProfesionalAdapter] Error buscando profesional:', error);
        return null;
    }
}

/**
 * Obtener profesional por ID
 *
 * @param {number} profesionalId
 * @param {number} organizacionId
 * @returns {Promise<Object|null>}
 */
async function obtenerPorId(profesionalId, organizacionId) {
    const model = getProfesionalModel();

    if (!model) {
        return null;
    }

    try {
        return await model.obtenerPorId(profesionalId, organizacionId);
    } catch (error) {
        logger.error('[ProfesionalAdapter] Error obteniendo profesional:', error);
        return null;
    }
}

/**
 * Verificar si el módulo está disponible
 * @returns {boolean}
 */
function isAvailable() {
    return getProfesionalModel() !== null;
}

module.exports = {
    buscarPorUsuario,
    obtenerPorId,
    isAvailable
};

/**
 * ClienteAdapter - Adaptador para operaciones con clientes
 *
 * Proporciona acceso al módulo de clientes sin acoplamiento directo.
 * Usado por: agendamiento (crear cliente en citas públicas)
 *
 * @module services/clienteAdapter
 */

const logger = require('../utils/logger');

// Cache del modelo (lazy loaded)
let _clienteModel = null;

/**
 * Obtener modelo de cliente (lazy load)
 * @returns {Object|null}
 */
function getClienteModel() {
    if (_clienteModel === null) {
        try {
            _clienteModel = require('../modules/clientes/models/cliente.model');
            logger.debug('[ClienteAdapter] ClienteModel cargado');
        } catch (error) {
            logger.warn('[ClienteAdapter] ClienteModel no disponible:', error.message);
            _clienteModel = false;
        }
    }
    return _clienteModel || null;
}

/**
 * Buscar cliente por teléfono
 *
 * @param {string} telefono
 * @param {number} organizacionId
 * @param {Object} opciones - { exacto: boolean }
 * @returns {Promise<Object>} { encontrado: boolean, cliente: Object|null }
 */
async function buscarPorTelefono(telefono, organizacionId, opciones = {}) {
    const model = getClienteModel();

    if (!model) {
        logger.debug('[ClienteAdapter] Módulo clientes no disponible');
        return { encontrado: false, cliente: null };
    }

    try {
        return await model.buscarPorTelefono(telefono, organizacionId, opciones);
    } catch (error) {
        logger.error('[ClienteAdapter] Error buscando por teléfono:', error);
        return { encontrado: false, cliente: null };
    }
}

/**
 * Crear nuevo cliente
 *
 * @param {Object} datos
 * @param {number} datos.organizacion_id
 * @param {string} datos.nombre
 * @param {string} [datos.apellidos]
 * @param {string} [datos.email]
 * @param {string} [datos.telefono]
 * @param {string} [datos.como_conocio]
 * @param {string} [datos.notas_especiales]
 * @param {boolean} [datos.activo]
 * @param {boolean} [datos.marketing_permitido]
 * @returns {Promise<Object|null>} Cliente creado o null
 */
async function crear(datos) {
    const model = getClienteModel();

    if (!model) {
        throw new Error('Módulo de clientes no disponible');
    }

    return await model.crear(datos);
}

/**
 * Obtener cliente por ID
 *
 * @param {number} clienteId
 * @param {number} organizacionId
 * @returns {Promise<Object|null>}
 */
async function obtenerPorId(clienteId, organizacionId) {
    const model = getClienteModel();

    if (!model) {
        return null;
    }

    try {
        return await model.obtenerPorId(clienteId, organizacionId);
    } catch (error) {
        logger.error('[ClienteAdapter] Error obteniendo cliente:', error);
        return null;
    }
}

/**
 * Verificar si el módulo está disponible
 * @returns {boolean}
 */
function isAvailable() {
    return getClienteModel() !== null;
}

module.exports = {
    buscarPorTelefono,
    crear,
    obtenerPorId,
    isAvailable
};

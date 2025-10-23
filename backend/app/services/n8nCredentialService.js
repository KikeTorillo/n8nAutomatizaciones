/**
 * ====================================================================
 * 🔐 N8N CREDENTIAL SERVICE - GESTIÓN DE CREDENTIALS VÍA API
 * ====================================================================
 *
 * Servicio para gestionar credentials (credenciales) en n8n de forma
 * programática. Las credentials almacenan tokens, API keys y otros
 * datos de autenticación para plataformas externas.
 *
 * 📋 FUNCIONALIDADES:
 * • Crear credentials para diferentes plataformas (Telegram, WhatsApp, etc)
 * • Obtener información de credentials
 * • Actualizar credentials
 * • Eliminar credentials
 * • Validar credentials antes de crear workflows
 *
 * 🔒 SEGURIDAD:
 * - Las credentials se almacenan encriptadas en n8n
 * - Solo se pasan IDs de credentials a workflows
 * - No se almacenan tokens en la BD del SaaS
 *
 * 🔗 DOCUMENTACIÓN N8N API:
 * https://docs.n8n.io/api/api-reference/#tag/Credential
 *
 * @module services/n8nCredentialService
 */

const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Cliente HTTP configurado para n8n API
 */
const n8nClient = axios.create({
    baseURL: process.env.N8N_API_URL || 'http://n8n-main:5678',
    headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY,
        'Content-Type': 'application/json'
    },
    timeout: 10000
});

// Interceptores (igual que n8nService)
n8nClient.interceptors.request.use(
    (config) => {
        logger.debug(`n8n Credential API Request: ${config.method.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => Promise.reject(error)
);

n8nClient.interceptors.response.use(
    (response) => {
        logger.debug(`n8n Credential API Response: ${response.status}`);
        return response;
    },
    (error) => {
        if (error.response) {
            logger.error(`n8n Credential API Error ${error.response.status}:`, error.response.data);
        }
        return Promise.reject(error);
    }
);

/**
 * Mapeo de plataformas a tipos de credential de n8n
 */
const CREDENTIAL_TYPES = {
    telegram: 'telegramApi',
    whatsapp: 'httpHeaderAuth', // Evolution API usa HTTP Header Auth
    instagram: 'facebookGraphApi',
    facebook_messenger: 'facebookGraphApi',
    slack: 'slackApi',
    discord: 'discordApi'
};

class N8nCredentialService {
    /**
     * ====================================================================
     * 🔍 OBTENER CREDENTIAL POR ID
     * ====================================================================
     * Obtiene detalles de una credential específica
     *
     * @param {string} credentialId - ID de la credential en n8n
     * @returns {Promise<Object>} Datos de la credential
     */
    static async obtenerCredential(credentialId) {
        try {
            const response = await n8nClient.get(`/api/v1/credentials/${credentialId}`);

            logger.info(`Credential obtenida: ${credentialId}`);

            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                throw new Error(`Credential ${credentialId} no encontrada en n8n`);
            }

            logger.error(`Error al obtener credential ${credentialId}:`, error.message);
            throw new Error(`Error al obtener credential: ${error.message}`);
        }
    }

    /**
     * ====================================================================
     * ➕ CREAR CREDENTIAL PARA TELEGRAM
     * ====================================================================
     * Crea una credential de Telegram Bot API en n8n
     *
     * @param {Object} data - Datos de la credential
     * @param {string} data.name - Nombre descriptivo
     * @param {string} data.bot_token - Token del bot de Telegram
     * @param {number} data.organizacion_id - ID de la organización
     * @returns {Promise<Object>} Credential creada con su ID
     */
    static async crearCredentialTelegram({ name, bot_token, organizacion_id }) {
        try {
            const credentialData = {
                name: name || `Telegram - Org ${organizacion_id}`,
                type: 'telegramApi',
                data: {
                    accessToken: bot_token
                }
            };

            const response = await n8nClient.post('/api/v1/credentials', credentialData);

            logger.info(`Credential Telegram creada: ${response.data.id}`);

            return response.data;
        } catch (error) {
            logger.error('Error al crear credential Telegram:', error.message);

            if (error.response && error.response.data) {
                throw new Error(`Error al crear credential en n8n: ${JSON.stringify(error.response.data)}`);
            }

            throw new Error(`Error al crear credential Telegram: ${error.message}`);
        }
    }

    /**
     * ====================================================================
     * ➕ CREAR CREDENTIAL PARA WHATSAPP (EVOLUTION API)
     * ====================================================================
     * Crea una credential HTTP Header Auth para Evolution API
     *
     * @param {Object} data - Datos de la credential
     * @param {string} data.name - Nombre descriptivo
     * @param {string} data.api_key - API Key de Evolution
     * @param {number} data.organizacion_id - ID de la organización
     * @returns {Promise<Object>} Credential creada
     */
    static async crearCredentialWhatsApp({ name, api_key, organizacion_id }) {
        try {
            const credentialData = {
                name: name || `WhatsApp Evolution - Org ${organizacion_id}`,
                type: 'httpHeaderAuth',
                data: {
                    name: 'apikey',
                    value: api_key
                }
            };

            const response = await n8nClient.post('/api/v1/credentials', credentialData);

            logger.info(`Credential WhatsApp creada: ${response.data.id}`);

            return response.data;
        } catch (error) {
            logger.error('Error al crear credential WhatsApp:', error.message);
            throw new Error(`Error al crear credential WhatsApp: ${error.message}`);
        }
    }

    /**
     * ====================================================================
     * ➕ CREAR CREDENTIAL GENÉRICA
     * ====================================================================
     * Crea una credential para cualquier plataforma soportada
     *
     * @param {Object} params - Parámetros de la credential
     * @param {string} params.plataforma - 'telegram', 'whatsapp', etc.
     * @param {string} params.nombre - Nombre descriptivo
     * @param {Object} params.config - Configuración específica de plataforma
     * @param {number} params.organizacion_id - ID de organización
     * @returns {Promise<Object>} Credential creada
     */
    static async crearCredential({ plataforma, nombre, config, organizacion_id }) {
        switch (plataforma) {
            case 'telegram':
                return await this.crearCredentialTelegram({
                    name: nombre,
                    bot_token: config.bot_token,
                    organizacion_id
                });

            case 'whatsapp':
                return await this.crearCredentialWhatsApp({
                    name: nombre,
                    api_key: config.api_key,
                    organizacion_id
                });

            // Agregar más plataformas según se implementen
            default:
                throw new Error(`Plataforma no soportada: ${plataforma}`);
        }
    }

    /**
     * ====================================================================
     * ✏️ ACTUALIZAR CREDENTIAL
     * ====================================================================
     * Actualiza una credential existente en n8n
     *
     * @param {string} credentialId - ID de la credential
     * @param {Object} updates - Datos a actualizar
     * @returns {Promise<Object>} Credential actualizada
     */
    static async actualizarCredential(credentialId, updates) {
        try {
            const response = await n8nClient.patch(
                `/api/v1/credentials/${credentialId}`,
                updates
            );

            logger.info(`Credential actualizada: ${credentialId}`);

            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                throw new Error(`Credential ${credentialId} no encontrada`);
            }

            logger.error(`Error al actualizar credential ${credentialId}:`, error.message);
            throw new Error(`Error al actualizar credential: ${error.message}`);
        }
    }

    /**
     * ====================================================================
     * 🗑️ ELIMINAR CREDENTIAL
     * ====================================================================
     * Elimina permanentemente una credential de n8n
     *
     * ADVERTENCIA: Workflows que usen esta credential dejarán de funcionar
     *
     * @param {string} credentialId - ID de la credential
     * @returns {Promise<void>}
     */
    static async eliminarCredential(credentialId) {
        try {
            await n8nClient.delete(`/api/v1/credentials/${credentialId}`);

            logger.info(`Credential eliminada: ${credentialId}`);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                logger.warn(`Credential ${credentialId} ya no existe`);
                return; // No lanzar error si ya fue eliminada
            }

            logger.error(`Error al eliminar credential ${credentialId}:`, error.message);
            throw new Error(`Error al eliminar credential: ${error.message}`);
        }
    }

    /**
     * ====================================================================
     * 🔄 VERIFICAR CREDENTIAL EXISTE
     * ====================================================================
     * Verifica si una credential existe en n8n
     *
     * @param {string} credentialId - ID de la credential
     * @returns {Promise<boolean>} true si existe, false si no
     */
    static async existeCredential(credentialId) {
        try {
            await this.obtenerCredential(credentialId);
            return true;
        } catch (error) {
            if (error.message.includes('no encontrada')) {
                return false;
            }
            throw error;
        }
    }

    /**
     * ====================================================================
     * 📦 OBTENER TIPO DE CREDENTIAL PARA PLATAFORMA
     * ====================================================================
     * Retorna el tipo de credential de n8n según la plataforma
     *
     * @param {string} plataforma - 'telegram', 'whatsapp', etc.
     * @returns {string} Tipo de credential de n8n
     */
    static getCredentialType(plataforma) {
        const type = CREDENTIAL_TYPES[plataforma];

        if (!type) {
            throw new Error(`No hay tipo de credential definido para plataforma: ${plataforma}`);
        }

        return type;
    }
}

module.exports = N8nCredentialService;

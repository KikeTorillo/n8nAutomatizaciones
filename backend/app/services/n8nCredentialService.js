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
 * • Crear credentials para diferentes plataformas (Telegram, etc)
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
const configService = require('./configService');

/**
 * ================================================================
 * 🏭 CREAR CLIENTE N8N CON API KEY DINÁMICA
 * ================================================================
 * Crea instancia axios con API Key leído desde BD (hot-reload).
 * Se crea una nueva instancia por cada request para garantizar
 * que siempre usa el API Key más actualizado.
 *
 * @returns {Promise<axios.AxiosInstance>}
 */
async function createN8nClient() {
    const apiKey = await configService.getN8nApiKey();

    if (!apiKey) {
        throw new Error(
            'N8N_API_KEY no configurado. ' +
            'Ejecuta setup inicial: POST /api/v1/setup/unified-setup'
        );
    }

    const client = axios.create({
        baseURL: process.env.N8N_API_URL || 'http://n8n-main:5678',
        headers: {
            'X-N8N-API-KEY': apiKey,
            'Content-Type': 'application/json'
        },
        timeout: 10000
    });

    // Interceptor para logging de requests
    client.interceptors.request.use(
        (config) => {
            logger.debug(`n8n Credential API Request: ${config.method.toUpperCase()} ${config.url}`);
            return config;
        },
        (error) => {
            logger.error('n8n Credential API Request Error:', error);
            return Promise.reject(error);
        }
    );

    // Interceptor para logging de responses
    client.interceptors.response.use(
        (response) => {
            logger.debug(`n8n Credential API Response: ${response.status} ${response.config.url}`);
            return response;
        },
        (error) => {
            if (error.response) {
                logger.error(`n8n Credential API Error ${error.response.status}:`, error.response.data);
            } else {
                logger.error('n8n Credential API Network Error:', error.message);
            }
            return Promise.reject(error);
        }
    );

    return client;
}

/**
 * Mapeo de plataformas a tipos de credential de n8n
 */
const CREDENTIAL_TYPES = {
    telegram: 'telegramApi',
    whatsapp_oficial: 'whatsappBusinessApi', // WhatsApp Business API Oficial
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
        const client = await createN8nClient(); // ✅ API Key dinámica

        try {
            const response = await client.get(`/api/v1/credentials/${credentialId}`);

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
        const client = await createN8nClient(); // ✅ API Key dinámica

        try {
            const credentialData = {
                name: name || `Telegram - Org ${organizacion_id}`,
                type: 'telegramApi',
                data: {
                    accessToken: bot_token
                }
            };

            const response = await client.post('/api/v1/credentials', credentialData);

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
     * ➕ CREAR CREDENTIAL GENÉRICA
     * ====================================================================
     * Crea una credential para cualquier plataforma soportada
     *
     * @param {Object} params - Parámetros de la credential
     * @param {string} params.plataforma - 'telegram', 'whatsapp_oficial', etc.
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
        const client = await createN8nClient(); // ✅ API Key dinámica

        try {
            const response = await client.patch(
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
        const client = await createN8nClient(); // ✅ API Key dinámica

        try {
            await client.delete(`/api/v1/credentials/${credentialId}`);

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
     * @param {string} plataforma - 'telegram', 'whatsapp_oficial', etc.
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

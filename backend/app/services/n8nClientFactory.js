/**
 * ====================================================================
 * N8N CLIENT FACTORY - Fábrica Unificada de Clientes N8N
 * ====================================================================
 *
 * Centraliza la creación de clientes axios para comunicación con la API de n8n.
 * Elimina duplicación de código en n8nService, n8nCredentialService y
 * n8nGlobalCredentialsService.
 *
 * @module services/n8nClientFactory
 */

const axios = require('axios');
const logger = require('../utils/logger');
const configService = require('./configService');

/**
 * Crea una instancia de cliente axios configurada para comunicarse con n8n.
 *
 * @param {Object} options - Opciones de configuración
 * @param {string} [options.context='n8n-api'] - Contexto para logging (identificación en logs)
 * @param {boolean} [options.includeAcceptHeader=false] - Si incluir header Accept: application/json
 * @param {number} [options.timeout=10000] - Timeout en milisegundos
 * @returns {Promise<axios.AxiosInstance>} Cliente axios configurado
 * @throws {Error} Si N8N_API_KEY no está configurado
 */
async function createN8nClient(options = {}) {
    const {
        context = 'n8n-api',
        includeAcceptHeader = false,
        timeout = 10000
    } = options;

    const apiKey = await configService.getN8nApiKey();

    if (!apiKey) {
        throw new Error(
            'N8N_API_KEY no configurado. ' +
            'Ejecuta setup inicial: POST /api/v1/setup/unified-setup'
        );
    }

    const headers = {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json'
    };

    if (includeAcceptHeader) {
        headers['Accept'] = 'application/json';
    }

    const client = axios.create({
        baseURL: process.env.N8N_API_URL || 'http://n8n-main:5678',
        headers,
        timeout
    });

    // Interceptor para logging de requests
    client.interceptors.request.use(
        (config) => {
            logger.debug(`[${context}] Request: ${config.method.toUpperCase()} ${config.url}`);
            return config;
        },
        (error) => {
            logger.error(`[${context}] Request Error:`, error.message);
            return Promise.reject(error);
        }
    );

    // Interceptor para logging de responses
    client.interceptors.response.use(
        (response) => {
            logger.debug(`[${context}] Response: ${response.status} ${response.config.url}`);
            return response;
        },
        (error) => {
            if (error.response) {
                logger.error(`[${context}] Error ${error.response.status}:`, error.response.data);
            } else {
                logger.error(`[${context}] Network Error:`, error.message);
            }
            return Promise.reject(error);
        }
    );

    return client;
}

/**
 * Crea cliente para operaciones de workflows
 * @returns {Promise<axios.AxiosInstance>}
 */
async function createWorkflowClient() {
    return createN8nClient({ context: 'n8n-workflow' });
}

/**
 * Crea cliente para operaciones de credentials por organización
 * @returns {Promise<axios.AxiosInstance>}
 */
async function createCredentialClient() {
    return createN8nClient({ context: 'n8n-credential' });
}

/**
 * Crea cliente para operaciones de credentials globales
 * @returns {Promise<axios.AxiosInstance>}
 */
async function createGlobalCredentialClient() {
    return createN8nClient({
        context: 'n8n-global-creds',
        includeAcceptHeader: true
    });
}

module.exports = {
    createN8nClient,
    createWorkflowClient,
    createCredentialClient,
    createGlobalCredentialClient
};

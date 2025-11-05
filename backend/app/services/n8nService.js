/**
 * ====================================================================
 * 🔧 N8N SERVICE - GESTIÓN DE WORKFLOWS VÍA API
 * ====================================================================
 *
 * Servicio para interactuar con la API de n8n y gestionar workflows
 * de chatbots de forma programática.
 *
 * 📋 FUNCIONALIDADES:
 * • Crear workflows desde templates
 * • Activar/desactivar workflows
 * • Obtener información de workflows
 * • Eliminar workflows
 * • Actualizar configuración de workflows
 *
 * 🔗 DOCUMENTACIÓN N8N API:
 * https://docs.n8n.io/api/api-reference/
 *
 * @module services/n8nService
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
        timeout: 10000 // 10 segundos
    });

    // Interceptor para logging de requests
    client.interceptors.request.use(
        (config) => {
            logger.debug(`n8n API Request: ${config.method.toUpperCase()} ${config.url}`);
            return config;
        },
        (error) => {
            logger.error('n8n API Request Error:', error);
            return Promise.reject(error);
        }
    );

    // Interceptor para logging de responses
    client.interceptors.response.use(
        (response) => {
            logger.debug(`n8n API Response: ${response.status} ${response.config.url}`);
            return response;
        },
        (error) => {
            if (error.response) {
                logger.error(`n8n API Error ${error.response.status}:`, error.response.data);
            } else {
                logger.error('n8n API Network Error:', error.message);
            }
            return Promise.reject(error);
        }
    );

    return client;
}

class N8nService {
    /**
     * ====================================================================
     * 📋 LISTAR WORKFLOWS
     * ====================================================================
     * Obtiene lista de workflows de n8n
     *
     * @param {Object} filters - Filtros opcionales
     * @param {boolean} filters.active - Solo workflows activos
     * @param {string[]} filters.tags - Filtrar por tags
     * @returns {Promise<Array>} Lista de workflows
     */
    static async listarWorkflows(filters = {}) {
        const client = await createN8nClient(); // ✅ API Key dinámica

        try {
            const params = {};

            if (filters.active !== undefined) {
                params.active = filters.active;
            }

            if (filters.tags && filters.tags.length > 0) {
                params.tags = filters.tags.join(',');
            }

            const response = await client.get('/api/v1/workflows', { params });

            logger.info(`Workflows obtenidos: ${response.data.data.length}`);

            return response.data.data;
        } catch (error) {
            logger.error('Error al listar workflows:', error.message);
            throw new Error(`Error al listar workflows de n8n: ${error.message}`);
        }
    }

    /**
     * ====================================================================
     * 🔍 OBTENER WORKFLOW POR ID
     * ====================================================================
     * Obtiene detalles completos de un workflow específico
     *
     * @param {string} workflowId - ID del workflow en n8n
     * @returns {Promise<Object>} Datos completos del workflow
     */
    static async obtenerWorkflow(workflowId) {
        const client = await createN8nClient(); // ✅ API Key dinámica

        try {
            const response = await client.get(`/api/v1/workflows/${workflowId}`);

            logger.info(`Workflow obtenido: ${workflowId}`);

            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                throw new Error(`Workflow ${workflowId} no encontrado en n8n`);
            }

            logger.error(`Error al obtener workflow ${workflowId}:`, error.message);
            throw new Error(`Error al obtener workflow: ${error.message}`);
        }
    }

    /**
     * ====================================================================
     * ➕ CREAR WORKFLOW
     * ====================================================================
     * Crea un nuevo workflow en n8n desde un objeto de definición
     *
     * @param {Object} workflowData - Definición del workflow
     * @param {string} workflowData.name - Nombre del workflow
     * @param {Array} workflowData.nodes - Nodos del workflow
     * @param {Array} workflowData.connections - Conexiones entre nodos
     * @param {Object} workflowData.settings - Configuración del workflow
     * @param {Array} workflowData.tags - Tags para organización
     * @returns {Promise<Object>} Workflow creado con su ID
     */
    static async crearWorkflow(workflowData) {
        const client = await createN8nClient(); // ✅ API Key dinámica

        try {
            // Validar campos obligatorios
            if (!workflowData.name) {
                throw new Error('El nombre del workflow es obligatorio');
            }

            if (!workflowData.nodes || !Array.isArray(workflowData.nodes)) {
                throw new Error('Los nodos del workflow son obligatorios');
            }

            const response = await client.post('/api/v1/workflows', workflowData);

            logger.info(`Workflow creado exitosamente: ${response.data.id} - ${response.data.name}`);

            return response.data;
        } catch (error) {
            logger.error('Error al crear workflow:', error.message);

            if (error.response && error.response.data) {
                throw new Error(`Error al crear workflow en n8n: ${JSON.stringify(error.response.data)}`);
            }

            throw new Error(`Error al crear workflow: ${error.message}`);
        }
    }

    /**
     * ====================================================================
     * ✏️ ACTUALIZAR WORKFLOW
     * ====================================================================
     * Actualiza un workflow existente en n8n
     *
     * @param {string} workflowId - ID del workflow a actualizar
     * @param {Object} updates - Datos a actualizar
     * @returns {Promise<Object>} Workflow actualizado
     */
    static async actualizarWorkflow(workflowId, updates) {
        const client = await createN8nClient(); // ✅ API Key dinámica

        try {
            // n8n usa PUT, no PATCH
            const response = await client.put(`/api/v1/workflows/${workflowId}`, updates);

            logger.info(`Workflow actualizado: ${workflowId}`);

            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                throw new Error(`Workflow ${workflowId} no encontrado en n8n`);
            }

            logger.error(`Error al actualizar workflow ${workflowId}:`, error.message);
            throw new Error(`Error al actualizar workflow: ${error.message}`);
        }
    }

    /**
     * ====================================================================
     * ✅ ACTIVAR WORKFLOW
     * ====================================================================
     * Activa un workflow desactivado usando el endpoint /activate
     *
     * IMPORTANTE: El workflow debe tener al menos un nodo trigger/webhook/poller
     * para poder ser activado. Un workflow solo con nodos manuales no se puede activar.
     *
     * @param {string} workflowId - ID del workflow
     * @returns {Promise<Object>} Workflow activado
     */
    static async activarWorkflow(workflowId) {
        const client = await createN8nClient(); // ✅ API Key dinámica

        try {
            // n8n usa endpoint específico POST /workflows/{id}/activate
            const response = await client.post(`/api/v1/workflows/${workflowId}/activate`);

            logger.info(`Workflow activado: ${workflowId}`);

            return response.data;
        } catch (error) {
            // Error común: "Workflow has no node to start the workflow"
            if (error.response && error.response.status === 400) {
                const errorMsg = error.response.data?.message || '';
                if (errorMsg.includes('no node to start')) {
                    throw new Error(`No se puede activar el workflow: debe contener al menos un nodo trigger, webhook o poller. Workflows solo con nodos manuales no se pueden activar.`);
                }
            }

            logger.error(`Error al activar workflow ${workflowId}:`, error.message);
            throw new Error(`Error al activar workflow: ${error.message}`);
        }
    }

    /**
     * ====================================================================
     * ⏸️ DESACTIVAR WORKFLOW
     * ====================================================================
     * Desactiva un workflow activo usando el endpoint /deactivate
     *
     * @param {string} workflowId - ID del workflow
     * @returns {Promise<Object>} Workflow desactivado
     */
    static async desactivarWorkflow(workflowId) {
        const client = await createN8nClient(); // ✅ API Key dinámica

        try {
            // n8n usa endpoint específico POST /workflows/{id}/deactivate
            const response = await client.post(`/api/v1/workflows/${workflowId}/deactivate`);

            logger.info(`Workflow desactivado: ${workflowId}`);

            return response.data;
        } catch (error) {
            logger.error(`Error al desactivar workflow ${workflowId}:`, error.message);
            throw new Error(`Error al desactivar workflow: ${error.message}`);
        }
    }

    /**
     * ====================================================================
     * 🗑️ ELIMINAR WORKFLOW
     * ====================================================================
     * Elimina permanentemente un workflow de n8n
     *
     * @param {string} workflowId - ID del workflow
     * @returns {Promise<void>}
     */
    static async eliminarWorkflow(workflowId) {
        const client = await createN8nClient(); // ✅ API Key dinámica

        try {
            await client.delete(`/api/v1/workflows/${workflowId}`);

            logger.info(`Workflow eliminado: ${workflowId}`);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                logger.warn(`Workflow ${workflowId} ya no existe en n8n`);
                return; // No lanzar error si ya fue eliminado
            }

            logger.error(`Error al eliminar workflow ${workflowId}:`, error.message);
            throw new Error(`Error al eliminar workflow: ${error.message}`);
        }
    }

    /**
     * ====================================================================
     * 🔄 VERIFICAR ESTADO DEL WORKFLOW
     * ====================================================================
     * Verifica si un workflow existe y está activo
     *
     * @param {string} workflowId - ID del workflow
     * @returns {Promise<Object>} Estado del workflow { exists, active, name }
     */
    static async verificarEstado(workflowId) {
        const client = await createN8nClient(); // ✅ API Key dinámica

        try {
            const workflow = await this.obtenerWorkflow(workflowId);

            return {
                exists: true,
                active: workflow.active,
                name: workflow.name,
                updatedAt: workflow.updatedAt
            };
        } catch (error) {
            if (error.message.includes('no encontrado')) {
                return {
                    exists: false,
                    active: false,
                    name: null
                };
            }

            throw error;
        }
    }
}

module.exports = N8nService;

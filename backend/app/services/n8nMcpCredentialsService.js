/**
 * ====================================================================
 * SERVICIO DE CREDENTIALS MCP DE N8N
 * ====================================================================
 *
 * Gestiona credentials httpHeaderAuth para autenticación del AI Agent
 * con el MCP Server.
 *
 * ESTRATEGIA: 1 credential por organización (compartida entre chatbots)
 * - Reduce clutter en n8n (N orgs = N credentials, no N chatbots)
 * - Facilita rotación de tokens por organización
 * - Mantiene aislamiento multi-tenant (token tiene organizacion_id)
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { generarTokenMCP } = require('../utils/mcpTokenGenerator');
const configService = require('./configService');

class N8nMcpCredentialsService {
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
    async createN8nClient() {
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
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 10000
        });

        // Interceptor para logging de requests
        client.interceptors.request.use(
            (config) => {
                logger.debug(`[N8nMcpCreds] ${config.method.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                logger.error('[N8nMcpCreds] Request error:', error.message);
                return Promise.reject(error);
            }
        );

        // Interceptor para logging de responses
        client.interceptors.response.use(
            (response) => {
                logger.debug(`[N8nMcpCreds] Response ${response.status}`);
                return response;
            },
            (error) => {
                if (error.response) {
                    logger.error('[N8nMcpCreds] Response error:', {
                        status: error.response.status,
                        data: error.response.data
                    });
                } else {
                    logger.error('[N8nMcpCreds] Network error:', error.message);
                }
                return Promise.reject(error);
            }
        );

        return client;
    }

    /**
     * ====================================================================
     * OBTENER O CREAR CREDENTIAL MCP POR ORGANIZACIÓN
     * ====================================================================
     *
     * Busca si ya existe una credential MCP para la organización.
     * Si existe, la retorna. Si no, crea una nueva con un token JWT.
     *
     * ESTRATEGIA: 1 credential por organización
     * - Todos los chatbots de la org comparten la misma credential
     * - El token JWT contiene organizacion_id para RLS
     * - Naming convention: "MCP Auth - Org {organizacion_id}"
     *
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} { id, name, type, token }
     */
    async obtenerOCrearPorOrganizacion(organizacionId) {
        const client = await this.createN8nClient(); // ✅ API Key dinámica

        try {
            const credentialName = `MCP Auth - Org ${organizacionId}`;

            // 1. Buscar credential existente
            logger.info(`[N8nMcpCreds] Buscando credential para org ${organizacionId}...`);

            try {
                const credenciales = await client.get('/api/v1/credentials');

                const credentialExistente = credenciales.data.data.find(
                    cred => cred.name === credentialName && cred.type === 'httpHeaderAuth'
                );

                if (credentialExistente) {
                    logger.info(`[N8nMcpCreds] Credential MCP reutilizada para org ${organizacionId}: ${credentialExistente.id}`);
                    return {
                        id: credentialExistente.id,
                        name: credentialExistente.name,
                        type: credentialExistente.type,
                        reutilizada: true
                    };
                }
            } catch (error) {
                logger.warn('[N8nMcpCreds] Error buscando credentials existentes:', error.message);
                // Continuar para crear nueva credential
            }

            // 2. Generar token JWT para la organización
            logger.info(`[N8nMcpCreds] Generando nuevo token JWT para org ${organizacionId}...`);
            const token = await generarTokenMCP(organizacionId);

            // 3. Crear nueva credential en n8n
            logger.info(`[N8nMcpCreds] Creando nueva credential MCP para org ${organizacionId}...`);

            const newCredential = await client.post('/api/v1/credentials', {
                name: credentialName,
                type: 'httpHeaderAuth',
                data: {
                    name: 'Authorization',
                    value: `Bearer ${token}`
                }
            });

            logger.info(`[N8nMcpCreds] Credential MCP creada exitosamente: ${newCredential.data.id}`);

            return {
                id: newCredential.data.id,
                name: newCredential.data.name,
                type: newCredential.data.type,
                token: token,
                reutilizada: false
            };

        } catch (error) {
            logger.error('[N8nMcpCreds] Error obteniendo/creando credential MCP:', error.message);

            if (error.response) {
                logger.error('[N8nMcpCreds] Response data:', error.response.data);
            }

            throw new Error(`Error con credential MCP: ${error.message}`);
        }
    }

    /**
     * ====================================================================
     * RENOVAR TOKEN DE CREDENTIAL MCP
     * ====================================================================
     *
     * Genera un nuevo token JWT y actualiza la credential existente.
     * Útil para rotación de tokens antes de que expiren (180 días).
     *
     * @param {string} credentialId - ID de la credential en n8n
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} { id, name, type, token }
     */
    async renovarToken(credentialId, organizacionId) {
        const client = await this.createN8nClient(); // ✅ API Key dinámica

        try {
            logger.info(`[N8nMcpCreds] Renovando token MCP para credential ${credentialId}...`);

            // 1. Generar nuevo token JWT
            const nuevoToken = await generarTokenMCP(organizacionId);

            // 2. Obtener credential actual
            const credentialActual = await client.get(`/api/v1/credentials/${credentialId}`);

            // 3. Actualizar credential con nuevo token
            const credentialActualizada = await client.put(`/api/v1/credentials/${credentialId}`, {
                name: credentialActual.data.name,
                type: credentialActual.data.type,
                data: {
                    name: 'Authorization',
                    value: `Bearer ${nuevoToken}`
                }
            });

            logger.info(`[N8nMcpCreds] Token renovado exitosamente para credential ${credentialId}`);

            return {
                id: credentialActualizada.data.id,
                name: credentialActualizada.data.name,
                type: credentialActualizada.data.type,
                token: nuevoToken
            };

        } catch (error) {
            logger.error(`[N8nMcpCreds] Error renovando token de credential ${credentialId}:`, error.message);
            throw new Error(`Error renovando token MCP: ${error.message}`);
        }
    }

    /**
     * ====================================================================
     * ELIMINAR CREDENTIAL MCP
     * ====================================================================
     *
     * Elimina una credential de n8n.
     *
     * IMPORTANTE: Solo eliminar si todos los chatbots de la org
     * han sido eliminados.
     *
     * @param {string} credentialId - ID de la credential
     * @returns {Promise<void>}
     */
    async eliminar(credentialId) {
        const client = await this.createN8nClient(); // ✅ API Key dinámica

        try {
            logger.info(`[N8nMcpCreds] Eliminando credential MCP: ${credentialId}`);

            await client.delete(`/api/v1/credentials/${credentialId}`);

            logger.info(`[N8nMcpCreds] Credential MCP eliminada exitosamente: ${credentialId}`);

        } catch (error) {
            if (error.response && error.response.status === 404) {
                logger.warn(`[N8nMcpCreds] Credential ${credentialId} ya no existe en n8n`);
                return; // No lanzar error si ya fue eliminada
            }

            logger.error(`[N8nMcpCreds] Error eliminando credential ${credentialId}:`, error.message);
            throw new Error(`Error eliminando credential MCP: ${error.message}`);
        }
    }

    /**
     * ====================================================================
     * VERIFICAR SI CREDENTIAL EXISTE
     * ====================================================================
     *
     * Verifica si existe una credential MCP para una organización.
     *
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object|null>} Credential o null si no existe
     */
    async verificarExistencia(organizacionId) {
        const client = await this.createN8nClient(); // ✅ API Key dinámica

        try {
            const credentialName = `MCP Auth - Org ${organizacionId}`;

            const credenciales = await client.get('/api/v1/credentials');

            const credentialExistente = credenciales.data.data.find(
                cred => cred.name === credentialName && cred.type === 'httpHeaderAuth'
            );

            if (credentialExistente) {
                return {
                    id: credentialExistente.id,
                    name: credentialExistente.name,
                    type: credentialExistente.type,
                    existe: true
                };
            }

            return null;

        } catch (error) {
            logger.error('[N8nMcpCreds] Error verificando existencia de credential:', error.message);
            return null;
        }
    }
}

module.exports = new N8nMcpCredentialsService();

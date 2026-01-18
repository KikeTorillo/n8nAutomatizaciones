/**
 * ====================================================================
 * SERVICIO DE CREDENTIALS GLOBALES DE N8N
 * ====================================================================
 *
 * Gestiona credentials compartidas entre todos los workflows:
 * - DeepSeek API (modelo de lenguaje)
 * - PostgreSQL (chat memory)
 * - Redis (anti-flood)
 *
 * Estas credentials se crean una sola vez y se reutilizan en todos
 * los workflows de chatbots.
 */

const logger = require('../utils/logger');
const configService = require('./configService');
const { createGlobalCredentialClient } = require('./n8nClientFactory');

class N8nGlobalCredentialsService {
    /**
     * Crea cliente N8N usando la fábrica centralizada
     * @returns {Promise<axios.AxiosInstance>}
     */
    async createN8nClient() {
        return createGlobalCredentialClient();
    }


    /**
     * ====================================================================
     * OBTENER O CREAR CREDENTIAL DE DEEPSEEK
     * ====================================================================
     *
     * Busca si ya existe una credential de DeepSeek, si no la crea.
     * Esta credential es global y se comparte entre todos los workflows.
     *
     * @returns {Promise<Object>} { id, name, type }
     */
    async obtenerOCrearDeepSeek() {
        const client = await this.createN8nClient(); // ✅ API Key dinámica

        try {
            // 1. Verificar si ya tenemos el ID en variable de entorno (.env)
            if (process.env.N8N_DEEPSEEK_CREDENTIAL_ID) {
                logger.info(`[N8nGlobalCreds] ✅ Usando credential DeepSeek desde .env: ${process.env.N8N_DEEPSEEK_CREDENTIAL_ID}`);
                return {
                    id: process.env.N8N_DEEPSEEK_CREDENTIAL_ID,
                    name: 'DeepSeek Global Account',
                    type: 'deepSeekApi'
                };
            }

            // 2. Verificar si ya tenemos el ID guardado en BD (metadata)
            const credentialId = await configService.getN8nCredentialId('deepseek_credential_id');
            if (credentialId) {
                logger.info(`[N8nGlobalCreds] ✅ Reutilizando credential DeepSeek desde BD: ${credentialId}`);
                return {
                    id: credentialId,
                    name: 'DeepSeek Global Account',
                    type: 'deepSeekApi'
                };
            }

            // 3. Si no existe, crear nueva credential
            logger.info('[N8nGlobalCreds] 🆕 Creando nueva credential DeepSeek...');

            const apiKey = process.env.DEEPSEEKAPIKEY;
            if (!apiKey) {
                throw new Error('DEEPSEEKAPIKEY no está configurado en .env');
            }

            const newCredential = await client.post('/api/v1/credentials', {
                name: 'DeepSeek Global Account',
                type: 'deepSeekApi',
                data: {
                    apiKey: apiKey
                }
            });

            logger.info(`[N8nGlobalCreds] ✅ Credential DeepSeek creada: ${newCredential.data.id}`);

            // Guardar ID en BD para evitar duplicación futura
            await configService.setN8nCredentialId('deepseek_credential_id', newCredential.data.id);
            logger.info(`[N8nGlobalCreds] 💾 ID guardado en BD para reutilización`);

            return {
                id: newCredential.data.id,
                name: newCredential.data.name,
                type: newCredential.data.type
            };

        } catch (error) {
            logger.error('[N8nGlobalCreds] Error obteniendo/creando credential DeepSeek:', error.message);
            throw new Error(`Error con credential DeepSeek: ${error.message}`);
        }
    }

    /**
     * ====================================================================
     * OBTENER O CREAR CREDENTIAL DE OPENROUTER
     * ====================================================================
     *
     * Busca si ya existe una credential de OpenRouter, si no la crea.
     * Esta credential es global y se comparte entre todos los workflows.
     *
     * @returns {Promise<Object>} { id, name, type }
     */
    async obtenerOCrearOpenRouter() {
        const client = await this.createN8nClient(); // ✅ API Key dinámica

        try {
            // 1. Verificar si ya tenemos el ID en variable de entorno (.env)
            if (process.env.N8N_OPENROUTER_CREDENTIAL_ID) {
                logger.info(`[N8nGlobalCreds] ✅ Usando credential OpenRouter desde .env: ${process.env.N8N_OPENROUTER_CREDENTIAL_ID}`);
                return {
                    id: process.env.N8N_OPENROUTER_CREDENTIAL_ID,
                    name: 'OpenRouter Global Account',
                    type: 'openRouterApi'
                };
            }

            // 2. Verificar si ya tenemos el ID guardado en BD (metadata)
            const credentialId = await configService.getN8nCredentialId('openrouter_credential_id');
            if (credentialId) {
                logger.info(`[N8nGlobalCreds] ✅ Reutilizando credential OpenRouter desde BD: ${credentialId}`);
                return {
                    id: credentialId,
                    name: 'OpenRouter Global Account',
                    type: 'openRouterApi'
                };
            }

            // 3. Si no existe, crear nueva credential
            logger.info('[N8nGlobalCreds] 🆕 Creando nueva credential OpenRouter...');

            const apiKey = process.env.OPENROUTER_API_KEY;
            if (!apiKey) {
                throw new Error('OPENROUTER_API_KEY no está configurado en .env');
            }

            const newCredential = await client.post('/api/v1/credentials', {
                name: 'OpenRouter Global Account',
                type: 'openRouterApi',
                data: {
                    apiKey: apiKey
                }
            });

            logger.info(`[N8nGlobalCreds] ✅ Credential OpenRouter creada: ${newCredential.data.id}`);

            // Guardar ID en BD para evitar duplicación futura
            await configService.setN8nCredentialId('openrouter_credential_id', newCredential.data.id);
            logger.info(`[N8nGlobalCreds] 💾 ID guardado en BD para reutilización`);

            return {
                id: newCredential.data.id,
                name: newCredential.data.name,
                type: newCredential.data.type
            };

        } catch (error) {
            logger.error('[N8nGlobalCreds] Error obteniendo/creando credential OpenRouter:', error.message);
            throw new Error(`Error con credential OpenRouter: ${error.message}`);
        }
    }

    /**
     * ====================================================================
     * OBTENER O CREAR CREDENTIAL DE POSTGRESQL (CHAT MEMORY)
     * ====================================================================
     *
     * Credential para conectar con la BD de chat memories de n8n.
     *
     * @returns {Promise<Object>} { id, name, type }
     */
    async obtenerOCrearPostgres() {
        const client = await this.createN8nClient(); // ✅ API Key dinámica

        try {
            // 1. Verificar si ya tenemos el ID en variable de entorno (.env)
            if (process.env.N8N_POSTGRES_CREDENTIAL_ID) {
                logger.info(`[N8nGlobalCreds] ✅ Usando credential PostgreSQL desde .env: ${process.env.N8N_POSTGRES_CREDENTIAL_ID}`);
                return {
                    id: process.env.N8N_POSTGRES_CREDENTIAL_ID,
                    name: 'Postgres Chat Memory Global',
                    type: 'postgres'
                };
            }

            // 2. Verificar si ya tenemos el ID guardado en BD (metadata)
            const credentialId = await configService.getN8nCredentialId('postgres_credential_id');
            if (credentialId) {
                logger.info(`[N8nGlobalCreds] ✅ Reutilizando credential PostgreSQL desde BD: ${credentialId}`);
                return {
                    id: credentialId,
                    name: 'Postgres Chat Memory Global',
                    type: 'postgres'
                };
            }

            // 3. Si no existe, crear nueva credential
            logger.info('[N8nGlobalCreds] 🆕 Creando nueva credential PostgreSQL...');

            const newCredential = await client.post('/api/v1/credentials', {
                name: 'Postgres Chat Memory Global',
                type: 'postgres',
                data: {
                    host: process.env.CHAT_DB_HOST || 'postgres',
                    database: process.env.CHAT_DB_NAME || 'chat_memories_db',
                    user: process.env.CHAT_DB_USER || 'n8n_app',
                    password: process.env.CHAT_DB_PASSWORD,
                    port: parseInt(process.env.CHAT_DB_PORT) || 5432,
                    ssl: 'disable',
                    // SSH Tunnel fields - REQUERIDOS por el schema de n8n API
                    // aunque no se use SSH tunnel
                    sshAuthenticateWith: 'password',
                    sshHost: '',
                    sshPort: 22,
                    sshUser: '',
                    sshPassword: '',
                    privateKey: '',
                    passphrase: ''
                }
            });

            logger.info(`[N8nGlobalCreds] ✅ Credential PostgreSQL creada: ${newCredential.data.id}`);

            // Guardar ID en BD para evitar duplicación futura
            await configService.setN8nCredentialId('postgres_credential_id', newCredential.data.id);
            logger.info(`[N8nGlobalCreds] 💾 ID guardado en BD para reutilización`);

            return {
                id: newCredential.data.id,
                name: newCredential.data.name,
                type: newCredential.data.type
            };

        } catch (error) {
            logger.error('[N8nGlobalCreds] Error obteniendo/creando credential PostgreSQL:', error.message);
            if (error.response) {
                logger.error(`[N8nGlobalCreds] PostgreSQL Response: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            }
            throw new Error(`Error con credential PostgreSQL: ${error.message}`);
        }
    }

    /**
     * ====================================================================
     * OBTENER O CREAR CREDENTIAL DE REDIS
     * ====================================================================
     *
     * Credential para Redis (anti-flood y debouncing).
     *
     * @returns {Promise<Object>} { id, name, type }
     */
    async obtenerOCrearRedis() {
        const client = await this.createN8nClient(); // ✅ API Key dinámica

        try {
            // 1. Verificar si ya tenemos el ID en variable de entorno (.env)
            if (process.env.N8N_REDIS_CREDENTIAL_ID) {
                logger.info(`[N8nGlobalCreds] ✅ Usando credential Redis desde .env: ${process.env.N8N_REDIS_CREDENTIAL_ID}`);
                return {
                    id: process.env.N8N_REDIS_CREDENTIAL_ID,
                    name: 'Redis Global Account',
                    type: 'redis'
                };
            }

            // 2. Verificar si ya tenemos el ID guardado en BD (metadata)
            const credentialId = await configService.getN8nCredentialId('redis_credential_id');
            if (credentialId) {
                logger.info(`[N8nGlobalCreds] ✅ Reutilizando credential Redis desde BD: ${credentialId}`);
                return {
                    id: credentialId,
                    name: 'Redis Global Account',
                    type: 'redis'
                };
            }

            // 3. Si no existe, crear nueva credential
            logger.info('[N8nGlobalCreds] 🆕 Creando nueva credential Redis...');

            const newCredential = await client.post('/api/v1/credentials', {
                name: 'Redis Global Account',
                type: 'redis',
                data: {
                    host: process.env.REDIS_HOST || 'redis',
                    port: parseInt(process.env.REDIS_PORT) || 6379,
                    database: 0,
                    ssl: false
                }
            });

            logger.info(`[N8nGlobalCreds] ✅ Credential Redis creada: ${newCredential.data.id}`);

            // Guardar ID en BD para evitar duplicación futura
            await configService.setN8nCredentialId('redis_credential_id', newCredential.data.id);
            logger.info(`[N8nGlobalCreds] 💾 ID guardado en BD para reutilización`);

            return {
                id: newCredential.data.id,
                name: newCredential.data.name,
                type: newCredential.data.type
            };

        } catch (error) {
            logger.error('[N8nGlobalCreds] Error obteniendo/creando credential Redis:', error.message);
            throw new Error(`Error con credential Redis: ${error.message}`);
        }
    }

    /**
     * ====================================================================
     * OBTENER TODAS LAS CREDENTIALS GLOBALES
     * ====================================================================
     *
     * Wrapper que obtiene/crea todas las credentials globales necesarias.
     *
     * @returns {Promise<Object>} { deepseek, openrouter, postgres, redis }
     */
    async obtenerTodasLasCredentials() {
        try {
            logger.info('[N8nGlobalCreds] Obteniendo todas las credentials globales...');

            const [deepseek, openrouter, postgres, redis] = await Promise.all([
                this.obtenerOCrearDeepSeek(),
                this.obtenerOCrearOpenRouter(),
                this.obtenerOCrearPostgres(),
                this.obtenerOCrearRedis()
            ]);

            logger.info('[N8nGlobalCreds] Todas las credentials globales obtenidas exitosamente');

            return {
                deepseek,      // ✅ Mantenemos como fallback
                openrouter,    // ✅ NUEVO - Prioridad para nuevos chatbots
                postgres,
                redis
            };

        } catch (error) {
            logger.error('[N8nGlobalCreds] Error obteniendo credentials globales:', error.message);
            throw error;
        }
    }
}

module.exports = new N8nGlobalCredentialsService();

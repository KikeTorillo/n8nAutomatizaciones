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

const axios = require('axios');
const logger = require('../utils/logger');
const configService = require('./configService');

class N8nGlobalCredentialsService {
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
                logger.debug(`[N8nGlobalCreds] ${config.method.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                logger.error('[N8nGlobalCreds] Request error:', error.message);
                return Promise.reject(error);
            }
        );

        // Interceptor para logging de responses
        client.interceptors.response.use(
            (response) => {
                logger.debug(`[N8nGlobalCreds] Response ${response.status}`);
                return response;
            },
            (error) => {
                logger.error('[N8nGlobalCreds] Response error:', error.message);
                return Promise.reject(error);
            }
        );

        return client;
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
            // Verificar si ya tenemos el ID en variable de entorno
            if (process.env.N8N_DEEPSEEK_CREDENTIAL_ID) {
                logger.info(`[N8nGlobalCreds] Usando credential DeepSeek existente: ${process.env.N8N_DEEPSEEK_CREDENTIAL_ID}`);
                return {
                    id: process.env.N8N_DEEPSEEK_CREDENTIAL_ID,
                    name: 'DeepSeek Global Account',
                    type: 'deepSeekApi'
                };
            }

            // Si no existe, crear nueva credential
            logger.info('[N8nGlobalCreds] Creando nueva credential DeepSeek...');

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

            logger.info(`[N8nGlobalCreds] Credential DeepSeek creada: ${newCredential.data.id}`);
            logger.warn(`[N8nGlobalCreds] ⚠️  Agregar al .env: N8N_DEEPSEEK_CREDENTIAL_ID=${newCredential.data.id}`);

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
            // Verificar si ya tenemos el ID en variable de entorno
            if (process.env.N8N_POSTGRES_CREDENTIAL_ID) {
                logger.info(`[N8nGlobalCreds] Usando credential PostgreSQL existente: ${process.env.N8N_POSTGRES_CREDENTIAL_ID}`);
                return {
                    id: process.env.N8N_POSTGRES_CREDENTIAL_ID,
                    name: 'Postgres Chat Memory Global',
                    type: 'postgres'
                };
            }

            // Si no existe, crear nueva credential
            logger.info('[N8nGlobalCreds] Creando nueva credential PostgreSQL...');

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

            logger.info(`[N8nGlobalCreds] Credential PostgreSQL creada: ${newCredential.data.id}`);
            logger.warn(`[N8nGlobalCreds] ⚠️  Agregar al .env: N8N_POSTGRES_CREDENTIAL_ID=${newCredential.data.id}`);

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
            // Verificar si ya tenemos el ID en variable de entorno
            if (process.env.N8N_REDIS_CREDENTIAL_ID) {
                logger.info(`[N8nGlobalCreds] Usando credential Redis existente: ${process.env.N8N_REDIS_CREDENTIAL_ID}`);
                return {
                    id: process.env.N8N_REDIS_CREDENTIAL_ID,
                    name: 'Redis Global Account',
                    type: 'redis'
                };
            }

            // Si no existe, crear nueva credential
            logger.info('[N8nGlobalCreds] Creando nueva credential Redis...');

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

            logger.info(`[N8nGlobalCreds] Credential Redis creada: ${newCredential.data.id}`);
            logger.warn(`[N8nGlobalCreds] ⚠️  Agregar al .env: N8N_REDIS_CREDENTIAL_ID=${newCredential.data.id}`);

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
     * @returns {Promise<Object>} { deepseek, postgres, redis }
     */
    async obtenerTodasLasCredentials() {
        try {
            logger.info('[N8nGlobalCreds] Obteniendo todas las credentials globales...');

            const [deepseek, postgres, redis] = await Promise.all([
                this.obtenerOCrearDeepSeek(),
                this.obtenerOCrearPostgres(),
                this.obtenerOCrearRedis()
            ]);

            logger.info('[N8nGlobalCreds] Todas las credentials globales obtenidas exitosamente');

            return {
                deepseek,
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

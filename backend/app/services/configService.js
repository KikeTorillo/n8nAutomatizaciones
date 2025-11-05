/**
 * ====================================================================
 * 🔧 CONFIG SERVICE - GESTIÓN CENTRALIZADA DE CONFIGURACIÓN SISTEMA
 * ====================================================================
 *
 * Servicio singleton que maneja configuraciones críticas del sistema
 * con cache inteligente y hot-reload desde BD.
 *
 * 🎯 FUNCIONALIDADES:
 * • Lectura de N8N_API_KEY desde BD (con cache 60s)
 * • Hot-reload sin restart de backend
 * • Fallback a .env para backward compatibility
 * • Invalidación manual de cache
 *
 * 📊 PERFORMANCE:
 * • Cache local: 60 segundos TTL
 * • 1 query a BD cada minuto (máximo)
 * • Singleton pattern para compartir cache
 *
 * 🔒 SEGURIDAD:
 * • Usa RLSContextManager.withBypass para acceso seguro
 * • Solo super_admin puede modificar (garantizado por RLS)
 *
 * @module services/configService
 */

const RLSContextManager = require('../utils/rlsContextManager');
const logger = require('../utils/logger');

class ConfigService {
    constructor() {
        // Cache con TTL de 60 segundos
        this.cache = {
            n8n_api_key: null,
            n8n_configured: false,
            super_admin_id: null,
            lastFetch: null,
            ttl: 60000 // 60 segundos
        };
    }

    /**
     * ================================================================
     * 🔑 OBTENER N8N API KEY (CON CACHE INTELIGENTE)
     * ================================================================
     * Lee el API Key de n8n desde la BD con sistema de cache.
     * Si el cache es válido (< 60s), retorna valor cacheado.
     *
     * @returns {Promise<string|null>} API Key de n8n o null
     */
    async getN8nApiKey() {
        const now = Date.now();

        // Si está en cache y no expiró, retornar cache
        if (this.cache.n8n_api_key &&
            this.cache.lastFetch &&
            (now - this.cache.lastFetch) < this.cache.ttl) {

            logger.debug('ConfigService: N8N_API_KEY desde cache');
            return this.cache.n8n_api_key;
        }

        // Fetch desde BD usando RLSContextManager
        try {
            const result = await RLSContextManager.withBypass(async (db) => {
                const queryResult = await db.query(`
                    SELECT n8n_api_key, n8n_configured, super_admin_id
                    FROM configuracion_sistema
                    WHERE id = 1
                `);

                if (queryResult.rows.length > 0) {
                    const config = queryResult.rows[0];

                    // Actualizar cache
                    this.cache.n8n_api_key = config.n8n_api_key;
                    this.cache.n8n_configured = config.n8n_configured;
                    this.cache.super_admin_id = config.super_admin_id;
                    this.cache.lastFetch = now;

                    logger.debug('ConfigService: N8N_API_KEY desde BD (cache actualizado)');
                    return config.n8n_api_key;
                }

                // Si no hay registro en BD, fallback a .env
                logger.warn('ConfigService: configuracion_sistema vacía, usando .env');
                const envKey = process.env.N8N_API_KEY || null;

                // Cachear también el .env para evitar lecturas repetidas
                if (envKey) {
                    this.cache.n8n_api_key = envKey;
                    this.cache.lastFetch = now;
                }

                return envKey;
            });

            return result;

        } catch (error) {
            logger.error('Error obteniendo N8N_API_KEY de BD:', error);
            // Fallback a .env en caso de error
            return process.env.N8N_API_KEY || null;
        }
    }

    /**
     * ================================================================
     * 💾 GUARDAR N8N API KEY EN BD
     * ================================================================
     * Actualiza el API Key de n8n en la tabla configuracion_sistema.
     * Invalida cache automáticamente.
     *
     * @param {string} apiKey - API Key generado por n8n
     * @param {object} options - Opciones adicionales
     * @param {string} options.ownerEmail - Email del owner de n8n
     * @param {number} options.superAdminId - ID del super_admin
     * @returns {Promise<object>} Configuración actualizada
     */
    async setN8nApiKey(apiKey, options = {}) {
        const { ownerEmail, superAdminId, db: dbConn } = options;

        const query = `
            UPDATE configuracion_sistema
            SET n8n_api_key = $1,
                n8n_owner_email = COALESCE($2, n8n_owner_email),
                super_admin_id = COALESCE($3, super_admin_id),
                n8n_configured = true,
                n8n_last_sync = CURRENT_TIMESTAMP,
                actualizado_en = CURRENT_TIMESTAMP
            WHERE id = 1
            RETURNING *
        `;

        // Si se proporciona una conexión db, usarla (para transacciones)
        // Si no, crear una nueva transacción con withBypass
        let result;
        if (dbConn) {
            const updateResult = await dbConn.query(query, [apiKey, ownerEmail, superAdminId]);
            if (updateResult.rowCount === 0) {
                throw new Error('No se pudo actualizar configuracion_sistema');
            }
            result = updateResult.rows[0];
        } else {
            result = await RLSContextManager.withBypass(async (db) => {
                const updateResult = await db.query(query, [apiKey, ownerEmail, superAdminId]);
                if (updateResult.rowCount === 0) {
                    throw new Error('No se pudo actualizar configuracion_sistema');
                }
                return updateResult.rows[0];
            });
        }

        // Actualizar cache inmediatamente
        this.cache.n8n_api_key = apiKey;
        this.cache.n8n_configured = true;
        if (superAdminId) this.cache.super_admin_id = superAdminId;
        this.cache.lastFetch = Date.now();

        logger.info('✅ N8N_API_KEY actualizado en BD y cache');
        return result;
    }

    /**
     * ================================================================
     * 📊 OBTENER CONFIGURACIÓN COMPLETA
     * ================================================================
     * Retorna toda la configuración del sistema
     *
     * @returns {Promise<object|null>} Configuración completa o null
     */
    async getFullConfig() {
        return await RLSContextManager.withBypass(async (db) => {
            const result = await db.query(`
                SELECT * FROM configuracion_sistema WHERE id = 1
            `);
            return result.rows[0] || null;
        });
    }

    /**
     * ================================================================
     * 🗑️ INVALIDAR CACHE (MANUAL)
     * ================================================================
     * Fuerza re-fetch desde BD en próxima llamada
     */
    invalidateCache() {
        this.cache.n8n_api_key = null;
        this.cache.lastFetch = null;
        logger.info('ConfigService: Cache invalidado');
    }

    /**
     * ================================================================
     * ✅ VERIFICAR SI N8N ESTÁ CONFIGURADO
     * ================================================================
     * Verifica si n8n fue configurado correctamente
     *
     * @returns {Promise<boolean>} true si n8n está configurado
     */
    async isN8nConfigured() {
        const config = await this.getFullConfig();
        return config?.n8n_configured || false;
    }
}

// Singleton: Una sola instancia compartida
module.exports = new ConfigService();

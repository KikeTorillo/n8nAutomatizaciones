/**
 * @fileoverview Servicio de Token Blacklist con Redis
 *
 * Gestiona la blacklist de tokens JWT revocados usando Redis (DB 3) para persistencia.
 * Reemplaza el Set en memoria por un almacenamiento persistente y compartido entre instancias.
 *
 * Características:
 * - Persistencia en Redis (sobrevive a restarts)
 * - Compartido entre múltiples instancias (horizontal scaling)
 * - TTL automático (Redis elimina tokens expirados)
 * - Fallback en memoria si Redis falla
 *
 * @author Backend Team
 * @version 1.0.0
 * @since 2025-11-06
 */

const redis = require('redis');
const logger = require('../utils/logger');

/**
 * Servicio de Token Blacklist
 *
 * Gestiona tokens JWT revocados en Redis DB 3 con fallback en memoria.
 * Garantiza que tokens revocados permanezcan inválidos incluso después
 * de restarts del servidor o en arquitecturas multi-instancia.
 *
 * @class TokenBlacklistService
 */
class TokenBlacklistService {
    /**
     * Inicializa el servicio de token blacklist
     *
     * Configura la conexión a Redis DB 3 y un Set de fallback en memoria.
     */
    constructor() {
        /** @type {import('redis').RedisClientType|null} Cliente Redis para blacklist */
        this.redisClient = null;

        /** @type {Set<string>} Almacén de fallback en memoria si Redis falla */
        this.fallbackStore = new Set();

        /** @type {boolean} Indica si el servicio está inicializado */
        this.isInitialized = false;

        // Inicializar conexión Redis de forma asíncrona
        this.initRedis();
    }

    /**
     * Inicializa la conexión a Redis para blacklist
     *
     * Se conecta a la base de datos 3 de Redis, dedicada exclusivamente
     * para almacenar tokens blacklisted. Si falla, usa fallback en memoria.
     *
     * @async
     * @private
     * @throws {Error} Si hay problemas de conexión (manejado con fallback)
     */
    async initRedis() {
        try {
            // Solo intentar conectar Redis si está configurado
            if (process.env.REDIS_HOST) {
                this.redisClient = redis.createClient({
                    socket: {
                        host: process.env.REDIS_HOST || 'localhost',
                        port: parseInt(process.env.REDIS_PORT) || 6379
                    },
                    password: process.env.REDIS_PASSWORD || undefined,
                    database: 3 // DB 3: Dedicada exclusivamente para token blacklist
                });

                // Event listeners para debugging
                this.redisClient.on('error', (err) => {
                    logger.error('Redis Token Blacklist error', { error: err.message });
                });

                this.redisClient.on('connect', () => {
                    logger.debug('Redis Token Blacklist conectando...');
                });

                this.redisClient.on('ready', () => {
                    logger.info('Redis Token Blacklist listo');
                    this.isInitialized = true;
                });

                await this.redisClient.connect();
                logger.info('✅ Cliente Redis de token blacklist conectado (DB 3)', {
                    host: process.env.REDIS_HOST,
                    port: process.env.REDIS_PORT,
                    database: 3
                });
            } else {
                logger.warn('⚠️ Redis no configurado, usando almacenamiento en memoria para token blacklist');
                this.isInitialized = true;
            }
        } catch (error) {
            logger.warn('Redis no disponible para token blacklist, usando fallback en memoria', {
                error: error.message
            });
            this.redisClient = null;
            this.isInitialized = true;
        }
    }

    /**
     * Agrega un token a la blacklist
     *
     * @async
     * @param {string} token - Token JWT a blacklist
     * @param {number|null} expirationSeconds - Segundos hasta que expire el token (para TTL automático)
     * @returns {Promise<boolean>} true si se agregó exitosamente
     * @example
     * await tokenBlacklistService.add('eyJhbGciOi...', 604800); // 7 días
     */
    async add(token, expirationSeconds = null) {
        try {
            // Validar que el token sea válido
            if (!token || typeof token !== 'string') {
                logger.warn('Intento de agregar token inválido a blacklist', {
                    tokenType: typeof token,
                    tokenValue: token
                });
                return false;
            }

            // Si Redis está disponible, usarlo
            if (this.redisClient && this.redisClient.isReady) {
                const key = `blacklist:${token}`;

                // Si tenemos TTL, configurarlo; sino, usar default de 7 días
                const ttl = expirationSeconds || 604800; // 7 días por defecto

                await this.redisClient.set(key, '1', {
                    EX: ttl // Expire automáticamente cuando el token expiraría
                });

                logger.debug('Token agregado a blacklist (Redis)', {
                    token: token.substring(0, 20) + '...',
                    ttl: ttl
                });

                return true;
            } else {
                // Fallback: Usar Set en memoria
                this.fallbackStore.add(token);

                // Auto-limpieza si hay TTL
                if (expirationSeconds) {
                    setTimeout(() => {
                        this.fallbackStore.delete(token);
                        logger.debug('Token removido automáticamente de blacklist (memoria)', {
                            token: token.substring(0, 20) + '...'
                        });
                    }, expirationSeconds * 1000);
                }

                logger.debug('Token agregado a blacklist (memoria fallback)', {
                    token: token.substring(0, 20) + '...',
                    blacklistSize: this.fallbackStore.size
                });

                return true;
            }
        } catch (error) {
            logger.error('Error agregando token a blacklist', {
                error: error.message,
                token: token ? token.substring(0, 20) + '...' : 'null/undefined'
            });

            // En caso de error, usar fallback solo si token es válido
            if (token) {
                this.fallbackStore.add(token);
            }
            return false;
        }
    }

    /**
     * Verifica si un token está en la blacklist
     *
     * @async
     * @param {string} token - Token JWT a verificar
     * @returns {Promise<boolean>} true si está blacklisted, false si no
     * @example
     * const isBlacklisted = await tokenBlacklistService.check('eyJhbGciOi...');
     * if (isBlacklisted) {
     *   return res.status(401).json({ error: 'Token revocado' });
     * }
     */
    async check(token) {
        try {
            // Si Redis está disponible, usarlo
            if (this.redisClient && this.redisClient.isReady) {
                const key = `blacklist:${token}`;
                const exists = await this.redisClient.exists(key);

                return exists === 1; // exists retorna 1 si existe, 0 si no
            } else {
                // Fallback: Usar Set en memoria
                return this.fallbackStore.has(token);
            }
        } catch (error) {
            logger.error('Error verificando blacklist', {
                error: error.message,
                token: token.substring(0, 20) + '...'
            });

            // Fail-open: En caso de error, consultar fallback
            // Si tampoco está en fallback, permitir el token (disponibilidad > seguridad en este caso)
            return this.fallbackStore.has(token);
        }
    }

    /**
     * Elimina un token de la blacklist
     *
     * @async
     * @param {string} token - Token JWT a remover
     * @returns {Promise<boolean>} true si se removió exitosamente
     * @example
     * await tokenBlacklistService.remove('eyJhbGciOi...');
     */
    async remove(token) {
        try {
            if (this.redisClient && this.redisClient.isReady) {
                const key = `blacklist:${token}`;
                await this.redisClient.del(key);
                return true;
            } else {
                this.fallbackStore.delete(token);
                return true;
            }
        } catch (error) {
            logger.error('Error removiendo token de blacklist', {
                error: error.message,
                token: token.substring(0, 20) + '...'
            });
            return false;
        }
    }

    /**
     * Obtiene el tamaño de la blacklist
     *
     * @async
     * @returns {Promise<number>} Número de tokens en blacklist
     * @example
     * const size = await tokenBlacklistService.size();
     * console.log(`Tokens blacklisted: ${size}`);
     */
    async size() {
        try {
            if (this.redisClient && this.redisClient.isReady) {
                // Contar keys que empiezan con "blacklist:"
                const keys = await this.redisClient.keys('blacklist:*');
                return keys.length;
            } else {
                return this.fallbackStore.size;
            }
        } catch (error) {
            logger.error('Error obteniendo tamaño de blacklist', { error: error.message });
            return this.fallbackStore.size;
        }
    }

    /**
     * Limpia toda la blacklist
     *
     * ⚠️ CUIDADO: Esta operación elimina TODOS los tokens blacklisted.
     * Solo usar en testing o mantenimiento.
     *
     * @async
     * @returns {Promise<boolean>} true si se limpió exitosamente
     * @example
     * await tokenBlacklistService.clear(); // Solo en tests
     */
    async clear() {
        try {
            if (this.redisClient && this.redisClient.isReady) {
                const keys = await this.redisClient.keys('blacklist:*');
                if (keys.length > 0) {
                    await this.redisClient.del(keys);
                }
                logger.info('Blacklist limpiada (Redis)', { tokensRemoved: keys.length });
            }

            this.fallbackStore.clear();
            logger.info('Blacklist limpiada (memoria)');

            return true;
        } catch (error) {
            logger.error('Error limpiando blacklist', { error: error.message });
            return false;
        }
    }

    /**
     * Cierra la conexión a Redis
     *
     * Debe llamarse durante el graceful shutdown del servidor.
     *
     * @async
     * @returns {Promise<void>}
     * @example
     * await tokenBlacklistService.close();
     */
    async close() {
        try {
            if (this.redisClient && this.redisClient.isOpen) {
                await this.redisClient.quit();
                logger.info('✅ Cliente Redis de token blacklist cerrado');
            }
        } catch (error) {
            logger.error('Error cerrando cliente Redis de blacklist', {
                error: error.message
            });
        }
    }
}

// Exportar instancia singleton
const tokenBlacklistService = new TokenBlacklistService();

module.exports = tokenBlacklistService;

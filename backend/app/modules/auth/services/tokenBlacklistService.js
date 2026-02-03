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
 * @version 1.1.0 (Ene 2026: Refactorizado para usar RedisClientFactory)
 * @since 2025-11-06
 */

const RedisClientFactory = require('../../../services/RedisClientFactory');
const logger = require('../../../utils/logger');

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

        /** @type {Map<string, NodeJS.Timeout>} Tracking de timeouts para cleanup */
        this.timeoutIds = new Map();

        /** @type {Map<number, number>} Usuarios invalidados (fallback en memoria) */
        this.invalidatedUsers = new Map();

        // Inicializar conexión Redis de forma asíncrona
        this.initRedis();
    }

    /**
     * Inicializa la conexión a Redis para blacklist
     *
     * Usa RedisClientFactory para obtener cliente de DB 3.
     * Si falla, usa fallback en memoria.
     *
     * @async
     * @private
     */
    async initRedis() {
        try {
            // Usar RedisClientFactory para obtener cliente
            this.redisClient = await RedisClientFactory.getClient(3, 'TokenBlacklist');

            if (this.redisClient) {
                logger.info('[TokenBlacklist] Redis conectado (DB 3)');
            } else {
                logger.warn('[TokenBlacklist] Redis no disponible, usando fallback en memoria');
            }

            this.isInitialized = true;
        } catch (error) {
            logger.warn('[TokenBlacklist] Redis no disponible, usando fallback en memoria', {
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

                // ✅ SECURITY FIX v2.1: Reducir TTL de 7 días a 2 días
                // Tokens con TTL más largo son un riesgo de seguridad
                const ttl = expirationSeconds || 172800; // 2 días por defecto

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

                // Auto-limpieza si hay TTL (con tracking para cleanup)
                if (expirationSeconds) {
                    const timeoutKey = `token:${token}`;
                    // Limpiar timeout anterior si existe
                    if (this.timeoutIds.has(timeoutKey)) {
                        clearTimeout(this.timeoutIds.get(timeoutKey));
                    }
                    const timeoutId = setTimeout(() => {
                        this.fallbackStore.delete(token);
                        this.timeoutIds.delete(timeoutKey);
                        logger.debug('Token removido automáticamente de blacklist (memoria)', {
                            token: token.substring(0, 20) + '...'
                        });
                    }, expirationSeconds * 1000);
                    this.timeoutIds.set(timeoutKey, timeoutId);
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
     * SECURITY FIX (Ene 2026): Fail-Closed
     * Si Redis falla y no hay fallback disponible, lanzar error
     * para rechazar el request (seguridad > disponibilidad)
     *
     * @async
     * @param {string} token - Token JWT a verificar
     * @returns {Promise<boolean>} true si está blacklisted, false si no
     * @throws {Error} Si no se puede verificar blacklist (fail-closed)
     * @example
     * const isBlacklisted = await tokenBlacklistService.check('eyJhbGciOi...');
     * if (isBlacklisted) {
     *   return res.status(401).json({ error: 'Token revocado' });
     * }
     */
    async check(token) {
        // Si Redis está disponible, usarlo
        if (this.redisClient && this.redisClient.isReady) {
            try {
                const key = `blacklist:${token}`;
                const exists = await this.redisClient.exists(key);
                return exists === 1;
            } catch (error) {
                logger.error('Error CRÍTICO verificando blacklist en Redis - Fail-closed', {
                    error: error.message,
                    token: token.substring(0, 20) + '...'
                });
                // SECURITY: Fail-closed - lanzar error si Redis falla
                const blacklistError = new Error('Servicio de blacklist no disponible');
                blacklistError.statusCode = 503;
                blacklistError.code = 'BLACKLIST_SERVICE_UNAVAILABLE';
                throw blacklistError;
            }
        }

        // Si Redis no está configurado, usar fallback en memoria
        // (Este es un caso válido para desarrollo/testing)
        if (!process.env.REDIS_HOST) {
            return this.fallbackStore.has(token);
        }

        // Si Redis estaba configurado pero no está listo, fail-closed
        logger.error('Redis configurado pero no disponible - Fail-closed', {
            redisHost: process.env.REDIS_HOST,
            isReady: this.redisClient?.isReady
        });
        const blacklistError = new Error('Servicio de blacklist no disponible');
        blacklistError.statusCode = 503;
        blacklistError.code = 'BLACKLIST_SERVICE_UNAVAILABLE';
        throw blacklistError;
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

    // ========================================
    // SECURITY FIX (Ene 2026): Invalidación de tokens por usuario
    // Cuando cambian permisos/rol, invalida todos los tokens del usuario
    // ========================================

    /**
     * Invalida todos los tokens de un usuario
     * Los tokens emitidos antes de este timestamp serán rechazados
     *
     * @async
     * @param {number} userId - ID del usuario
     * @param {string} motivo - Razón de la invalidación (para logging)
     * @returns {Promise<boolean>} true si se registró la invalidación
     * @example
     * await tokenBlacklistService.invalidateUserTokens(123, 'cambio_rol_empleado_a_admin');
     */
    async invalidateUserTokens(userId, motivo = 'cambio_permisos') {
        const key = `invalidated_user:${userId}`;
        const timestamp = Math.floor(Date.now() / 1000);

        try {
            if (this.redisClient && this.redisClient.isReady) {
                // TTL de 24 horas - tokens tienen max 7 días pero refresh regenera
                await this.redisClient.set(key, timestamp.toString(), { EX: 86400 });

                logger.info('[TokenBlacklist] Tokens de usuario invalidados (Redis)', {
                    usuario_id: userId,
                    motivo,
                    invalidated_at: timestamp
                });
            } else {
                // Fallback en memoria
                this.invalidatedUsers.set(userId, timestamp);

                // Auto-limpieza después de 24 horas (con tracking para cleanup)
                const timeoutKey = `user:${userId}`;
                // Limpiar timeout anterior si existe
                if (this.timeoutIds.has(timeoutKey)) {
                    clearTimeout(this.timeoutIds.get(timeoutKey));
                }
                const timeoutId = setTimeout(() => {
                    this.invalidatedUsers.delete(userId);
                    this.timeoutIds.delete(timeoutKey);
                }, 86400000);
                this.timeoutIds.set(timeoutKey, timeoutId);

                logger.info('[TokenBlacklist] Tokens de usuario invalidados (memoria)', {
                    usuario_id: userId,
                    motivo,
                    invalidated_at: timestamp
                });
            }

            return true;
        } catch (error) {
            logger.error('[TokenBlacklist] Error invalidando tokens de usuario', {
                error: error.message,
                usuario_id: userId,
                motivo
            });
            // En caso de error, aún intentar fallback en memoria (sin timeout tracking para simplificar)
            this.invalidatedUsers.set(userId, timestamp);
            return true;
        }
    }

    /**
     * Verifica si los tokens del usuario fueron invalidados
     *
     * @async
     * @param {number} userId - ID del usuario
     * @param {number} tokenIat - Timestamp de emisión del token (iat claim)
     * @returns {Promise<boolean>} true si el token fue invalidado (emitido antes de invalidación)
     * @example
     * const invalidated = await tokenBlacklistService.isUserTokenInvalidated(123, decoded.iat);
     * if (invalidated) {
     *   return res.status(401).json({ error: 'Sesión invalidada' });
     * }
     */
    async isUserTokenInvalidated(userId, tokenIat) {
        const key = `invalidated_user:${userId}`;

        try {
            if (this.redisClient && this.redisClient.isReady) {
                const invalidatedAt = await this.redisClient.get(key);

                if (invalidatedAt) {
                    const isInvalidated = tokenIat < parseInt(invalidatedAt);

                    if (isInvalidated) {
                        logger.debug('[TokenBlacklist] Token invalidado por cambio de permisos', {
                            usuario_id: userId,
                            token_iat: tokenIat,
                            invalidated_at: parseInt(invalidatedAt)
                        });
                    }

                    return isInvalidated;
                }
            } else if (this.invalidatedUsers?.has(userId)) {
                // Fallback en memoria
                const invalidatedAt = this.invalidatedUsers.get(userId);
                return tokenIat < invalidatedAt;
            }

            return false;
        } catch (error) {
            logger.error('[TokenBlacklist] Error verificando invalidación de usuario', {
                error: error.message,
                usuario_id: userId
            });
            // En error, verificar fallback
            if (this.invalidatedUsers?.has(userId)) {
                return tokenIat < this.invalidatedUsers.get(userId);
            }
            return false;
        }
    }

    /**
     * Cierra el servicio de blacklist
     *
     * Debe llamarse durante el graceful shutdown del servidor.
     * El cliente Redis es gestionado por RedisClientFactory.
     *
     * @async
     * @returns {Promise<void>}
     * @example
     * await tokenBlacklistService.close();
     */
    async close() {
        try {
            // Limpiar todos los timeouts rastreados
            for (const [key, timeoutId] of this.timeoutIds.entries()) {
                clearTimeout(timeoutId);
            }
            this.timeoutIds.clear();

            // Limpiar estructuras de datos en memoria
            this.fallbackStore.clear();
            this.invalidatedUsers.clear();

            // El cliente Redis es gestionado por RedisClientFactory
            // No cerrarlo aquí para permitir reutilización
            this.redisClient = null;
            this.isInitialized = false;

            logger.info('[TokenBlacklist] Servicio cerrado');
        } catch (error) {
            logger.error('[TokenBlacklist] Error cerrando servicio', {
                error: error.message
            });
        }
    }
}

// Exportar instancia singleton
const tokenBlacklistService = new TokenBlacklistService();

module.exports = tokenBlacklistService;

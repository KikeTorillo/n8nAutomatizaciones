/**
 * @fileoverview Servicio de Cache de Permisos con Redis Pub/Sub
 *
 * Sistema de cache híbrido para permisos de usuario:
 * - Redis (DB 4) para cache distribuido entre instancias
 * - Pub/Sub para invalidación en tiempo real
 * - Map local como fallback si Redis falla
 *
 * Beneficios:
 * - Reduce queries a PostgreSQL para verificación de permisos
 * - Sincroniza invalidación entre múltiples instancias del backend
 * - TTL automático para evitar datos obsoletos
 *
 * Canales Pub/Sub:
 * - permisos:invalidacion - Mensajes de invalidación de cache
 *
 * @author Backend Team
 * @version 1.1.0 (Ene 2026: Refactorizado para usar RedisClientFactory)
 * @since 2026-01-17
 */

const RedisClientFactory = require('./RedisClientFactory');
const logger = require('../utils/logger');

/**
 * Canal de Pub/Sub para invalidación de permisos
 * @constant {string}
 */
const CHANNEL_INVALIDACION = 'permisos:invalidacion';

/**
 * TTL del cache en segundos (5 minutos)
 * @constant {number}
 */
const CACHE_TTL_SECONDS = 5 * 60;

/**
 * TTL del cache en milisegundos para el Map local
 * @constant {number}
 */
const CACHE_TTL_MS = CACHE_TTL_SECONDS * 1000;

/**
 * Servicio de Cache de Permisos
 *
 * Gestiona el cache de permisos usando Redis DB 4 con Pub/Sub para
 * invalidación distribuida. Incluye fallback a Map local si Redis falla.
 *
 * @class PermisosCacheService
 */
class PermisosCacheService {
    /**
     * Inicializa el servicio de cache de permisos
     */
    constructor() {
        /** @type {import('redis').RedisClientType|null} Cliente Redis para cache */
        this.redisClient = null;

        /** @type {import('redis').RedisClientType|null} Cliente Redis para suscriptor Pub/Sub */
        this.subscriberClient = null;

        /** @type {Map<string, {valor: any, timestamp: number}>} Cache local (fallback) */
        this.localCache = new Map();

        /** @type {boolean} Indica si el servicio está inicializado */
        this.isInitialized = false;

        /** @type {boolean} Indica si Redis está disponible */
        this.redisAvailable = false;

        // Inicializar conexión Redis de forma asíncrona
        this.initRedis();

        // Limpieza periódica del cache local (cada 10 minutos)
        this.cleanupInterval = setInterval(() => this.cleanupLocalCache(), 10 * 60 * 1000);
    }

    /**
     * Inicializa la conexión a Redis para cache de permisos
     *
     * Usa RedisClientFactory para obtener cliente de DB 4.
     * Configura también el suscriptor Pub/Sub para invalidación distribuida.
     *
     * @async
     * @private
     */
    async initRedis() {
        try {
            // Usar RedisClientFactory para obtener cliente
            this.redisClient = await RedisClientFactory.getClient(4, 'PermisosCacheService');

            if (!this.redisClient) {
                logger.info('[PermisosCacheService] Redis no disponible, usando cache local');
                this.isInitialized = true;
                return;
            }

            this.redisAvailable = true;

            // Cliente separado para suscripción Pub/Sub
            this.subscriberClient = await RedisClientFactory.createSubscriber(4, 'PermisosPubSub');

            if (this.subscriberClient) {
                // Suscribirse al canal de invalidación
                await this.subscriberClient.subscribe(CHANNEL_INVALIDACION, (message) => {
                    this.handleInvalidacionMessage(message);
                });

                logger.info('[PermisosCacheService] Suscrito a canal de invalidación', {
                    channel: CHANNEL_INVALIDACION
                });
            }

            this.isInitialized = true;

        } catch (error) {
            logger.warn('[PermisosCacheService] Redis no disponible, usando cache local', {
                error: error.message
            });
            this.redisClient = null;
            this.subscriberClient = null;
            this.redisAvailable = false;
            this.isInitialized = true;
        }
    }

    /**
     * Genera clave de cache para un permiso
     * @private
     * @param {number} usuarioId
     * @param {number} sucursalId
     * @param {string} codigoPermiso
     * @returns {string}
     */
    getCacheKey(usuarioId, sucursalId, codigoPermiso) {
        return `permisos:${usuarioId}:${sucursalId}:${codigoPermiso}`;
    }

    /**
     * Obtiene un valor del cache
     *
     * @async
     * @param {number} usuarioId
     * @param {number} sucursalId
     * @param {string} codigoPermiso
     * @returns {Promise<{valor: any, found: boolean}>}
     */
    async get(usuarioId, sucursalId, codigoPermiso) {
        const key = this.getCacheKey(usuarioId, sucursalId, codigoPermiso);

        try {
            // Intentar Redis primero
            if (this.redisClient && this.redisAvailable) {
                const cached = await this.redisClient.get(key);
                if (cached !== null) {
                    return { valor: JSON.parse(cached), found: true };
                }
                return { valor: null, found: false };
            }
        } catch (error) {
            logger.debug('[PermisosCacheService] Error leyendo de Redis, usando cache local', {
                error: error.message
            });
        }

        // Fallback: cache local
        const localEntry = this.localCache.get(key);
        if (localEntry && Date.now() - localEntry.timestamp < CACHE_TTL_MS) {
            return { valor: localEntry.valor, found: true };
        }

        return { valor: null, found: false };
    }

    /**
     * Guarda un valor en el cache
     *
     * @async
     * @param {number} usuarioId
     * @param {number} sucursalId
     * @param {string} codigoPermiso
     * @param {any} valor
     * @returns {Promise<void>}
     */
    async set(usuarioId, sucursalId, codigoPermiso, valor) {
        const key = this.getCacheKey(usuarioId, sucursalId, codigoPermiso);

        try {
            // Intentar Redis primero
            if (this.redisClient && this.redisAvailable) {
                await this.redisClient.set(key, JSON.stringify(valor), {
                    EX: CACHE_TTL_SECONDS
                });
            }
        } catch (error) {
            logger.debug('[PermisosCacheService] Error escribiendo a Redis', {
                error: error.message
            });
        }

        // Siempre guardar en cache local también (como backup)
        this.localCache.set(key, {
            valor,
            timestamp: Date.now()
        });
    }

    /**
     * Invalida el cache de un usuario espec\u00edfico
     *
     * Publica mensaje de invalidaci\u00f3n para sincronizar todas las instancias.
     *
     * ORDEN CR\u00cdTICO para evitar race conditions:
     * 1. Invalidar local PRIMERO (esta instancia deja de usar cache viejo)
     * 2. Invalidar Redis SEGUNDO (otras instancias leen el nuevo estado)
     * 3. Publicar mensaje \u00daLTIMO (notificar a otras instancias)
     *
     * @async
     * @param {number} usuarioId
     */
    async invalidarUsuario(usuarioId) {
        const version = Date.now();
        logger.debug('[PermisosCacheService] Invalidando cache de usuario', { usuarioId, version });

        // 1. Invalidar local PRIMERO
        this.invalidarUsuarioLocal(usuarioId);

        // 2. Invalidar en Redis SEGUNDO
        await this.invalidarUsuarioRedis(usuarioId);

        // 3. Publicar mensaje de invalidaci\u00f3n \u00daLTIMO
        await this.publicarInvalidacion({ tipo: 'usuario', usuarioId, version });
    }

    /**
     * Invalida el cache de una sucursal espec\u00edfica
     *
     * ORDEN CR\u00cdTICO para evitar race conditions:
     * 1. Invalidar local PRIMERO
     * 2. Invalidar Redis SEGUNDO
     * 3. Publicar mensaje \u00daLTIMO
     *
     * @async
     * @param {number} sucursalId
     */
    async invalidarSucursal(sucursalId) {
        const version = Date.now();
        logger.debug('[PermisosCacheService] Invalidando cache de sucursal', { sucursalId, version });

        // 1. Invalidar local PRIMERO
        this.invalidarSucursalLocal(sucursalId);

        // 2. Invalidar en Redis SEGUNDO
        await this.invalidarSucursalRedis(sucursalId);

        // 3. Publicar mensaje de invalidaci\u00f3n \u00daLTIMO
        await this.publicarInvalidacion({ tipo: 'sucursal', sucursalId, version });
    }

    /**
     * Invalida todo el cache de permisos
     *
     * ORDEN CR\u00cdTICO para evitar race conditions:
     * 1. Invalidar local PRIMERO
     * 2. Invalidar Redis SEGUNDO
     * 3. Publicar mensaje \u00daLTIMO
     *
     * @async
     */
    async invalidarTodo() {
        const version = Date.now();
        logger.debug('[PermisosCacheService] Invalidando todo el cache', { version });

        // 1. Invalidar local PRIMERO
        this.localCache.clear();

        // 2. Invalidar en Redis SEGUNDO
        await this.invalidarTodoRedis();

        // 3. Publicar mensaje de invalidaci\u00f3n \u00daLTIMO
        await this.publicarInvalidacion({ tipo: 'global', version });
    }

    /**
     * Publica mensaje de invalidación via Pub/Sub
     *
     * @private
     * @async
     * @param {Object} mensaje - Mensaje de invalidación
     */
    async publicarInvalidacion(mensaje) {
        try {
            if (this.redisClient && this.redisAvailable) {
                await this.redisClient.publish(
                    CHANNEL_INVALIDACION,
                    JSON.stringify({
                        ...mensaje,
                        timestamp: Date.now(),
                        instanceId: process.pid // Identificar instancia origen
                    })
                );
            }
        } catch (error) {
            logger.error('[PermisosCacheService] Error publicando invalidación', {
                error: error.message
            });
        }
    }

    /**
     * Maneja mensajes de invalidación recibidos via Pub/Sub
     *
     * @private
     * @param {string} message - Mensaje JSON recibido
     */
    handleInvalidacionMessage(message) {
        try {
            const data = JSON.parse(message);

            // Ignorar mensajes de esta misma instancia (ya procesados)
            if (data.instanceId === process.pid) {
                return;
            }

            logger.debug('[PermisosCacheService] Mensaje de invalidación recibido', {
                tipo: data.tipo,
                fromInstance: data.instanceId
            });

            switch (data.tipo) {
                case 'usuario':
                    this.invalidarUsuarioLocal(data.usuarioId);
                    break;
                case 'sucursal':
                    this.invalidarSucursalLocal(data.sucursalId);
                    break;
                case 'global':
                    this.localCache.clear();
                    break;
                default:
                    logger.warn('[PermisosCacheService] Tipo de invalidación desconocido', {
                        tipo: data.tipo
                    });
            }
        } catch (error) {
            logger.error('[PermisosCacheService] Error procesando mensaje de invalidación', {
                error: error.message,
                message
            });
        }
    }

    /**
     * Invalida cache local de un usuario
     * @private
     */
    invalidarUsuarioLocal(usuarioId) {
        const prefix = `permisos:${usuarioId}:`;
        for (const key of this.localCache.keys()) {
            if (key.startsWith(prefix)) {
                this.localCache.delete(key);
            }
        }
    }

    /**
     * Invalida cache local de una sucursal
     * @private
     */
    invalidarSucursalLocal(sucursalId) {
        const pattern = `:${sucursalId}:`;
        for (const key of this.localCache.keys()) {
            if (key.includes(pattern)) {
                this.localCache.delete(key);
            }
        }
    }

    /**
     * Invalida cache Redis de un usuario
     * @private
     * @async
     */
    async invalidarUsuarioRedis(usuarioId) {
        try {
            if (this.redisClient && this.redisAvailable) {
                const keys = await this.redisClient.keys(`permisos:${usuarioId}:*`);
                if (keys.length > 0) {
                    await this.redisClient.del(keys);
                }
            }
        } catch (error) {
            logger.debug('[PermisosCacheService] Error invalidando en Redis', {
                error: error.message
            });
        }
    }

    /**
     * Invalida cache Redis de una sucursal
     * @private
     * @async
     */
    async invalidarSucursalRedis(sucursalId) {
        try {
            if (this.redisClient && this.redisAvailable) {
                const keys = await this.redisClient.keys(`permisos:*:${sucursalId}:*`);
                if (keys.length > 0) {
                    await this.redisClient.del(keys);
                }
            }
        } catch (error) {
            logger.debug('[PermisosCacheService] Error invalidando sucursal en Redis', {
                error: error.message
            });
        }
    }

    /**
     * Invalida todo el cache en Redis
     * @private
     * @async
     */
    async invalidarTodoRedis() {
        try {
            if (this.redisClient && this.redisAvailable) {
                const keys = await this.redisClient.keys('permisos:*');
                if (keys.length > 0) {
                    await this.redisClient.del(keys);
                }
            }
        } catch (error) {
            logger.debug('[PermisosCacheService] Error invalidando todo en Redis', {
                error: error.message
            });
        }
    }

    /**
     * Limpia entradas expiradas del cache local
     * @private
     */
    cleanupLocalCache() {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, entry] of this.localCache.entries()) {
            if (now - entry.timestamp > CACHE_TTL_MS) {
                this.localCache.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.debug('[PermisosCacheService] Cache local limpiado', {
                entriesRemoved: cleaned,
                remainingEntries: this.localCache.size
            });
        }
    }

    /**
     * Obtiene estadísticas del cache
     *
     * @async
     * @returns {Promise<Object>}
     */
    async getStats() {
        const stats = {
            localCacheSize: this.localCache.size,
            redisAvailable: this.redisAvailable,
            redisCacheSize: 0
        };

        try {
            if (this.redisClient && this.redisAvailable) {
                const keys = await this.redisClient.keys('permisos:*');
                stats.redisCacheSize = keys.length;
            }
        } catch (error) {
            logger.debug('[PermisosCacheService] Error obteniendo stats de Redis', {
                error: error.message
            });
        }

        return stats;
    }

    /**
     * Cierra las conexiones a Redis
     *
     * @async
     */
    async close() {
        try {
            if (this.cleanupInterval) {
                clearInterval(this.cleanupInterval);
                this.cleanupInterval = null;
            }

            // Cerrar subscriber propio (no gestionado por Factory)
            if (this.subscriberClient && this.subscriberClient.isOpen) {
                await this.subscriberClient.unsubscribe(CHANNEL_INVALIDACION);
                this.subscriberClient.removeAllListeners();
                await this.subscriberClient.quit();
            }

            // El cliente principal es gestionado por RedisClientFactory
            // No cerrarlo aquí para permitir reutilización

            // Reset de estado para permitir re-inicialización limpia
            this.redisAvailable = false;
            this.isInitialized = false;
            this.redisClient = null;
            this.subscriberClient = null;

            logger.info('[PermisosCacheService] Conexiones cerradas');
        } catch (error) {
            logger.error('[PermisosCacheService] Error cerrando conexiones', {
                error: error.message
            });
        }
    }
}

// Exportar instancia singleton
const permisosCacheService = new PermisosCacheService();

module.exports = permisosCacheService;

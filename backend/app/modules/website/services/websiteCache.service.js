/**
 * @fileoverview Servicio de Cache de Sitios Web con Redis Pub/Sub
 *
 * Sistema de cache para sitios web publicados:
 * - Redis (DB 5) para cache distribuido entre instancias
 * - Pub/Sub para invalidación en tiempo real al publicar
 * - Map local como fallback si Redis falla
 *
 * Beneficios:
 * - Reduce queries complejos (JOINs config + paginas + bloques)
 * - Sincroniza invalidación entre múltiples instancias
 * - TTL automático (5 minutos) para evitar datos obsoletos
 *
 * Canales Pub/Sub:
 * - website:invalidacion - Mensajes de invalidación de cache
 *
 * @author Backend Team
 * @version 1.0.0
 * @since 2026-01-25
 */

const RedisClientFactory = require('../../../services/RedisClientFactory');
const logger = require('../../../utils/logger');

/**
 * Canal de Pub/Sub para invalidación de websites
 * @constant {string}
 */
const CHANNEL_INVALIDACION = 'website:invalidacion';

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
 * Prefijo para claves de cache
 * @constant {string}
 */
const CACHE_PREFIX = 'website:sitio:';

/**
 * Servicio de Cache de Sitios Web
 *
 * Gestiona el cache de sitios publicados usando Redis DB 5 con Pub/Sub para
 * invalidación distribuida. Incluye fallback a Map local si Redis falla.
 *
 * @class WebsiteCacheService
 */
class WebsiteCacheService {
    /**
     * Inicializa el servicio de cache de websites
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
     * Inicializa la conexión a Redis para cache de websites
     *
     * Usa RedisClientFactory para obtener cliente de DB 5.
     * Configura también el suscriptor Pub/Sub para invalidación distribuida.
     *
     * @async
     * @private
     */
    async initRedis() {
        try {
            // Usar RedisClientFactory para obtener cliente DB 5
            this.redisClient = await RedisClientFactory.getClient(5, 'WebsiteCacheService');

            if (!this.redisClient) {
                logger.info('[WebsiteCacheService] Redis no disponible, usando cache local');
                this.isInitialized = true;
                return;
            }

            this.redisAvailable = true;

            // Cliente separado para suscripción Pub/Sub
            this.subscriberClient = await RedisClientFactory.createSubscriber(5, 'WebsitePubSub');

            if (this.subscriberClient) {
                // Suscribirse al canal de invalidación
                await this.subscriberClient.subscribe(CHANNEL_INVALIDACION, (message) => {
                    this.handleInvalidacionMessage(message);
                });

                logger.info('[WebsiteCacheService] Suscrito a canal de invalidación', {
                    channel: CHANNEL_INVALIDACION
                });
            }

            this.isInitialized = true;

        } catch (error) {
            logger.warn('[WebsiteCacheService] Redis no disponible, usando cache local', {
                error: error.message
            });
            this.redisClient = null;
            this.subscriberClient = null;
            this.redisAvailable = false;
            this.isInitialized = true;
        }
    }

    /**
     * Genera clave de cache para un sitio
     * @private
     * @param {string} slug - Slug del sitio
     * @returns {string}
     */
    getCacheKey(slug) {
        return `${CACHE_PREFIX}${slug}`;
    }

    /**
     * Genera clave de cache para una página específica
     * @private
     * @param {string} siteSlug - Slug del sitio
     * @param {string} pageSlug - Slug de la página
     * @returns {string}
     */
    getPageCacheKey(siteSlug, pageSlug) {
        return `${CACHE_PREFIX}${siteSlug}:pagina:${pageSlug}`;
    }

    /**
     * Obtiene un sitio del cache
     *
     * @async
     * @param {string} slug - Slug del sitio
     * @returns {Promise<{valor: any, found: boolean}>}
     */
    async getSitio(slug) {
        const key = this.getCacheKey(slug);

        try {
            // Intentar Redis primero
            if (this.redisClient && this.redisAvailable) {
                const cached = await this.redisClient.get(key);
                if (cached !== null) {
                    logger.debug('[WebsiteCacheService] Cache HIT (Redis)', { slug });
                    return { valor: JSON.parse(cached), found: true };
                }
                return { valor: null, found: false };
            }
        } catch (error) {
            logger.debug('[WebsiteCacheService] Error leyendo de Redis, usando cache local', {
                error: error.message
            });
        }

        // Fallback: cache local
        const localEntry = this.localCache.get(key);
        if (localEntry && Date.now() - localEntry.timestamp < CACHE_TTL_MS) {
            logger.debug('[WebsiteCacheService] Cache HIT (local)', { slug });
            return { valor: localEntry.valor, found: true };
        }

        return { valor: null, found: false };
    }

    /**
     * Obtiene una página del cache
     *
     * @async
     * @param {string} siteSlug - Slug del sitio
     * @param {string} pageSlug - Slug de la página
     * @returns {Promise<{valor: any, found: boolean}>}
     */
    async getPagina(siteSlug, pageSlug) {
        const key = this.getPageCacheKey(siteSlug, pageSlug);

        try {
            if (this.redisClient && this.redisAvailable) {
                const cached = await this.redisClient.get(key);
                if (cached !== null) {
                    logger.debug('[WebsiteCacheService] Page Cache HIT (Redis)', { siteSlug, pageSlug });
                    return { valor: JSON.parse(cached), found: true };
                }
                return { valor: null, found: false };
            }
        } catch (error) {
            logger.debug('[WebsiteCacheService] Error leyendo página de Redis', {
                error: error.message
            });
        }

        // Fallback: cache local
        const localEntry = this.localCache.get(key);
        if (localEntry && Date.now() - localEntry.timestamp < CACHE_TTL_MS) {
            logger.debug('[WebsiteCacheService] Page Cache HIT (local)', { siteSlug, pageSlug });
            return { valor: localEntry.valor, found: true };
        }

        return { valor: null, found: false };
    }

    /**
     * Guarda un sitio en el cache
     *
     * @async
     * @param {string} slug - Slug del sitio
     * @param {Object} valor - Datos del sitio
     * @returns {Promise<void>}
     */
    async setSitio(slug, valor) {
        const key = this.getCacheKey(slug);

        try {
            // Intentar Redis primero
            if (this.redisClient && this.redisAvailable) {
                await this.redisClient.set(key, JSON.stringify(valor), {
                    EX: CACHE_TTL_SECONDS
                });
                logger.debug('[WebsiteCacheService] Cache SET (Redis)', { slug });
            }
        } catch (error) {
            logger.debug('[WebsiteCacheService] Error escribiendo a Redis', {
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
     * Guarda una página en el cache
     *
     * @async
     * @param {string} siteSlug - Slug del sitio
     * @param {string} pageSlug - Slug de la página
     * @param {Object} valor - Datos de la página
     * @returns {Promise<void>}
     */
    async setPagina(siteSlug, pageSlug, valor) {
        const key = this.getPageCacheKey(siteSlug, pageSlug);

        try {
            if (this.redisClient && this.redisAvailable) {
                await this.redisClient.set(key, JSON.stringify(valor), {
                    EX: CACHE_TTL_SECONDS
                });
                logger.debug('[WebsiteCacheService] Page Cache SET (Redis)', { siteSlug, pageSlug });
            }
        } catch (error) {
            logger.debug('[WebsiteCacheService] Error escribiendo página a Redis', {
                error: error.message
            });
        }

        // Siempre guardar en cache local
        this.localCache.set(key, {
            valor,
            timestamp: Date.now()
        });
    }

    /**
     * Invalida el cache de un sitio específico
     *
     * Publica mensaje de invalidación para sincronizar todas las instancias.
     *
     * @async
     * @param {string} slug - Slug del sitio a invalidar
     */
    async invalidarSitio(slug) {
        const version = Date.now();
        logger.info('[WebsiteCacheService] Invalidando cache de sitio', { slug, version });

        // 1. Invalidar local PRIMERO
        this.invalidarSitioLocal(slug);

        // 2. Invalidar en Redis SEGUNDO
        await this.invalidarSitioRedis(slug);

        // 3. Publicar mensaje de invalidación ÚLTIMO
        await this.publicarInvalidacion({ tipo: 'sitio', slug, version });
    }

    /**
     * Invalida el cache por websiteId (usado internamente)
     *
     * @async
     * @param {string} websiteId - UUID del website
     * @param {string} slug - Slug del sitio (si se conoce)
     */
    async invalidarPorWebsiteId(websiteId, slug = null) {
        const version = Date.now();
        logger.info('[WebsiteCacheService] Invalidando cache por websiteId', { websiteId, slug, version });

        if (slug) {
            // Si conocemos el slug, invalidar directamente
            await this.invalidarSitio(slug);
        } else {
            // Invalidar todo (fallback si no conocemos el slug)
            await this.invalidarTodo();
        }
    }

    /**
     * Invalida todo el cache de websites
     *
     * @async
     */
    async invalidarTodo() {
        const version = Date.now();
        logger.info('[WebsiteCacheService] Invalidando todo el cache', { version });

        // 1. Invalidar local PRIMERO
        this.localCache.clear();

        // 2. Invalidar en Redis SEGUNDO
        await this.invalidarTodoRedis();

        // 3. Publicar mensaje de invalidación ÚLTIMO
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
                        instanceId: process.pid
                    })
                );
            }
        } catch (error) {
            logger.error('[WebsiteCacheService] Error publicando invalidación', {
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

            logger.debug('[WebsiteCacheService] Mensaje de invalidación recibido', {
                tipo: data.tipo,
                fromInstance: data.instanceId
            });

            switch (data.tipo) {
                case 'sitio':
                    this.invalidarSitioLocal(data.slug);
                    break;
                case 'global':
                    this.localCache.clear();
                    break;
                default:
                    logger.warn('[WebsiteCacheService] Tipo de invalidación desconocido', {
                        tipo: data.tipo
                    });
            }
        } catch (error) {
            logger.error('[WebsiteCacheService] Error procesando mensaje de invalidación', {
                error: error.message,
                message
            });
        }
    }

    /**
     * Invalida cache local de un sitio
     * @private
     * @param {string} slug - Slug del sitio
     */
    invalidarSitioLocal(slug) {
        const prefix = `${CACHE_PREFIX}${slug}`;
        for (const key of this.localCache.keys()) {
            if (key.startsWith(prefix)) {
                this.localCache.delete(key);
            }
        }
    }

    /**
     * Invalida cache Redis de un sitio
     * @private
     * @async
     * @param {string} slug - Slug del sitio
     */
    async invalidarSitioRedis(slug) {
        try {
            if (this.redisClient && this.redisAvailable) {
                const keys = await this.redisClient.keys(`${CACHE_PREFIX}${slug}*`);
                if (keys.length > 0) {
                    await this.redisClient.del(keys);
                    logger.debug('[WebsiteCacheService] Claves eliminadas de Redis', {
                        slug,
                        count: keys.length
                    });
                }
            }
        } catch (error) {
            logger.debug('[WebsiteCacheService] Error invalidando en Redis', {
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
                const keys = await this.redisClient.keys(`${CACHE_PREFIX}*`);
                if (keys.length > 0) {
                    await this.redisClient.del(keys);
                    logger.debug('[WebsiteCacheService] Todas las claves eliminadas de Redis', {
                        count: keys.length
                    });
                }
            }
        } catch (error) {
            logger.debug('[WebsiteCacheService] Error invalidando todo en Redis', {
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
            logger.debug('[WebsiteCacheService] Cache local limpiado', {
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
                const keys = await this.redisClient.keys(`${CACHE_PREFIX}*`);
                stats.redisCacheSize = keys.length;
            }
        } catch (error) {
            logger.debug('[WebsiteCacheService] Error obteniendo stats de Redis', {
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

            // Reset de estado para permitir re-inicialización limpia
            this.redisAvailable = false;
            this.isInitialized = false;
            this.redisClient = null;
            this.subscriberClient = null;

            logger.info('[WebsiteCacheService] Conexiones cerradas');
        } catch (error) {
            logger.error('[WebsiteCacheService] Error cerrando conexiones', {
                error: error.message
            });
        }
    }
}

// Exportar instancia singleton
const websiteCacheService = new WebsiteCacheService();

module.exports = websiteCacheService;

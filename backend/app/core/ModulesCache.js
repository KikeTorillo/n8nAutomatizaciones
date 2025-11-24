/**
 * @fileoverview Modules Cache - Sistema de Caché de Módulos Activos por Organización
 * @description Cache distribuido con Redis para módulos activos de cada organización
 * @version 1.0.0 (PoC)
 *
 * CARACTERÍSTICAS:
 * - Cache distribuido con Redis (sincronizado entre múltiples instancias)
 * - TTL de 5 minutos (configurable)
 * - Invalidación selectiva por organización
 * - Fallback a query BD si Redis no está disponible
 * - Métricas de hit/miss ratio
 */

const logger = require('../utils/logger');
const RLSContextManager = require('../utils/rlsContextManager');

class ModulesCache {

  /**
   * Cliente Redis (inyectado desde configuración)
   */
  static redisClient = null;

  /**
   * TTL del cache en segundos (5 minutos)
   */
  static TTL_SECONDS = 5 * 60;

  /**
   * Prefijo para keys en Redis
   */
  static KEY_PREFIX = 'modulos_activos:';

  /**
   * Estadísticas de cache
   */
  static stats = {
    hits: 0,
    misses: 0,
    errors: 0,
    invalidations: 0
  };

  /**
   * Cache en memoria como fallback (si Redis no disponible)
   */
  static memoryCache = new Map();

  /**
   * TTL cleanup interval para memory cache
   */
  static cleanupInterval = null;

  // ================================================================
  // CONFIGURACIÓN
  // ================================================================

  /**
   * Inicializa el cache con cliente Redis
   * @param {Object} redisClient - Cliente Redis configurado
   */
  static initialize(redisClient) {
    if (!redisClient) {
      logger.warn('[ModulesCache] ⚠️ Redis no configurado, usando cache en memoria');
      this.startMemoryCacheCleanup();
      return;
    }

    this.redisClient = redisClient;

    // Verificar conexión Redis
    redisClient.ping((err, result) => {
      if (err) {
        logger.error('[ModulesCache] ❌ Error conectando a Redis', { error: err.message });
        this.startMemoryCacheCleanup();
      } else {
        logger.info('[ModulesCache] ✅ Conectado a Redis', { result });
      }
    });
  }

  /**
   * Inicia cleanup periódico de memory cache
   */
  static startMemoryCacheCleanup() {
    if (this.cleanupInterval) {
      return;
    }

    // Limpiar cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.expiresAt < now) {
          this.memoryCache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.debug('[ModulesCache] 🧹 Memory cache cleanup', { cleaned });
      }
    }, this.TTL_SECONDS * 1000);

    logger.info('[ModulesCache] ✅ Memory cache cleanup iniciado');
  }

  // ================================================================
  // OPERACIONES DE CACHE
  // ================================================================

  /**
   * Obtiene módulos activos de una organización
   * @param {number} organizacionId - ID de la organización
   * @returns {Promise<Object>} Objeto con módulos activos { modulo: true/false }
   */
  static async get(organizacionId) {
    if (organizacionId === null || organizacionId === undefined) {
      throw new Error('organizacionId es requerido');
    }

    const cacheKey = `${this.KEY_PREFIX}${organizacionId}`;

    try {
      // Intentar cache Redis primero
      if (this.redisClient) {
        const cached = await this.getFromRedis(cacheKey);

        if (cached) {
          this.stats.hits++;
          logger.debug('[ModulesCache] ✅ Cache HIT (Redis)', {
            organizacion_id: organizacionId,
            hit_rate: this.getHitRate()
          });
          return cached;
        }
      } else {
        // Fallback a memory cache
        const cached = this.getFromMemory(cacheKey);

        if (cached) {
          this.stats.hits++;
          logger.debug('[ModulesCache] ✅ Cache HIT (Memory)', {
            organizacion_id: organizacionId
          });
          return cached;
        }
      }

      // Cache MISS - Query BD
      this.stats.misses++;
      logger.debug('[ModulesCache] ⚠️ Cache MISS', {
        organizacion_id: organizacionId,
        hit_rate: this.getHitRate()
      });

      const modulos = await this.queryActiveModules(organizacionId);

      // Almacenar en cache
      await this.set(organizacionId, modulos);

      return modulos;

    } catch (error) {
      this.stats.errors++;
      logger.error('[ModulesCache] ❌ Error obteniendo módulos', {
        organizacion_id: organizacionId,
        error: error.message
      });

      // En caso de error, query directo a BD sin cache
      return await this.queryActiveModules(organizacionId);
    }
  }

  /**
   * Almacena módulos activos en cache
   * @param {number} organizacionId - ID de la organización
   * @param {Object} modulos - Objeto con módulos activos
   */
  static async set(organizacionId, modulos) {
    const cacheKey = `${this.KEY_PREFIX}${organizacionId}`;

    try {
      if (this.redisClient) {
        await this.setInRedis(cacheKey, modulos);
      } else {
        this.setInMemory(cacheKey, modulos);
      }

      logger.debug('[ModulesCache] ✅ Módulos almacenados en cache', {
        organizacion_id: organizacionId,
        modulos
      });

    } catch (error) {
      logger.error('[ModulesCache] ❌ Error almacenando en cache', {
        organizacion_id: organizacionId,
        error: error.message
      });
    }
  }

  /**
   * Invalida el cache de una organización
   * @param {number} organizacionId - ID de la organización
   */
  static async invalidate(organizacionId) {
    const cacheKey = `${this.KEY_PREFIX}${organizacionId}`;

    try {
      if (this.redisClient) {
        await this.deleteFromRedis(cacheKey);
      } else {
        this.memoryCache.delete(cacheKey);
      }

      this.stats.invalidations++;

      logger.info('[ModulesCache] ✅ Cache invalidado', {
        organizacion_id: organizacionId,
        total_invalidations: this.stats.invalidations
      });

    } catch (error) {
      logger.error('[ModulesCache] ❌ Error invalidando cache', {
        organizacion_id: organizacionId,
        error: error.message
      });
    }
  }

  /**
   * Limpia todo el cache
   */
  static async clear() {
    try {
      if (this.redisClient) {
        // Eliminar todas las keys con el prefijo
        const pattern = `${this.KEY_PREFIX}*`;
        await this.redisClient.keys(pattern, async (err, keys) => {
          if (err) {
            logger.error('[ModulesCache] Error obteniendo keys', { error: err.message });
            return;
          }

          if (keys.length > 0) {
            await this.redisClient.del(...keys);
            logger.info('[ModulesCache] ✅ Cache Redis limpiado', { keys_deleted: keys.length });
          }
        });
      } else {
        this.memoryCache.clear();
        logger.info('[ModulesCache] ✅ Memory cache limpiado');
      }

    } catch (error) {
      logger.error('[ModulesCache] ❌ Error limpiando cache', { error: error.message });
    }
  }

  // ================================================================
  // OPERACIONES REDIS
  // ================================================================

  /**
   * Obtiene valor de Redis
   * @param {string} key - Key de Redis
   * @returns {Promise<Object|null>}
   */
  static async getFromRedis(key) {
    return new Promise((resolve, reject) => {
      this.redisClient.get(key, (err, data) => {
        if (err) {
          reject(err);
        } else if (data) {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            logger.error('[ModulesCache] Error parseando JSON de Redis', { error: error.message });
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Almacena valor en Redis con TTL
   * @param {string} key - Key de Redis
   * @param {Object} value - Valor a almacenar
   */
  static async setInRedis(key, value) {
    return new Promise((resolve, reject) => {
      const serialized = JSON.stringify(value);

      this.redisClient.setex(key, this.TTL_SECONDS, serialized, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Elimina key de Redis
   * @param {string} key - Key de Redis
   */
  static async deleteFromRedis(key) {
    return new Promise((resolve, reject) => {
      this.redisClient.del(key, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // ================================================================
  // OPERACIONES MEMORY CACHE
  // ================================================================

  /**
   * Obtiene valor de memory cache
   * @param {string} key - Key del cache
   * @returns {Object|null}
   */
  static getFromMemory(key) {
    const entry = this.memoryCache.get(key);

    if (!entry) {
      return null;
    }

    // Verificar expiración
    if (entry.expiresAt < Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Almacena valor en memory cache
   * @param {string} key - Key del cache
   * @param {Object} value - Valor a almacenar
   */
  static setInMemory(key, value) {
    const expiresAt = Date.now() + (this.TTL_SECONDS * 1000);

    this.memoryCache.set(key, {
      value,
      expiresAt
    });
  }

  // ================================================================
  // QUERY BASE DE DATOS
  // ================================================================

  /**
   * Consulta módulos activos desde la base de datos
   * @param {number} organizacionId - ID de la organización
   * @returns {Promise<Object>} Módulos activos
   */
  static async queryActiveModules(organizacionId) {
    try {
      logger.debug('[ModulesCache] 🔍 Consultando módulos desde BD', {
        organizacion_id: organizacionId
      });

      // Query con bypass RLS (JOIN multi-tabla)
      const result = await RLSContextManager.withBypass(async (db) => {
        const query = `
          SELECT s.modulos_activos
          FROM subscripciones s
          WHERE s.organizacion_id = $1 AND s.activa = true
          LIMIT 1
        `;

        return await db.query(query, [organizacionId]);
      });

      if (result.rows.length === 0) {
        logger.warn('[ModulesCache] ⚠️ No se encontró subscripción activa', {
          organizacion_id: organizacionId
        });

        // Retornar solo módulo core por defecto
        return { core: true };
      }

      const modulos = result.rows[0].modulos_activos || { core: true };

      logger.debug('[ModulesCache] ✅ Módulos obtenidos de BD', {
        organizacion_id: organizacionId,
        modulos
      });

      return modulos;

    } catch (error) {
      logger.error('[ModulesCache] ❌ Error consultando módulos', {
        organizacion_id: organizacionId,
        error: error.message,
        stack: error.stack
      });

      // Fallback seguro: solo core
      return { core: true };
    }
  }

  // ================================================================
  // ESTADÍSTICAS
  // ================================================================

  /**
   * Obtiene hit rate del cache
   * @returns {number} Hit rate (0-100)
   */
  static getHitRate() {
    const total = this.stats.hits + this.stats.misses;
    if (total === 0) return 0;
    return ((this.stats.hits / total) * 100).toFixed(2);
  }

  /**
   * Obtiene estadísticas del cache
   * @returns {Object} Estadísticas
   */
  static getStats() {
    return {
      ...this.stats,
      hit_rate: this.getHitRate(),
      cache_type: this.redisClient ? 'redis' : 'memory',
      memory_cache_size: this.memoryCache.size,
      ttl_seconds: this.TTL_SECONDS
    };
  }

  /**
   * Resetea estadísticas
   */
  static resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      invalidations: 0
    };
    logger.info('[ModulesCache] 🔄 Estadísticas reseteadas');
  }

  /**
   * Cleanup de recursos (para shutdown)
   */
  static cleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.memoryCache.clear();
    logger.info('[ModulesCache] 🧹 Cleanup completado');
  }
}

module.exports = ModulesCache;

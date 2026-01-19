/**
 * Servicio de cache para validación de sucursal-organización
 * Reduce consultas a BD en middleware de permisos
 *
 * @module services/sucursalCacheService
 * @version 1.0.0
 * @date Enero 2026
 *
 * Características:
 * - Cache en memoria con TTL de 5 minutos
 * - Invalidación por organización
 * - Thread-safe para Node.js single-threaded
 *
 * @example
 * const sucursalCache = require('./sucursalCacheService');
 *
 * // Validar
 * const valida = await sucursalCache.validarSucursalPerteneceAOrg(sucursalId, orgId);
 *
 * // Invalidar cuando cambie una sucursal
 * sucursalCache.invalidarOrganizacion(orgId);
 */

const { getDb } = require('../config/database');
const logger = require('../utils/logger');

class SucursalCacheService {
  constructor() {
    /**
     * Cache Map: key = `${sucursalId}:${orgId}`, value = { valida, timestamp }
     */
    this.cache = new Map();

    /**
     * TTL en milisegundos (5 minutos)
     */
    this.TTL = 5 * 60 * 1000;

    /**
     * Estadísticas de cache
     */
    this.stats = {
      hits: 0,
      misses: 0,
      invalidations: 0
    };

    // Limpiar cache expirado cada minuto
    this.cleanupInterval = setInterval(() => this._cleanup(), 60 * 1000);

    logger.info('[SucursalCacheService] Inicializado', { ttl: this.TTL });
  }

  /**
   * Valida si una sucursal pertenece a una organización
   * Usa cache si está disponible y no expirado
   *
   * @param {number} sucursalId - ID de la sucursal
   * @param {number} orgId - ID de la organización
   * @returns {Promise<boolean>} true si la sucursal pertenece a la organización
   */
  async validarSucursalPerteneceAOrg(sucursalId, orgId) {
    if (!sucursalId || !orgId) {
      return false;
    }

    const key = `${sucursalId}:${orgId}`;
    const cached = this.cache.get(key);

    // Cache hit
    if (cached && (Date.now() - cached.timestamp) < this.TTL) {
      this.stats.hits++;
      return cached.valida;
    }

    // Cache miss - consultar BD
    this.stats.misses++;
    const valida = await this._consultarBD(sucursalId, orgId);

    // Guardar en cache
    this.cache.set(key, {
      valida,
      timestamp: Date.now()
    });

    return valida;
  }

  /**
   * Consulta a BD para validar sucursal-organización
   * @private
   */
  async _consultarBD(sucursalId, orgId) {
    const db = await getDb();
    try {
      // Configurar bypass RLS para esta consulta de validación interna
      await db.query("SELECT set_config('app.bypass_rls', 'true', false)");

      const result = await db.query(
        `SELECT 1 FROM sucursales
         WHERE id = $1 AND organizacion_id = $2 AND activo = true`,
        [sucursalId, orgId]
      );
      return result.rows.length > 0;
    } catch (error) {
      logger.error('[SucursalCacheService] Error consultando BD', {
        error: error.message,
        sucursalId,
        orgId
      });
      // Fail-closed: si no podemos validar, rechazamos
      return false;
    } finally {
      // Limpiar bypass RLS antes de liberar la conexión
      await db.query("SELECT set_config('app.bypass_rls', 'false', false)").catch(() => {});
      db.release();
    }
  }

  /**
   * Invalida todas las entradas de cache para una organización
   * Llamar cuando se modifiquen sucursales de una organización
   *
   * @param {number} orgId - ID de la organización
   */
  invalidarOrganizacion(orgId) {
    let eliminados = 0;

    for (const key of this.cache.keys()) {
      if (key.endsWith(`:${orgId}`)) {
        this.cache.delete(key);
        eliminados++;
      }
    }

    this.stats.invalidations++;

    logger.debug('[SucursalCacheService] Cache invalidado para organización', {
      orgId,
      eliminados
    });
  }

  /**
   * Invalida una entrada específica de cache
   *
   * @param {number} sucursalId - ID de la sucursal
   * @param {number} orgId - ID de la organización
   */
  invalidarSucursal(sucursalId, orgId) {
    const key = `${sucursalId}:${orgId}`;
    this.cache.delete(key);

    logger.debug('[SucursalCacheService] Cache invalidado para sucursal', {
      sucursalId,
      orgId
    });
  }

  /**
   * Invalida todo el cache
   */
  invalidarTodo() {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.invalidations++;

    logger.debug('[SucursalCacheService] Cache global invalidado', { eliminados: size });
  }

  /**
   * Limpia entradas expiradas del cache
   * @private
   */
  _cleanup() {
    const now = Date.now();
    let eliminados = 0;

    for (const [key, value] of this.cache.entries()) {
      if ((now - value.timestamp) >= this.TTL) {
        this.cache.delete(key);
        eliminados++;
      }
    }

    if (eliminados > 0) {
      logger.debug('[SucursalCacheService] Cleanup completado', {
        eliminados,
        restantes: this.cache.size
      });
    }
  }

  /**
   * Obtiene estadísticas del cache
   *
   * @returns {Object} Estadísticas de hits, misses, tamaño, etc.
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: `${hitRate}%`,
      ttl: this.TTL
    };
  }

  /**
   * Cierra el servicio (para tests o shutdown)
   */
  close() {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
    logger.info('[SucursalCacheService] Cerrado');
  }
}

// Singleton
module.exports = new SucursalCacheService();

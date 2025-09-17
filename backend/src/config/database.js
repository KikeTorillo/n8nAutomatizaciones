/**
 * Configuración de base de datos multi-tenant
 * Usa pools de conexiones PostgreSQL nativas para máximo rendimiento
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');

class DatabaseConfig {
  constructor() {
    this.pools = {};
    this.initializePools();
  }

  /**
   * Inicializa pools de conexión para cada base de datos
   */
  initializePools() {
    // Pool principal SaaS
    this.pools.saas = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 20,              // Máximo 20 conexiones
      min: 5,               // Mínimo 5 conexiones
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      application_name: 'saas_backend'
    });

    // Pool para n8n (sincronización)
    this.pools.n8n = new Pool({
      host: process.env.N8N_DB_HOST,
      port: process.env.N8N_DB_PORT,
      database: process.env.N8N_DB_NAME,
      user: process.env.N8N_DB_USER,
      password: process.env.N8N_DB_PASSWORD,
      max: 10,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      application_name: 'saas_n8n_sync'
    });

    // Pool para Evolution API (WhatsApp)
    this.pools.evolution = new Pool({
      host: process.env.EVOLUTION_DB_HOST,
      port: process.env.EVOLUTION_DB_PORT,
      database: process.env.EVOLUTION_DB_NAME,
      user: process.env.EVOLUTION_DB_USER,
      password: process.env.EVOLUTION_DB_PASSWORD,
      max: 8,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      application_name: 'saas_evolution_sync'
    });

    // Pool para Chat Memories (IA)
    this.pools.chat = new Pool({
      host: process.env.CHAT_DB_HOST,
      port: process.env.CHAT_DB_PORT,
      database: process.env.CHAT_DB_NAME,
      user: process.env.CHAT_DB_USER,
      password: process.env.CHAT_DB_PASSWORD,
      max: 5,
      min: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      application_name: 'saas_chat_sync'
    });

    // Configurar event listeners para todos los pools
    Object.entries(this.pools).forEach(([name, pool]) => {
      pool.on('connect', (client) => {
        logger.info(`Nueva conexión establecida a ${name}`, {
          database: name,
          processId: client.processID
        });
      });

      pool.on('error', (err, client) => {
        logger.error(`Error en pool de ${name}`, {
          database: name,
          error: err.message,
          processId: client?.processID
        });
      });

      pool.on('remove', (client) => {
        logger.debug(`Cliente removido del pool ${name}`, {
          database: name,
          processId: client.processID
        });
      });
    });

    logger.info('Pools de base de datos inicializados', {
      pools: Object.keys(this.pools),
      environment: process.env.NODE_ENV
    });
  }

  /**
   * Obtiene el pool de conexiones para una base de datos específica
   * @param {string} database - Nombre de la base de datos ('saas', 'n8n', 'evolution', 'chat')
   * @returns {Pool} Pool de conexiones
   */
  getPool(database = 'saas') {
    const pool = this.pools[database];
    if (!pool) {
      throw new Error(`Pool de base de datos '${database}' no encontrado`);
    }
    return pool;
  }

  /**
   * Ejecuta una consulta en la base de datos principal (SaaS)
   * Incluye automáticamente el contexto multi-tenant
   * @param {string} query - Consulta SQL
   * @param {Array} params - Parámetros de la consulta
   * @param {number} tenantId - ID del tenant (opcional)
   * @returns {Promise<Object>} Resultado de la consulta
   */
  async query(query, params = [], tenantId = null) {
    const pool = this.getPool('saas');
    const client = await pool.connect();

    try {
      // Configurar tenant si se proporciona
      if (tenantId) {
        await client.query('SET app.current_tenant_id = $1', [tenantId]);
      }

      const start = Date.now();
      const result = await client.query(query, params);
      const duration = Date.now() - start;

      // Log para queries lentas (>100ms)
      if (duration > 100) {
        logger.warn('Query lenta detectada', {
          query: query.substring(0, 100) + '...',
          duration,
          rowCount: result.rowCount,
          tenantId
        });
      }

      return result;
    } catch (error) {
      logger.error('Error en consulta SQL', {
        error: error.message,
        query: query.substring(0, 100) + '...',
        params: params.length,
        tenantId
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Ejecuta una consulta en una base de datos específica
   * @param {string} database - Nombre de la base de datos
   * @param {string} query - Consulta SQL
   * @param {Array} params - Parámetros de la consulta
   * @returns {Promise<Object>} Resultado de la consulta
   */
  async queryDatabase(database, query, params = []) {
    const pool = this.getPool(database);
    const client = await pool.connect();

    try {
      const start = Date.now();
      const result = await client.query(query, params);
      const duration = Date.now() - start;

      if (duration > 100) {
        logger.warn(`Query lenta en ${database}`, {
          database,
          query: query.substring(0, 100) + '...',
          duration,
          rowCount: result.rowCount
        });
      }

      return result;
    } catch (error) {
      logger.error(`Error en consulta ${database}`, {
        database,
        error: error.message,
        query: query.substring(0, 100) + '...'
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Ejecuta una transacción en la base de datos principal
   * @param {Function} callback - Función que ejecuta las queries de la transacción
   * @param {number} tenantId - ID del tenant
   * @returns {Promise<any>} Resultado de la transacción
   */
  async transaction(callback, tenantId = null) {
    const pool = this.getPool('saas');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Configurar tenant si se proporciona
      if (tenantId) {
        await client.query('SET app.current_tenant_id = $1', [tenantId]);
      }

      const result = await callback(client);
      await client.query('COMMIT');

      logger.debug('Transacción completada exitosamente', { tenantId });
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error en transacción - rollback ejecutado', {
        error: error.message,
        tenantId
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Verifica la salud de todas las conexiones de base de datos
   * @returns {Promise<Object>} Estado de salud de cada base de datos
   */
  async healthCheck() {
    const results = {};

    for (const [name, pool] of Object.entries(this.pools)) {
      try {
        const client = await pool.connect();
        const result = await client.query('SELECT 1 as health');
        client.release();

        results[name] = {
          status: 'ok',
          connections: {
            total: pool.totalCount,
            idle: pool.idleCount,
            waiting: pool.waitingCount
          }
        };
      } catch (error) {
        results[name] = {
          status: 'error',
          error: error.message
        };
      }
    }

    return results;
  }

  /**
   * Cierra todos los pools de conexión
   */
  async close() {
    logger.info('Cerrando pools de base de datos...');

    for (const [name, pool] of Object.entries(this.pools)) {
      try {
        await pool.end();
        logger.info(`Pool ${name} cerrado correctamente`);
      } catch (error) {
        logger.error(`Error cerrando pool ${name}`, { error: error.message });
      }
    }
  }
}

// Singleton
const database = new DatabaseConfig();

module.exports = database;
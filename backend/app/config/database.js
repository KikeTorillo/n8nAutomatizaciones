/**
 * Configuración de base de datos multi-tenant
 * Usa pools de conexiones PostgreSQL nativas para máximo rendimiento
 */

// Cargar variables de entorno
require('dotenv').config();

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
    // ✅ SEGURIDAD: Validar que se usa el usuario correcto (principio de mínimo privilegio)
    const expectedUser = 'saas_app'; // Usuario limitado con RLS activo
    const currentUser = process.env.DB_USER;

    if (currentUser !== expectedUser) {
      logger.error('🔴 SEGURIDAD: Usuario de BD incorrecto', {
        currentUser: currentUser,
        expectedUser: expectedUser,
        riesgo: 'Usar "admin" permite bypass de RLS y acceso a todos los tenants',
        ambiente: process.env.NODE_ENV
      });

      // En producción, fallar inmediatamente
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          `SEGURIDAD CRÍTICA: DB_USER debe ser '${expectedUser}' en producción. ` +
          `Actual: '${currentUser}'. El usuario 'admin' puede bypass RLS.`
        );
      } else {
        // En desarrollo, advertir pero permitir (facilita debugging)
        logger.warn(`⚠️ ADVERTENCIA: Se recomienda usar '${expectedUser}' en desarrollo también`);
      }
    } else {
      logger.info('✅ Usuario de BD validado correctamente', {
        user: expectedUser,
        ambiente: process.env.NODE_ENV
      });
    }

    // Pool principal SaaS
    this.pools.saas = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: String(process.env.DB_PASSWORD),
      max: 20,              // Máximo 20 conexiones
      min: 5,               // Mínimo 5 conexiones
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      application_name: 'saas_backend'
    });

    // Pool para n8n (sincronización)
    this.pools.n8n = new Pool({
      host: process.env.N8N_DB_HOST,
      port: parseInt(process.env.N8N_DB_PORT),
      database: process.env.N8N_DB_NAME,
      user: process.env.N8N_DB_USER,
      password: String(process.env.N8N_DB_PASSWORD),
      max: 10,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      application_name: 'saas_n8n_sync'
    });

    // Pool para Chat Memories (IA)
    this.pools.chat = new Pool({
      host: process.env.CHAT_DB_HOST,
      port: parseInt(process.env.CHAT_DB_PORT),
      database: process.env.CHAT_DB_NAME,
      user: process.env.CHAT_DB_USER,
      password: String(process.env.CHAT_DB_PASSWORD),
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
   * @param {string} database - Nombre de la base de datos ('saas', 'n8n', 'chat')
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
      // ✅ FIX: Usar set_config en lugar de SET para que sea local a la transacción
      if (tenantId) {
        await client.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', tenantId.toString()]);
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
      // ✅ FIX: Usar set_config en lugar de SET para que sea local a la transacción
      if (tenantId) {
        await client.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', tenantId.toString()]);
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

/**
 * Función helper para obtener una conexión de la base de datos principal (SaaS)
 * Compatible con la interfaz esperada por los modelos
 * @returns {Promise<Object>} Cliente de base de datos
 */
async function getDb() {
  const pool = database.getPool('saas');
  return await pool.connect();
}

/**
 * Función helper para obtener el pool principal directamente
 * @returns {Pool} Pool de conexiones SaaS
 */
function getPool() {
  return database.getPool('saas');
}

module.exports = {
  database,
  getDb,
  getPool,
  // Exportar también las funciones principales del database
  query: (query, params, tenantId) => database.query(query, params, tenantId),
  queryDatabase: (db, query, params) => database.queryDatabase(db, query, params),
  transaction: (callback, tenantId) => database.transaction(callback, tenantId),
  healthCheck: () => database.healthCheck(),
  close: () => database.close()
};
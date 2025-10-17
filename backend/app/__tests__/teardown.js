/**
 * Teardown Global para Tests
 * Limpieza final después de ejecutar toda la suite
 */

const logger = require('../utils/logger');

module.exports = async () => {
  logger.info('🧹 Limpiando recursos de tests...');

  // ✨ LIMPIAR BD ANTES DE CERRAR POOL
  // Esto se ejecuta UNA SOLA VEZ al final de TODOS los tests
  if (global.testPool) {
    try {
      const { cleanAllTables } = require('./helpers/db-helper');
      const client = await global.testPool.connect();

      logger.info('🧹 Limpieza final de BD (globalTeardown)...');
      await cleanAllTables(client);

      client.release();
      logger.info('✅ BD limpiada completamente al finalizar todos los tests');
    } catch (error) {
      logger.warn('⚠️ Error en limpieza final de BD:', error.message);
    }

    // Cerrar pool de conexiones global
    await global.testPool.end();
    logger.info('✅ Pool de conexiones cerrado');
  }

  logger.info('🏁 Teardown global de tests completado');
};

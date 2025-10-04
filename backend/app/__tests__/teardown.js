/**
 * Teardown Global para Tests
 * Limpieza final después de ejecutar toda la suite
 */

const logger = require('../utils/logger');

module.exports = async () => {
  logger.info('🧹 Limpiando recursos de tests...');

  // Cerrar pool de conexiones global
  if (global.testPool) {
    await global.testPool.end();
    logger.info('✅ Pool de conexiones cerrado');
  }

  logger.info('🏁 Teardown global de tests completado');
};

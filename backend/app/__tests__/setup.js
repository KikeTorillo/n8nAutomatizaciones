/**
 * Setup Global para Tests
 * Configura la base de datos de testing y helpers globales
 */

require('dotenv').config({ path: '.env.test' });

const { Pool } = require('pg');
const logger = require('../utils/logger');

// Pool de conexión para tests (independiente del pool de la app)
let testPool;

// Setup antes de todos los tests
beforeAll(async () => {
  logger.info('🧪 Iniciando setup de tests...');

  // Validar que estamos en entorno de test
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('❌ NODE_ENV debe ser "test" para ejecutar tests');
  }

  logger.info('⚠️  Usando BD principal para tests (desarrollo iterativo)');
  logger.warn('💡 Ejecuta "npm run clean:data" antes de los tests para limpiar datos');

  // Crear pool de conexión de test (usa la BD principal)
  testPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,  // ← Usa DB_NAME (postgres)
    user: process.env.DB_USER || 'saas_app',
    password: process.env.DB_PASSWORD,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });

  // Verificar conectividad
  try {
    const client = await testPool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.info('✅ Conexión a BD establecida', {
      database: process.env.DB_NAME,
      timestamp: result.rows[0].now
    });
  } catch (error) {
    logger.error('❌ Error conectando a BD:', error);
    throw error;
  }

  // Exponer pool globalmente
  global.testPool = testPool;
});

// Cleanup después de todos los tests
afterAll(async () => {
  logger.info('🧹 Limpiando recursos de tests...');

  if (testPool) {
    await testPool.end();
    logger.info('✅ Pool de conexiones cerrado');
  }
});

// Cleanup entre tests (opcional, puede ser lento)
// afterEach(async () => {
//   // Limpiar datos de test si es necesario
// });

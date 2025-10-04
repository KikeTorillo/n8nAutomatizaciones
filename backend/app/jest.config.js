/**
 * Configuración de Jest para Testing del Backend SaaS
 * Tests de integración con PostgreSQL y RLS multi-tenant
 */

module.exports = {
  // Entorno de ejecución
  testEnvironment: 'node',

  // Directorios de tests
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.spec.js'
  ],

  // Ignorar node_modules
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/logs/'
  ],

  // Coverage
  collectCoverageFrom: [
    'controllers/**/*.js',
    'database/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
    '!**/__tests__/**'
  ],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Setup y teardown
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  globalTeardown: '<rootDir>/__tests__/teardown.js',

  // Timeouts (importante para tests de BD)
  testTimeout: 30000, // 30 segundos

  // Verbose output
  verbose: true,

  // Detectar memory leaks
  detectLeaks: false, // Cambiar a true cuando estabilicemos tests

  // Ejecución en serie para tests de BD (evita race conditions)
  maxWorkers: 1,

  // Clear mocks entre tests
  clearMocks: true,
  resetMocks: false,
  restoreMocks: true
};

/**
 * Tests Unitarios para ModulesCache
 * Valida cache de módulos activos con Redis y memory fallback
 */

const ModulesCache = require('../../../core/ModulesCache');

// Mock de RLSContextManager
jest.mock('../../../utils/rlsContextManager', () => ({
  withBypass: jest.fn(async (callback) => {
    // Mock BD: simular query de módulos activos
    const mockDb = {
      query: jest.fn(async (sql, params) => {
        const orgId = params[0];

        // Simular diferentes organizaciones
        const mockData = {
          1: { modulos_activos: { core: true, agendamiento: true, inventario: true } },
          2: { modulos_activos: { core: true, agendamiento: true } },
          3: { modulos_activos: { core: true } }
        };

        const data = mockData[orgId];

        if (!data) {
          return { rows: [] };
        }

        return { rows: [data] };
      })
    };

    return await callback(mockDb);
  })
}));

describe('ModulesCache - PoC Fase 0', () => {

  beforeEach(() => {
    // Limpiar cache antes de cada test
    ModulesCache.memoryCache.clear();
    ModulesCache.resetStats();
    ModulesCache.redisClient = null; // Usar memory cache para tests
  });

  afterAll(() => {
    ModulesCache.cleanup();
  });

  // ================================================================
  // OPERACIONES BÁSICAS
  // ================================================================

  describe('Operaciones de Cache', () => {

    test('debe obtener módulos activos de BD en cache miss', async () => {
      const modulos = await ModulesCache.get(1);

      expect(modulos).toBeDefined();
      expect(modulos.core).toBe(true);
      expect(modulos.agendamiento).toBe(true);
      expect(modulos.inventario).toBe(true);
    });

    test('debe retornar solo core si organización no tiene subscripción', async () => {
      const modulos = await ModulesCache.get(999);

      expect(modulos).toEqual({ core: true });
    });

    test('debe usar cache en segunda llamada (cache hit)', async () => {
      // Primera llamada - cache miss
      const modulos1 = await ModulesCache.get(1);
      const initialMisses = ModulesCache.stats.misses;

      // Segunda llamada - cache hit
      const modulos2 = await ModulesCache.get(1);
      const finalMisses = ModulesCache.stats.misses;

      expect(modulos1).toEqual(modulos2);
      expect(ModulesCache.stats.hits).toBe(1);
      expect(finalMisses).toBe(initialMisses); // No incrementa misses
    });

    test('debe almacenar en cache correctamente', async () => {
      const testModulos = { core: true, pos: true };

      await ModulesCache.set(100, testModulos);

      // Verificar que está en memory cache
      const cached = ModulesCache.getFromMemory('modulos_activos:100');
      expect(cached).toEqual(testModulos);
    });

    test('debe invalidar cache de organización específica', async () => {
      // Cachear
      await ModulesCache.get(1);
      expect(ModulesCache.memoryCache.size).toBeGreaterThan(0);

      // Invalidar
      await ModulesCache.invalidate(1);

      // Verificar que se removió
      const cached = ModulesCache.getFromMemory('modulos_activos:1');
      expect(cached).toBeNull();
      expect(ModulesCache.stats.invalidations).toBe(1);
    });

    test('debe limpiar todo el cache', async () => {
      // Cachear múltiples organizaciones
      await ModulesCache.get(1);
      await ModulesCache.get(2);
      await ModulesCache.get(3);

      expect(ModulesCache.memoryCache.size).toBe(3);

      // Limpiar todo
      await ModulesCache.clear();

      expect(ModulesCache.memoryCache.size).toBe(0);
    });

  });

  // ================================================================
  // MEMORY CACHE
  // ================================================================

  describe('Memory Cache', () => {

    test('debe almacenar con TTL', () => {
      const testData = { core: true, test: true };
      ModulesCache.setInMemory('test_key', testData);

      const entry = ModulesCache.memoryCache.get('test_key');

      expect(entry).toBeDefined();
      expect(entry.value).toEqual(testData);
      expect(entry.expiresAt).toBeGreaterThan(Date.now());
    });

    test('debe expirar después de TTL', () => {
      const testData = { core: true };

      // Simular entrada expirada
      const expiredTime = Date.now() - 1000; // 1 segundo atrás
      ModulesCache.memoryCache.set('expired_key', {
        value: testData,
        expiresAt: expiredTime
      });

      const cached = ModulesCache.getFromMemory('expired_key');
      expect(cached).toBeNull();
    });

    test('debe retornar null para key inexistente', () => {
      const cached = ModulesCache.getFromMemory('key_inexistente');
      expect(cached).toBeNull();
    });

  });

  // ================================================================
  // ESTADÍSTICAS
  // ================================================================

  describe('Estadísticas', () => {

    test('debe calcular hit rate correctamente', async () => {
      // 2 misses
      await ModulesCache.get(1);
      await ModulesCache.get(2);

      // 2 hits
      await ModulesCache.get(1);
      await ModulesCache.get(2);

      const hitRate = ModulesCache.getHitRate();
      expect(parseFloat(hitRate)).toBe(50.0); // 2 hits / 4 total = 50%
    });

    test('debe rastrear hits y misses', async () => {
      const initialHits = ModulesCache.stats.hits;
      const initialMisses = ModulesCache.stats.misses;

      // Cache miss
      await ModulesCache.get(1);
      expect(ModulesCache.stats.misses).toBe(initialMisses + 1);

      // Cache hit
      await ModulesCache.get(1);
      expect(ModulesCache.stats.hits).toBe(initialHits + 1);
    });

    test('debe obtener estadísticas completas', () => {
      const stats = ModulesCache.getStats();

      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('errors');
      expect(stats).toHaveProperty('invalidations');
      expect(stats).toHaveProperty('hit_rate');
      expect(stats).toHaveProperty('cache_type');
      expect(stats).toHaveProperty('memory_cache_size');
      expect(stats).toHaveProperty('ttl_seconds');

      expect(stats.cache_type).toBe('memory');
      expect(stats.ttl_seconds).toBe(5 * 60);
    });

    test('debe resetear estadísticas', () => {
      ModulesCache.stats.hits = 10;
      ModulesCache.stats.misses = 5;

      ModulesCache.resetStats();

      expect(ModulesCache.stats.hits).toBe(0);
      expect(ModulesCache.stats.misses).toBe(0);
      expect(ModulesCache.stats.errors).toBe(0);
      expect(ModulesCache.stats.invalidations).toBe(0);
    });

  });

  // ================================================================
  // QUERY BASE DE DATOS
  // ================================================================

  describe('Query Base de Datos', () => {

    test('debe consultar módulos desde BD', async () => {
      const modulos = await ModulesCache.queryActiveModules(1);

      expect(modulos).toBeDefined();
      expect(modulos.core).toBe(true);
      expect(modulos.agendamiento).toBe(true);
      expect(modulos.inventario).toBe(true);
    });

    test('debe retornar solo core si no hay subscripción', async () => {
      const modulos = await ModulesCache.queryActiveModules(999);

      expect(modulos).toEqual({ core: true });
    });

    test('debe manejar errores de BD con fallback', async () => {
      // Forzar error en mock
      const RLSContextManager = require('../../../utils/rlsContextManager');
      RLSContextManager.withBypass.mockRejectedValueOnce(new Error('DB Error'));

      const modulos = await ModulesCache.queryActiveModules(1);

      // Debe retornar fallback seguro
      expect(modulos).toEqual({ core: true });
    });

  });

  // ================================================================
  // VALIDACIONES
  // ================================================================

  describe('Validaciones', () => {

    test('debe requerir organizacionId', async () => {
      await expect(ModulesCache.get(null)).rejects.toThrow('organizacionId es requerido');
      await expect(ModulesCache.get(undefined)).rejects.toThrow('organizacionId es requerido');
    });

    test('debe manejar organizacionId inválido', async () => {
      const modulos = await ModulesCache.get(0);

      // Debe retornar fallback
      expect(modulos).toEqual({ core: true });
    });

  });

  // ================================================================
  // PERFORMANCE
  // ================================================================

  describe('Performance', () => {

    test('cache hit debe ser más rápido que query BD', async () => {
      // Primera llamada - query BD
      const start1 = Date.now();
      await ModulesCache.get(1);
      const time1 = Date.now() - start1;

      // Segunda llamada - cache hit
      const start2 = Date.now();
      await ModulesCache.get(1);
      const time2 = Date.now() - start2;

      // Cache debe ser significativamente más rápido
      expect(time2).toBeLessThan(time1);
    });

    test('debe obtener módulos en menos de 50ms con cache', async () => {
      // Cachear primero
      await ModulesCache.get(1);

      // Medir cache hit
      const start = Date.now();
      await ModulesCache.get(1);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
    });

  });

});

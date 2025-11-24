/**
 * Tests Unitarios para ModuleRegistry
 * Valida auto-discovery, resolución de dependencias y carga de módulos
 */

const ModuleRegistry = require('../../../core/ModuleRegistry');
const path = require('path');

describe('ModuleRegistry - PoC Fase 0', () => {

  beforeEach(() => {
    // Resetear el registry antes de cada test
    ModuleRegistry.reset();
  });

  afterAll(() => {
    ModuleRegistry.reset();
  });

  // ================================================================
  // AUTO-DISCOVERY
  // ================================================================

  describe('Auto-Discovery de Módulos', () => {

    test('debe descubrir módulos core e inventario', async () => {
      const modules = await ModuleRegistry.discoverModules();

      expect(modules).toBeInstanceOf(Array);
      expect(modules.length).toBeGreaterThanOrEqual(2);
      expect(modules).toContain('core');
      expect(modules).toContain('inventario');
    });

    test('debe completar discovery en menos de 500ms', async () => {
      const startTime = Date.now();
      await ModuleRegistry.discoverModules();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500);
    });

    test('debe almacenar información de manifests', async () => {
      await ModuleRegistry.discoverModules();

      const coreModule = ModuleRegistry.getModule('core');
      expect(coreModule).toBeDefined();
      expect(coreModule.manifest).toBeDefined();
      expect(coreModule.manifest.name).toBe('core');
      expect(coreModule.manifest.version).toBeDefined();

      const inventarioModule = ModuleRegistry.getModule('inventario');
      expect(inventarioModule).toBeDefined();
      expect(inventarioModule.manifest.name).toBe('inventario');
      expect(inventarioModule.manifest.depends).toContain('core');
    });

    test('debe manejar directorio inexistente con fallback', async () => {
      // Temporalmente cambiar ruta
      const originalPath = ModuleRegistry.MODULES_PATH;
      ModuleRegistry.MODULES_PATH = '/path/que/no/existe';

      const modules = await ModuleRegistry.discoverModules();

      expect(modules).toEqual(ModuleRegistry.FALLBACK_MODULES);
      expect(modules).toContain('core');
      expect(modules).toContain('inventario');

      // Restaurar
      ModuleRegistry.MODULES_PATH = originalPath;
    });

  });

  // ================================================================
  // VALIDACIÓN DE DEPENDENCIAS
  // ================================================================

  describe('Validación de Dependencias', () => {

    beforeEach(async () => {
      await ModuleRegistry.discoverModules();
      ModuleRegistry.buildDependencyGraph();
    });

    test('debe construir grafo de dependencias correctamente', () => {
      const graph = ModuleRegistry.dependencyGraph;

      expect(graph.has('core')).toBe(true);
      expect(graph.has('inventario')).toBe(true);

      const coreDeps = graph.get('core');
      expect(Array.from(coreDeps)).toEqual([]);

      const inventarioDeps = graph.get('inventario');
      expect(Array.from(inventarioDeps)).toContain('core');
    });

    test('debe resolver dependencias en orden correcto', () => {
      const resolved = ModuleRegistry.resolveDependencies(['inventario']);

      expect(resolved).toBeInstanceOf(Array);
      expect(resolved.length).toBeGreaterThanOrEqual(2);

      // core debe cargarse ANTES que inventario
      const coreIndex = resolved.indexOf('core');
      const inventarioIndex = resolved.indexOf('inventario');
      expect(coreIndex).toBeLessThan(inventarioIndex);
    });

    test('debe validar que módulo existe', () => {
      expect(() => {
        ModuleRegistry.validateDependencies('modulo_inexistente');
      }).toThrow('Módulo no encontrado: modulo_inexistente');
    });

    test('debe validar que dependencias están disponibles', () => {
      // Simular un módulo con dependencia faltante
      ModuleRegistry.modules.set('test_module', {
        name: 'test_module',
        manifest: {
          name: 'test_module',
          version: '1.0.0',
          depends: ['modulo_inexistente']
        },
        path: '/fake/path',
        loaded: false
      });

      ModuleRegistry.buildDependencyGraph();

      expect(() => {
        ModuleRegistry.validateDependencies('test_module');
      }).toThrow(/dependencias faltantes.*modulo_inexistente/i);
    });

  });

  // ================================================================
  // CARGA DE MÓDULOS
  // ================================================================

  describe('Carga de Módulos', () => {

    beforeEach(async () => {
      await ModuleRegistry.discoverModules();
      ModuleRegistry.buildDependencyGraph();
    });

    test('debe cargar módulo core', async () => {
      const moduleInfo = await ModuleRegistry.loadModule('core');

      expect(moduleInfo).toBeDefined();
      expect(moduleInfo.loaded).toBe(true);
      expect(moduleInfo.loadTime).toBeGreaterThanOrEqual(0);
      expect(moduleInfo.routes).toBeDefined();
    });

    test('debe cargar módulo inventario con dependencias', async () => {
      const moduleInfo = await ModuleRegistry.loadModule('inventario');

      expect(moduleInfo).toBeDefined();
      expect(moduleInfo.loaded).toBe(true);

      // Verificar que core también se cargó
      const coreModule = ModuleRegistry.getModule('core');
      expect(coreModule.loaded).toBe(true);
    });

    test('no debe cargar módulo dos veces', async () => {
      await ModuleRegistry.loadModule('core');
      const firstLoadTime = ModuleRegistry.getModule('core').loadTime;

      await ModuleRegistry.loadModule('core');
      const secondLoadTime = ModuleRegistry.getModule('core').loadTime;

      expect(firstLoadTime).toBe(secondLoadTime);
    });

    test('debe cargar múltiples módulos en orden correcto', async () => {
      const loadOrder = [];

      ModuleRegistry.on('onModuleLoad', ({ moduleName }) => {
        loadOrder.push(moduleName);
      });

      await ModuleRegistry.loadModules(['inventario']);

      expect(loadOrder.length).toBeGreaterThanOrEqual(2);

      // core debe cargarse primero
      expect(loadOrder[0]).toBe('core');
      expect(loadOrder).toContain('inventario');
    });

  });

  // ================================================================
  // INICIALIZACIÓN
  // ================================================================

  describe('Inicialización', () => {

    test('debe inicializar correctamente', async () => {
      await ModuleRegistry.initialize({ defaultModules: ['core'] });

      expect(ModuleRegistry.initialized).toBe(true);
      expect(ModuleRegistry.modules.size).toBeGreaterThanOrEqual(2);
      expect(ModuleRegistry.isModuleLoaded('core')).toBe(true);
    });

    test('no debe inicializar dos veces', async () => {
      await ModuleRegistry.initialize();
      const firstInitState = ModuleRegistry.initialized;

      await ModuleRegistry.initialize();
      const secondInitState = ModuleRegistry.initialized;

      expect(firstInitState).toBe(true);
      expect(secondInitState).toBe(true);
    });

    test('debe inicializar en menos de 2 segundos', async () => {
      const startTime = Date.now();
      await ModuleRegistry.initialize();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000);
    });

  });

  // ================================================================
  // UTILIDADES
  // ================================================================

  describe('Utilidades y Estadísticas', () => {

    beforeEach(async () => {
      await ModuleRegistry.initialize();
    });

    test('debe obtener módulos cargados', () => {
      const loadedModules = ModuleRegistry.getLoadedModules();

      expect(loadedModules).toBeInstanceOf(Array);
      expect(loadedModules.length).toBeGreaterThanOrEqual(1);
      expect(loadedModules.every(m => m.loaded)).toBe(true);
    });

    test('debe verificar si módulo está cargado', () => {
      expect(ModuleRegistry.isModuleLoaded('core')).toBe(true);
      expect(ModuleRegistry.isModuleLoaded('modulo_inexistente')).toBe(false);
    });

    test('debe obtener estadísticas correctas', () => {
      const stats = ModuleRegistry.getStats();

      expect(stats).toHaveProperty('total_modules');
      expect(stats).toHaveProperty('loaded_modules');
      expect(stats).toHaveProperty('total_routes');
      expect(stats).toHaveProperty('initialized');
      expect(stats).toHaveProperty('avg_load_time');
      expect(stats).toHaveProperty('modules');
      expect(stats).toHaveProperty('loaded');

      expect(stats.initialized).toBe(true);
      expect(stats.total_modules).toBeGreaterThanOrEqual(2);
      expect(stats.loaded_modules).toBeGreaterThanOrEqual(1);
    });

  });

  // ================================================================
  // EVENTOS
  // ================================================================

  describe('Sistema de Eventos', () => {

    test('debe disparar evento onModuleLoad', async () => {
      let eventFired = false;
      let eventData = null;

      ModuleRegistry.on('onModuleLoad', (data) => {
        eventFired = true;
        eventData = data;
      });

      await ModuleRegistry.discoverModules();
      ModuleRegistry.buildDependencyGraph();
      await ModuleRegistry.loadModule('core');

      expect(eventFired).toBe(true);
      expect(eventData).toHaveProperty('moduleName', 'core');
      expect(eventData).toHaveProperty('loadTime');
      expect(eventData).toHaveProperty('moduleInfo');
    });

    test('debe disparar evento onDiscovery', async () => {
      let eventFired = false;
      let discoveredModules = null;

      ModuleRegistry.on('onDiscovery', (modules) => {
        eventFired = true;
        discoveredModules = modules;
      });

      await ModuleRegistry.discoverModules();

      expect(eventFired).toBe(true);
      expect(discoveredModules).toBeInstanceOf(Array);
      expect(discoveredModules.length).toBeGreaterThanOrEqual(2);
    });

  });

});

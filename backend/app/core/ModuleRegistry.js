/**
 * @fileoverview Module Registry - Sistema de Auto-Discovery y Carga Dinámica de Módulos
 * @description Gestiona el descubrimiento, validación y carga de módulos de la aplicación
 * @version 1.0.0 (PoC)
 *
 * CARACTERÍSTICAS:
 * - Auto-discovery de módulos desde filesystem
 * - Resolución recursiva de dependencias
 * - Validación de manifests
 * - Carga dinámica de rutas
 * - Modo fallback para casos de error
 * - Métricas de performance
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class ModuleRegistry {

  /**
   * Almacena módulos descubiertos
   * Estructura: Map<string, ModuleInfo>
   * ModuleInfo: { name, manifest, path, loaded, loadTime }
   */
  static modules = new Map();

  /**
   * Almacena rutas registradas
   * Estructura: Map<string, Router>
   */
  static routes = new Map();

  /**
   * Grafo de dependencias
   * Estructura: Map<string, Set<string>>
   */
  static dependencyGraph = new Map();

  /**
   * Estado de inicialización
   */
  static initialized = false;

  /**
   * Callbacks para eventos
   */
  static eventCallbacks = {
    onModuleLoad: [],
    onModuleError: [],
    onDiscovery: []
  };

  /**
   * Ruta base de módulos
   */
  static MODULES_PATH = path.join(__dirname, '../modules');

  /**
   * Módulos fallback (si auto-discovery falla)
   */
  static FALLBACK_MODULES = ['core', 'inventario'];

  // ================================================================
  // DISCOVERY DE MÓDULOS
  // ================================================================

  /**
   * Descubre todos los módulos disponibles
   * @returns {Promise<string[]>} Lista de nombres de módulos
   */
  static async discoverModules() {
    const startTime = Date.now();

    try {
      logger.info('[ModuleRegistry] 🔍 Iniciando auto-discovery de módulos...');

      // Verificar que existe el directorio de módulos
      try {
        await fs.access(this.MODULES_PATH);
      } catch (error) {
        logger.error('[ModuleRegistry] ❌ Directorio modules/ no encontrado', {
          path: this.MODULES_PATH,
          error: error.message
        });
        return this.loadFallbackModules();
      }

      // Leer contenido del directorio
      const entries = await fs.readdir(this.MODULES_PATH, { withFileTypes: true });

      // Filtrar solo directorios
      const moduleDirs = entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);

      logger.debug('[ModuleRegistry] Directorios encontrados:', moduleDirs);

      // Validar cada módulo (verificar que tenga manifest.json)
      const validModules = [];

      for (const moduleName of moduleDirs) {
        const manifestPath = path.join(this.MODULES_PATH, moduleName, 'manifest.json');

        try {
          await fs.access(manifestPath);

          // Leer y parsear manifest
          const manifestContent = await fs.readFile(manifestPath, 'utf-8');
          const manifest = JSON.parse(manifestContent);

          // Validar manifest básico
          if (!manifest.name || !manifest.version) {
            logger.warn(`[ModuleRegistry] ⚠️ Manifest inválido en ${moduleName}`, {
              manifest
            });
            continue;
          }

          // Almacenar módulo
          this.modules.set(moduleName, {
            name: moduleName,
            manifest,
            path: path.join(this.MODULES_PATH, moduleName),
            loaded: false,
            loadTime: null,
            routes: null
          });

          validModules.push(moduleName);

          logger.debug(`[ModuleRegistry] ✅ Módulo válido: ${moduleName}`, {
            version: manifest.version,
            depends: manifest.depends
          });

        } catch (error) {
          logger.warn(`[ModuleRegistry] ⚠️ Módulo ${moduleName} sin manifest válido`, {
            error: error.message
          });
        }
      }

      const discoveryTime = Date.now() - startTime;

      logger.info('[ModuleRegistry] ✅ Discovery completado', {
        total_dirs: moduleDirs.length,
        valid_modules: validModules.length,
        discovery_time_ms: discoveryTime,
        modules: validModules
      });

      // Disparar evento
      this.triggerEvent('onDiscovery', validModules);

      // Validar tiempo de discovery (< 500ms)
      if (discoveryTime > 500) {
        logger.warn('[ModuleRegistry] ⚠️ Discovery lento', {
          time_ms: discoveryTime,
          threshold_ms: 500
        });
      }

      return validModules;

    } catch (error) {
      logger.error('[ModuleRegistry] ❌ Error en auto-discovery', {
        error: error.message,
        stack: error.stack
      });

      // Fallback a lista hard-coded
      return this.loadFallbackModules();
    }
  }

  /**
   * Carga módulos en modo fallback (si discovery falla)
   * @returns {string[]} Lista de módulos fallback
   */
  static loadFallbackModules() {
    logger.warn('[ModuleRegistry] ⚠️ Usando módulos fallback', {
      modules: this.FALLBACK_MODULES
    });

    return this.FALLBACK_MODULES;
  }

  // ================================================================
  // VALIDACIÓN DE DEPENDENCIAS
  // ================================================================

  /**
   * Construye el grafo de dependencias
   */
  static buildDependencyGraph() {
    logger.debug('[ModuleRegistry] 🔗 Construyendo grafo de dependencias...');

    this.dependencyGraph.clear();

    for (const [moduleName, moduleInfo] of this.modules) {
      const dependencies = moduleInfo.manifest.depends || [];
      this.dependencyGraph.set(moduleName, new Set(dependencies));
    }

    logger.debug('[ModuleRegistry] Grafo construido:',
      Object.fromEntries(
        Array.from(this.dependencyGraph.entries()).map(([k, v]) => [k, Array.from(v)])
      )
    );
  }

  /**
   * Resuelve el orden de carga de módulos (topological sort)
   * @param {string[]} moduleNames - Módulos a cargar
   * @returns {string[]} Orden de carga resuelto
   */
  static resolveDependencies(moduleNames) {
    logger.debug('[ModuleRegistry] 🔍 Resolviendo dependencias...', { moduleNames });

    const resolved = [];
    const visiting = new Set();
    const visited = new Set();

    const visit = (moduleName) => {
      // Detectar dependencias circulares
      if (visiting.has(moduleName)) {
        throw new Error(`Dependencia circular detectada: ${moduleName}`);
      }

      if (visited.has(moduleName)) {
        return;
      }

      // Verificar que el módulo existe
      if (!this.modules.has(moduleName)) {
        throw new Error(`Módulo no encontrado: ${moduleName}`);
      }

      visiting.add(moduleName);

      // Visitar dependencias primero
      const dependencies = this.dependencyGraph.get(moduleName) || new Set();

      for (const dep of dependencies) {
        visit(dep);
      }

      visiting.delete(moduleName);
      visited.add(moduleName);
      resolved.push(moduleName);
    };

    // Visitar todos los módulos solicitados
    for (const moduleName of moduleNames) {
      visit(moduleName);
    }

    logger.info('[ModuleRegistry] ✅ Dependencias resueltas', {
      requested: moduleNames,
      resolved_order: resolved
    });

    return resolved;
  }

  /**
   * Valida que todas las dependencias estén disponibles
   * @param {string} moduleName - Módulo a validar
   * @throws {Error} Si falta alguna dependencia
   */
  static validateDependencies(moduleName) {
    const moduleInfo = this.modules.get(moduleName);

    if (!moduleInfo) {
      throw new Error(`Módulo no encontrado: ${moduleName}`);
    }

    const dependencies = moduleInfo.manifest.depends || [];
    const missing = [];

    for (const dep of dependencies) {
      if (!this.modules.has(dep)) {
        missing.push(dep);
      }
    }

    if (missing.length > 0) {
      const error = new Error(
        `Módulo ${moduleName} tiene dependencias faltantes: ${missing.join(', ')}`
      );
      error.module = moduleName;
      error.missingDependencies = missing;
      throw error;
    }
  }

  // ================================================================
  // CARGA DE MÓDULOS
  // ================================================================

  /**
   * Carga un módulo específico
   * @param {string} moduleName - Nombre del módulo
   * @returns {Promise<ModuleInfo>} Información del módulo cargado
   */
  static async loadModule(moduleName) {
    const startTime = Date.now();

    logger.info(`[ModuleRegistry] 📦 Cargando módulo: ${moduleName}...`);

    // Verificar si ya está cargado
    const moduleInfo = this.modules.get(moduleName);

    if (!moduleInfo) {
      throw new Error(`Módulo no encontrado: ${moduleName}`);
    }

    if (moduleInfo.loaded) {
      logger.debug(`[ModuleRegistry] ℹ️ Módulo ${moduleName} ya cargado`);
      return moduleInfo;
    }

    // Validar dependencias
    this.validateDependencies(moduleName);

    // Cargar dependencias primero (recursivo)
    const dependencies = moduleInfo.manifest.depends || [];

    for (const dep of dependencies) {
      await this.loadModule(dep);
    }

    try {
      // Cargar rutas del módulo si existen
      const routesPath = path.join(moduleInfo.path, 'routes', 'index.js');

      try {
        await fs.access(routesPath);

        // Require dinámico
        const routesModule = require(routesPath);
        moduleInfo.routes = routesModule;

        logger.debug(`[ModuleRegistry] ✅ Rutas cargadas para ${moduleName}`);

      } catch (error) {
        if (error.code !== 'ENOENT') {
          logger.warn(`[ModuleRegistry] ⚠️ Error cargando rutas de ${moduleName}`, {
            error: error.message
          });
        } else {
          logger.debug(`[ModuleRegistry] ℹ️ Módulo ${moduleName} sin archivo de rutas`);
        }
      }

      // Marcar como cargado
      const loadTime = Date.now() - startTime;
      moduleInfo.loaded = true;
      moduleInfo.loadTime = loadTime;

      logger.info(`[ModuleRegistry] ✅ Módulo ${moduleName} cargado`, {
        load_time_ms: loadTime,
        dependencies: dependencies.length,
        has_routes: !!moduleInfo.routes
      });

      // Disparar evento
      this.triggerEvent('onModuleLoad', { moduleName, loadTime, moduleInfo });

      return moduleInfo;

    } catch (error) {
      logger.error(`[ModuleRegistry] ❌ Error cargando módulo ${moduleName}`, {
        error: error.message,
        stack: error.stack
      });

      this.triggerEvent('onModuleError', { moduleName, error });
      throw error;
    }
  }

  /**
   * Carga múltiples módulos en orden de dependencias
   * @param {string[]} moduleNames - Lista de módulos a cargar
   * @returns {Promise<Map<string, ModuleInfo>>} Módulos cargados
   */
  static async loadModules(moduleNames) {
    logger.info('[ModuleRegistry] 📦 Cargando múltiples módulos...', { moduleNames });

    // Resolver orden de carga
    const loadOrder = this.resolveDependencies(moduleNames);

    // Cargar en orden
    for (const moduleName of loadOrder) {
      await this.loadModule(moduleName);
    }

    logger.info('[ModuleRegistry] ✅ Todos los módulos cargados', {
      total: loadOrder.length,
      order: loadOrder
    });

    return this.modules;
  }

  // ================================================================
  // REGISTRO DE RUTAS
  // ================================================================

  /**
   * Registra las rutas de módulos cargados en Express app
   * @param {Express} app - Aplicación Express
   */
  static registerRoutes(app) {
    logger.info('[ModuleRegistry] 🔗 Registrando rutas de módulos...');

    let totalRoutes = 0;

    for (const [moduleName, moduleInfo] of this.modules) {
      if (!moduleInfo.loaded || !moduleInfo.routes) {
        continue;
      }

      const routesConfig = moduleInfo.manifest.routes || {};

      for (const [routeName, routePath] of Object.entries(routesConfig)) {
        try {
          // Aquí se registrarían las rutas en Express
          // app.use(routePath, moduleInfo.routes[routeName]);

          this.routes.set(`${moduleName}.${routeName}`, {
            module: moduleName,
            route: routeName,
            path: routePath
          });

          totalRoutes++;

          logger.debug(`[ModuleRegistry] ✅ Ruta registrada: ${routePath}`, {
            module: moduleName,
            route: routeName
          });

        } catch (error) {
          logger.error(`[ModuleRegistry] ❌ Error registrando ruta ${routePath}`, {
            module: moduleName,
            error: error.message
          });
        }
      }
    }

    logger.info('[ModuleRegistry] ✅ Rutas registradas', {
      total_routes: totalRoutes,
      modules: Array.from(this.modules.keys()).filter(m => this.modules.get(m).loaded)
    });
  }

  // ================================================================
  // INICIALIZACIÓN
  // ================================================================

  /**
   * Inicializa el Module Registry
   * @param {Object} options - Opciones de configuración
   * @returns {Promise<void>}
   */
  static async initialize(options = {}) {
    if (this.initialized) {
      logger.warn('[ModuleRegistry] ⚠️ Ya inicializado, omitiendo...');
      return;
    }

    const startTime = Date.now();
    logger.info('[ModuleRegistry] 🚀 Inicializando Module Registry...');

    try {
      // 1. Descubrir módulos
      const modules = await this.discoverModules();

      if (modules.length === 0) {
        throw new Error('No se encontraron módulos válidos');
      }

      // 2. Construir grafo de dependencias
      this.buildDependencyGraph();

      // 3. Cargar módulos básicos por defecto
      const defaultModules = options.defaultModules || ['core'];
      await this.loadModules(defaultModules);

      const initTime = Date.now() - startTime;

      this.initialized = true;

      logger.info('[ModuleRegistry] ✅ Module Registry inicializado', {
        init_time_ms: initTime,
        total_modules: this.modules.size,
        loaded_modules: Array.from(this.modules.values()).filter(m => m.loaded).length,
        default_modules: defaultModules
      });

    } catch (error) {
      logger.error('[ModuleRegistry] ❌ Error en inicialización', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // ================================================================
  // UTILIDADES
  // ================================================================

  /**
   * Obtiene información de un módulo
   * @param {string} moduleName - Nombre del módulo
   * @returns {ModuleInfo|null}
   */
  static getModule(moduleName) {
    return this.modules.get(moduleName) || null;
  }

  /**
   * Obtiene todos los módulos cargados
   * @returns {ModuleInfo[]}
   */
  static getLoadedModules() {
    return Array.from(this.modules.values()).filter(m => m.loaded);
  }

  /**
   * Verifica si un módulo está cargado
   * @param {string} moduleName - Nombre del módulo
   * @returns {boolean}
   */
  static isModuleLoaded(moduleName) {
    const module = this.modules.get(moduleName);
    return module ? module.loaded : false;
  }

  /**
   * Obtiene estadísticas del registry
   * @returns {Object}
   */
  static getStats() {
    const loadedModules = this.getLoadedModules();

    return {
      total_modules: this.modules.size,
      loaded_modules: loadedModules.length,
      total_routes: this.routes.size,
      initialized: this.initialized,
      avg_load_time: loadedModules.length > 0
        ? loadedModules.reduce((sum, m) => sum + (m.loadTime || 0), 0) / loadedModules.length
        : 0,
      modules: Array.from(this.modules.keys()),
      loaded: loadedModules.map(m => m.name)
    };
  }

  /**
   * Registra un callback para eventos
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función callback
   */
  static on(event, callback) {
    if (this.eventCallbacks[event]) {
      this.eventCallbacks[event].push(callback);
    }
  }

  /**
   * Dispara un evento
   * @param {string} event - Nombre del evento
   * @param {*} data - Datos del evento
   */
  static triggerEvent(event, data) {
    if (this.eventCallbacks[event]) {
      this.eventCallbacks[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error(`[ModuleRegistry] Error en callback de evento ${event}`, {
            error: error.message
          });
        }
      });
    }
  }

  /**
   * Resetea el registry (útil para testing)
   */
  static reset() {
    this.modules.clear();
    this.routes.clear();
    this.dependencyGraph.clear();
    this.initialized = false;
    this.eventCallbacks = {
      onModuleLoad: [],
      onModuleError: [],
      onDiscovery: []
    };
    logger.info('[ModuleRegistry] 🔄 Registry reseteado');
  }
}

module.exports = ModuleRegistry;

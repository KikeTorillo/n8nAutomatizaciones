/**
 * @fileoverview RouteLoader - Sistema de Carga Dinámica de Rutas
 * @description Carga automáticamente las rutas de módulos basándose en sus manifests
 * @version 1.0.0
 * @date Diciembre 2025
 *
 * CARACTERÍSTICAS:
 * - Auto-discovery de rutas desde manifests
 * - Soporte para múltiples formatos de exportación
 * - Ordenamiento por prioridad de módulo
 * - Logging detallado para debugging
 * - Manejo de rutas legacy (no migradas)
 *
 * PATRONES DE EXPORTACIÓN SOPORTADOS:
 * 1. Router directo: module.exports = router
 * 2. Objeto simple: module.exports = { nombreRoutes }
 * 3. Objeto múltiple: module.exports = { auth, usuarios, ... }
 */

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class RouteLoader {

  /**
   * Ruta base de módulos
   */
  static MODULES_PATH = path.join(__dirname, '../modules');

  /**
   * Rutas cargadas para tracking
   */
  static loadedRoutes = [];

  /**
   * Estadísticas de carga
   */
  static stats = {
    modulesProcessed: 0,
    routesRegistered: 0,
    errors: 0,
    loadTime: 0
  };

  /**
   * Configuración de rutas legacy (no están en módulos)
   * Estas rutas se mantienen para compatibilidad mientras se migran
   */
  static LEGACY_ROUTES = {
    // Rutas que aún están en routes/api/v1/ y no en modules/
    // clientes: migrado a modules/clientes (Dic 2025)
    invitaciones: {
      path: '/invitaciones',
      file: '../routes/api/v1/invitaciones'
    },
    mercadopago: {
      path: '/mercadopago',
      file: '../routes/api/v1/mercadopago'
    },
    setup: {
      path: '/setup',
      file: '../modules/core/routes/setup'
    },
    modulos: {
      path: '/modulos',
      file: '../modules/core/routes/modulos'
    },
    ubicaciones: {
      path: '/ubicaciones',
      file: '../modules/core/routes/ubicaciones'
    }
  };

  /**
   * Descubre y carga todos los módulos con sus manifests
   * @returns {Array} Lista de módulos con sus configuraciones
   */
  static discoverModules() {
    const modules = [];

    try {
      const entries = fs.readdirSync(this.MODULES_PATH, { withFileTypes: true });
      const moduleDirs = entries.filter(e => e.isDirectory()).map(e => e.name);

      for (const moduleName of moduleDirs) {
        const manifestPath = path.join(this.MODULES_PATH, moduleName, 'manifest.json');

        try {
          const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
          const manifest = JSON.parse(manifestContent);

          modules.push({
            name: moduleName,
            manifest,
            path: path.join(this.MODULES_PATH, moduleName),
            priority: manifest.priority || 100
          });

        } catch (err) {
          // Módulo sin manifest, ignorar silenciosamente
          logger.debug(`[RouteLoader] Módulo ${moduleName} sin manifest.json`);
        }
      }

      // Ordenar por prioridad (menor = primero)
      modules.sort((a, b) => a.priority - b.priority);

      logger.info(`[RouteLoader] ${modules.length} módulos descubiertos`, {
        modules: modules.map(m => `${m.name} (p:${m.priority})`)
      });

      return modules;

    } catch (error) {
      logger.error('[RouteLoader] Error en discovery', { error: error.message });
      return [];
    }
  }

  /**
   * Carga las rutas de un módulo específico
   * @param {Object} moduleInfo - Información del módulo
   * @returns {Object|null} Objeto con rutas cargadas o null
   */
  static loadModuleRoutes(moduleInfo) {
    const routesIndexPath = path.join(moduleInfo.path, 'routes', 'index.js');

    try {
      // Verificar si existe routes/index.js
      require.resolve(routesIndexPath);
      return require(routesIndexPath);
    } catch (error) {
      logger.debug(`[RouteLoader] Módulo ${moduleInfo.name} sin routes/index.js`);
      logger.error(`[RouteLoader] Error cargando ${moduleInfo.name}: ${error.message}`);
      return null;
    }
  }

  /**
   * Determina el nombre del export basándose en el nombre de la ruta
   * Convenciones:
   * - "sucursales" -> busca "sucursalesRoutes" o "sucursales"
   * - "auth" -> busca "authRouter" o "auth"
   * @param {string} routeName - Nombre de la ruta en el manifest
   * @returns {string[]} Posibles nombres de export
   */
  static getExportNames(routeName) {
    const baseName = routeName.replace(/-/g, '');
    return [
      `${baseName}Routes`,      // sucursalesRoutes
      `${baseName}Router`,      // sucursalesRouter
      baseName,                 // sucursales
      routeName,                // con guiones si aplica
      `${routeName}Routes`,
      `${routeName}Router`
    ];
  }

  /**
   * Extrae el router correcto del módulo exportado
   * @param {Object|Function} routesExport - Lo que exporta routes/index.js
   * @param {string} routeName - Nombre de la ruta buscada
   * @param {string} moduleName - Nombre del módulo (para logging)
   * @returns {Function|null} Router de Express o null
   */
  static extractRouter(routesExport, routeName, moduleName) {
    // Caso 1: Es un router directo (función)
    if (typeof routesExport === 'function') {
      logger.debug(`[RouteLoader] ${moduleName}.${routeName}: Router directo`);
      return routesExport;
    }

    // Caso 2: Es un objeto con múltiples routers
    if (typeof routesExport === 'object') {
      const possibleNames = this.getExportNames(routeName);

      for (const name of possibleNames) {
        if (routesExport[name] && typeof routesExport[name] === 'function') {
          logger.debug(`[RouteLoader] ${moduleName}.${routeName}: Encontrado como '${name}'`);
          return routesExport[name];
        }
      }

      // Si el objeto tiene una sola key, usarla
      const keys = Object.keys(routesExport);
      if (keys.length === 1 && typeof routesExport[keys[0]] === 'function') {
        logger.debug(`[RouteLoader] ${moduleName}.${routeName}: Único export '${keys[0]}'`);
        return routesExport[keys[0]];
      }

      logger.warn(`[RouteLoader] ${moduleName}.${routeName}: No se encontró router`, {
        available: keys,
        searched: possibleNames
      });
    }

    return null;
  }

  /**
   * Registra todas las rutas de todos los módulos
   * @param {Express.Router} router - Router principal de Express
   * @returns {Object} Estadísticas de carga
   */
  static registerAllRoutes(router) {
    const startTime = Date.now();
    this.loadedRoutes = [];
    this.stats = { modulesProcessed: 0, routesRegistered: 0, errors: 0, loadTime: 0 };

    logger.info('[RouteLoader] ═══════════════════════════════════════');
    logger.info('[RouteLoader] Iniciando carga dinámica de rutas...');
    logger.info('[RouteLoader] ═══════════════════════════════════════');

    // 1. Descubrir módulos
    const modules = this.discoverModules();

    // 2. Procesar cada módulo
    for (const moduleInfo of modules) {
      this.registerModuleRoutes(router, moduleInfo);
    }

    // 3. Cargar rutas legacy
    this.registerLegacyRoutes(router);

    // 4. Calcular estadísticas
    this.stats.loadTime = Date.now() - startTime;

    logger.info('[RouteLoader] ═══════════════════════════════════════');
    logger.info('[RouteLoader] Carga de rutas completada', {
      modules: this.stats.modulesProcessed,
      routes: this.stats.routesRegistered,
      errors: this.stats.errors,
      time_ms: this.stats.loadTime
    });
    logger.info('[RouteLoader] ═══════════════════════════════════════');

    return this.stats;
  }

  /**
   * Registra las rutas de un módulo específico
   * @param {Express.Router} router - Router principal
   * @param {Object} moduleInfo - Información del módulo
   */
  static registerModuleRoutes(router, moduleInfo) {
    const { name: moduleName, manifest } = moduleInfo;
    const routes = manifest.routes || {};

    if (Object.keys(routes).length === 0) {
      logger.debug(`[RouteLoader] Módulo ${moduleName} sin rutas definidas`);
      return;
    }

    this.stats.modulesProcessed++;

    // Cargar exports del módulo
    const routesExport = this.loadModuleRoutes(moduleInfo);

    if (!routesExport) {
      logger.warn(`[RouteLoader] ⚠️ Módulo ${moduleName}: No se pudo cargar routes/index.js`);
      return;
    }

    // Procesar cada ruta definida en el manifest
    for (const [routeName, routePath] of Object.entries(routes)) {
      try {
        // Extraer el router correcto
        const routerInstance = this.extractRouter(routesExport, routeName, moduleName);

        if (!routerInstance) {
          logger.warn(`[RouteLoader] ⚠️ ${moduleName}.${routeName}: Router no encontrado`);
          this.stats.errors++;
          continue;
        }

        // Normalizar el path (quitar /api/v1 si está incluido)
        const normalizedPath = routePath.replace(/^\/api\/v1/, '');

        // Registrar en Express
        router.use(normalizedPath, routerInstance);

        this.loadedRoutes.push({
          module: moduleName,
          name: routeName,
          path: normalizedPath,
          fullPath: routePath
        });

        this.stats.routesRegistered++;

        logger.info(`[RouteLoader] ✅ ${moduleName}.${routeName} → ${normalizedPath}`);

      } catch (error) {
        logger.error(`[RouteLoader] ❌ Error registrando ${moduleName}.${routeName}`, {
          error: error.message
        });
        this.stats.errors++;
      }
    }
  }

  /**
   * Registra rutas legacy (no migradas a módulos)
   * @param {Express.Router} router - Router principal
   */
  static registerLegacyRoutes(router) {
    logger.info('[RouteLoader] 📦 Cargando rutas legacy...');

    for (const [name, config] of Object.entries(this.LEGACY_ROUTES)) {
      try {
        const routerInstance = require(config.file);
        router.use(config.path, routerInstance);

        this.loadedRoutes.push({
          module: 'legacy',
          name,
          path: config.path,
          legacy: true
        });

        this.stats.routesRegistered++;

        logger.info(`[RouteLoader] ✅ legacy.${name} → ${config.path}`);

      } catch (error) {
        logger.warn(`[RouteLoader] ⚠️ Ruta legacy ${name} no encontrada`, {
          file: config.file,
          error: error.message
        });
      }
    }
  }

  /**
   * Obtiene las rutas cargadas
   * @returns {Array} Lista de rutas cargadas
   */
  static getLoadedRoutes() {
    return this.loadedRoutes;
  }

  /**
   * Obtiene estadísticas de carga
   * @returns {Object} Estadísticas
   */
  static getStats() {
    return { ...this.stats };
  }

  /**
   * Imprime un resumen de rutas cargadas
   */
  static printSummary() {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    RUTAS REGISTRADAS                          ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');

    const byModule = {};
    for (const route of this.loadedRoutes) {
      if (!byModule[route.module]) {
        byModule[route.module] = [];
      }
      byModule[route.module].push(route);
    }

    for (const [moduleName, routes] of Object.entries(byModule)) {
      console.log(`║ 📦 ${moduleName.toUpperCase().padEnd(56)}║`);
      for (const route of routes) {
        const line = `    ${route.name}: ${route.path}`;
        console.log(`║   ${line.padEnd(57)}║`);
      }
    }

    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║ Total: ${this.stats.routesRegistered} rutas en ${this.stats.loadTime}ms`.padEnd(63) + '║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
  }
}

module.exports = RouteLoader;

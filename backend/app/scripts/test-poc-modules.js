/**
 * Script de Validación PoC - Fase 0
 * Prueba el ModuleRegistry y ModulesCache
 *
 * Uso: node backend/app/scripts/test-poc-modules.js
 */

const ModuleRegistry = require('../core/ModuleRegistry');
const ModulesCache = require('../core/ModulesCache');
const logger = require('../utils/logger');

async function testModuleRegistry() {
  console.log('\n🚀 ============================================');
  console.log('   PRUEBA POC - MODULE REGISTRY');
  console.log('============================================\n');

  try {
    // 1. Test Auto-Discovery
    console.log('📍 PASO 1: Auto-Discovery de Módulos\n');
    const startDiscovery = Date.now();
    const modules = await ModuleRegistry.discoverModules();
    const discoveryTime = Date.now() - startDiscovery;

    console.log(`✅ Módulos descubiertos: ${modules.length}`);
    console.log(`   - ${modules.join(', ')}`);
    console.log(`⏱️  Tiempo: ${discoveryTime}ms`);

    if (discoveryTime > 500) {
      console.log(`⚠️  WARNING: Discovery lento (>500ms)`);
    }

    // 2. Test Dependency Graph
    console.log('\n📍 PASO 2: Construcción de Grafo de Dependencias\n');
    ModuleRegistry.buildDependencyGraph();

    for (const [moduleName, moduleInfo] of ModuleRegistry.modules) {
      const deps = moduleInfo.manifest.depends || [];
      console.log(`   ${moduleName}:`);
      console.log(`     - Versión: ${moduleInfo.manifest.version}`);
      console.log(`     - Depende de: ${deps.length > 0 ? deps.join(', ') : 'ninguno'}`);
    }

    // 3. Test Dependency Resolution
    console.log('\n📍 PASO 3: Resolución de Dependencias\n');
    const resolved = ModuleRegistry.resolveDependencies(['inventario']);
    console.log(`✅ Orden de carga: ${resolved.join(' → ')}`);

    // 4. Test Module Loading
    console.log('\n📍 PASO 4: Carga de Módulos\n');
    const startLoad = Date.now();
    await ModuleRegistry.loadModules(['core', 'inventario']);
    const loadTime = Date.now() - startLoad;

    console.log(`✅ Módulos cargados correctamente`);
    console.log(`⏱️  Tiempo: ${loadTime}ms`);

    if (loadTime > 2000) {
      console.log(`⚠️  WARNING: Carga lenta (>2s)`);
    }

    // 5. Test Statistics
    console.log('\n📍 PASO 5: Estadísticas del Registry\n');
    const stats = ModuleRegistry.getStats();

    console.log(`   Total módulos: ${stats.total_modules}`);
    console.log(`   Módulos cargados: ${stats.loaded_modules}`);
    console.log(`   Rutas registradas: ${stats.total_routes}`);
    console.log(`   Tiempo promedio carga: ${stats.avg_load_time.toFixed(2)}ms`);
    console.log(`   Inicializado: ${stats.initialized ? '✅' : '❌'}`);

    // 6. Validar módulos cargados
    console.log('\n📍 PASO 6: Validación de Módulos Cargados\n');

    const coreLoaded = ModuleRegistry.isModuleLoaded('core');
    const inventarioLoaded = ModuleRegistry.isModuleLoaded('inventario');

    console.log(`   Core cargado: ${coreLoaded ? '✅' : '❌'}`);
    console.log(`   Inventario cargado: ${inventarioLoaded ? '✅' : '❌'}`);

    if (coreLoaded && inventarioLoaded) {
      console.log('\n✅ MODULE REGISTRY: TODOS LOS TESTS PASARON');
      return true;
    } else {
      console.log('\n❌ MODULE REGISTRY: ALGUNOS TESTS FALLARON');
      return false;
    }

  } catch (error) {
    console.error('\n❌ ERROR EN MODULE REGISTRY:', error.message);
    console.error(error.stack);
    return false;
  }
}

async function testModulesCache() {
  console.log('\n\n🚀 ============================================');
  console.log('   PRUEBA POC - MODULES CACHE');
  console.log('============================================\n');

  try {
    // Inicializar sin Redis (memory cache)
    console.log('📍 Inicializando ModulesCache (memory mode)\n');
    ModulesCache.initialize(null);

    console.log(`   Cache type: ${ModulesCache.redisClient ? 'Redis' : 'Memory'}`);
    console.log(`   TTL: ${ModulesCache.TTL_SECONDS}s`);

    // Nota: Para probar completamente necesitaríamos conexión a BD real
    // Por ahora solo validamos la estructura

    const stats = ModulesCache.getStats();
    console.log('\n📍 Estadísticas Iniciales:\n');
    console.log(`   Hits: ${stats.hits}`);
    console.log(`   Misses: ${stats.misses}`);
    console.log(`   Hit Rate: ${stats.hit_rate}%`);
    console.log(`   Cache Size: ${stats.memory_cache_size}`);

    console.log('\n✅ MODULES CACHE: Estructura validada');
    console.log('⚠️  Nota: Tests completos requieren conexión a BD');

    return true;

  } catch (error) {
    console.error('\n❌ ERROR EN MODULES CACHE:', error.message);
    console.error(error.stack);
    return false;
  }
}

async function runPoC() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║                                            ║');
  console.log('║     POC ARQUITECTURA MODULAR - FASE 0      ║');
  console.log('║                                            ║');
  console.log('╚════════════════════════════════════════════╝');

  const startTime = Date.now();

  // Test 1: ModuleRegistry
  const registryOk = await testModuleRegistry();

  // Test 2: ModulesCache
  const cacheOk = await testModulesCache();

  const totalTime = Date.now() - startTime;

  // Resumen Final
  console.log('\n\n╔════════════════════════════════════════════╗');
  console.log('║           RESUMEN DE RESULTADOS            ║');
  console.log('╚════════════════════════════════════════════╝\n');

  console.log(`   ModuleRegistry: ${registryOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   ModulesCache:   ${cacheOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`\n   ⏱️  Tiempo total: ${totalTime}ms`);

  if (registryOk && cacheOk) {
    console.log('\n🎉 ¡POC EXITOSO! Arquitectura modular funcionando correctamente\n');
    console.log('📋 Próximos pasos:');
    console.log('   1. Ejecutar tests unitarios: npm test ModuleRegistry');
    console.log('   2. Validar con BD real');
    console.log('   3. Integrar en routes principales');
    console.log('   4. Continuar con Fase 1 del plan\n');
    process.exit(0);
  } else {
    console.log('\n❌ POC con errores. Revisar logs arriba.\n');
    process.exit(1);
  }
}

// Ejecutar PoC
runPoC().catch(error => {
  console.error('\n💥 ERROR CRÍTICO:', error);
  process.exit(1);
});

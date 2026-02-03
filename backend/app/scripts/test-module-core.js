#!/usr/bin/env node
/**
 * Script de prueba para validar que el módulo CORE carga correctamente
 * Verifica que todos los imports funcionan sin errores
 */

// Cargar variables de entorno
require('dotenv').config();

// Configurar JWT_SECRET si no existe (para testing)
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key-for-module-testing-only';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
}

console.log('🧪 Iniciando prueba del módulo CORE...\n');

try {
  console.log('📦 Cargando rutas del módulo CORE...');

  // Intentar cargar todas las rutas del módulo CORE
  const authRouter = require('../modules/auth/routes');
  console.log('  ✅ auth routes cargado (desde modules/auth)');

  const setupRouter = require('../modules/core/routes/setup');
  console.log('  ✅ setup.js cargado');

  const superadminRouter = require('../modules/core/routes/superadmin');
  console.log('  ✅ superadmin.js cargado');

  const organizacionesRouter = require('../modules/core/routes/organizaciones');
  console.log('  ✅ organizaciones.js cargado');

  const usuariosRouter = require('../modules/core/routes/usuarios');
  console.log('  ✅ usuarios.js cargado');

  // NOTA: Sistema suscripciones v1 eliminado en Fase 0 (22 Ene 2026)
  // Ver nuevo módulo: suscripciones-negocio
  // Los archivos planes.js, pagos.js, webhooks.js, subscripciones.js fueron eliminados

  console.log('\n📦 Cargando controllers del módulo CORE...');
  const controllers = require('../modules/core/controllers');
  console.log('  ✅ Controllers index cargado');

  console.log('\n📦 Cargando models del módulo CORE...');
  const models = require('../modules/core/models');
  console.log('  ✅ Models index cargado');

  console.log('\n📦 Cargando schemas del módulo CORE...');
  const schemas = require('../modules/core/schemas');
  console.log('  ✅ Schemas index cargado');

  console.log('\n📦 Cargando routes/api/v1/index.js...');
  const routerApi = require('../routes/api/v1/index');
  console.log('  ✅ index.js principal cargado');

  console.log('\n✅ ¡ÉXITO! Todos los archivos del módulo CORE cargan correctamente');
  console.log('\n📊 Resumen:');
  console.log('  • 4 routes de core + auth desde modules/auth');
  console.log('  • Controllers, Models y Schemas cargados');
  console.log('  • Ver módulo suscripciones-negocio para pagos/suscripciones');
  console.log('\n🎉 El módulo CORE está listo para funcionar!\n');

  process.exit(0);

} catch (error) {
  console.error('\n❌ ERROR al cargar el módulo CORE:');
  console.error('\n🔍 Detalles del error:');
  console.error(error.message);
  console.error('\n📍 Stack trace:');
  console.error(error.stack);
  process.exit(1);
}

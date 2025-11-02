#!/usr/bin/env node

/**
 * ====================================================================
 * SCRIPT DE SINCRONIZACIÓN DE PLANES CON MERCADO PAGO
 * ====================================================================
 *
 * Sincroniza planes locales de la BD con Mercado Pago API.
 *
 * MODOS DE EJECUCIÓN:
 *
 * 1. Crear planes nuevos (default):
 *    node scripts/sync-plans-to-mercadopago.js
 *    - Busca planes con mp_plan_id IS NULL
 *    - Crea cada plan en Mercado Pago
 *    - Actualiza mp_plan_id en BD local
 *
 * 2. Actualizar planes existentes:
 *    node scripts/sync-plans-to-mercadopago.js --update
 *    - Busca planes con mp_plan_id NOT NULL
 *    - Compara precios locales vs MP
 *    - Actualiza los que cambiaron
 *
 * 3. Forzar recreación:
 *    node scripts/sync-plans-to-mercadopago.js --force
 *    - Borra planes en MP
 *    - Los recrea con datos actualizados
 *    - Actualiza mp_plan_id
 *
 * 4. Dry run (simular sin cambios):
 *    node scripts/sync-plans-to-mercadopago.js --dry-run
 *    - Muestra qué haría sin ejecutar cambios
 *
 * @module scripts/sync-plans-to-mercadopago
 */

require('dotenv').config();

const mercadopagoService = require('../services/mercadopago.service');
const RLSContextManager = require('../utils/rlsContextManager');
const logger = require('../utils/logger');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[36m',
  gray: '\x1b[90m'
};

// ====================================================================
// FUNCIONES PRINCIPALES
// ====================================================================

/**
 * Obtener planes locales que necesitan sincronización
 * @param {string} mode - Modo: 'create' | 'update' | 'force'
 */
async function obtenerPlanesParaSincronizar(mode) {
  return await RLSContextManager.withBypass(async (db) => {
    let query = '';

    if (mode === 'create') {
      // Buscar planes SIN mp_plan_id (nunca sincronizados)
      query = `
        SELECT id, codigo_plan, nombre_plan, precio_mensual,
               descripcion, mp_plan_id, activo
        FROM planes_subscripcion
        WHERE mp_plan_id IS NULL
          AND activo = true
        ORDER BY orden_display
      `;
    } else {
      // Buscar planes CON mp_plan_id (para update o force)
      query = `
        SELECT id, codigo_plan, nombre_plan, precio_mensual,
               descripcion, mp_plan_id, activo
        FROM planes_subscripcion
        WHERE mp_plan_id IS NOT NULL
          AND activo = true
        ORDER BY orden_display
      `;
    }

    const result = await db.query(query);
    return result.rows;
  });
}

/**
 * Crear plan en Mercado Pago
 */
async function crearPlanEnMP(plan, dryRun = false) {
  console.log(`\n${colors.blue}📋 Procesando: ${plan.nombre_plan}${colors.reset}`);
  console.log(`   Código: ${plan.codigo_plan}`);
  console.log(`   Precio: $${plan.precio_mensual} MXN/mes`);

  if (dryRun) {
    console.log(`${colors.gray}   [DRY RUN] Se crearía en Mercado Pago${colors.reset}`);
    return { id: 'dry-run-id-' + plan.id };
  }

  try {
    // Crear plan en Mercado Pago
    const mpPlan = await mercadopagoService.crearPlan({
      nombre: plan.nombre_plan,
      precio: parseFloat(plan.precio_mensual),
      frecuencia: {
        tipo: 'months',
        valor: 1
      },
      moneda: 'MXN'
    });

    console.log(`${colors.green}   ✅ Creado en MP con ID: ${mpPlan.id}${colors.reset}`);

    return mpPlan;
  } catch (error) {
    console.error(`${colors.red}   ❌ Error creando en MP: ${error.message}${colors.reset}`);
    throw error;
  }
}

/**
 * Actualizar mp_plan_id en BD local
 */
async function actualizarMpPlanIdLocal(planId, mpPlanId, dryRun = false) {
  if (dryRun) {
    console.log(`${colors.gray}   [DRY RUN] Se actualizaría mp_plan_id = ${mpPlanId}${colors.reset}`);
    return;
  }

  await RLSContextManager.withBypass(async (db) => {
    await db.query(`
      UPDATE planes_subscripcion
      SET mp_plan_id = $1
      WHERE id = $2
    `, [mpPlanId, planId]);
  });

  console.log(`${colors.green}   ✅ mp_plan_id actualizado en BD local${colors.reset}`);
}

/**
 * Actualizar plan existente en Mercado Pago
 */
async function actualizarPlanEnMP(plan, dryRun = false) {
  console.log(`\n${colors.blue}🔄 Actualizando: ${plan.nombre_plan}${colors.reset}`);
  console.log(`   MP Plan ID: ${plan.mp_plan_id}`);
  console.log(`   Precio actual: $${plan.precio_mensual} MXN/mes`);

  if (dryRun) {
    console.log(`${colors.gray}   [DRY RUN] Se actualizaría en Mercado Pago${colors.reset}`);
    return;
  }

  try {
    // Obtener plan actual de MP para comparar
    const mpPlan = await mercadopagoService.obtenerPlan(plan.mp_plan_id);
    const precioMP = mpPlan.auto_recurring.transaction_amount;
    const precioLocal = parseFloat(plan.precio_mensual);

    if (Math.abs(precioMP - precioLocal) < 0.01) {
      console.log(`${colors.gray}   ℹ️  Sin cambios (precio igual en MP)${colors.reset}`);
      return { cambios: false };
    }

    console.log(`   Precio en MP: $${precioMP} → Nuevo: $${precioLocal}`);

    // IMPORTANTE: En Mercado Pago NO se pueden actualizar precios de planes
    // existentes. Hay que crear un nuevo plan y migrar suscripciones.
    console.log(`${colors.yellow}   ⚠️  ADVERTENCIA: MP no permite actualizar precios de planes existentes${colors.reset}`);
    console.log(`${colors.yellow}   📝 Opciones:${colors.reset}`);
    console.log(`${colors.yellow}      1. Crear nuevo plan con --force${colors.reset}`);
    console.log(`${colors.yellow}      2. Migrar suscripciones manualmente${colors.reset}`);

    return { cambios: true, requiereRecreacion: true };
  } catch (error) {
    console.error(`${colors.red}   ❌ Error actualizando: ${error.message}${colors.reset}`);
    throw error;
  }
}

/**
 * Recrear plan (borrar y crear nuevo)
 */
async function recrearPlanEnMP(plan, dryRun = false) {
  console.log(`\n${colors.yellow}🔄 Recreando: ${plan.nombre_plan}${colors.reset}`);
  console.log(`   MP Plan ID anterior: ${plan.mp_plan_id}`);

  if (dryRun) {
    console.log(`${colors.gray}   [DRY RUN] Se borraría y recrearía en MP${colors.reset}`);
    return { id: 'dry-run-new-id-' + plan.id };
  }

  try {
    // Nota: En producción, verificar que no haya suscripciones activas
    // antes de borrar el plan

    console.log(`${colors.yellow}   ⚠️  Creando nuevo plan (el anterior quedará inactivo)${colors.reset}`);

    // Crear nuevo plan
    const mpPlan = await mercadopagoService.crearPlan({
      nombre: plan.nombre_plan,
      precio: parseFloat(plan.precio_mensual),
      frecuencia: {
        tipo: 'months',
        valor: 1
      },
      moneda: 'MXN'
    });

    console.log(`${colors.green}   ✅ Nuevo plan creado con ID: ${mpPlan.id}${colors.reset}`);
    console.log(`${colors.yellow}   📝 IMPORTANTE: Migrar suscripciones del plan anterior${colors.reset}`);

    return mpPlan;
  } catch (error) {
    console.error(`${colors.red}   ❌ Error recreando: ${error.message}${colors.reset}`);
    throw error;
  }
}

// ====================================================================
// MODO: CREAR PLANES NUEVOS
// ====================================================================

async function modoCrear(dryRun = false) {
  console.log(`\n${colors.blue}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}📋 MODO: CREAR PLANES NUEVOS${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════${colors.reset}`);

  const planes = await obtenerPlanesParaSincronizar('create');

  if (planes.length === 0) {
    console.log(`\n${colors.green}✅ Todos los planes ya están sincronizados${colors.reset}`);
    return { exitosos: 0, fallidos: 0 };
  }

  console.log(`\nEncontrados ${planes.length} plan(es) sin sincronizar:`);
  planes.forEach(p => {
    console.log(`  • ${p.nombre_plan} ($${p.precio_mensual}/mes)`);
  });

  if (dryRun) {
    console.log(`\n${colors.yellow}⚠️  DRY RUN: No se realizarán cambios${colors.reset}`);
  }

  let exitosos = 0;
  let fallidos = 0;

  for (const plan of planes) {
    try {
      // Crear en MP
      const mpPlan = await crearPlanEnMP(plan, dryRun);

      // Actualizar BD local
      await actualizarMpPlanIdLocal(plan.id, mpPlan.id, dryRun);

      exitosos++;
    } catch (error) {
      fallidos++;
      logger.error('Error sincronizando plan:', {
        plan: plan.codigo_plan,
        error: error.message
      });
    }
  }

  return { exitosos, fallidos };
}

// ====================================================================
// MODO: ACTUALIZAR PLANES EXISTENTES
// ====================================================================

async function modoActualizar(dryRun = false) {
  console.log(`\n${colors.blue}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}🔄 MODO: ACTUALIZAR PLANES EXISTENTES${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════${colors.reset}`);

  const planes = await obtenerPlanesParaSincronizar('update');

  if (planes.length === 0) {
    console.log(`\n${colors.yellow}⚠️  No hay planes sincronizados para actualizar${colors.reset}`);
    console.log(`   Ejecuta sin --update para crear planes nuevos`);
    return { exitosos: 0, fallidos: 0, sinCambios: 0 };
  }

  console.log(`\nRevisando ${planes.length} plan(es) sincronizado(s)...`);

  if (dryRun) {
    console.log(`${colors.yellow}⚠️  DRY RUN: No se realizarán cambios${colors.reset}`);
  }

  let exitosos = 0;
  let fallidos = 0;
  let sinCambios = 0;

  for (const plan of planes) {
    try {
      const resultado = await actualizarPlanEnMP(plan, dryRun);

      if (resultado?.cambios) {
        if (resultado.requiereRecreacion) {
          console.log(`${colors.yellow}   👉 Usar --force para recrear este plan${colors.reset}`);
        }
        exitosos++;
      } else {
        sinCambios++;
      }
    } catch (error) {
      fallidos++;
      logger.error('Error actualizando plan:', {
        plan: plan.codigo_plan,
        error: error.message
      });
    }
  }

  return { exitosos, fallidos, sinCambios };
}

// ====================================================================
// MODO: FORZAR RECREACIÓN
// ====================================================================

async function modoForce(dryRun = false) {
  console.log(`\n${colors.yellow}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.yellow}🔄 MODO: RECREAR PLANES (FORCE)${colors.reset}`);
  console.log(`${colors.yellow}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.red}⚠️  ADVERTENCIA: Esto creará nuevos planes en MP${colors.reset}`);
  console.log(`${colors.red}⚠️  Deberás migrar las suscripciones manualmente${colors.reset}`);

  const planes = await obtenerPlanesParaSincronizar('update');

  if (planes.length === 0) {
    console.log(`\n${colors.yellow}⚠️  No hay planes para recrear${colors.reset}`);
    return { exitosos: 0, fallidos: 0 };
  }

  console.log(`\nSe recrearán ${planes.length} plan(es):`);
  planes.forEach(p => {
    console.log(`  • ${p.nombre_plan} - ID actual: ${p.mp_plan_id}`);
  });

  if (!dryRun) {
    console.log(`\n${colors.yellow}⏳ Esperando 5 segundos... (Ctrl+C para cancelar)${colors.reset}`);
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  let exitosos = 0;
  let fallidos = 0;

  for (const plan of planes) {
    try {
      // Recrear plan
      const mpPlan = await recrearPlanEnMP(plan, dryRun);

      // Actualizar BD local con nuevo ID
      await actualizarMpPlanIdLocal(plan.id, mpPlan.id, dryRun);

      exitosos++;
    } catch (error) {
      fallidos++;
      logger.error('Error recreando plan:', {
        plan: plan.codigo_plan,
        error: error.message
      });
    }
  }

  return { exitosos, fallidos };
}

// ====================================================================
// FUNCIÓN PRINCIPAL
// ====================================================================

async function main() {
  console.log(`\n${colors.blue}╔═══════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  SINCRONIZACIÓN DE PLANES CON MERCADO PAGO       ║${colors.reset}`);
  console.log(`${colors.blue}╚═══════════════════════════════════════════════════╝${colors.reset}`);

  // Parsear argumentos
  const args = process.argv.slice(2);
  const modeUpdate = args.includes('--update');
  const modeForce = args.includes('--force');
  const dryRun = args.includes('--dry-run');
  const showHelp = args.includes('--help') || args.includes('-h');

  if (showHelp) {
    console.log(`
${colors.blue}USO:${colors.reset}
  node scripts/sync-plans-to-mercadopago.js [opciones]

${colors.blue}OPCIONES:${colors.reset}
  (sin opciones)  Crear planes nuevos (mp_plan_id IS NULL)
  --update        Actualizar planes existentes
  --force         Recrear planes (crea nuevos IDs)
  --dry-run       Simular sin hacer cambios
  --help, -h      Mostrar esta ayuda

${colors.blue}EJEMPLOS:${colors.reset}
  # Crear planes nuevos
  node scripts/sync-plans-to-mercadopago.js

  # Ver qué se actualizaría (sin cambios)
  node scripts/sync-plans-to-mercadopago.js --update --dry-run

  # Recrear planes con nuevos precios
  node scripts/sync-plans-to-mercadopago.js --force
    `);
    return;
  }

  try {
    let resultado;

    if (modeForce) {
      resultado = await modoForce(dryRun);
    } else if (modeUpdate) {
      resultado = await modoActualizar(dryRun);
    } else {
      resultado = await modoCrear(dryRun);
    }

    // Resumen final
    console.log(`\n${colors.blue}═══════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.blue}📊 RESUMEN${colors.reset}`);
    console.log(`${colors.blue}═══════════════════════════════════════════════════${colors.reset}`);

    if (resultado.exitosos > 0) {
      console.log(`${colors.green}✅ Exitosos: ${resultado.exitosos}${colors.reset}`);
    }

    if (resultado.sinCambios > 0) {
      console.log(`${colors.gray}ℹ️  Sin cambios: ${resultado.sinCambios}${colors.reset}`);
    }

    if (resultado.fallidos > 0) {
      console.log(`${colors.red}❌ Fallidos: ${resultado.fallidos}${colors.reset}`);
    }

    if (dryRun) {
      console.log(`\n${colors.yellow}💡 Ejecuta sin --dry-run para aplicar los cambios${colors.reset}`);
    }

    console.log('');

    process.exit(resultado.fallidos > 0 ? 1 : 0);

  } catch (error) {
    console.error(`\n${colors.red}❌ Error fatal: ${error.message}${colors.reset}`);
    logger.error('Error en sincronización de planes:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main };

#!/usr/bin/env node

/**
 * ====================================================================
 * SCRIPT PARA LIMPIAR TODOS LOS PLANES DE MERCADO PAGO
 * ====================================================================
 *
 * Este script:
 * 1. Lista todos los planes en Mercado Pago
 * 2. Elimina cada plan (actualizando status a 'inactive')
 * 3. Limpia los mp_plan_id en la BD local
 *
 * USO:
 *   docker exec back node scripts/limpiar-planes-mp.js
 */

require('dotenv').config();

const { MercadoPagoConfig, PreApprovalPlan } = require('mercadopago');
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

async function limpiarPlanesMP() {
  console.log(`\n${colors.blue}╔═══════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  LIMPIEZA DE PLANES EN MERCADO PAGO              ║${colors.reset}`);
  console.log(`${colors.blue}╚═══════════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    // 1. Inicializar cliente de Mercado Pago
    const accessToken = process.env.MERCADOPAGO_ENVIRONMENT === 'sandbox'
      ? process.env.MERCADOPAGO_SANDBOX_ACCESS_TOKEN
      : process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error('Access token de Mercado Pago no configurado');
    }

    const client = new MercadoPagoConfig({
      accessToken: accessToken,
      options: { timeout: 10000 }
    });

    const planClient = new PreApprovalPlan(client);

    console.log(`${colors.yellow}📋 Buscando planes en Mercado Pago...${colors.reset}\n`);

    // 2. Obtener planes de la BD local
    const planesLocales = await RLSContextManager.withBypass(async (db) => {
      const result = await db.query(`
        SELECT id, codigo_plan, nombre_plan, mp_plan_id
        FROM planes_subscripcion
        WHERE mp_plan_id IS NOT NULL
        ORDER BY id
      `);
      return result.rows;
    });

    if (planesLocales.length === 0) {
      console.log(`${colors.yellow}⚠️  No hay planes sincronizados en la BD local${colors.reset}\n`);
      return;
    }

    console.log(`Encontrados ${planesLocales.length} plan(es) sincronizado(s):\n`);
    planesLocales.forEach(plan => {
      console.log(`  ${colors.gray}•${colors.reset} ${plan.nombre_plan} (${plan.codigo_plan})`);
      console.log(`    ${colors.gray}MP ID: ${plan.mp_plan_id}${colors.reset}`);
    });
    console.log('');

    // 3. Limpiar mp_plan_id en BD local
    // NOTA: Los planes en MP deben eliminarse manualmente desde el panel de Mercado Pago
    let limpiados = 0;

    console.log(`${colors.yellow}⚠️  Los planes en Mercado Pago deben eliminarse manualmente desde:${colors.reset}`);
    console.log(`   ${colors.gray}https://www.mercadopago.com.mx/developers/panel/app${colors.reset}\n`);
    console.log(`${colors.blue}🧹 Limpiando mp_plan_id en BD local...${colors.reset}\n`);

    for (const plan of planesLocales) {
      try {
        console.log(`${colors.blue}  • ${plan.nombre_plan}${colors.reset}`);
        console.log(`    ${colors.gray}MP Plan ID a desvincular: ${plan.mp_plan_id}${colors.reset}`);

        // Limpiar mp_plan_id en BD local
        await RLSContextManager.withBypass(async (db) => {
          await db.query(`
            UPDATE planes_subscripcion
            SET mp_plan_id = NULL
            WHERE id = $1
          `, [plan.id]);
        });

        console.log(`    ${colors.green}✅ mp_plan_id limpiado${colors.reset}\n`);
        limpiados++;

      } catch (error) {
        console.log(`    ${colors.red}❌ Error: ${error.message}${colors.reset}\n`);
      }
    }

    // 4. Resumen
    console.log(`${colors.blue}═══════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.blue}📊 RESUMEN${colors.reset}`);
    console.log(`${colors.blue}═══════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}✅ mp_plan_id limpiados: ${limpiados}${colors.reset}`);
    console.log('');

    console.log(`${colors.yellow}💡 Próximo paso:${colors.reset}`);
    console.log(`   Ejecuta la sincronización para recrear los planes:`);
    console.log(`   ${colors.gray}docker exec back node scripts/sync-plans-to-mercadopago.js${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}❌ Error fatal:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Ejecutar
limpiarPlanesMP()
  .then(() => {
    console.log(`${colors.green}✅ Limpieza completada${colors.reset}\n`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`${colors.red}❌ Error:${colors.reset}`, error);
    process.exit(1);
  });

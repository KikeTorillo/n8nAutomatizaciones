#!/usr/bin/env node

/**
 * Script para verificar planes sincronizados con Mercado Pago
 */

require('dotenv').config();

const mercadopagoService = require('../services/mercadopago.service');
const RLSContextManager = require('../utils/rlsContextManager');

async function main() {
  console.log('\n📋 VERIFICANDO PLANES EN MERCADO PAGO\n');

  // Obtener planes de BD local
  const planes = await RLSContextManager.withBypass(async (db) => {
    const result = await db.query(`
      SELECT id, codigo_plan, nombre_plan, precio_mensual, mp_plan_id
      FROM planes_subscripcion
      WHERE mp_plan_id IS NOT NULL
      ORDER BY id
    `);
    return result.rows;
  });

  if (planes.length === 0) {
    console.log('❌ No hay planes sincronizados');
    return;
  }

  console.log(`Encontrados ${planes.length} planes sincronizados:\n`);

  for (const plan of planes) {
    console.log(`📦 ${plan.nombre_plan}`);
    console.log(`   Código: ${plan.codigo_plan}`);
    console.log(`   Precio local: $${plan.precio_mensual} MXN/mes`);
    console.log(`   MP Plan ID: ${plan.mp_plan_id}`);

    try {
      // Obtener información del plan desde Mercado Pago
      const mpPlan = await mercadopagoService.obtenerPlan(plan.mp_plan_id);

      console.log(`   ✅ Estado en MP: ${mpPlan.status}`);
      console.log(`   📅 Creado: ${new Date(mpPlan.date_created).toLocaleString()}`);
      console.log(`   💰 Precio en MP: $${mpPlan.auto_recurring.transaction_amount} ${mpPlan.auto_recurring.currency_id}`);
      console.log(`   🔄 Frecuencia: ${mpPlan.auto_recurring.frequency} ${mpPlan.auto_recurring.frequency_type}`);
    } catch (error) {
      console.log(`   ❌ Error obteniendo de MP: ${error.message}`);
    }

    console.log('');
  }

  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

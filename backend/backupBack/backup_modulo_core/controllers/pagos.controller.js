/**
 * ====================================================================
 * CONTROLLER DE PAGOS
 * ====================================================================
 *
 * Maneja operaciones relacionadas con pagos y suscripciones de Mercado Pago.
 *
 * ENDPOINTS:
 * - POST /api/v1/pagos/crear-suscripcion
 * - GET /api/v1/pagos/historial
 * - GET /api/v1/pagos/metodo-pago
 *
 * SEGURIDAD:
 * - Requiere autenticación JWT
 * - Usa RLS para aislamiento multi-tenant
 * - Solo admin/propietario pueden crear suscripciones
 *
 * @module controllers/pagos.controller
 */

const mercadopagoService = require('../services/mercadopago.service');
const RLSContextManager = require('../utils/rlsContextManager');
const asyncHandler = require('../middleware/asyncHandler');
const { ResponseHelper } = require('../utils/helpers');
const logger = require('../utils/logger');

class PagosController {
  /**
   * Crear suscripción en Mercado Pago
   *
   * @route POST /api/v1/pagos/crear-suscripcion
   * @access Private (admin, propietario)
   *
   * @body {string} plan_codigo - Código del plan ('basico', 'profesional', 'custom')
   * @body {string} [payer_email] - Email del pagador (opcional, usa email del usuario)
   *
   * @returns {Object} { subscription_id, checkout_url, plan }
   */
  static crearSuscripcion = asyncHandler(async (req, res) => {
    const { plan_codigo, payer_email } = req.body;
    const { organizacion_id, email } = req.user;

    logger.info('Creando suscripción', {
      organizacion_id,
      plan_codigo,
      usuario: email
    });

    // 1. Verificar que el plan existe y tiene mp_plan_id
    const plan = await RLSContextManager.withBypass(async (db) => {
      const result = await db.query(`
        SELECT id, mp_plan_id, nombre_plan, codigo_plan, precio_mensual
        FROM planes_subscripcion
        WHERE codigo_plan = $1 AND activo = true
      `, [plan_codigo]);

      return result.rows[0];
    });

    if (!plan) {
      return ResponseHelper.error(res, 404, 'Plan no encontrado');
    }

    if (!plan.mp_plan_id) {
      logger.error('Plan sin mp_plan_id', { plan_codigo });
      return ResponseHelper.error(
        res,
        500,
        'Plan no configurado en Mercado Pago. Contacte al administrador.'
      );
    }

    // 2. Verificar que la organización no tenga suscripción activa en MP
    const subscripcionExistente = await RLSContextManager.query(
      organizacion_id,
      async (db) => {
        const result = await db.query(`
          SELECT subscription_id_gateway, estado
          FROM subscripciones
          WHERE organizacion_id = $1
        `, [organizacion_id]);

        return result.rows[0];
      }
    );

    if (
      subscripcionExistente?.subscription_id_gateway &&
      subscripcionExistente.estado === 'activa'
    ) {
      return ResponseHelper.error(
        res,
        400,
        'Ya existe una suscripción activa. Use el endpoint de cambio de plan.'
      );
    }

    // 3. Crear suscripción en Mercado Pago
    const externalReference = `org_${organizacion_id}_${Date.now()}`;
    const returnUrl = `${process.env.FRONTEND_URL}/payment/callback`;

    const subscription = await mercadopagoService.crearSuscripcion({
      planId: plan.mp_plan_id,
      email: payer_email || email,
      returnUrl,
      externalReference
    });

    logger.info('Suscripción creada en MP', {
      subscriptionId: subscription.id,
      organizacion_id
    });

    // 4. Actualizar subscripción en BD (sin transacción, es un UPDATE simple)
    await RLSContextManager.query(organizacion_id, async (db) => {
      await db.query(`
        UPDATE subscripciones
        SET subscription_id_gateway = $1,
            gateway_pago = 'mercadopago',
            updated_at = NOW()
        WHERE organizacion_id = $2
      `, [subscription.id, organizacion_id]);
    });

    // 5. Registrar en historial (usa bypass porque historial tiene política especial)
    await RLSContextManager.withBypass(async (db) => {
      await db.query(`
        INSERT INTO historial_subscripciones (
          organizacion_id, tipo_evento, motivo, metadata
        ) VALUES ($1, $2, $3, $4)
      `, [
        organizacion_id,
        'creacion',
        `Suscripción creada en Mercado Pago: ${plan.nombre_plan}`,
        JSON.stringify({
          subscription_id_mp: subscription.id,
          plan_codigo
        })
      ]);
    });

    // 6. Retornar URL de checkout
    return ResponseHelper.success(res, {
      subscription_id: subscription.id,
      checkout_url: subscription.init_point,
      plan: {
        codigo: plan.codigo_plan,
        nombre: plan.nombre_plan,
        precio: plan.precio_mensual
      }
    }, 'Redirigir al usuario a checkout_url para completar el pago');
  });

  /**
   * Obtener historial de pagos de la organización
   *
   * @route GET /api/v1/pagos/historial
   * @access Private
   *
   * @query {number} [limite=20] - Límite de resultados
   * @query {number} [pagina=1] - Número de página
   *
   * @returns {Object} { pagos, paginacion }
   */
  static obtenerHistorial = asyncHandler(async (req, res) => {
    const { organizacion_id } = req.user;
    const { limite = 20, pagina = 1 } = req.query;

    const limiteNum = parseInt(limite);
    const paginaNum = parseInt(pagina);
    const offset = (paginaNum - 1) * limiteNum;

    // Obtener pagos y total en paralelo
    const [pagos, total] = await Promise.all([
      RLSContextManager.query(organizacion_id, async (db) => {
        const result = await db.query(`
          SELECT
            id,
            payment_id_mp,
            monto,
            moneda,
            estado,
            tipo_pago,
            payment_method_id,
            fecha_pago,
            created_at
          FROM pagos
          WHERE organizacion_id = $1
          ORDER BY fecha_pago DESC NULLS LAST, created_at DESC
          LIMIT $2 OFFSET $3
        `, [organizacion_id, limiteNum, offset]);

        return result.rows;
      }),

      RLSContextManager.query(organizacion_id, async (db) => {
        const result = await db.query(`
          SELECT COUNT(*) as total
          FROM pagos
          WHERE organizacion_id = $1
        `, [organizacion_id]);

        return parseInt(result.rows[0].total);
      })
    ]);

    return ResponseHelper.success(res, {
      pagos,
      paginacion: {
        total,
        pagina: paginaNum,
        limite: limiteNum,
        total_paginas: Math.ceil(total / limiteNum)
      }
    });
  });

  /**
   * Obtener método de pago actual
   *
   * @route GET /api/v1/pagos/metodo-pago
   * @access Private
   *
   * @returns {Object} { metodo_pago }
   */
  static obtenerMetodoPago = asyncHandler(async (req, res) => {
    const { organizacion_id } = req.user;

    const metodoPago = await RLSContextManager.query(organizacion_id, async (db) => {
      const result = await db.query(`
        SELECT
          id,
          card_last_digits,
          card_brand,
          card_holder_name,
          expiration_month,
          expiration_year,
          activo
        FROM metodos_pago
        WHERE organizacion_id = $1 AND activo = true
        ORDER BY created_at DESC
        LIMIT 1
      `, [organizacion_id]);

      return result.rows[0] || null;
    });

    return ResponseHelper.success(res, {
      metodo_pago: metodoPago
    });
  });
}

module.exports = PagosController;

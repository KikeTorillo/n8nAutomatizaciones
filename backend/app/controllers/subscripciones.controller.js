/**
 * ====================================================================
 * CONTROLADOR DE SUSCRIPCIONES
 * ====================================================================
 *
 * Maneja la creación y gestión de suscripciones con Mercado Pago
 */

const mercadopagoService = require('../services/mercadopago.service');
const mercadopagoApi = require('../services/mercadopago.service');
const SubscripcionModel = require('../database/subscripcion.model');
const { ResponseHelper, ValidationHelper } = require('../utils/helpers');
const logger = require('../utils/logger');
const RLSContextManager = require('../utils/rlsContextManager');

class SubscripcionesController {
  /**
   * Crear suscripción en Mercado Pago
   * POST /api/v1/subscripciones/crear
   *
   * Body: {
   *   plan_id: number,
   *   email: string,
   *   card_token_id: string
   * }
   *
   * Retorna: {
   *   subscription_id: string,
   *   status: string,
   *   suscripcion_id: number
   * }
   */
  async crearSuscripcion(req, res) {
    const { plan_id, email, card_token_id } = req.body;
    const organizacionId = req.tenant.organizacionId;  // ✅ Corregido: obtener de req.tenant
    const userId = req.user.id;  // ✅ Corregido: obtener de req.user

    try {
      // 1. Obtener información del plan
      const plan = await RLSContextManager.query(organizacionId, async (db) => {
        const result = await db.query(`
          SELECT id, codigo_plan, nombre_plan, precio_mensual, mp_plan_id
          FROM planes_subscripcion
          WHERE id = $1 AND activo = true
        `, [plan_id]);

        return result.rows[0];
      });

      if (!plan) {
        return ResponseHelper.error(res, 'Plan no encontrado', 404);
      }

      if (!plan.mp_plan_id) {
        return ResponseHelper.error(res, 'El plan no está sincronizado con Mercado Pago', 400);
      }

      // 2. Verificar si la organización ya tiene una suscripción activa
      const suscripcionActiva = await RLSContextManager.query(organizacionId, async (db) => {
        const result = await db.query(`
          SELECT id, estado
          FROM subscripciones
          WHERE organizacion_id = $1 AND activa = true
          LIMIT 1
        `, [organizacionId]);

        return result.rows[0];
      });

      if (suscripcionActiva) {
        return ResponseHelper.error(res, 'La organización ya tiene una suscripción activa', 400);
      }

      // 3. Generar referencia externa única
      const externalReference = `org_${organizacionId}_${Date.now()}`;

      // 4. Obtener URL de retorno desde variables de entorno
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      const returnUrl = `${frontendUrl}/subscripcion/resultado`;

      // 5. Crear suscripción en Mercado Pago
      logger.info('Creando suscripción en Mercado Pago', {
        organizacionId,
        planId: plan_id,
        mpPlanId: plan.mp_plan_id,
        email,
        hasCardToken: !!card_token_id
      });

      const mpSuscripcion = await mercadopagoService.crearSuscripcion({
        planId: plan.mp_plan_id,
        email,
        cardTokenId: card_token_id,
        returnUrl,
        externalReference
      });

      // 6. Crear registro en BD local
      const nuevaSuscripcion = await RLSContextManager.query(organizacionId, async (db) => {
        const result = await db.query(`
          INSERT INTO subscripciones (
            organizacion_id,
            plan_id,
            precio_actual,
            fecha_inicio,
            fecha_proximo_pago,
            estado,
            activa,
            gateway_pago,
            subscription_id_gateway,
            actualizado_por
          ) VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month', 'pendiente', false, 'mercadopago', $4, $5)
          RETURNING id, estado, subscription_id_gateway
        `, [organizacionId, plan_id, plan.precio_mensual, mpSuscripcion.id, userId]);

        return result.rows[0];
      });

      logger.info('✅ Suscripción creada exitosamente', {
        suscripcionId: nuevaSuscripcion.id,
        mpSuscripcionId: mpSuscripcion.id,
        organizacionId,
        status: mpSuscripcion.status
      });

      return ResponseHelper.success(res, {
        subscription_id: mpSuscripcion.id,
        status: mpSuscripcion.status,
        suscripcion_id: nuevaSuscripcion.id
      }, 'Suscripción creada exitosamente', 201);

    } catch (error) {
      logger.error('Error creando suscripción:', {
        error: error.message,
        stack: error.stack,
        organizacionId,
        planId: plan_id
      });
      return ResponseHelper.error(res, `Error creando suscripción: ${error.message}`, 500);
    }
  }

  /**
   * Obtener suscripción actual de la organización
   * GET /api/v1/subscripciones/actual
   */
  async obtenerSuscripcionActual(req, res) {
    const organizacionId = req.tenant.organizacionId;  // ✅ Corregido: obtener de req.tenant

    try {
      const suscripcion = await RLSContextManager.query(organizacionId, async (db) => {
        const result = await db.query(`
          SELECT
            s.*,
            p.nombre_plan,
            p.codigo_plan,
            p.max_profesionales,
            p.max_servicios,
            p.max_usuarios,
            p.max_citas_mes
          FROM subscripciones s
          INNER JOIN planes_subscripcion p ON s.plan_id = p.id
          WHERE s.organizacion_id = $1 AND s.activa = true
          LIMIT 1
        `, [organizacionId]);

        return result.rows[0];
      });

      if (!suscripcion) {
        return ResponseHelper.success(res, null, 'No hay suscripción activa');
      }

      return ResponseHelper.success(res, suscripcion);

    } catch (error) {
      logger.error('Error obteniendo suscripción:', {
        error: error.message,
        organizacionId
      });
      return ResponseHelper.error(res, 'Error obteniendo suscripción', 500);
    }
  }

  /**
   * Obtener estado del trial de la organización
   * GET /api/v1/subscripciones/estado-trial
   */
  async obtenerEstadoTrial(req, res) {
    const organizacionId = req.tenant.organizacionId;

    try {
      const estadoTrial = await SubscripcionModel.verificarEstadoTrial(organizacionId);

      return ResponseHelper.success(res, estadoTrial);
    } catch (error) {
      logger.error('Error obteniendo estado del trial:', {
        error: error.message,
        organizacionId
      });
      return ResponseHelper.error(res, 'Error obteniendo estado del trial', 500);
    }
  }

  /**
   * Activar pago con Mercado Pago (después del trial) - Usando init_point
   * POST /api/v1/subscripciones/activar-pago
   *
   * No requiere body - genera init_point para que usuario pague en MP
   */
  async activarPago(req, res) {
    const organizacionId = req.tenant.organizacionId;

    try {
      // 1. Obtener suscripción actual
      const suscripcionActual = await SubscripcionModel.obtenerPorOrganizacion(organizacionId);

      if (!suscripcionActual) {
        return ResponseHelper.error(res, 'No se encontró suscripción activa', 404);
      }

      // 2. Verificar que tenga un plan de pago y esté en trial
      const esPlanDePago = ['basico', 'profesional'].includes(suscripcionActual.codigo_plan);
      if (!esPlanDePago) {
        return ResponseHelper.error(res, 'Este plan no requiere activación de pago', 400);
      }

      // 3. Obtener datos del plan para crear suscripción
      const plan = await RLSContextManager.query(organizacionId, async (db) => {
        const result = await db.query(`
          SELECT
            nombre_plan,
            precio_mensual,
            moneda
          FROM planes_subscripcion
          WHERE id = $1 AND activo = true
        `, [suscripcionActual.plan_id]);
        return result.rows[0];
      });

      if (!plan) {
        return ResponseHelper.error(res, 'Plan no encontrado', 404);
      }

      // 4. Generar referencia externa única
      const externalReference = `org_${organizacionId}_${Date.now()}`;

      // Para sandbox, Mercado Pago requiere una URL válida (no localhost)
      let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';

      // Si es localhost, usar URL de ejemplo válida para sandbox (misma región que el access token - MX)
      if (frontendUrl.includes('localhost') || frontendUrl.includes('127.0.0.1')) {
        frontendUrl = 'https://www.mercadopago.com.mx';
      }

      const returnUrl = `${frontendUrl}/return`;

      // 5. Crear suscripción en Mercado Pago SIN plan asociado (genera init_point)
      logger.info('Creando suscripción con init_point en Mercado Pago', {
        organizacionId,
        planNombre: plan.nombre_plan,
        precio: plan.precio_mensual,
        email: req.user.email
      });

      const mpSuscripcion = await mercadopagoService.crearSuscripcionConInitPoint({
        nombre: plan.nombre_plan,
        precio: parseFloat(plan.precio_mensual),
        moneda: plan.moneda || 'MXN',
        email: req.user.email,
        returnUrl,
        externalReference
      });

      // 6. Guardar subscription_id en suscripción local (aún en estado 'pending')
      await RLSContextManager.query(organizacionId, async (db) => {
        await db.query(`
          UPDATE subscripciones
          SET subscription_id_gateway = $1
          WHERE organizacion_id = $2 AND activa = TRUE
        `, [mpSuscripcion.id, organizacionId]);
      });

      logger.info('✅ Init point generado exitosamente', {
        mpSuscripcionId: mpSuscripcion.id,
        organizacionId,
        hasInitPoint: !!mpSuscripcion.init_point
      });

      return ResponseHelper.success(res, {
        subscription_id: mpSuscripcion.id,
        init_point: mpSuscripcion.init_point, // URL para redirigir al usuario
        status: mpSuscripcion.status
      }, 'Suscripción creada. Redirigir al usuario para completar el pago.', 200);

    } catch (error) {
      logger.error('Error creando suscripción:', {
        error: error.message,
        stack: error.stack,
        organizacionId
      });
      return ResponseHelper.error(res, `Error creando suscripción: ${error.message}`, 500);
    }
  }

  /**
   * Obtener métricas de uso de la organización
   * GET /api/v1/subscripciones/metricas-uso
   */
  async obtenerMetricasUso(req, res) {
    const organizacionId = req.tenant.organizacionId;

    try {
      const metricas = await SubscripcionModel.obtenerMetricasUso(organizacionId);

      if (!metricas) {
        return ResponseHelper.success(res, {
          uso_profesionales: 0,
          uso_clientes: 0,
          uso_servicios: 0,
          uso_usuarios: 1,
          uso_citas_mes_actual: 0
        }, 'No hay métricas disponibles');
      }

      return ResponseHelper.success(res, metricas);
    } catch (error) {
      logger.error('Error obteniendo métricas de uso:', {
        error: error.message,
        organizacionId
      });
      return ResponseHelper.error(res, 'Error obteniendo métricas de uso', 500);
    }
  }
}

module.exports = new SubscripcionesController();

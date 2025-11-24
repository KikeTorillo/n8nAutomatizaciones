/**
 * ====================================================================
 * MODELO DE SUBSCRIPCIONES
 * ====================================================================
 * Gestiona las suscripciones de las organizaciones incluyendo trials,
 * activación de pagos y verificación de estado.
 */

const { getDb } = require('../../../config/database');
const RLSContextManager = require('../../../utils/rlsContextManager');

class SubscripcionModel {
  /**
   * Obtener suscripción activa de una organización
   * @param {number} organizacionId - ID de la organización
   * @returns {Promise<Object|null>} Suscripción activa o null
   */
  static async obtenerPorOrganizacion(organizacionId) {
    return await RLSContextManager.query(organizacionId, async (db) => {
      const query = `
        SELECT
          s.id,
          s.organizacion_id,
          s.plan_id,
          s.precio_actual,
          s.fecha_inicio,
          s.fecha_fin,
          s.fecha_proximo_pago,
          s.estado,
          s.activa,
          s.fecha_inicio_trial,
          s.fecha_fin_trial,
          s.dias_trial,
          s.subscription_id_gateway AS mercadopago_subscription_id,
          s.customer_id_gateway AS mercadopago_customer_id,
          s.creado_en,
          s.actualizado_en,
          ps.codigo_plan,
          ps.nombre_plan,
          ps.precio_mensual,
          ps.limite_profesionales,
          ps.limite_clientes,
          ps.limite_servicios,
          ps.limite_usuarios,
          ps.limite_citas_mes
        FROM subscripciones s
        INNER JOIN planes_subscripcion ps ON s.plan_id = ps.id
        WHERE s.organizacion_id = $1 AND s.activa = TRUE
        ORDER BY s.creado_en DESC
        LIMIT 1
      `;

      const result = await db.query(query, [organizacionId]);
      return result.rows[0] || null;
    });
  }

  /**
   * Verificar estado del trial y calcular días restantes
   * @param {number} organizacionId - ID de la organización
   * @returns {Promise<Object>} Estado del trial
   */
  static async verificarEstadoTrial(organizacionId) {
    return await RLSContextManager.query(organizacionId, async (db) => {
      const query = `
        SELECT
          s.fecha_inicio_trial,
          s.fecha_fin_trial,
          s.dias_trial,
          s.estado,
          ps.codigo_plan,
          CASE
            WHEN s.fecha_fin_trial IS NULL THEN NULL
            WHEN NOW() > s.fecha_fin_trial THEN 0
            ELSE EXTRACT(DAY FROM s.fecha_fin_trial - NOW())::INTEGER
          END AS dias_restantes,
          CASE
            WHEN s.fecha_fin_trial IS NULL THEN true
            WHEN NOW() <= s.fecha_fin_trial THEN true
            ELSE false
          END AS trial_activo,
          CASE
            WHEN s.fecha_fin_trial IS NOT NULL AND NOW() > s.fecha_fin_trial THEN true
            ELSE false
          END AS trial_vencido
        FROM subscripciones s
        INNER JOIN planes_subscripcion ps ON s.plan_id = ps.id
        WHERE s.organizacion_id = $1 AND s.activa = TRUE
        LIMIT 1
      `;

      const result = await db.query(query, [organizacionId]);

      if (!result.rows[0]) {
        return {
          tiene_trial: false,
          trial_activo: false,
          trial_vencido: false,
          dias_restantes: null,
          plan_codigo: null
        };
      }

      const row = result.rows[0];
      return {
        tiene_trial: row.fecha_inicio_trial !== null,
        trial_activo: row.trial_activo,
        trial_vencido: row.trial_vencido,
        dias_restantes: row.dias_restantes,
        plan_codigo: row.codigo_plan,
        fecha_inicio_trial: row.fecha_inicio_trial,
        fecha_fin_trial: row.fecha_fin_trial
      };
    });
  }

  /**
   * Activar pago - actualizar suscripción local con datos de Mercado Pago
   * @param {number} organizacionId - ID de la organización
   * @param {string} mpSubscriptionId - ID de suscripción en Mercado Pago
   * @param {string} mpCustomerId - ID de customer en Mercado Pago
   * @returns {Promise<Object>} Suscripción actualizada
   */
  static async activarPago(organizacionId, mpSubscriptionId, mpCustomerId = null) {
    return await RLSContextManager.transaction(organizacionId, async (db) => {
      const query = `
        UPDATE subscripciones
        SET
          estado = 'activa',
          subscription_id_gateway = $2,
          customer_id_gateway = $3,
          gateway_pago = 'mercadopago',
          fecha_inicio_trial = NULL,
          fecha_fin_trial = NULL,
          actualizado_en = NOW()
        WHERE organizacion_id = $1 AND activa = TRUE
        RETURNING
          id,
          organizacion_id,
          plan_id,
          estado,
          subscription_id_gateway,
          customer_id_gateway,
          actualizado_en
      `;

      const result = await db.query(query, [
        organizacionId,
        mpSubscriptionId,
        mpCustomerId
      ]);

      if (result.rows.length === 0) {
        throw new Error('No se encontró suscripción activa para actualizar');
      }

      return result.rows[0];
    });
  }

  /**
   * Suspender suscripción por trial vencido
   * @param {number} organizacionId - ID de la organización
   * @returns {Promise<Object>} Suscripción suspendida
   */
  static async suspenderPorTrialVencido(organizacionId) {
    return await RLSContextManager.transaction(organizacionId, async (db) => {
      const query = `
        UPDATE subscripciones
        SET
          estado = 'suspendida',
          activa = FALSE,
          motivo_cancelacion = 'Trial vencido sin activación de pago',
          actualizado_en = NOW()
        WHERE organizacion_id = $1
          AND activa = TRUE
          AND fecha_fin_trial IS NOT NULL
          AND NOW() > fecha_fin_trial
        RETURNING id, organizacion_id, estado, activa
      `;

      const result = await db.query(query, [organizacionId]);
      return result.rows[0] || null;
    });
  }

  /**
   * Reactivar suscripción suspendida
   * @param {number} organizacionId - ID de la organización
   * @returns {Promise<Object>} Suscripción reactivada
   */
  static async reactivar(organizacionId) {
    return await RLSContextManager.transaction(organizacionId, async (db) => {
      const query = `
        UPDATE subscripciones
        SET
          estado = 'activa',
          activa = TRUE,
          motivo_cancelacion = NULL,
          fecha_cancelacion = NULL,
          actualizado_en = NOW()
        WHERE organizacion_id = $1 AND activa = FALSE
        RETURNING id, organizacion_id, estado, activa
      `;

      const result = await db.query(query, [organizacionId]);

      if (result.rows.length === 0) {
        throw new Error('No se encontró suscripción suspendida para reactivar');
      }

      return result.rows[0];
    });
  }

  /**
   * Obtener métricas de uso de la organización
   * @param {number} organizacionId - ID de la organización
   * @returns {Promise<Object>} Métricas de uso y límites
   */
  static async obtenerMetricasUso(organizacionId) {
    return await RLSContextManager.query(organizacionId, async (db) => {
      const query = `
        SELECT
          m.uso_profesionales,
          m.uso_clientes,
          m.uso_servicios,
          m.uso_usuarios,
          m.uso_citas_mes_actual,
          ps.limite_profesionales,
          ps.limite_clientes,
          ps.limite_servicios,
          ps.limite_usuarios,
          ps.limite_citas_mes,
          CASE
            WHEN ps.limite_profesionales IS NULL THEN 100
            ELSE ROUND((m.uso_profesionales::NUMERIC / ps.limite_profesionales::NUMERIC) * 100, 2)
          END AS porcentaje_profesionales,
          CASE
            WHEN ps.limite_clientes IS NULL THEN 100
            ELSE ROUND((m.uso_clientes::NUMERIC / ps.limite_clientes::NUMERIC) * 100, 2)
          END AS porcentaje_clientes,
          CASE
            WHEN ps.limite_servicios IS NULL THEN 100
            ELSE ROUND((m.uso_servicios::NUMERIC / ps.limite_servicios::NUMERIC) * 100, 2)
          END AS porcentaje_servicios
        FROM metricas_uso_organizacion m
        INNER JOIN subscripciones s ON m.organizacion_id = s.organizacion_id AND s.activa = TRUE
        INNER JOIN planes_subscripcion ps ON s.plan_id = ps.id
        WHERE m.organizacion_id = $1
      `;

      const result = await db.query(query, [organizacionId]);
      return result.rows[0] || null;
    });
  }
}

module.exports = SubscripcionModel;

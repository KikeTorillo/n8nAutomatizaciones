/**
 * ====================================================================
 * CONTROLLER DE WEBHOOKS MERCADO PAGO
 * ====================================================================
 *
 * Maneja notificaciones webhook de Mercado Pago.
 *
 * EVENTOS SOPORTADOS:
 * - payment: Pagos (payment.created, payment.updated)
 * - subscription_preapproval: Suscripciones
 * - subscription_authorized_payment: Pagos autorizados
 *
 * SEGURIDAD:
 * - Validación HMAC SHA-256 de firma x-signature
 * - Idempotencia garantizada (UNIQUE payment_id_mp)
 * - Transacciones atómicas con RLS
 *
 * PERFORMANCE:
 * - Responde HTTP 200 en <5 segundos (requisito MP)
 * - Procesa async sin bloquear respuesta
 * - Usa transacciones para atomicidad
 *
 * @module controllers/webhooks.controller
 */

const mercadopagoService = require('../../../services/mercadopago.service');
const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

class WebhooksController {
  /**
   * Handler principal de webhooks de Mercado Pago
   *
   * @route POST /api/v1/webhooks/mercadopago
   * @access Public (valida firma x-signature)
   *
   * @body {string} type - Tipo de evento ('payment', 'subscription_preapproval', etc.)
   * @body {Object} data - Datos del evento ({ id: 'resource_id' })
   * @body {string} action - Acción del evento ('created', 'updated', etc.)
   *
   * @headers {string} x-signature - Firma HMAC del webhook
   * @headers {string} x-request-id - ID único del request
   */
  static async handleMercadoPago(req, res) {
    const { type, data, action } = req.body;

    logger.info('📥 Webhook recibido de Mercado Pago', {
      type,
      action,
      dataId: data?.id,
      timestamp: new Date().toISOString()
    });

    // 1. Validar signature (CRÍTICO para seguridad)
    const signature = req.headers['x-signature'];
    const requestId = req.headers['x-request-id'];

    const esValido = mercadopagoService.validarWebhook(signature, requestId, data?.id);

    if (!esValido) {
      logger.warn('⚠️  Webhook con firma inválida', { signature, requestId });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 2. Responder rápido (Mercado Pago espera HTTP 200 en <5 segundos)
    res.status(200).send('OK');

    // 3. Procesar async (no bloquear la respuesta)
    try {
      if (type === 'payment') {
        await WebhooksController.procesarPago(data.id, action);
      } else if (type === 'subscription_preapproval') {
        await WebhooksController.procesarSuscripcion(data.id, action);
      } else if (type === 'subscription_authorized_payment') {
        await WebhooksController.procesarPagoAutorizado(data.id, action);
      } else {
        logger.info(`ℹ️  Tipo de webhook no manejado: ${type}`);
      }
    } catch (error) {
      logger.error('❌ Error procesando webhook:', error);
      // No lanzar error (ya respondimos 200)
    }
  }

  /**
   * Procesar evento de pago
   *
   * @private
   * @param {string} paymentId - ID del pago en MP
   * @param {string} action - Acción del evento
   */
  static async procesarPago(paymentId, action) {
    logger.info('💳 Procesando pago', { paymentId, action });

    try {
      // 1. Obtener pago de Mercado Pago
      const pago = await mercadopagoService.obtenerPago(paymentId);

      logger.info('Pago obtenido de MP', {
        paymentId,
        status: pago.status,
        amount: pago.transaction_amount,
        externalRef: pago.external_reference
      });

      // 2. Extraer organizacion_id del external_reference
      // Formato: org_{organizacion_id}_{timestamp}
      const orgId = WebhooksController.extraerOrgId(pago.external_reference);

      if (!orgId) {
        logger.error('No se pudo extraer organizacion_id', {
          externalReference: pago.external_reference
        });
        return;
      }

      // 3. Verificar idempotencia y registrar/actualizar pago (CON BYPASS porque no podemos usar RLS aquí)
      const yaExiste = await RLSContextManager.withBypass(async (db) => {
        const result = await db.query(`
          SELECT id FROM pagos WHERE payment_id_mp = $1
        `, [paymentId]);

        return result.rows.length > 0;
      });

      if (yaExiste) {
        logger.info('Pago ya procesado, actualizando...', { paymentId });

        // Actualizar estado usando bypass (porque necesitamos acceso directo)
        await RLSContextManager.withBypass(async (db) => {
          await db.query(`
            UPDATE pagos
            SET estado = $1,
                status_detail = $2,
                fecha_aprobacion = $3,
                metadata = $4,
                updated_at = NOW()
            WHERE payment_id_mp = $5
          `, [
            pago.status,
            pago.status_detail,
            pago.date_approved,
            JSON.stringify(pago),
            paymentId
          ]);
        });

        return;
      }

      // 4. Registrar nuevo pago usando bypass
      await RLSContextManager.withBypass(async (db) => {
        await db.query(`
          INSERT INTO pagos (
            organizacion_id, payment_id_mp, subscription_id_mp,
            monto, moneda, estado, tipo_pago,
            payment_method_id, payment_type_id, status_detail,
            metadata, external_reference,
            fecha_pago, fecha_aprobacion
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `, [
          orgId,
          pago.id,
          pago.subscription_id || null,
          pago.transaction_amount,
          pago.currency_id,
          pago.status,
          pago.subscription_id ? 'subscription' : 'one_time',
          pago.payment_method_id,
          pago.payment_type_id,
          pago.status_detail,
          JSON.stringify(pago),
          pago.external_reference,
          pago.date_created,
          pago.date_approved
        ]);
      });

      logger.info('✅ Pago registrado en BD', { paymentId, orgId });

      // 5. Actualizar estado de subscripción según resultado del pago
      if (pago.status === 'approved') {
        await WebhooksController.pagoExitoso(orgId, pago);
      } else if (pago.status === 'rejected') {
        await WebhooksController.pagoFallido(orgId, pago);
      } else if (pago.status === 'pending') {
        logger.info('Pago pendiente, esperando confirmación', { paymentId });
      }

    } catch (error) {
      logger.error('Error procesando pago:', error);
      throw error;
    }
  }

  /**
   * Procesar evento de suscripción
   *
   * @private
   * @param {string} subscriptionId - ID de suscripción en MP
   * @param {string} action - Acción del evento
   */
  static async procesarSuscripcion(subscriptionId, action) {
    logger.info('📋 Procesando suscripción', { subscriptionId, action });

    try {
      // Obtener suscripción de Mercado Pago
      const subscription = await mercadopagoService.obtenerSuscripcion(subscriptionId);

      logger.info('Suscripción obtenida de MP', {
        subscriptionId,
        status: subscription.status,
        externalRef: subscription.external_reference
      });

      const orgId = WebhooksController.extraerOrgId(subscription.external_reference);

      if (!orgId) {
        logger.error('No se pudo extraer organizacion_id de suscripción');
        return;
      }

      // Mapear estado de MP a nuestro estado
      let estadoLocal = 'activa';
      if (subscription.status === 'cancelled') {
        estadoLocal = 'cancelada';
      } else if (subscription.status === 'paused') {
        estadoLocal = 'suspendida';
      } else if (subscription.status === 'pending') {
        estadoLocal = 'activa'; // Pendiente de primer pago
      }

      // Actualizar estado en BD usando bypass
      await RLSContextManager.withBypass(async (db) => {
        await db.query(`
          UPDATE subscripciones
          SET estado = $1,
              subscription_id_gateway = $2,
              updated_at = NOW()
          WHERE organizacion_id = $3
        `, [estadoLocal, subscriptionId, orgId]);
      });

      logger.info('✅ Estado de suscripción actualizado', { orgId, estadoLocal });

    } catch (error) {
      logger.error('Error procesando suscripción:', error);
      throw error;
    }
  }

  /**
   * Procesar pago autorizado de suscripción
   *
   * @private
   */
  static async procesarPagoAutorizado(paymentId, action) {
    // Similar a procesarPago
    logger.info('💳 Procesando pago autorizado', { paymentId, action });
    await WebhooksController.procesarPago(paymentId, action);
  }

  /**
   * Pago exitoso - actualizar subscripción y registrar
   * RECOMENDACIÓN #1: Usa RLSContextManager.transaction() para atomicidad
   *
   * @private
   * @param {number} orgId - ID de la organización
   * @param {Object} pago - Datos del pago de MP
   */
  static async pagoExitoso(orgId, pago) {
    logger.info('✅ Procesando pago exitoso', {
      orgId,
      amount: pago.transaction_amount
    });

    try {
      // Usar transacción para garantizar atomicidad
      await RLSContextManager.withBypass(async (db) => {
        // Iniciar transacción manual (porque estamos usando bypass)
        await db.query('BEGIN');

        try {
          // 1. Actualizar estado de subscripción
          await db.query(`
            UPDATE subscripciones
            SET estado = 'activa',
                intentos_pago_fallidos = 0,
                ultimo_intento_pago = NOW(),
                fecha_proximo_pago = NOW() + INTERVAL '1 month',
                valor_total_pagado = COALESCE(valor_total_pagado, 0) + $1,
                updated_at = NOW()
            WHERE organizacion_id = $2
          `, [pago.transaction_amount, orgId]);

          // 2. Registrar en historial
          await db.query(`
            INSERT INTO historial_subscripciones (
              organizacion_id, tipo_evento, motivo, metadata
            ) VALUES ($1, $2, $3, $4)
          `, [
            orgId,
            'pago_exitoso',
            `Pago procesado exitosamente: $${pago.transaction_amount} ${pago.currency_id}`,
            JSON.stringify({
              payment_id: pago.id,
              amount: pago.transaction_amount,
              payment_method: pago.payment_method_id
            })
          ]);

          await db.query('COMMIT');
        } catch (error) {
          await db.query('ROLLBACK');
          throw error;
        }
      });

      // 3. TODO: Enviar email de confirmación
      logger.info('TODO: Enviar email de confirmación de pago', { orgId });

    } catch (error) {
      logger.error('Error procesando pago exitoso:', error);
      throw error;
    }
  }

  /**
   * Pago fallido - incrementar contador e intentar de nuevo
   * RECOMENDACIÓN #1: Usa transacción para atomicidad
   *
   * @private
   * @param {number} orgId - ID de la organización
   * @param {Object} pago - Datos del pago de MP
   */
  static async pagoFallido(orgId, pago) {
    logger.warn('⚠️  Procesando pago fallido', {
      orgId,
      reason: pago.status_detail
    });

    try {
      await RLSContextManager.withBypass(async (db) => {
        await db.query('BEGIN');

        try {
          // Incrementar contador de intentos fallidos
          const result = await db.query(`
            UPDATE subscripciones
            SET intentos_pago_fallidos = intentos_pago_fallidos + 1,
                ultimo_intento_pago = NOW(),
                estado = CASE
                  WHEN intentos_pago_fallidos >= 2 THEN 'morosa'
                  ELSE estado
                END,
                updated_at = NOW()
            WHERE organizacion_id = $1
            RETURNING intentos_pago_fallidos
          `, [orgId]);

          const intentos = result.rows[0]?.intentos_pago_fallidos || 0;

          // Registrar en historial
          await db.query(`
            INSERT INTO historial_subscripciones (
              organizacion_id, tipo_evento, motivo, metadata
            ) VALUES ($1, $2, $3, $4)
          `, [
            orgId,
            'pago_fallido',
            `Pago rechazado (intento ${intentos}): ${pago.status_detail}`,
            JSON.stringify({
              payment_id: pago.id,
              status_detail: pago.status_detail,
              intentos
            })
          ]);

          await db.query('COMMIT');

          logger.info('Pago fallido registrado', { orgId, intentos });
        } catch (error) {
          await db.query('ROLLBACK');
          throw error;
        }
      });

      // TODO: Notificar admin de la organización
      logger.info('TODO: Enviar notificación de pago fallido', { orgId });

    } catch (error) {
      logger.error('Error procesando pago fallido:', error);
      throw error;
    }
  }

  /**
   * Extraer organizacion_id del external_reference
   * Formato: org_{organizacion_id}_{timestamp}
   *
   * @private
   * @param {string} externalReference - Referencia externa
   * @returns {number|null} ID de la organización o null
   */
  static extraerOrgId(externalReference) {
    if (!externalReference) return null;

    const match = externalReference.match(/org_(\d+)_/);
    return match ? parseInt(match[1]) : null;
  }
}

module.exports = WebhooksController;

/**
 * ====================================================================
 * SERVICIO MERCADO PAGO
 * ====================================================================
 *
 * Servicio centralizado para todas las operaciones con Mercado Pago.
 *
 * FUNCIONALIDADES:
 * - Crear planes de suscripción (preapproval_plan)
 * - Crear suscripciones (preapproval)
 * - Actualizar/cancelar/pausar suscripciones
 * - Obtener información de pagos
 * - Validar webhooks (CRÍTICO para seguridad)
 *
 * SEGURIDAD:
 * - Validación HMAC SHA-256 de webhooks
 * - Timeout de 5 segundos en requests
 * - Logging de todas las operaciones
 *
 * @module services/mercadopago.service
 */

const { MercadoPagoConfig, PreApprovalPlan, PreApproval, Payment } = require('mercadopago');
const crypto = require('crypto');
const config = require('../config/mercadopago');
const logger = require('../utils/logger');

class MercadoPagoService {
  constructor() {
    this._initialized = false;
    this.client = null;
    this.planClient = null;
    this.subscriptionClient = null;
    this.paymentClient = null;
  }

  /**
   * Inicializa el servicio (lazy initialization)
   * Solo se ejecuta la primera vez que se usa el servicio
   * @private
   */
  _ensureInitialized() {
    if (this._initialized) return;

    // Validar configuración al inicializar
    try {
      config.validate();
    } catch (error) {
      logger.error('Error en configuración de Mercado Pago:', error);
      throw error;
    }

    // Inicializar cliente de Mercado Pago
    this.client = new MercadoPagoConfig({
      accessToken: config.accessToken,
      options: {
        timeout: config.timeout,
        idempotencyKey: this._generateIdempotencyKey()
      }
    });

    // Inicializar clientes especializados
    this.planClient = new PreApprovalPlan(this.client);
    this.subscriptionClient = new PreApproval(this.client);
    this.paymentClient = new Payment(this.client);

    this._initialized = true;

    logger.info('✅ MercadoPagoService inicializado', {
      environment: config.environment,
      country: config.country
    });
  }

  // ====================================================================
  // PLANES DE SUSCRIPCIÓN
  // ====================================================================

  /**
   * Crear un plan de suscripción en Mercado Pago
   *
   * @param {Object} params - Parámetros del plan
   * @param {string} params.nombre - Nombre del plan
   * @param {number} params.precio - Precio mensual
   * @param {Object} params.frecuencia - {tipo: 'months', valor: 1}
   * @param {string} [params.moneda='MXN'] - Moneda
   * @param {string} [params.backUrl] - URL de retorno (usa FRONTEND_URL si no se especifica)
   * @returns {Promise<Object>} Plan creado con { id, ...otrosCampos }
   */
  async crearPlan({ nombre, precio, frecuencia, moneda = 'MXN', backUrl }) {
    this._ensureInitialized();
    try {
      logger.info('Creando plan en Mercado Pago', { nombre, precio, frecuencia });

      // Si no se proporciona backUrl, usar FRONTEND_URL del .env
      // Para sandbox/desarrollo, usar URL de ejemplo si FRONTEND_URL es localhost
      let urlRetorno = backUrl || process.env.FRONTEND_URL || 'https://www.mercadopago.com';

      // Si es localhost, usar URL de ejemplo válida para sandbox
      if (urlRetorno.includes('localhost') || urlRetorno.includes('127.0.0.1')) {
        urlRetorno = 'https://www.mercadopago.com/return';
      }

      const planData = {
        reason: nombre,
        back_url: urlRetorno,
        auto_recurring: {
          frequency: frecuencia.valor,          // 1, 2, 3...
          frequency_type: frecuencia.tipo,      // 'months', 'days', 'years'
          transaction_amount: precio,
          currency_id: moneda,
        }
      };

      const response = await this.planClient.create({ body: planData });

      logger.info('✅ Plan creado en Mercado Pago', {
        planId: response.id,
        nombre,
        precio
      });

      return response;
    } catch (error) {
      logger.error('❌ Error creando plan en Mercado Pago:', {
        error: error.message,
        nombre,
        precio
      });
      throw new Error(`Error creando plan en Mercado Pago: ${error.message}`);
    }
  }

  /**
   * Obtener un plan por ID
   *
   * @param {string} planId - ID del plan en Mercado Pago
   * @returns {Promise<Object>} Datos del plan
   */
  async obtenerPlan(planId) {
    this._ensureInitialized();
    try {
      const response = await this.planClient.get({ id: planId });
      return response;
    } catch (error) {
      logger.error('Error obteniendo plan:', { planId, error: error.message });
      throw new Error(`Error obteniendo plan: ${error.message}`);
    }
  }

  // ====================================================================
  // SUSCRIPCIONES
  // ====================================================================

  /**
   * Crear una suscripción en Mercado Pago
   *
   * @param {Object} params - Parámetros de la suscripción
   * @param {string} params.planId - ID del plan en MP
   * @param {string} params.email - Email del pagador
   * @param {string} [params.cardTokenId] - Token de tarjeta (opcional - si no se envía, MP genera init_point)
   * @param {string} params.returnUrl - URL de retorno
   * @param {string} params.externalReference - Referencia externa (org_X_timestamp)
   * @returns {Promise<Object>} { id, status, init_point? }
   */
  async crearSuscripcion({ planId, email, cardTokenId, returnUrl, externalReference }) {
    this._ensureInitialized();
    try {
      logger.info('Creando suscripción en Mercado Pago', {
        planId,
        email,
        externalReference,
        hasCardToken: !!cardTokenId,
        metodo: cardTokenId ? 'con tarjeta' : 'con init_point'
      });

      const subscriptionData = {
        preapproval_plan_id: planId,
        payer_email: email,
        back_url: returnUrl,
        external_reference: externalReference,
        // NO incluir auto_recurring - ya está definido en el plan
      };

      // Solo agregar card_token_id si se proporciona
      if (cardTokenId) {
        subscriptionData.card_token_id = cardTokenId;
        subscriptionData.status = 'authorized'; // Activar inmediatamente con tarjeta
      } else {
        // Sin card_token_id, MP generará init_point para pago pendiente
        subscriptionData.status = 'pending';
      }

      let response;

      // Si no hay cardTokenId, usar axios directamente porque el SDK valida que es requerido
      if (!cardTokenId) {
        const axios = require('axios');

        const axiosResponse = await axios.post(
          'https://api.mercadopago.com/preapproval',
          subscriptionData,
          {
            headers: {
              'Authorization': `Bearer ${config.accessToken}`,
              'Content-Type': 'application/json',
              'X-Idempotency-Key': this._generateIdempotencyKey()
            },
            timeout: config.timeout
          }
        );

        response = axiosResponse.data;
      } else {
        // Con card_token_id, usar el SDK normalmente
        response = await this.subscriptionClient.create({ body: subscriptionData });
      }

      logger.info('✅ Suscripción creada en Mercado Pago', {
        subscriptionId: response.id,
        email,
        planId,
        status: response.status,
        hasInitPoint: !!response.init_point
      });

      return {
        id: response.id,
        status: response.status,
        init_point: response.init_point // URL para que el usuario complete el pago
      };
    } catch (error) {
      logger.error('❌ Error creando suscripción:', {
        error: error.message,
        planId,
        email,
        responseData: error.response?.data
      });
      throw new Error(`Error creando suscripción: ${error.message}`);
    }
  }

  /**
   * Crear suscripción SIN plan asociado - Genera init_point para pago pendiente
   *
   * Este método crea una suscripción definiendo auto_recurring directamente,
   * en lugar de usar preapproval_plan_id. Esto permite generar un init_point
   * sin requerir card_token_id.
   *
   * @param {Object} params - Parámetros de la suscripción
   * @param {string} params.nombre - Nombre/razón de la suscripción
   * @param {number} params.precio - Precio mensual
   * @param {string} [params.moneda='MXN'] - Moneda
   * @param {string} params.email - Email del pagador
   * @param {string} params.returnUrl - URL de retorno
   * @param {string} params.externalReference - Referencia externa (org_X_timestamp)
   * @returns {Promise<Object>} { id, status, init_point }
   */
  async crearSuscripcionConInitPoint({ nombre, precio, moneda = 'MXN', email, returnUrl, externalReference }) {
    this._ensureInitialized();
    try {
      logger.info('Creando suscripción con init_point (sin plan asociado)', {
        nombre,
        precio,
        moneda,
        email,
        externalReference
      });

      const axios = require('axios');

      const subscriptionData = {
        reason: nombre,
        payer_email: email,
        back_url: returnUrl,
        external_reference: externalReference,
        status: 'pending', // CRÍTICO: pending genera init_point
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: precio,
          currency_id: moneda
        }
      };

      const response = await axios.post(
        'https://api.mercadopago.com/preapproval',
        subscriptionData,
        {
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': this._generateIdempotencyKey()
          },
          timeout: config.timeout
        }
      );

      logger.info('✅ Suscripción con init_point creada exitosamente', {
        subscriptionId: response.data.id,
        email,
        status: response.data.status,
        hasInitPoint: !!response.data.init_point
      });

      return {
        id: response.data.id,
        status: response.data.status,
        init_point: response.data.init_point
      };
    } catch (error) {
      logger.error('❌ Error creando suscripción con init_point:', {
        error: error.message,
        nombre,
        precio,
        email,
        responseData: error.response?.data
      });
      throw new Error(`Error creando suscripción: ${error.message}`);
    }
  }

  /**
   * Actualizar suscripción (cambio de plan)
   *
   * @param {string} subscriptionId - ID de suscripción en MP
   * @param {string} nuevoPlanId - ID del nuevo plan
   * @returns {Promise<Object>} Suscripción actualizada
   */
  async actualizarSuscripcion(subscriptionId, nuevoPlanId) {
    this._ensureInitialized();
    try {
      logger.info('Actualizando suscripción', { subscriptionId, nuevoPlanId });

      const response = await this.subscriptionClient.update({
        id: subscriptionId,
        body: {
          preapproval_plan_id: nuevoPlanId,
          status: 'authorized' // Reactivar si estaba pausada
        }
      });

      logger.info('✅ Suscripción actualizada', { subscriptionId, nuevoPlanId });
      return response;
    } catch (error) {
      logger.error('Error actualizando suscripción:', {
        subscriptionId,
        error: error.message
      });
      throw new Error(`Error actualizando suscripción: ${error.message}`);
    }
  }

  /**
   * Cancelar suscripción
   *
   * @param {string} subscriptionId - ID de suscripción en MP
   * @returns {Promise<Object>} Suscripción cancelada
   */
  async cancelarSuscripcion(subscriptionId) {
    this._ensureInitialized();
    try {
      logger.info('Cancelando suscripción', { subscriptionId });

      const response = await this.subscriptionClient.update({
        id: subscriptionId,
        body: { status: 'cancelled' }
      });

      logger.info('✅ Suscripción cancelada', { subscriptionId });
      return response;
    } catch (error) {
      logger.error('Error cancelando suscripción:', {
        subscriptionId,
        error: error.message
      });
      throw new Error(`Error cancelando suscripción: ${error.message}`);
    }
  }

  /**
   * Pausar suscripción
   *
   * @param {string} subscriptionId - ID de suscripción en MP
   * @returns {Promise<Object>} Suscripción pausada
   */
  async pausarSuscripcion(subscriptionId) {
    this._ensureInitialized();
    try {
      const response = await this.subscriptionClient.update({
        id: subscriptionId,
        body: { status: 'paused' }
      });

      logger.info('Suscripción pausada', { subscriptionId });
      return response;
    } catch (error) {
      logger.error('Error pausando suscripción:', { subscriptionId, error: error.message });
      throw new Error(`Error pausando suscripción: ${error.message}`);
    }
  }

  /**
   * Obtener suscripción por ID
   *
   * @param {string} subscriptionId - ID de suscripción en MP
   * @returns {Promise<Object>} Datos de la suscripción
   */
  async obtenerSuscripcion(subscriptionId) {
    this._ensureInitialized();
    try {
      const response = await this.subscriptionClient.get({ id: subscriptionId });
      return response;
    } catch (error) {
      logger.error('Error obteniendo suscripción:', {
        subscriptionId,
        error: error.message
      });
      throw new Error(`Error obteniendo suscripción: ${error.message}`);
    }
  }

  // ====================================================================
  // PAGOS
  // ====================================================================

  /**
   * Obtener información de un pago
   *
   * @param {string} paymentId - ID del pago en MP
   * @returns {Promise<Object>} Datos del pago
   */
  async obtenerPago(paymentId) {
    this._ensureInitialized();
    try {
      const response = await this.paymentClient.get({ id: paymentId });
      return response;
    } catch (error) {
      logger.error('Error obteniendo pago:', { paymentId, error: error.message });
      throw new Error(`Error obteniendo pago: ${error.message}`);
    }
  }

  // ====================================================================
  // VALIDACIÓN DE WEBHOOKS (CRÍTICO PARA SEGURIDAD)
  // ====================================================================

  /**
   * Validar firma de webhook de Mercado Pago usando HMAC SHA-256
   *
   * IMPORTANTE: Esta es una validación crítica de seguridad.
   * NUNCA procesar webhooks sin validar la firma.
   *
   * Documentación oficial:
   * https://www.mercadopago.com.mx/developers/es/docs/your-integrations/notifications/webhooks
   *
   * @param {string} signature - Header x-signature del request
   * @param {string} requestId - Header x-request-id del request
   * @param {string} dataId - ID del recurso notificado
   * @returns {boolean} true si la firma es válida, false si no
   */
  validarWebhook(signature, requestId, dataId) {
    // Validar que tenemos todos los datos necesarios
    if (!signature || !requestId || !dataId) {
      logger.warn('⚠️  Webhook sin datos de validación completos', {
        hasSignature: !!signature,
        hasRequestId: !!requestId,
        hasDataId: !!dataId
      });
      return false;
    }

    const secret = config.webhookSecret;
    if (!secret) {
      logger.error('❌ MERCADOPAGO_WEBHOOK_SECRET no configurado');
      return false;
    }

    try {
      // Parsear signature: "ts=1234567890,v1=abcd1234..."
      const parts = signature.split(',');
      if (parts.length < 2) {
        logger.warn('Formato de signature inválido', { signature });
        return false;
      }

      const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1];
      const hash = parts.find(p => p.startsWith('v1='))?.split('=')[1];

      if (!ts || !hash) {
        logger.warn('Signature sin timestamp o hash', { signature });
        return false;
      }

      // Crear manifest según especificación de MP
      const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;

      // Calcular HMAC SHA-256
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(manifest);
      const computedHash = hmac.digest('hex');

      // Comparar hashes (time-safe comparison)
      const isValid = crypto.timingSafeEqual(
        Buffer.from(hash, 'hex'),
        Buffer.from(computedHash, 'hex')
      );

      if (!isValid) {
        logger.warn('⚠️  Webhook con firma inválida', {
          dataId,
          requestId,
          expectedHash: computedHash.substring(0, 10) + '...',
          receivedHash: hash.substring(0, 10) + '...'
        });
      } else {
        logger.debug('✅ Webhook validado correctamente', { dataId, requestId });
      }

      return isValid;
    } catch (error) {
      logger.error('❌ Error validando webhook:', {
        error: error.message,
        dataId,
        requestId
      });
      return false;
    }
  }

  // ====================================================================
  // UTILIDADES
  // ====================================================================

  /**
   * Generar clave de idempotencia para requests
   * @private
   */
  _generateIdempotencyKey() {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}

// Exportar instancia única (singleton)
module.exports = new MercadoPagoService();

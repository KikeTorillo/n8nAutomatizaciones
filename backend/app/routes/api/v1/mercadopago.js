/**
 * ====================================================================
 * RUTAS - MERCADO PAGO (TOKENIZACIÓN)
 * ====================================================================
 */

const express = require('express');
const router = express.Router();

const { auth, tenant, validation, rateLimiting } = require('../../../middleware');
const { ResponseHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const config = require('../../../config/mercadopago');

const validate = validation.validate;

/**
 * POST /api/v1/mercadopago/create-card-token
 * Crear token de tarjeta (público - no requiere autenticación)
 *
 * Body: {
 *   card_number: string,
 *   cardholder_name: string,
 *   expiration_month: string,
 *   expiration_year: string,
 *   security_code: string,
 *   identification_number: string (opcional)
 * }
 */
router.post('/create-card-token',
  rateLimiting.apiRateLimit,
  async (req, res) => {
    try {
      const {
        card_number,
        cardholder_name,
        expiration_month,
        expiration_year,
        security_code,
        identification_number
      } = req.body;

      logger.info('Generando token de tarjeta', {
        hasCardNumber: !!card_number,
        hasCardholderName: !!cardholder_name
      });

      // Validar datos requeridos
      if (!card_number || !cardholder_name || !expiration_month || !expiration_year || !security_code) {
        return ResponseHelper.error(res, 'Faltan datos de la tarjeta', 400);
      }

      // Crear token usando API de Mercado Pago
      const publicKey = process.env.MERCADOPAGO_PUBLIC_KEY;

      if (!publicKey) {
        logger.error('MERCADOPAGO_PUBLIC_KEY no configurado');
        return ResponseHelper.error(res, 'Configuración de Mercado Pago incompleta', 500);
      }

      // La public_key va como query parameter
      const url = `https://api.mercadopago.com/v1/card_tokens?public_key=${publicKey}`;

      const payload = {
        card_number: card_number.replace(/\s/g, ''),
        cardholder: {
          name: cardholder_name,
          identification: {
            type: 'RFC',
            number: identification_number || 'XAXX010101000',
          },
        },
        expiration_month: parseInt(expiration_month),
        expiration_year: parseInt(expiration_year),
        security_code: security_code,
      };

      logger.debug('Enviando petición a Mercado Pago', {
        hasPublicKey: !!publicKey,
        expirationMonth: payload.expiration_month,
        expirationYear: payload.expiration_year
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.id) {
        logger.error('Error generando token de tarjeta:', {
          status: response.status,
          error: data
        });

        return ResponseHelper.error(res, data.message || 'Error al validar la tarjeta', 400, {
          errors: data.cause || []
        });
      }

      logger.info('✅ Token de tarjeta generado', { tokenId: data.id });

      return ResponseHelper.success(res, {
        token_id: data.id,
        first_six_digits: data.first_six_digits,
        last_four_digits: data.last_four_digits,
        expiration_month: data.expiration_month,
        expiration_year: data.expiration_year,
        cardholder_name: data.cardholder.name
      });

    } catch (error) {
      logger.error('Error en tokenización:', {
        error: error.message,
        stack: error.stack
      });
      return ResponseHelper.error(res, 'Error al procesar la tarjeta', 500);
    }
  }
);

module.exports = router;

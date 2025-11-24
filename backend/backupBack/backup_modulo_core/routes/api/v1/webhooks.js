/**
 * ====================================================================
 * ROUTES - WEBHOOKS
 * ====================================================================
 *
 * Rutas para recibir notificaciones webhook de Mercado Pago.
 *
 * IMPORTANTE:
 * - NO usar middleware auth (MP no envía JWT)
 * - NO usar middleware tenant (validación en controller)
 * - Validación de seguridad por firma x-signature
 * - Responder HTTP 200 en <5 segundos
 *
 * @module routes/api/v1/webhooks
 */

const express = require('express');
const WebhooksController = require('../../../controllers/webhooks.controller');

const router = express.Router();

/**
 * Webhook de Mercado Pago
 * POST /api/v1/webhooks/mercadopago
 *
 * Auth: Validación de firma x-signature (en controller)
 * Headers requeridos:
 * - x-signature: Firma HMAC SHA-256
 * - x-request-id: ID único del request
 *
 * Body: { type, data: { id }, action }
 *
 * Eventos soportados:
 * - payment
 * - subscription_preapproval
 * - subscription_authorized_payment
 */
router.post('/mercadopago',
  express.json(), // Parse JSON body
  WebhooksController.handleMercadoPago
);

module.exports = router;

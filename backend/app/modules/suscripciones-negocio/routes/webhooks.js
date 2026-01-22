/**
 * ====================================================================
 * ROUTES: WEBHOOKS
 * ====================================================================
 * Rutas públicas para webhooks de Stripe y MercadoPago.
 *
 * CRÍTICO:
 * - Endpoints públicos (sin auth)
 * - Validación HMAC obligatoria en controllers
 * - Rate limiting recomendado
 */

const express = require('express');
const router = express.Router();
const WebhooksController = require('../controllers/webhooks.controller');

/**
 * POST /api/v1/suscripciones-negocio/webhooks/stripe
 * Webhook de Stripe (público)
 *
 * NOTA: Stripe requiere raw body (sin parsear) para validación HMAC.
 * Esto debe configurarse en app.js con express.raw() para esta ruta específica.
 */
router.post(
    '/stripe',
    WebhooksController.webhookStripe
);

/**
 * POST /api/v1/suscripciones-negocio/webhooks/mercadopago
 * Webhook de MercadoPago (público)
 */
router.post(
    '/mercadopago',
    WebhooksController.webhookMercadoPago
);

module.exports = router;

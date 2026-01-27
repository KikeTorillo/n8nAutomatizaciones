/**
 * ====================================================================
 * ROUTES: CHECKOUT
 * ====================================================================
 * Rutas para el flujo de checkout con MercadoPago.
 *
 * Base URL: /api/v1/suscripciones-negocio/checkout
 *
 * @module routes/checkout
 */

const express = require('express');
const router = express.Router();

const CheckoutController = require('../controllers/checkout.controller');
const auth = require('../../../middleware/auth');
const { validateBody, validateQuery } = require('../../../middleware/validation');
const asyncHandler = require('../../../middleware/asyncHandler');
const checkoutSchemas = require('../schemas/checkout.schemas');

/**
 * POST /checkout/iniciar
 * Inicia el proceso de checkout y genera init_point de MercadoPago
 *
 * @auth Requiere autenticación
 * @body {plan_id, periodo?, cupon_codigo?, suscriptor_externo?}
 * @returns {init_point, suscripcion_id, pago_id, precio}
 */
router.post(
    '/iniciar',
    auth.authenticateToken,
    validateBody(checkoutSchemas.iniciarCheckout),
    asyncHandler(CheckoutController.iniciarCheckout.bind(CheckoutController))
);

/**
 * POST /checkout/validar-cupon
 * Valida un cupón de descuento y calcula el descuento aplicable
 *
 * @auth Requiere autenticación
 * @body {codigo, plan_id, precio_base?}
 * @returns {valido, cupon?, descuento_calculado?, precio_final?}
 */
router.post(
    '/validar-cupon',
    auth.authenticateToken,
    validateBody(checkoutSchemas.validarCupon),
    asyncHandler(CheckoutController.validarCupon.bind(CheckoutController))
);

/**
 * GET /checkout/resultado
 * Obtiene el resultado de un pago después del callback de MercadoPago
 *
 * @auth Requiere autenticación
 * @query {suscripcion_id?, external_reference?, collection_status?}
 * @returns {suscripcion, resultado_pago}
 */
router.get(
    '/resultado',
    auth.authenticateToken,
    validateQuery(checkoutSchemas.obtenerResultado),
    asyncHandler(CheckoutController.obtenerResultado.bind(CheckoutController))
);

/**
 * POST /checkout/iniciar-trial
 * Inicia un trial gratuito sin proceso de pago
 *
 * @auth Requiere autenticación
 * @body {plan_id, periodo?}
 * @returns {suscripcion_id, estado, dias_trial, redirect_url}
 */
router.post(
    '/iniciar-trial',
    auth.authenticateToken,
    validateBody(checkoutSchemas.iniciarTrial),
    asyncHandler(CheckoutController.iniciarTrial.bind(CheckoutController))
);

module.exports = router;

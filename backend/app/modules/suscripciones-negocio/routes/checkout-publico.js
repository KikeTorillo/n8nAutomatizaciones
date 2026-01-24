/**
 * ====================================================================
 * ROUTES: CHECKOUT PÚBLICO
 * ====================================================================
 * Rutas públicas para checkout sin autenticación.
 *
 * Estas rutas NO requieren autenticación - son accesibles mediante
 * un token único generado por el admin de la organización.
 *
 * @module routes/checkout-publico
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const CheckoutPublicoController = require('../controllers/checkout-publico.controller');

// ============================================================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================================================

/**
 * GET /api/v1/suscripciones-negocio/checkout/link/:token
 *
 * Obtener datos del checkout para mostrar al cliente.
 * Retorna info del plan, cliente y organización.
 */
router.get(
    '/link/:token',
    CheckoutPublicoController.obtenerDatosCheckout
);

/**
 * POST /api/v1/suscripciones-negocio/checkout/link/:token/pagar
 *
 * Iniciar proceso de pago con MercadoPago.
 * Retorna init_point para redirección.
 */
router.post(
    '/link/:token/pagar',
    CheckoutPublicoController.iniciarPago
);

module.exports = router;

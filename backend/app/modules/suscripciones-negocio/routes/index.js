/**
 * ====================================================================
 * ROUTES INDEX - SUSCRIPCIONES-NEGOCIO
 * ====================================================================
 * Configura y exporta todas las rutas del módulo de suscripciones.
 *
 * Rutas públicas (sin auth):
 * - /checkout/link/:token - Checkout público para Customer Billing
 *
 * Rutas protegidas (con auth):
 * - /planes, /suscripciones, /pagos, /cupones, /metricas, /webhooks, /checkout, /conectores
 */

const express = require('express');
const router = express.Router();

// Importar rutas
const planesRoutes = require('./planes');
const suscripcionesRoutes = require('./suscripciones');
const pagosRoutes = require('./pagos');
const cuponesRoutes = require('./cupones');
const metricasRoutes = require('./metricas');
const webhooksRoutes = require('./webhooks');
const checkoutRoutes = require('./checkout');
const checkoutPublicoRoutes = require('./checkout-publico');
const conectoresRoutes = require('./conectores');
const usoRoutes = require('./uso.routes');
const entitlementsRoutes = require('./entitlements.routes');

// ============================================================================
// RUTAS PÚBLICAS (sin autenticación) - Deben ir ANTES de rutas protegidas
// ============================================================================
// IMPORTANTE: Las rutas de checkout público son accesibles sin login
// Permiten que clientes paguen suscripciones mediante un link único
router.use('/checkout', checkoutPublicoRoutes);

// ============================================================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================================================
router.use('/planes', planesRoutes);
router.use('/suscripciones', suscripcionesRoutes);
router.use('/pagos', pagosRoutes);
router.use('/cupones', cuponesRoutes);
router.use('/metricas', metricasRoutes);
router.use('/webhooks', webhooksRoutes);
router.use('/checkout', checkoutRoutes);  // Las rutas autenticadas de /checkout
router.use('/conectores', conectoresRoutes);
router.use('/uso', usoRoutes);  // Uso de usuarios (seat-based billing)
router.use('/entitlements', entitlementsRoutes);  // Entitlements de plataforma (SuperAdmin)

module.exports = router;

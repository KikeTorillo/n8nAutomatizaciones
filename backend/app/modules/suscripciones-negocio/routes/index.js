/**
 * ====================================================================
 * ROUTES INDEX - SUSCRIPCIONES-NEGOCIO
 * ====================================================================
 * Configura y exporta todas las rutas del módulo de suscripciones.
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

// Montar rutas
router.use('/planes', planesRoutes);
router.use('/suscripciones', suscripcionesRoutes);
router.use('/pagos', pagosRoutes);
router.use('/cupones', cuponesRoutes);
router.use('/metricas', metricasRoutes);
router.use('/webhooks', webhooksRoutes);
router.use('/checkout', checkoutRoutes);

module.exports = router;

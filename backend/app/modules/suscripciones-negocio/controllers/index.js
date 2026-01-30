/**
 * ====================================================================
 * CONTROLLERS INDEX - SUSCRIPCIONES-NEGOCIO
 * ====================================================================
 * Exporta todos los controllers del módulo de suscripciones.
 */

const PlanesController = require('./planes.controller');
const SuscripcionesController = require('./suscripciones.controller');
const PagosController = require('./pagos.controller');
const CuponesController = require('./cupones.controller');
const MetricasController = require('./metricas.controller');
const WebhooksController = require('./webhooks.controller');
const UsoController = require('./uso.controller');

module.exports = {
    PlanesController,
    SuscripcionesController,
    PagosController,
    CuponesController,
    MetricasController,
    WebhooksController,
    UsoController
};

/**
 * ====================================================================
 * MODELS INDEX - SUSCRIPCIONES-NEGOCIO
 * ====================================================================
 * Exporta todos los modelos del módulo de suscripciones.
 */

const PlanesModel = require('./planes.model');
const SuscripcionesModel = require('./suscripciones.model');
const PagosModel = require('./pagos.model');
const CuponesModel = require('./cupones.model');
const MetricasModel = require('./metricas.model');
const CheckoutTokensModel = require('./checkout-tokens.model');
const WebhooksProcesadosModel = require('./webhooks-procesados.model');

module.exports = {
    PlanesModel,
    SuscripcionesModel,
    PagosModel,
    CuponesModel,
    MetricasModel,
    CheckoutTokensModel,
    WebhooksProcesadosModel
};

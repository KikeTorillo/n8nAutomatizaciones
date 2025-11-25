/**
 * ====================================================================
 * MARKETPLACE - DATABASE MODELS INDEX
 * ====================================================================
 *
 * Exporta todos los models del módulo marketplace.
 *
 * MODELS (3):
 * • PerfilesMarketplaceModel   - Perfiles públicos de negocios
 * • ReseñasMarketplaceModel    - Reseñas de clientes
 * • AnalyticsMarketplaceModel  - Tracking de eventos
 *
 * Fecha creación: 17 Noviembre 2025
 */

const PerfilesMarketplaceModel = require('./perfiles.model');
const ReseñasMarketplaceModel = require('./reseñas.model');
const AnalyticsMarketplaceModel = require('./analytics.model');

module.exports = {
    PerfilesMarketplaceModel,
    ReseñasMarketplaceModel,
    AnalyticsMarketplaceModel
};

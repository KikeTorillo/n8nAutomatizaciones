/**
 * ====================================================================
 * MARKETPLACE - CONTROLLERS INDEX
 * ====================================================================
 *
 * Exporta todos los controllers del módulo marketplace.
 *
 * CONTROLLERS (3):
 * • PerfilesMarketplaceController  - Gestión de perfiles (7 endpoints)
 * • ReseñasMarketplaceController   - Gestión de reseñas (4 endpoints)
 * • AnalyticsMarketplaceController - Tracking y stats (4 endpoints)
 *
 * Fecha creación: 17 Noviembre 2025
 */

const PerfilesMarketplaceController = require('./perfiles.controller');
const ReseñasMarketplaceController = require('./reseñas.controller');
const AnalyticsMarketplaceController = require('./analytics.controller');

module.exports = {
    PerfilesMarketplaceController,
    ReseñasMarketplaceController,
    AnalyticsMarketplaceController
};

/**
 * Exportación centralizada de todos los models de POS
 */

const VentasPOSModel = require('./ventas.model');
const ReportesPOSModel = require('./reportes.model');
const PromocionesModel = require('./promociones.model');

module.exports = {
    VentasPOSModel,
    ReportesPOSModel,
    PromocionesModel
};

/**
 * Exportación centralizada de todos los models de POS
 */

const VentasPOSModel = require('./ventas.model');
const ReportesPOSModel = require('./reportes.model');

module.exports = {
    VentasPOSModel,
    ReportesPOSModel
};

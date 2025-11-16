/**
 * Index de Models de Comisiones
 * Exporta todos los modelos del módulo de comisiones
 */

const ConfiguracionComisionesModel = require('./configuracion.model');
const ComisionesModel = require('./comisiones.model');
const ReportesComisionesModel = require('./reportes.model');

module.exports = {
    ConfiguracionComisionesModel,
    ComisionesModel,
    ReportesComisionesModel
};

/**
 * Re-exportación de ClienteModel desde Core
 * Nov 2025: ClienteModel migrado a modules/core (patrón Odoo/Salesforce)
 *
 * Este archivo mantiene compatibilidad con imports existentes.
 * @deprecated Usar import directo desde modules/core/models/cliente.model
 */
module.exports = require('../modules/core/models/cliente.model');

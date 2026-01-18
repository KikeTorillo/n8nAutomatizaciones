/**
 * Controller para gestión de proveedores
 * Migrado a BaseCrudController - reduce ~95 líneas a ~25
 *
 * @module inventario/controllers/proveedores
 */

const { createCrudController } = require('../../../utils/BaseCrudController');
const { ProveedoresModel } = require('../models');

module.exports = createCrudController({
  Model: ProveedoresModel,
  resourceName: 'Proveedor',
  resourceNamePlural: 'proveedores',
  filterSchema: {
    activo: 'boolean',
    busqueda: 'string',
    ciudad_id: 'int',
    rfc: 'string'
  },
  allowedOrderFields: ['nombre', 'creado_en', 'actualizado_en']
});

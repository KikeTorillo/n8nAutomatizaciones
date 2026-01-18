/**
 * Controller para tipos de bloqueo
 * Migrado a BaseCrudController - reduce ~65 líneas a ~20
 *
 * @module agendamiento/controllers/tipos-bloqueo
 */

const { createCrudController } = require('../../../utils/BaseCrudController');
const TipoBloqueoModel = require('../models/tipos-bloqueo.model');

module.exports = createCrudController({
  Model: TipoBloqueoModel,
  resourceName: 'Tipo de bloqueo',
  resourceNamePlural: 'tipos de bloqueo',
  filterSchema: {
    solo_sistema: 'boolean',
    solo_personalizados: 'boolean'
  },
  allowedOrderFields: ['orden_display', 'nombre', 'creado_en']
});

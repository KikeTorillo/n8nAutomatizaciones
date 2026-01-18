/**
 * Controller de Puestos
 * Migrado a BaseCrudController - Ene 2026
 *
 * Antes: 147 líneas
 * Después: ~25 líneas
 */
const { createCrudController } = require('../../../utils/BaseCrudController');
const PuestoModel = require('../models/puesto.model');

/**
 * Controller CRUD generado automáticamente
 * Incluye: crear, listar, obtenerPorId, actualizar, eliminar
 */
module.exports = createCrudController({
  Model: PuestoModel,
  resourceName: 'Puesto',
  resourceNamePlural: 'puestos',
  filterSchema: {
    activo: 'boolean',
    departamento_id: 'int'
  },
  allowedOrderFields: ['nombre', 'creado_en', 'actualizado_en'],
  defaultOrderField: 'nombre'
});

/**
 * Controller para gestión de categorías de productos
 * Migrado a BaseCrudController + withTreeMethods - reduce ~95 líneas a ~25
 *
 * @module inventario/controllers/categorias
 */

const { createCrudController, withTreeMethods } = require('../../../utils/BaseCrudController');
const { CategoriasProductosModel } = require('../models');

const baseController = createCrudController({
  Model: CategoriasProductosModel,
  resourceName: 'Categoría',
  resourceNamePlural: 'categorías',
  filterSchema: {
    activo: 'boolean',
    categoria_padre_id: 'int_nullable', // Soporta null para categorías raíz
    busqueda: 'string'
  },
  allowedOrderFields: ['orden', 'nombre', 'creado_en']
});

// Extender con método para obtener árbol jerárquico
module.exports = withTreeMethods(baseController, CategoriasProductosModel, 'Categoría');

/**
 * Controller de Categorías de Profesional
 * Migrado a BaseCrudController - Ene 2026
 *
 * Antes: 182 líneas
 * Después: ~45 líneas
 */
const { createCrudController } = require('../../../utils/BaseCrudController');
const { asyncHandler } = require('../../../middleware');
const CategoriaModel = require('../models/categoria.model');

// Controller base con CRUD estándar
const baseController = createCrudController({
  Model: CategoriaModel,
  resourceName: 'Categoría',
  resourceNamePlural: 'categorías',
  filterSchema: {
    activo: 'boolean',
    tipo_categoria: 'string'
  },
  allowedOrderFields: ['nombre', 'tipo_categoria', 'orden', 'creado_en'],
  defaultOrderField: 'orden'
});

// Extender con métodos adicionales
module.exports = {
  ...baseController,

  /**
   * GET /categorias-profesional/agrupadas
   * Listar categorías agrupadas por tipo
   */
  listarAgrupadas: asyncHandler(async (req, res) => {
    const organizacionId = req.tenant.organizacionId;
    const soloActivas = req.query.activo !== 'false';

    const categorias = await CategoriaModel.listarAgrupadas(organizacionId, soloActivas);

    res.json({
      success: true,
      data: categorias
    });
  }),

  /**
   * GET /categorias-profesional/:id/profesionales
   * Obtener profesionales de una categoría
   */
  obtenerProfesionales: asyncHandler(async (req, res) => {
    const organizacionId = req.tenant.organizacionId;
    const { id } = req.params;

    const profesionales = await CategoriaModel.obtenerProfesionales(organizacionId, id);

    res.json({
      success: true,
      data: profesionales,
      meta: { total: profesionales.length }
    });
  })
};

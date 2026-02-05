/**
 * Controller de Categorías de Pago
 * Migrado a BaseCrudController - reduce ~95 líneas a ~35
 *
 * @module profesionales/controllers/categorias-pago
 * @description Endpoints para gestión de categorías de nómina
 * Clasificación de empleados para nómina
 */

const { createCrudController } = require('../../../utils/BaseCrudController');
const { asyncHandler } = require('../../../middleware');
const CategoriaPagoModel = require('../models/categorias-pago.model');

// Controller base con CRUD estándar
const baseController = createCrudController({
  Model: CategoriaPagoModel,
  resourceName: 'Categoría de pago',
  resourceNamePlural: 'categorías de pago',
  filterSchema: {
    activas: 'boolean',
    nivel_minimo: 'int',
    nivel_maximo: 'int',
    permite_comisiones: 'boolean',
    permite_bonos: 'boolean',
    permite_viaticos: 'boolean'
  },
  allowedOrderFields: ['orden', 'nivel_salarial', 'nombre', 'creado_en']
});

// Extender con métodos adicionales
module.exports = {
  ...baseController,

  /**
   * GET /categorias-pago/estadisticas
   * Obtener estadísticas de uso de categorías
   */
  estadisticas: asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const estadisticas = await CategoriaPagoModel.estadisticas(orgId);

    res.json({
      success: true,
      data: estadisticas,
      meta: { total: estadisticas.length }
    });
  })
};

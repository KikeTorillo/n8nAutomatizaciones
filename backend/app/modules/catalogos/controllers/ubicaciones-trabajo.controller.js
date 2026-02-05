/**
 * Controller de Ubicaciones de Trabajo
 * Migrado a BaseCrudController - reduce ~100 líneas a ~45
 *
 * @module catalogos/controllers/ubicaciones-trabajo
 * @description Endpoints para gestión de ubicaciones (trabajo híbrido)
 * Soporte para trabajo híbrido
 */

const { createCrudController } = require('../../../utils/BaseCrudController');
const { asyncHandler } = require('../../../middleware');
const UbicacionTrabajoModel = require('../models/ubicaciones-trabajo.model');

// Controller base con CRUD estándar
const baseController = createCrudController({
  Model: UbicacionTrabajoModel,
  resourceName: 'Ubicación de trabajo',
  resourceNamePlural: 'ubicaciones de trabajo',
  filterSchema: {
    activas: 'boolean',
    es_remoto: 'boolean',
    es_oficina_principal: 'boolean',
    sucursal_id: 'int'
  },
  allowedOrderFields: ['orden', 'nombre', 'creado_en']
});

// Extender con métodos adicionales
module.exports = {
  ...baseController,

  /**
   * GET /ubicaciones-trabajo/estadisticas
   * Obtener estadísticas de uso por día de la semana
   */
  estadisticas: asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const estadisticas = await UbicacionTrabajoModel.estadisticasPorDia(orgId);

    res.json({
      success: true,
      data: {
        estadisticas,
        dias: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
      },
      meta: { total: estadisticas.length }
    });
  })
};

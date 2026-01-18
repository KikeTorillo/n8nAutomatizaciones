/**
 * Controller de Motivos de Salida
 * Migrado a BaseCrudController - reduce ~110 líneas a ~55
 *
 * @module profesionales/controllers/motivos-salida
 * @description Endpoints para gestión de motivos de terminación
 * GAP-001 vs Odoo 19: Catálogo dinámico de razones de terminación
 */

const { createCrudController } = require('../../../utils/BaseCrudController');
const { asyncHandler } = require('../../../middleware');
const { ResponseHelper } = require('../../../utils/helpers');
const MotivoSalidaModel = require('../models/motivos-salida.model');

// Controller base con CRUD estándar
const baseController = createCrudController({
  Model: MotivoSalidaModel,
  resourceName: 'Motivo de salida',
  resourceNamePlural: 'motivos de salida',
  filterSchema: {
    solo_sistema: 'boolean',
    solo_personalizados: 'boolean',
    activos: 'boolean'
  },
  allowedOrderFields: ['orden_display', 'nombre', 'creado_en']
});

// Extender con métodos adicionales
module.exports = {
  ...baseController,

  /**
   * GET /motivos-salida/estadisticas
   * Obtener estadísticas de uso de motivos
   */
  estadisticas: asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const estadisticas = await MotivoSalidaModel.estadisticas(orgId);

    res.json({
      success: true,
      data: estadisticas,
      meta: { total: estadisticas.length }
    });
  }),

  /**
   * GET /motivos-salida/codigo/:codigo
   * Obtener motivo por código
   */
  obtenerPorCodigo: asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const { codigo } = req.params;

    const motivo = await MotivoSalidaModel.obtenerPorCodigo(orgId, codigo);

    if (!motivo) {
      return ResponseHelper.notFound(res, 'Motivo de salida no encontrado');
    }

    res.json({
      success: true,
      data: motivo
    });
  })
};

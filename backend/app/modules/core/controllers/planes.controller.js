const PlanModel = require('../models/planes.model');
const asyncHandler = require('../../../middleware/asyncHandler');
const { ResponseHelper } = require('../../../utils/helpers');

/**
 * Controller de Planes de Subscripción
 */
class PlanController {
  /**
   * Listar todos los planes activos
   * @route GET /api/v1/planes
   */
  static listar = asyncHandler(async (req, res) => {
    const planes = await PlanModel.listar();

    // Agregar información adicional útil para el frontend
    const planesConInfo = planes.map(plan => ({
      ...plan,
      // Indicadores de características
      incluye_whatsapp: plan.funciones_habilitadas?.whatsapp ?? true,
      incluye_recordatorios: plan.funciones_habilitadas?.recordatorios ?? true,
      incluye_reportes: plan.funciones_habilitadas?.reportes ?? false,
      incluye_integraciones: plan.funciones_habilitadas?.integraciones ?? false,
    }));

    ResponseHelper.success(res, planesConInfo, 'Planes obtenidos exitosamente');
  });

  /**
   * Obtener un plan por ID
   * @route GET /api/v1/planes/:id
   */
  static obtenerPorId = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const plan = await PlanModel.obtenerPorId(id);

    // Agregar información adicional
    const planConInfo = {
      ...plan,
      incluye_whatsapp: plan.funciones_habilitadas?.whatsapp ?? true,
      incluye_recordatorios: plan.funciones_habilitadas?.recordatorios ?? true,
      incluye_reportes: plan.funciones_habilitadas?.reportes ?? false,
      incluye_integraciones: plan.funciones_habilitadas?.integraciones ?? false,
    };

    ResponseHelper.success(res, planConInfo, 'Plan obtenido exitosamente');
  });
}

module.exports = PlanController;

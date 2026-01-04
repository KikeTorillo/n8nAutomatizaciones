/**
 * @fileoverview Controlador de Ubicaciones de Trabajo
 * @description Endpoints para gestión de ubicaciones (trabajo híbrido)
 * @version 1.0.0
 * @date Enero 2026
 *
 * GAP-003 vs Odoo 19: Soporte para trabajo híbrido
 */

const UbicacionTrabajoModel = require('../models/ubicaciones-trabajo.model');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');

class UbicacionTrabajoController {
  /**
   * GET /ubicaciones-trabajo
   * Listar ubicaciones de trabajo de la organización
   */
  static listar = asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const filtros = {
      activas: req.query.activas !== 'false',
      es_remoto: req.query.es_remoto === 'true' ? true : (req.query.es_remoto === 'false' ? false : undefined),
      es_oficina_principal: req.query.es_oficina_principal === 'true' ? true : undefined,
      sucursal_id: req.query.sucursal_id ? parseInt(req.query.sucursal_id) : undefined
    };

    const ubicaciones = await UbicacionTrabajoModel.listar(orgId, filtros);

    return ResponseHelper.success(res, {
      ubicaciones,
      total: ubicaciones.length
    });
  });

  /**
   * GET /ubicaciones-trabajo/estadisticas
   * Obtener estadísticas de uso por día de la semana
   */
  static estadisticas = asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;

    const estadisticas = await UbicacionTrabajoModel.estadisticasPorDia(orgId);

    return ResponseHelper.success(res, {
      estadisticas,
      dias: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
      total_ubicaciones: estadisticas.length
    });
  });

  /**
   * GET /ubicaciones-trabajo/:id
   * Obtener ubicación por ID
   */
  static obtenerPorId = asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const ubicacionId = parseInt(req.params.id);

    const ubicacion = await UbicacionTrabajoModel.obtenerPorId(orgId, ubicacionId);

    if (!ubicacion) {
      return ResponseHelper.notFound(res, 'Ubicación de trabajo no encontrada');
    }

    return ResponseHelper.success(res, { ubicacion });
  });

  /**
   * POST /ubicaciones-trabajo
   * Crear ubicación de trabajo
   */
  static crear = asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const usuarioId = req.user?.id;
    const data = req.body;

    const ubicacion = await UbicacionTrabajoModel.crear(orgId, data, usuarioId);

    return ResponseHelper.success(res, { ubicacion }, 'Ubicación de trabajo creada exitosamente', 201);
  });

  /**
   * PUT /ubicaciones-trabajo/:id
   * Actualizar ubicación de trabajo
   */
  static actualizar = asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const ubicacionId = parseInt(req.params.id);
    const usuarioId = req.user?.id;
    const data = req.body;

    const ubicacion = await UbicacionTrabajoModel.actualizar(orgId, ubicacionId, data, usuarioId);

    return ResponseHelper.success(res, { ubicacion }, 'Ubicación de trabajo actualizada exitosamente');
  });

  /**
   * DELETE /ubicaciones-trabajo/:id
   * Eliminar ubicación de trabajo (soft delete)
   */
  static eliminar = asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const ubicacionId = parseInt(req.params.id);

    const resultado = await UbicacionTrabajoModel.eliminar(orgId, ubicacionId);

    return ResponseHelper.success(res, resultado, 'Ubicación de trabajo eliminada exitosamente');
  });
}

module.exports = UbicacionTrabajoController;

/**
 * @fileoverview Controlador de Motivos de Salida
 * @description Endpoints para gestión de motivos de terminación
 * @version 1.0.0
 * @date Enero 2026
 *
 * GAP-001 vs Odoo 19: Catálogo dinámico de razones de terminación
 */

const MotivoSalidaModel = require('../models/motivos-salida.model');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');

class MotivoSalidaController {
  /**
   * GET /motivos-salida
   * Listar motivos disponibles (sistema + organización)
   */
  static listar = asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const filtros = {
      solo_sistema: req.query.solo_sistema === 'true',
      solo_personalizados: req.query.solo_personalizados === 'true',
      activos: req.query.activos !== 'false'
    };

    const motivos = await MotivoSalidaModel.listar(orgId, filtros);

    return ResponseHelper.success(res, {
      motivos,
      total: motivos.length,
      filtros_aplicados: filtros
    });
  });

  /**
   * GET /motivos-salida/estadisticas
   * Obtener estadísticas de uso de motivos
   */
  static estadisticas = asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;

    const estadisticas = await MotivoSalidaModel.estadisticas(orgId);

    return ResponseHelper.success(res, {
      estadisticas,
      total: estadisticas.length
    });
  });

  /**
   * GET /motivos-salida/:id
   * Obtener motivo por ID
   */
  static obtenerPorId = asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const motivoId = parseInt(req.params.id);

    const motivo = await MotivoSalidaModel.obtenerPorId(orgId, motivoId);

    if (!motivo) {
      return ResponseHelper.notFound(res, 'Motivo de salida no encontrado');
    }

    return ResponseHelper.success(res, { motivo });
  });

  /**
   * GET /motivos-salida/codigo/:codigo
   * Obtener motivo por código
   */
  static obtenerPorCodigo = asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const codigo = req.params.codigo;

    const motivo = await MotivoSalidaModel.obtenerPorCodigo(orgId, codigo);

    if (!motivo) {
      return ResponseHelper.notFound(res, 'Motivo de salida no encontrado');
    }

    return ResponseHelper.success(res, { motivo });
  });

  /**
   * POST /motivos-salida
   * Crear motivo personalizado
   */
  static crear = asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const data = req.body;

    const motivo = await MotivoSalidaModel.crear(orgId, data);

    return ResponseHelper.success(res, { motivo }, 'Motivo de salida creado exitosamente', 201);
  });

  /**
   * PUT /motivos-salida/:id
   * Actualizar motivo personalizado
   */
  static actualizar = asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const motivoId = parseInt(req.params.id);
    const data = req.body;

    const motivo = await MotivoSalidaModel.actualizar(orgId, motivoId, data);

    return ResponseHelper.success(res, { motivo }, 'Motivo de salida actualizado exitosamente');
  });

  /**
   * DELETE /motivos-salida/:id
   * Eliminar motivo personalizado (soft delete)
   */
  static eliminar = asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const motivoId = parseInt(req.params.id);

    const resultado = await MotivoSalidaModel.eliminar(orgId, motivoId);

    return ResponseHelper.success(res, resultado, 'Motivo de salida eliminado exitosamente');
  });
}

module.exports = MotivoSalidaController;

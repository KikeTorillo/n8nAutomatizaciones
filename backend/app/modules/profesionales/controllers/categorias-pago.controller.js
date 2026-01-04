/**
 * @fileoverview Controlador de Categorías de Pago
 * @description Endpoints para gestión de categorías de nómina
 * @version 1.0.0
 * @date Enero 2026
 *
 * GAP-004 vs Odoo 19: Clasificación de empleados para nómina
 */

const CategoriaPagoModel = require('../models/categorias-pago.model');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');

class CategoriaPagoController {
  /**
   * GET /categorias-pago
   * Listar categorías de pago de la organización
   */
  static listar = asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const filtros = {
      activas: req.query.activas !== 'false',
      ordenar_por: req.query.ordenar_por
    };

    const categorias = await CategoriaPagoModel.listar(orgId, filtros);

    return ResponseHelper.success(res, {
      categorias,
      total: categorias.length
    });
  });

  /**
   * GET /categorias-pago/estadisticas
   * Obtener estadísticas de uso de categorías
   */
  static estadisticas = asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;

    const estadisticas = await CategoriaPagoModel.estadisticas(orgId);

    return ResponseHelper.success(res, {
      estadisticas,
      total: estadisticas.length
    });
  });

  /**
   * GET /categorias-pago/:id
   * Obtener categoría por ID
   */
  static obtenerPorId = asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const categoriaId = parseInt(req.params.id);

    const categoria = await CategoriaPagoModel.obtenerPorId(orgId, categoriaId);

    if (!categoria) {
      return ResponseHelper.notFound(res, 'Categoría de pago no encontrada');
    }

    return ResponseHelper.success(res, { categoria });
  });

  /**
   * POST /categorias-pago
   * Crear categoría de pago
   */
  static crear = asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const usuarioId = req.user?.id;
    const data = req.body;

    const categoria = await CategoriaPagoModel.crear(orgId, data, usuarioId);

    return ResponseHelper.success(res, { categoria }, 'Categoría de pago creada exitosamente', 201);
  });

  /**
   * PUT /categorias-pago/:id
   * Actualizar categoría de pago
   */
  static actualizar = asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const categoriaId = parseInt(req.params.id);
    const usuarioId = req.user?.id;
    const data = req.body;

    const categoria = await CategoriaPagoModel.actualizar(orgId, categoriaId, data, usuarioId);

    return ResponseHelper.success(res, { categoria }, 'Categoría de pago actualizada exitosamente');
  });

  /**
   * DELETE /categorias-pago/:id
   * Eliminar categoría de pago (soft delete)
   */
  static eliminar = asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const categoriaId = parseInt(req.params.id);

    const resultado = await CategoriaPagoModel.eliminar(orgId, categoriaId);

    return ResponseHelper.success(res, resultado, 'Categoría de pago eliminada exitosamente');
  });
}

module.exports = CategoriaPagoController;

const TipoBloqueoModel = require('../database/tipos-bloqueo.model');
const { ResponseHelper } = require('../utils/helpers');
const { asyncHandler } = require('../middleware');

class TipoBloqueoController {
  /**
   * GET /tipos-bloqueo
   * Listar tipos disponibles (sistema + organización)
   */
  static listar = asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const filtros = {
      solo_sistema: req.query.solo_sistema === 'true',
      solo_personalizados: req.query.solo_personalizados === 'true'
    };

    const tipos = await TipoBloqueoModel.listar(orgId, filtros);

    return ResponseHelper.success(res, {
      tipos,
      total: tipos.length,
      filtros_aplicados: filtros
    });
  });

  /**
   * GET /tipos-bloqueo/:id
   * Obtener tipo por ID
   */
  static obtenerPorId = asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const tipoId = parseInt(req.params.id);

    const tipo = await TipoBloqueoModel.obtenerPorId(orgId, tipoId);

    if (!tipo) {
      return ResponseHelper.notFound(res, 'Tipo de bloqueo no encontrado');
    }

    return ResponseHelper.success(res, { tipo });
  });

  /**
   * POST /tipos-bloqueo
   * Crear tipo personalizado
   */
  static crear = asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const data = req.body;

    const tipo = await TipoBloqueoModel.crear(orgId, data);

    return ResponseHelper.success(res, tipo, 'Tipo de bloqueo creado exitosamente', 201);
  });

  /**
   * PUT /tipos-bloqueo/:id
   * Actualizar tipo personalizado
   */
  static actualizar = asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const tipoId = parseInt(req.params.id);
    const data = req.body;

    const tipo = await TipoBloqueoModel.actualizar(orgId, tipoId, data);

    return ResponseHelper.success(res, tipo, 'Tipo de bloqueo actualizado exitosamente');
  });

  /**
   * DELETE /tipos-bloqueo/:id
   * Eliminar tipo personalizado (soft delete)
   */
  static eliminar = asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const tipoId = parseInt(req.params.id);

    const resultado = await TipoBloqueoModel.eliminar(orgId, tipoId);

    return ResponseHelper.success(res, resultado, 'Tipo de bloqueo eliminado exitosamente');
  });
}

module.exports = TipoBloqueoController;

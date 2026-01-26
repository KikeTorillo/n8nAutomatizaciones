/**
 * ====================================================================
 * WEBSITE VERSIONES CONTROLLER
 * ====================================================================
 * Controlador para gestionar versiones y rollback del sitio web.
 *
 * ENDPOINTS (6):
 * - GET    /versiones              - Listar versiones
 * - GET    /versiones/:id          - Obtener version
 * - POST   /versiones              - Crear version manual
 * - POST   /versiones/:id/restaurar - Restaurar a version
 * - DELETE /versiones/:id          - Eliminar version
 * - GET    /versiones/:id/preview  - Preview de version
 */

const asyncHandler = require('express-async-handler');
const WebsiteVersionesModel = require('../models/versiones.model');
const { WebsiteConfigModel } = require('../models');
const { ResponseHelper, ErrorHelper } = require('../../../utils/helpers');

/**
 * Controller de versiones
 */
class WebsiteVersionesController {
  /**
   * Listar versiones de un sitio
   * GET /api/v1/website/versiones
   *
   * Query params: { limite?, offset?, tipo? }
   */
  static listar = asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const { limite = 20, offset = 0, tipo } = req.query;

    // Obtener website de la org
    const config = await WebsiteConfigModel.obtenerPorOrganizacion(orgId);
    if (!config) {
      return ResponseHelper.error(res, 'Sitio web no encontrado', 404);
    }

    const versiones = await WebsiteVersionesModel.listar(
      config.id,
      orgId,
      { limite: parseInt(limite), offset: parseInt(offset), tipo }
    );

    const total = await WebsiteVersionesModel.contar(config.id, orgId);

    ResponseHelper.success(res, {
      items: versiones,
      paginacion: {
        total,
        limite: parseInt(limite),
        offset: parseInt(offset),
        paginas: Math.ceil(total / parseInt(limite)),
      },
    });
  });

  /**
   * Obtener version por ID
   * GET /api/v1/website/versiones/:id
   */
  static obtener = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const orgId = req.tenant.organizacionId;

    const version = await WebsiteVersionesModel.obtener(id, orgId);

    if (!version) {
      return ResponseHelper.error(res, 'Version no encontrada', 404);
    }

    ResponseHelper.success(res, version);
  });

  /**
   * Crear nueva version (snapshot manual)
   * POST /api/v1/website/versiones
   *
   * Body: { nombre?, descripcion? }
   */
  static crear = asyncHandler(async (req, res) => {
    const orgId = req.tenant.organizacionId;
    const userId = req.user.id;
    const { nombre, descripcion } = req.body;

    // Obtener website de la org
    const config = await WebsiteConfigModel.obtenerPorOrganizacion(orgId);
    if (!config) {
      return ResponseHelper.error(res, 'Sitio web no encontrado', 404);
    }

    const version = await WebsiteVersionesModel.crear(
      config.id,
      { nombre, descripcion, tipo: 'manual' },
      userId
    );

    ResponseHelper.created(res, version, 'Version creada exitosamente');
  });

  /**
   * Restaurar sitio a una version anterior
   * POST /api/v1/website/versiones/:id/restaurar
   *
   * Body: { crear_backup?: boolean }
   */
  static restaurar = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const orgId = req.tenant.organizacionId;
    const { crear_backup = true } = req.body;

    // Verificar que la version existe y pertenece a la org
    const version = await WebsiteVersionesModel.obtener(id, orgId);
    if (!version) {
      return ResponseHelper.error(res, 'Version no encontrada', 404);
    }

    // Restaurar
    const restaurado = await WebsiteVersionesModel.restaurar(id, crear_backup);

    if (!restaurado) {
      return ResponseHelper.error(res, 'Error al restaurar version', 500);
    }

    ResponseHelper.success(res, {
      restaurado: true,
      version_restaurada: version.numero_version,
      backup_creado: crear_backup,
    }, `Sitio restaurado a version ${version.numero_version}`);
  });

  /**
   * Eliminar version
   * DELETE /api/v1/website/versiones/:id
   */
  static eliminar = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const orgId = req.tenant.organizacionId;

    // Verificar que existe
    const version = await WebsiteVersionesModel.obtener(id, orgId);
    if (!version) {
      return ResponseHelper.error(res, 'Version no encontrada', 404);
    }

    // No permitir eliminar si es la unica version
    const config = await WebsiteConfigModel.obtenerPorOrganizacion(orgId);
    const total = await WebsiteVersionesModel.contar(config.id, orgId);

    if (total <= 1) {
      return ResponseHelper.error(res, 'No se puede eliminar la unica version existente', 400);
    }

    await WebsiteVersionesModel.eliminar(id, orgId);

    ResponseHelper.success(res, { eliminado: true }, 'Version eliminada');
  });

  /**
   * Obtener preview de una version (sin restaurar)
   * GET /api/v1/website/versiones/:id/preview
   */
  static obtenerPreview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const orgId = req.tenant.organizacionId;

    const preview = await WebsiteVersionesModel.obtenerPreviewVersion(id, orgId);

    if (!preview) {
      return ResponseHelper.error(res, 'Version no encontrada', 404);
    }

    ResponseHelper.success(res, preview);
  });

  /**
   * Comparar dos versiones
   * GET /api/v1/website/versiones/comparar
   *
   * Query: { version1, version2 }
   */
  static comparar = asyncHandler(async (req, res) => {
    const { version1, version2 } = req.query;
    const orgId = req.tenant.organizacionId;

    if (!version1 || !version2) {
      return ResponseHelper.error(res, 'Se requieren version1 y version2', 400);
    }

    const comparacion = await WebsiteVersionesModel.comparar(version1, version2, orgId);

    if (!comparacion) {
      return ResponseHelper.error(res, 'Una o ambas versiones no encontradas', 404);
    }

    ResponseHelper.success(res, comparacion);
  });
}

module.exports = WebsiteVersionesController;

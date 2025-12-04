/**
 * Controller de Storage
 * Gestión de archivos con MinIO
 *
 * @module modules/storage/controllers/storage.controller
 */

const storageService = require('../../../services/storage');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');
const logger = require('../../../utils/logger');

/**
 * Controller para gestión de archivos en storage
 */
class StorageController {
  /**
   * Subir archivo
   * POST /api/v1/storage/upload
   */
  static upload = asyncHandler(async (req, res) => {
    if (!req.file) {
      return ResponseHelper.error(res, 'No se proporcionó archivo', 400);
    }

    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    if (!organizacionId) {
      return ResponseHelper.error(res, 'No se pudo determinar la organización', 401);
    }

    // Parámetros opcionales del body
    const {
      folder = 'general',
      isPublic = 'true',
      generateThumbnail = 'false',
      entidadTipo = null,
      entidadId = null
    } = req.body;

    const result = await storageService.upload({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      organizacionId,
      folder,
      isPublic: isPublic === 'true' || isPublic === true,
      generateThumbnail: generateThumbnail === 'true' || generateThumbnail === true,
      entidadTipo,
      entidadId: entidadId ? parseInt(entidadId) : null
    });

    logger.info(`[StorageController] Archivo subido: ${result.fileName} por org ${organizacionId}`);

    return ResponseHelper.success(
      res,
      result,
      'Archivo subido exitosamente',
      201
    );
  });

  /**
   * Eliminar archivo
   * DELETE /api/v1/storage/:id
   */
  static delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    if (!organizacionId) {
      return ResponseHelper.error(res, 'No se pudo determinar la organización', 401);
    }

    const result = await storageService.delete(parseInt(id), organizacionId);

    logger.info(`[StorageController] Archivo eliminado: ${id} por org ${organizacionId}`);

    return ResponseHelper.success(res, result, 'Archivo eliminado exitosamente');
  });

  /**
   * Listar archivos de la organización
   * GET /api/v1/storage
   */
  static list = asyncHandler(async (req, res) => {
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    if (!organizacionId) {
      return ResponseHelper.error(res, 'No se pudo determinar la organización', 401);
    }

    const {
      entidadTipo,
      entidadId,
      limit = 50,
      offset = 0
    } = req.query;

    const archivos = await storageService.listFiles(organizacionId, {
      entidadTipo,
      entidadId: entidadId ? parseInt(entidadId) : undefined,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return ResponseHelper.success(res, archivos, 'Archivos obtenidos exitosamente');
  });

  /**
   * Obtener archivo por ID
   * GET /api/v1/storage/:id
   */
  static getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    if (!organizacionId) {
      return ResponseHelper.error(res, 'No se pudo determinar la organización', 401);
    }

    const archivo = await storageService.getById(parseInt(id), organizacionId);

    if (!archivo) {
      return ResponseHelper.error(res, 'Archivo no encontrado', 404);
    }

    return ResponseHelper.success(res, archivo, 'Archivo obtenido exitosamente');
  });

  /**
   * Generar URL firmada para archivo privado
   * GET /api/v1/storage/:id/presigned
   */
  static getPresignedUrl = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { expiry = 3600 } = req.query;
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    if (!organizacionId) {
      return ResponseHelper.error(res, 'No se pudo determinar la organización', 401);
    }

    // Obtener archivo para verificar permisos y obtener path
    const archivo = await storageService.getById(parseInt(id), organizacionId);

    if (!archivo) {
      return ResponseHelper.error(res, 'Archivo no encontrado', 404);
    }

    // Solo generar presigned URL para archivos privados
    if (archivo.url_publica) {
      return ResponseHelper.success(res, {
        url: archivo.url_publica,
        esPublica: true
      }, 'URL pública del archivo');
    }

    const url = await storageService.getPresignedUrl(
      archivo.bucket,
      archivo.path,
      parseInt(expiry)
    );

    return ResponseHelper.success(res, {
      url,
      expiresIn: parseInt(expiry),
      esPublica: false
    }, 'URL firmada generada exitosamente');
  });

  /**
   * Obtener uso de almacenamiento de la organización
   * GET /api/v1/storage/usage
   */
  static getUsage = asyncHandler(async (req, res) => {
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    if (!organizacionId) {
      return ResponseHelper.error(res, 'No se pudo determinar la organización', 401);
    }

    const usage = await storageService.getStorageUsage(organizacionId);

    return ResponseHelper.success(res, usage, 'Uso de almacenamiento obtenido');
  });
}

module.exports = StorageController;

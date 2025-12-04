/**
 * ====================================================================
 * ROUTES - STORAGE
 * ====================================================================
 *
 * Rutas para gestión de archivos con MinIO:
 * - Upload de archivos
 * - Eliminación de archivos
 * - Listado de archivos
 * - URLs firmadas para archivos privados
 * - Uso de almacenamiento
 */

const express = require('express');
const StorageController = require('../controllers');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const storageMiddleware = require('../../../middleware/storage');
const storageSchemas = require('../schemas/storage.schemas');

const router = express.Router();
const validate = validation.validate;

// ===================================================================
// ENDPOINTS DE STORAGE
// ===================================================================

/**
 * GET /api/v1/storage/usage
 * Obtener uso de almacenamiento de la organización
 *
 * NOTA: Esta ruta debe ir ANTES de /:id para evitar conflictos
 */
router.get('/usage',
  auth.authenticateToken,
  tenant.setTenantContext,
  tenant.verifyTenantActive,
  rateLimiting.apiRateLimit,
  StorageController.getUsage
);

/**
 * POST /api/v1/storage/upload
 * Subir un archivo
 *
 * Body (multipart/form-data):
 * - file: El archivo a subir (requerido)
 * - folder: Carpeta destino (opcional, default: 'general')
 * - isPublic: Si el archivo es público (opcional, default: true)
 * - generateThumbnail: Generar thumbnail para imágenes (opcional, default: false)
 * - entidadTipo: Tipo de entidad relacionada (opcional)
 * - entidadId: ID de entidad relacionada (opcional)
 */
router.post('/upload',
  auth.authenticateToken,
  tenant.setTenantContext,
  tenant.verifyTenantActive,
  storageMiddleware.checkStorageLimit,
  rateLimiting.heavyOperationRateLimit,
  storageMiddleware.uploadSingle,
  storageMiddleware.validateFileSize,
  validate(storageSchemas.uploadSchema),
  StorageController.upload
);

/**
 * GET /api/v1/storage
 * Listar archivos de la organización
 *
 * Query params:
 * - entidadTipo: Filtrar por tipo de entidad
 * - entidadId: Filtrar por ID de entidad
 * - limit: Límite de resultados (default: 50, max: 100)
 * - offset: Desplazamiento para paginación
 */
router.get('/',
  auth.authenticateToken,
  tenant.setTenantContext,
  tenant.verifyTenantActive,
  rateLimiting.apiRateLimit,
  validate(storageSchemas.listSchema),
  StorageController.list
);

/**
 * GET /api/v1/storage/:id
 * Obtener archivo por ID
 */
router.get('/:id',
  auth.authenticateToken,
  tenant.setTenantContext,
  tenant.verifyTenantActive,
  rateLimiting.apiRateLimit,
  validate(storageSchemas.getByIdSchema),
  StorageController.getById
);

/**
 * GET /api/v1/storage/:id/presigned
 * Generar URL firmada para archivo privado
 *
 * Query params:
 * - expiry: Tiempo de expiración en segundos (default: 3600, max: 604800)
 */
router.get('/:id/presigned',
  auth.authenticateToken,
  tenant.setTenantContext,
  tenant.verifyTenantActive,
  rateLimiting.apiRateLimit,
  validate(storageSchemas.presignedSchema),
  StorageController.getPresignedUrl
);

/**
 * DELETE /api/v1/storage/:id
 * Eliminar archivo
 */
router.delete('/:id',
  auth.authenticateToken,
  tenant.setTenantContext,
  tenant.verifyTenantActive,
  rateLimiting.apiRateLimit,
  validate(storageSchemas.deleteSchema),
  StorageController.delete
);

module.exports = router;

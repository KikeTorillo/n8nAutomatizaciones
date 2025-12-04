/**
 * Storage Service - Exports centralizados
 *
 * Sistema de almacenamiento de archivos con MinIO
 * Compatible con API S3, con validación de contenido y transacciones atómicas
 *
 * @module services/storage
 *
 * @example
 * // Uso básico
 * const storageService = require('./services/storage');
 *
 * // Subir archivo
 * const result = await storageService.upload({
 *   buffer: req.file.buffer,
 *   originalName: req.file.originalname,
 *   mimeType: req.file.mimetype,
 *   organizacionId: req.user.organizacion_id,
 *   folder: 'logos',
 *   generateThumbnail: true
 * });
 *
 * // Eliminar archivo
 * await storageService.delete(archivoId, organizacionId);
 *
 * // Obtener uso
 * const usage = await storageService.getStorageUsage(organizacionId);
 */

const storageService = require('./storage.service');
const { minioClient, BUCKETS, initializeBuckets, checkConnection, getBucketStats } = require('./minio.client');
const { validateFileContent, isAllowedMimeType, isImageMimeType, ALLOWED_MIME_TYPES } = require('./content.validator');
const { processImage, generateThumbnail, getImageMetadata, isValidImage } = require('./image.processor');

// ============================================
// EXPORT PRINCIPAL (StorageService instance)
// ============================================
module.exports = storageService;

// ============================================
// EXPORTS ADICIONALES (named exports)
// ============================================
module.exports.minioClient = minioClient;
module.exports.BUCKETS = BUCKETS;
module.exports.initializeBuckets = initializeBuckets;
module.exports.checkConnection = checkConnection;
module.exports.getBucketStats = getBucketStats;

// Validación
module.exports.validateFileContent = validateFileContent;
module.exports.isAllowedMimeType = isAllowedMimeType;
module.exports.isImageMimeType = isImageMimeType;
module.exports.ALLOWED_MIME_TYPES = ALLOWED_MIME_TYPES;

// Procesamiento de imágenes
module.exports.processImage = processImage;
module.exports.generateThumbnail = generateThumbnail;
module.exports.getImageMetadata = getImageMetadata;
module.exports.isValidImage = isValidImage;

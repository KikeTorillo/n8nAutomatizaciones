/**
 * Servicio de Storage con Transacciones Atómicas
 * Garantiza consistencia entre MinIO y PostgreSQL
 *
 * @module services/storage/storage.service
 */

const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { getPool } = require('../../config/database');
const logger = require('../../utils/logger');
const { minioClient, BUCKETS } = require('./minio.client');
const { validateFileContent, isImageMimeType } = require('./content.validator');
const { processImage, generateThumbnail } = require('./image.processor');

// ============================================
// CLASE PRINCIPAL
// ============================================

class StorageService {
  constructor() {
    this.publicBucket = BUCKETS.PUBLIC;
    this.privateBucket = BUCKETS.PRIVATE;
    this.tempBucket = BUCKETS.TEMP;
    this.baseUrl = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
  }

  // ============================================
  // UPLOAD CON TRANSACCIÓN ATÓMICA
  // ============================================

  /**
   * Sube un archivo al storage CON TRANSACCIÓN ATÓMICA
   *
   * IMPORTANTE: Esta función garantiza que si la metadata falla,
   * el archivo en MinIO se elimina automáticamente (rollback)
   *
   * @param {Object} options
   * @param {Buffer} options.buffer - Contenido del archivo
   * @param {string} options.originalName - Nombre original
   * @param {string} options.mimeType - Tipo MIME
   * @param {number} options.organizacionId - ID de la organización
   * @param {string} [options.folder='general'] - Carpeta destino
   * @param {boolean} [options.isPublic=true] - Si es público o privado
   * @param {boolean} [options.generateThumbnail=false] - Generar thumbnail
   * @param {string} [options.entidadTipo] - Tipo de entidad relacionada
   * @param {number} [options.entidadId] - ID de la entidad relacionada
   * @returns {Promise<Object>} Datos del archivo subido
   */
  async upload(options) {
    const {
      buffer,
      originalName,
      mimeType,
      organizacionId,
      folder = 'general',
      isPublic = true,
      generateThumbnail: shouldGenerateThumbnail = false,
      entidadTipo = null,
      entidadId = null
    } = options;

    // ========================================
    // PASO 1: Validar contenido real (magic bytes)
    // ========================================
    const validation = await validateFileContent(buffer, mimeType);
    if (!validation.valid) {
      throw new Error(`Validación de contenido falló: ${validation.error}`);
    }

    // ========================================
    // PASO 2: Generar nombre único
    // ========================================
    const ext = path.extname(originalName).toLowerCase();
    const uuid = uuidv4();
    const fileName = `${uuid}${ext}`;

    // ========================================
    // PASO 3: Construir paths
    // ========================================
    const objectPath = `org-${organizacionId}/${folder}/${fileName}`;
    const bucket = isPublic ? this.publicBucket : this.privateBucket;
    let thumbPath = null;

    // ========================================
    // PASO 4: Procesar imagen si aplica
    // ========================================
    let processedBuffer = buffer;
    let thumbnailBuffer = null;

    if (isImageMimeType(mimeType)) {
      try {
        const processed = await processImage(buffer, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 85
        });
        processedBuffer = processed.buffer;

        if (shouldGenerateThumbnail) {
          const thumbnail = await generateThumbnail(buffer, {
            width: 300,
            height: 200,
            fit: 'cover',
            quality: 80
          });
          thumbnailBuffer = thumbnail.buffer;
          thumbPath = `org-${organizacionId}/${folder}/thumbs/thumb-${uuid}.jpg`;
        }
      } catch (imgError) {
        logger.warn(`[StorageService] Error procesando imagen, usando original: ${imgError.message}`);
        // Si falla el procesamiento, usar el original
        processedBuffer = buffer;
      }
    }

    // ========================================
    // PASO 5: TRANSACCIÓN ATÓMICA
    // ========================================
    const client = await getPool().connect();
    const uploadedPaths = []; // Para cleanup en caso de error

    try {
      await client.query('BEGIN');

      // Setear contexto RLS
      await client.query(`SET LOCAL app.current_tenant_id = '${organizacionId}'`);

      // Subir archivo principal a MinIO
      await minioClient.putObject(bucket, objectPath, processedBuffer, {
        'Content-Type': mimeType,
        'x-amz-meta-original-name': encodeURIComponent(originalName),
        'x-amz-meta-organization-id': organizacionId.toString()
      });
      uploadedPaths.push({ bucket, path: objectPath });
      logger.debug(`[StorageService] Archivo subido: ${bucket}/${objectPath}`);

      // Subir thumbnail si existe
      let thumbnailUrl = null;
      if (thumbnailBuffer && thumbPath) {
        await minioClient.putObject(bucket, thumbPath, thumbnailBuffer, {
          'Content-Type': 'image/jpeg'
        });
        uploadedPaths.push({ bucket, path: thumbPath });
        thumbnailUrl = `${this.baseUrl}/${bucket}/${thumbPath}`;
        logger.debug(`[StorageService] Thumbnail subido: ${bucket}/${thumbPath}`);
      }

      // Generar URL
      const url = isPublic
        ? `${this.baseUrl}/${bucket}/${objectPath}`
        : await this.getPresignedUrl(bucket, objectPath, 3600);

      // Guardar metadata en PostgreSQL
      const insertQuery = `
        INSERT INTO archivos_storage (
          organizacion_id, entidad_tipo, entidad_id,
          nombre_original, nombre_storage, mime_type, tamano_bytes,
          bucket, path, url_publica, thumbnail_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, creado_en
      `;

      const result = await client.query(insertQuery, [
        organizacionId,
        entidadTipo,
        entidadId,
        originalName,
        fileName,
        mimeType,
        processedBuffer.length,
        bucket,
        objectPath,
        isPublic ? url : null,
        thumbnailUrl
      ]);

      // ✅ COMMIT - Todo exitoso
      await client.query('COMMIT');

      logger.info(`[StorageService] Upload exitoso: ${fileName} (${Math.round(processedBuffer.length / 1024)}KB)`);

      return {
        id: result.rows[0].id,
        url,
        thumbnailUrl,
        bucket,
        path: objectPath,
        fileName,
        mimeType,
        size: processedBuffer.length,
        creadoEn: result.rows[0].creado_en
      };

    } catch (error) {
      // ❌ ROLLBACK PostgreSQL
      await client.query('ROLLBACK');
      logger.error(`[StorageService] Error en upload, ejecutando rollback: ${error.message}`);

      // 🧹 CLEANUP MinIO - Eliminar archivos subidos
      for (const uploaded of uploadedPaths) {
        try {
          await minioClient.removeObject(uploaded.bucket, uploaded.path);
          logger.debug(`[StorageService] Cleanup: eliminado ${uploaded.path}`);
        } catch (cleanupError) {
          logger.error(`[StorageService] Error en cleanup de ${uploaded.path}:`, cleanupError.message);
        }
      }

      throw error;
    } finally {
      client.release();
    }
  }

  // ============================================
  // DELETE CON TRANSACCIÓN
  // ============================================

  /**
   * Elimina un archivo del storage (con transacción)
   *
   * @param {number} archivoId - ID del archivo
   * @param {number} organizacionId - ID de la organización
   * @returns {Promise<Object>}
   */
  async delete(archivoId, organizacionId) {
    const client = await getPool().connect();

    try {
      await client.query('BEGIN');
      await client.query(`SET LOCAL app.current_tenant_id = '${organizacionId}'`);

      // Obtener info del archivo
      const result = await client.query(
        'SELECT bucket, path, thumbnail_url FROM archivos_storage WHERE id = $1 AND activo = true',
        [archivoId]
      );

      if (result.rows.length === 0) {
        throw new Error('Archivo no encontrado');
      }

      const { bucket, path: objectPath, thumbnail_url } = result.rows[0];

      // Eliminar de MinIO
      await minioClient.removeObject(bucket, objectPath);
      logger.debug(`[StorageService] Eliminado de MinIO: ${objectPath}`);

      // Intentar eliminar thumbnail si existe
      if (thumbnail_url) {
        try {
          const thumbPath = objectPath.replace(/\/([^/]+)$/, '/thumbs/thumb-$1').replace(/\.[^.]+$/, '.jpg');
          await minioClient.removeObject(bucket, thumbPath);
          logger.debug(`[StorageService] Thumbnail eliminado: ${thumbPath}`);
        } catch (e) {
          // Thumbnail no existe, ignorar
        }
      }

      // Marcar como inactivo en DB (soft delete)
      await client.query(
        'UPDATE archivos_storage SET activo = false, actualizado_en = NOW() WHERE id = $1',
        [archivoId]
      );

      await client.query('COMMIT');
      logger.info(`[StorageService] Archivo eliminado: ${archivoId}`);

      return { success: true, archivoId };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`[StorageService] Error eliminando archivo: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  // ============================================
  // CONSULTAS
  // ============================================

  /**
   * Genera URL firmada para archivos privados
   *
   * @param {string} bucket - Nombre del bucket
   * @param {string} objectPath - Path del objeto
   * @param {number} [expirySeconds=3600] - Tiempo de expiración
   * @returns {Promise<string>}
   */
  async getPresignedUrl(bucket, objectPath, expirySeconds = 3600) {
    return await minioClient.presignedGetObject(bucket, objectPath, expirySeconds);
  }

  /**
   * Lista archivos de una organización
   *
   * @param {number} organizacionId - ID de la organización
   * @param {Object} options - Opciones de filtrado
   * @returns {Promise<Array>}
   */
  async listFiles(organizacionId, options = {}) {
    const { entidadTipo, entidadId, limit = 50, offset = 0 } = options;
    const client = await getPool().connect();

    try {
      await client.query('BEGIN');
      await client.query(`SET LOCAL app.current_tenant_id = '${organizacionId}'`);

      let query = `
        SELECT id, nombre_original, mime_type, tamano_bytes,
               url_publica, thumbnail_url, creado_en, entidad_tipo, entidad_id
        FROM archivos_storage
        WHERE organizacion_id = $1 AND activo = true
      `;
      const params = [organizacionId];

      if (entidadTipo) {
        query += ` AND entidad_tipo = $${params.length + 1}`;
        params.push(entidadTipo);
      }
      if (entidadId) {
        query += ` AND entidad_id = $${params.length + 1}`;
        params.push(entidadId);
      }

      query += ` ORDER BY creado_en DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await client.query(query, params);
      await client.query('COMMIT');
      return result.rows;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtiene un archivo por ID
   *
   * @param {number} archivoId - ID del archivo
   * @param {number} organizacionId - ID de la organización
   * @returns {Promise<Object|null>}
   */
  async getById(archivoId, organizacionId) {
    const client = await getPool().connect();

    try {
      await client.query('BEGIN');
      await client.query(`SET LOCAL app.current_tenant_id = '${organizacionId}'`);

      const query = `
        SELECT id, nombre_original, mime_type, tamano_bytes,
               url_publica, thumbnail_url, bucket, path, creado_en,
               entidad_tipo, entidad_id
        FROM archivos_storage
        WHERE id = $1 AND organizacion_id = $2 AND activo = true
      `;

      const result = await client.query(query, [archivoId, organizacionId]);
      await client.query('COMMIT');
      return result.rows[0] || null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtiene uso de almacenamiento de una organización
   *
   * @param {number} organizacionId - ID de la organización
   * @returns {Promise<Object>}
   */
  async getStorageUsage(organizacionId) {
    const client = await getPool().connect();

    try {
      await client.query('BEGIN');
      await client.query(`SET LOCAL app.current_tenant_id = '${organizacionId}'`);

      const query = `
        SELECT
          COUNT(*) as total_archivos,
          COALESCE(SUM(tamano_bytes), 0) as total_bytes,
          ROUND(COALESCE(SUM(tamano_bytes), 0) / 1024.0 / 1024.0, 2) as total_mb
        FROM archivos_storage
        WHERE organizacion_id = $1 AND activo = true
      `;

      const result = await client.query(query, [organizacionId]);
      await client.query('COMMIT');

      return {
        totalArchivos: parseInt(result.rows[0].total_archivos),
        totalBytes: parseInt(result.rows[0].total_bytes),
        totalMb: parseFloat(result.rows[0].total_mb)
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Copia archivo de temporal a destino final
   *
   * @param {string} tempPath - Path en bucket temporal
   * @param {string} destinationBucket - Bucket destino
   * @param {string} destinationPath - Path destino
   * @returns {Promise<string>} URL del archivo
   */
  async moveFromTemp(tempPath, destinationBucket, destinationPath) {
    await minioClient.copyObject(
      destinationBucket,
      destinationPath,
      `/${this.tempBucket}/${tempPath}`
    );
    await minioClient.removeObject(this.tempBucket, tempPath);

    return `${this.baseUrl}/${destinationBucket}/${destinationPath}`;
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

module.exports = new StorageService();

/**
 * Middleware de Storage
 * Configuración de Multer y validación de límites de almacenamiento
 *
 * @module middleware/storage
 */

const multer = require('multer');
const { getDb } = require('../config/database');
const logger = require('../utils/logger');
const { ALLOWED_MIME_TYPES } = require('../services/storage/content.validator');
const { ResponseHelper } = require('../utils/helpers');

// ============================================
// CONFIGURACIÓN DE MULTER
// ============================================

/**
 * Configuración de almacenamiento en memoria
 * Los archivos se procesan en memoria antes de subirse a MinIO
 */
const storage = multer.memoryStorage();

/**
 * Tipos MIME permitidos para upload
 */
const ALLOWED_TYPES = Object.keys(ALLOWED_MIME_TYPES);

/**
 * Límites de tamaño por tipo de archivo (en bytes)
 */
const SIZE_LIMITS = {
  image: 10 * 1024 * 1024,    // 10MB para imágenes
  pdf: 25 * 1024 * 1024,      // 25MB para PDFs
  csv: 50 * 1024 * 1024,      // 50MB para CSVs
  default: 10 * 1024 * 1024   // 10MB por defecto
};

/**
 * Filtro de archivos para Multer
 * Valida el tipo MIME antes de aceptar el archivo
 */
const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(`Tipo de archivo no permitido: ${file.mimetype}. Permitidos: ${ALLOWED_TYPES.join(', ')}`);
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

/**
 * Configuración de Multer para upload único
 */
const uploadSingle = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: SIZE_LIMITS.default,
    files: 1
  }
}).single('file');

/**
 * Configuración de Multer para múltiples archivos
 */
const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: SIZE_LIMITS.default,
    files: 10
  }
}).array('files', 10);

// ============================================
// MIDDLEWARE DE VALIDACIÓN DE LÍMITES
// ============================================

/**
 * Verifica el límite de almacenamiento de la organización
 * Consulta el uso actual vs el límite del plan
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next
 */
async function checkStorageLimit(req, res, next) {
  try {
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    if (!organizacionId) {
      return ResponseHelper.unauthorized(res, 'No se pudo determinar la organización');
    }

    // Obtener límite del plan y uso actual
    // Nota: usamos suscripciones_org (tabla del módulo suscripciones-negocio)
    // Usamos bypass_rls porque esta query cruza varias tablas y necesita ver todos los datos
    const query = `
      SELECT
        p.limite_almacenamiento_mb,
        COALESCE(SUM(a.tamano_bytes), 0) as uso_actual_bytes
      FROM organizaciones o
      JOIN suscripciones_org s ON s.cliente_id IN (
        SELECT id FROM clientes WHERE organizacion_vinculada_id = o.id
      ) AND s.estado IN ('activa', 'trial')
      JOIN planes_suscripcion_org p ON p.id = s.plan_id
      LEFT JOIN archivos_storage a ON a.organizacion_id = o.id AND a.activo = true
      WHERE o.id = $1
      GROUP BY p.limite_almacenamiento_mb
    `;

    // Establecer bypass RLS para esta consulta (cross-table query)
    // Usamos set_config con is_local=false (sesión) en lugar de BEGIN/COMMIT
    const db = await getDb();
    let result;
    try {
      await db.query('SELECT set_config($1, $2, false)', ['app.bypass_rls', 'true']);
      result = await db.query(query, [organizacionId]);
    } catch (err) {
      throw err;
    } finally {
      // Limpiar bypass_rls antes de liberar la conexión al pool
      await db.query('SELECT set_config($1, $2, false)', ['app.bypass_rls', 'false']).catch(() => {});
      db.release();
    }

    if (result.rows.length === 0) {
      return ResponseHelper.forbidden(res, 'No se encontró suscripción activa');
    }

    const { limite_almacenamiento_mb, uso_actual_bytes } = result.rows[0];
    const usoActualMb = parseInt(uso_actual_bytes) / 1024 / 1024;

    // Si el límite es NULL, es ilimitado (plan custom)
    if (limite_almacenamiento_mb !== null) {
      // Verificar si ya está al límite
      if (usoActualMb >= limite_almacenamiento_mb) {
        return ResponseHelper.forbidden(res, 'Límite de almacenamiento alcanzado', {
          limite_mb: limite_almacenamiento_mb,
          uso_actual_mb: Math.round(usoActualMb * 100) / 100,
          disponible_mb: 0
        });
      }

      // Adjuntar info de límites al request para validar después del upload
      req.storageLimit = {
        limiteMb: limite_almacenamiento_mb,
        usoActualMb,
        disponibleMb: limite_almacenamiento_mb - usoActualMb
      };
    }

    next();
  } catch (error) {
    logger.error('[StorageMiddleware] Error verificando límite:', error);
    return ResponseHelper.error(res, 'Error verificando límite de almacenamiento');
  }
}

/**
 * Verifica que el archivo subido no exceda el espacio disponible
 * Se ejecuta DESPUÉS del upload de Multer
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next
 */
function validateFileSize(req, res, next) {
  if (!req.file) {
    return next();
  }

  const fileSizeMb = req.file.size / 1024 / 1024;

  // Si hay límite de storage, verificar
  if (req.storageLimit) {
    if (fileSizeMb > req.storageLimit.disponibleMb) {
      return ResponseHelper.error(res, 'El archivo excede el espacio disponible', 413, {
        archivo_mb: Math.round(fileSizeMb * 100) / 100,
        disponible_mb: Math.round(req.storageLimit.disponibleMb * 100) / 100
      });
    }
  }

  next();
}

// ============================================
// WRAPPER PARA MANEJO DE ERRORES DE MULTER
// ============================================

/**
 * Wrapper para manejar errores de Multer de forma consistente
 *
 * @param {Function} uploadFn - Función de upload de Multer
 * @returns {Function} Middleware de Express
 */
function handleMulterUpload(uploadFn) {
  return (req, res, next) => {
    uploadFn(req, res, (err) => {
      if (err) {
        logger.warn('[StorageMiddleware] Error en upload:', err.message);

        if (err instanceof multer.MulterError) {
          // Errores específicos de Multer
          switch (err.code) {
            case 'LIMIT_FILE_SIZE':
              return ResponseHelper.error(res, 'El archivo excede el tamaño máximo permitido', 413);
            case 'LIMIT_FILE_COUNT':
              return ResponseHelper.error(res, 'Se excedió el número máximo de archivos', 400);
            case 'LIMIT_UNEXPECTED_FILE':
              return ResponseHelper.error(res, 'Campo de archivo inesperado', 400);
            default:
              return ResponseHelper.error(res, `Error de upload: ${err.message}`, 400);
          }
        }

        // Error personalizado (tipo de archivo no permitido)
        if (err.code === 'INVALID_FILE_TYPE') {
          return ResponseHelper.error(res, err.message, 415);
        }

        // Otros errores
        return ResponseHelper.error(res, 'Error procesando el archivo');
      }

      next();
    });
  };
}

// ============================================
// FACTORY PARA CAMPOS PERSONALIZADOS
// ============================================

/**
 * Crea un middleware de upload para un campo específico
 * Útil cuando el nombre del campo no es 'file'
 *
 * @param {string} fieldName - Nombre del campo del archivo
 * @returns {Function} Middleware de Express
 */
function createUploadSingle(fieldName) {
  const uploadFn = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: SIZE_LIMITS.pdf, // 25MB para documentos
      files: 1
    }
  }).single(fieldName);

  return handleMulterUpload(uploadFn);
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Funciones de upload con manejo de errores
  uploadSingle: handleMulterUpload(uploadSingle),
  uploadMultiple: handleMulterUpload(uploadMultiple),

  // Factory para campos personalizados
  createUploadSingle,

  // Validación de límites
  checkStorageLimit,
  validateFileSize,

  // Configuración raw de Multer (por si se necesita personalizar)
  multerConfig: {
    storage,
    fileFilter,
    limits: SIZE_LIMITS
  },

  // Constantes
  ALLOWED_TYPES,
  SIZE_LIMITS
};

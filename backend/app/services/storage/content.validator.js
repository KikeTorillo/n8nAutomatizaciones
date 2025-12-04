/**
 * Validador de contenido de archivos usando Magic Bytes
 * Previene ataques donde se sube un archivo malicioso con extensión falsa
 *
 * @module services/storage/content.validator
 */

const FileType = require('file-type');
const logger = require('../../utils/logger');

// ============================================
// TIPOS MIME PERMITIDOS
// ============================================

/**
 * Mapeo de MIME types permitidos y sus firmas válidas
 * Cada MIME declarado debe coincidir con el tipo real detectado
 */
const ALLOWED_MIME_TYPES = {
  // Imágenes
  'image/jpeg': ['image/jpeg'],
  'image/png': ['image/png'],
  'image/gif': ['image/gif'],
  'image/webp': ['image/webp'],

  // Documentos
  'application/pdf': ['application/pdf'],

  // CSV/Texto (file-type no puede detectar, validación especial)
  'text/csv': ['text/plain', 'application/csv', 'text/csv'],
  'text/plain': ['text/plain']
};

/**
 * Extensiones permitidas por MIME type
 */
const ALLOWED_EXTENSIONS = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'text/csv': ['.csv'],
  'text/plain': ['.txt']
};

// ============================================
// VALIDACIÓN DE CONTENIDO
// ============================================

/**
 * Valida que el contenido real del archivo coincida con el MIME declarado
 * Usa magic bytes para detectar el tipo real del archivo
 *
 * @param {Buffer} buffer - Contenido del archivo
 * @param {string} declaredMimeType - MIME type declarado por el cliente
 * @returns {Promise<Object>} { valid: boolean, detectedType: string, error?: string }
 */
async function validateFileContent(buffer, declaredMimeType) {
  try {
    // Detectar tipo real basado en magic bytes
    const detected = await FileType.fromBuffer(buffer);

    // Para archivos de texto (CSV), file-type no puede detectarlos
    // ya que no tienen magic bytes específicos
    if (!detected) {
      // Si declaró CSV/texto y no se detectó tipo, validar contenido
      if (['text/csv', 'text/plain', 'application/csv'].includes(declaredMimeType)) {
        const isText = isValidTextFile(buffer);
        if (!isText) {
          return {
            valid: false,
            detectedType: 'binary',
            error: 'El archivo parece ser binario, no texto'
          };
        }
        return { valid: true, detectedType: 'text/csv' };
      }

      return {
        valid: false,
        detectedType: 'unknown',
        error: 'No se pudo determinar el tipo de archivo'
      };
    }

    // Verificar que el tipo detectado esté en los permitidos para el MIME declarado
    const allowedTypes = ALLOWED_MIME_TYPES[declaredMimeType];
    if (!allowedTypes) {
      return {
        valid: false,
        detectedType: detected.mime,
        error: `Tipo MIME no permitido: ${declaredMimeType}`
      };
    }

    if (!allowedTypes.includes(detected.mime)) {
      logger.warn(`[ContentValidator] MIME mismatch: declarado=${declaredMimeType}, detectado=${detected.mime}`);
      return {
        valid: false,
        detectedType: detected.mime,
        error: `Contenido no coincide: declarado ${declaredMimeType}, detectado ${detected.mime}`
      };
    }

    return { valid: true, detectedType: detected.mime };
  } catch (error) {
    logger.error('[ContentValidator] Error validando contenido:', error);
    return {
      valid: false,
      detectedType: 'error',
      error: `Error de validación: ${error.message}`
    };
  }
}

/**
 * Verifica si un buffer contiene texto válido (no binario)
 * Analiza los primeros 8000 bytes buscando caracteres no imprimibles
 *
 * @param {Buffer} buffer - Contenido del archivo
 * @returns {boolean}
 */
function isValidTextFile(buffer) {
  // Verificar primeros 8000 bytes por caracteres no imprimibles
  const sample = buffer.slice(0, 8000);

  for (const byte of sample) {
    // Permitir: tabs (9), newlines (10), carriage returns (13), y ASCII imprimible (32-126)
    if (byte !== 9 && byte !== 10 && byte !== 13 && (byte < 32 || byte > 126)) {
      // Permitir UTF-8 multibyte (128-255 son válidos en UTF-8)
      if (byte < 128) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Verifica si el MIME type está permitido
 *
 * @param {string} mimeType - MIME type a verificar
 * @returns {boolean}
 */
function isAllowedMimeType(mimeType) {
  return Object.keys(ALLOWED_MIME_TYPES).includes(mimeType);
}

/**
 * Verifica si la extensión es válida para el MIME type
 *
 * @param {string} extension - Extensión del archivo (con punto)
 * @param {string} mimeType - MIME type declarado
 * @returns {boolean}
 */
function isValidExtension(extension, mimeType) {
  const allowed = ALLOWED_EXTENSIONS[mimeType];
  if (!allowed) return false;
  return allowed.includes(extension.toLowerCase());
}

/**
 * Obtiene las extensiones permitidas para un MIME type
 *
 * @param {string} mimeType - MIME type
 * @returns {string[]}
 */
function getAllowedExtensions(mimeType) {
  return ALLOWED_EXTENSIONS[mimeType] || [];
}

/**
 * Verifica si el MIME type es de imagen
 *
 * @param {string} mimeType - MIME type a verificar
 * @returns {boolean}
 */
function isImageMimeType(mimeType) {
  return mimeType.startsWith('image/');
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  validateFileContent,
  isValidTextFile,
  isAllowedMimeType,
  isValidExtension,
  getAllowedExtensions,
  isImageMimeType,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS
};

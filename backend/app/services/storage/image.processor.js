/**
 * Procesador de imágenes con Sharp
 * Redimensiona, optimiza y genera thumbnails
 *
 * @module services/storage/image.processor
 */

const sharp = require('sharp');
const logger = require('../../utils/logger');

// ============================================
// CONFIGURACIÓN POR DEFECTO
// ============================================

const DEFAULT_CONFIG = {
  // Tamaño máximo para imágenes originales
  maxWidth: 1920,
  maxHeight: 1080,

  // Tamaño de thumbnails
  thumbWidth: 300,
  thumbHeight: 200,

  // Calidad de compresión
  jpegQuality: 85,
  webpQuality: 85,
  pngCompression: 9
};

// ============================================
// PROCESAMIENTO DE IMÁGENES
// ============================================

/**
 * Procesa una imagen: redimensiona y optimiza
 *
 * @param {Buffer} buffer - Buffer de la imagen original
 * @param {Object} options - Opciones de procesamiento
 * @param {number} [options.width] - Ancho específico (opcional)
 * @param {number} [options.height] - Alto específico (opcional)
 * @param {number} [options.maxWidth=1920] - Ancho máximo
 * @param {number} [options.maxHeight=1080] - Alto máximo
 * @param {string} [options.fit='inside'] - Modo de ajuste: 'cover', 'contain', 'fill', 'inside', 'outside'
 * @param {number} [options.quality=85] - Calidad de compresión (1-100)
 * @param {string} [options.format] - Formato de salida: 'jpeg', 'png', 'webp' (auto si no se especifica)
 * @returns {Promise<Object>} { buffer, width, height, format, size }
 */
async function processImage(buffer, options = {}) {
  const {
    width,
    height,
    maxWidth = DEFAULT_CONFIG.maxWidth,
    maxHeight = DEFAULT_CONFIG.maxHeight,
    fit = 'inside',
    quality = DEFAULT_CONFIG.jpegQuality,
    format
  } = options;

  try {
    let pipeline = sharp(buffer);

    // Obtener metadata original
    const originalMetadata = await sharp(buffer).metadata();

    // Rotar según EXIF (importante para fotos de móviles)
    pipeline = pipeline.rotate();

    // Redimensionar
    if (width && height) {
      // Dimensiones específicas
      pipeline = pipeline.resize(width, height, {
        fit,
        withoutEnlargement: true
      });
    } else {
      // Usar límites máximos
      pipeline = pipeline.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Determinar formato de salida
    const outputFormat = format || getOutputFormat(originalMetadata.format);

    // Aplicar formato y calidad
    switch (outputFormat) {
      case 'jpeg':
        pipeline = pipeline.jpeg({
          quality,
          progressive: true,
          mozjpeg: true
        });
        break;
      case 'webp':
        pipeline = pipeline.webp({
          quality,
          effort: 4
        });
        break;
      case 'png':
        pipeline = pipeline.png({
          compressionLevel: DEFAULT_CONFIG.pngCompression,
          progressive: true
        });
        break;
      default:
        pipeline = pipeline.jpeg({ quality, progressive: true });
    }

    // Procesar
    const outputBuffer = await pipeline.toBuffer();
    const outputMetadata = await sharp(outputBuffer).metadata();

    logger.debug(`[ImageProcessor] Procesado: ${originalMetadata.width}x${originalMetadata.height} -> ${outputMetadata.width}x${outputMetadata.height}, ${Math.round(outputBuffer.length / 1024)}KB`);

    return {
      buffer: outputBuffer,
      width: outputMetadata.width,
      height: outputMetadata.height,
      format: outputMetadata.format,
      size: outputBuffer.length
    };
  } catch (error) {
    logger.error('[ImageProcessor] Error procesando imagen:', error);
    throw new Error(`Error procesando imagen: ${error.message}`);
  }
}

/**
 * Genera un thumbnail de una imagen
 *
 * @param {Buffer} buffer - Buffer de la imagen original
 * @param {Object} options - Opciones del thumbnail
 * @param {number} [options.width=300] - Ancho del thumbnail
 * @param {number} [options.height=200] - Alto del thumbnail
 * @param {string} [options.fit='cover'] - Modo de ajuste
 * @param {number} [options.quality=80] - Calidad
 * @returns {Promise<Object>} { buffer, width, height, format, size }
 */
async function generateThumbnail(buffer, options = {}) {
  const {
    width = DEFAULT_CONFIG.thumbWidth,
    height = DEFAULT_CONFIG.thumbHeight,
    fit = 'cover',
    quality = 80
  } = options;

  return processImage(buffer, {
    width,
    height,
    fit,
    quality,
    format: 'jpeg' // Thumbnails siempre en JPEG para menor tamaño
  });
}

/**
 * Obtiene metadata de una imagen sin procesarla
 *
 * @param {Buffer} buffer - Buffer de la imagen
 * @returns {Promise<Object>} Metadata de la imagen
 */
async function getImageMetadata(buffer) {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      space: metadata.space,
      channels: metadata.channels,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
      size: buffer.length
    };
  } catch (error) {
    logger.error('[ImageProcessor] Error obteniendo metadata:', error);
    throw new Error(`Error obteniendo metadata: ${error.message}`);
  }
}

/**
 * Verifica si un buffer es una imagen válida
 *
 * @param {Buffer} buffer - Buffer a verificar
 * @returns {Promise<boolean>}
 */
async function isValidImage(buffer) {
  try {
    await sharp(buffer).metadata();
    return true;
  } catch {
    return false;
  }
}

/**
 * Convierte imagen a formato WebP (más eficiente)
 *
 * @param {Buffer} buffer - Buffer de la imagen original
 * @param {number} [quality=85] - Calidad de compresión
 * @returns {Promise<Object>}
 */
async function convertToWebP(buffer, quality = 85) {
  return processImage(buffer, {
    format: 'webp',
    quality
  });
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Determina el formato de salida óptimo basado en el formato de entrada
 *
 * @param {string} inputFormat - Formato de entrada
 * @returns {string} Formato de salida recomendado
 */
function getOutputFormat(inputFormat) {
  const formatMap = {
    jpeg: 'jpeg',
    jpg: 'jpeg',
    png: 'png',
    webp: 'webp',
    gif: 'jpeg', // GIF se convierte a JPEG (sin animación)
    tiff: 'jpeg',
    svg: 'png'
  };

  return formatMap[inputFormat?.toLowerCase()] || 'jpeg';
}

/**
 * Calcula dimensiones manteniendo aspect ratio
 *
 * @param {number} originalWidth - Ancho original
 * @param {number} originalHeight - Alto original
 * @param {number} maxWidth - Ancho máximo
 * @param {number} maxHeight - Alto máximo
 * @returns {Object} { width, height }
 */
function calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
  const aspectRatio = originalWidth / originalHeight;

  let newWidth = originalWidth;
  let newHeight = originalHeight;

  if (newWidth > maxWidth) {
    newWidth = maxWidth;
    newHeight = Math.round(newWidth / aspectRatio);
  }

  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = Math.round(newHeight * aspectRatio);
  }

  return { width: newWidth, height: newHeight };
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  processImage,
  generateThumbnail,
  getImageMetadata,
  isValidImage,
  convertToWebP,
  getOutputFormat,
  calculateDimensions,
  DEFAULT_CONFIG
};

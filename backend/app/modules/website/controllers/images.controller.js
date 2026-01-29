/**
 * ====================================================================
 * IMAGES CONTROLLER
 * ====================================================================
 * Controller para busqueda y descarga de imagenes.
 */

const UnsplashService = require('../services/unsplash.service');
const asyncHandler = require('express-async-handler');

/**
 * Buscar imagenes en Unsplash
 * GET /api/v1/website/images/search
 */
const buscarImagenes = asyncHandler(async (req, res) => {
  const { q: query, page = 1, per_page = 20, orientation } = req.query;

  if (!query || query.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Query de busqueda requerido (minimo 2 caracteres)',
    });
  }

  if (!UnsplashService.isAvailable()) {
    return res.status(503).json({
      success: false,
      message: 'Servicio de imagenes no disponible',
    });
  }

  const results = await UnsplashService.search({
    query,
    page: parseInt(page),
    per_page: parseInt(per_page),
    orientation,
  });

  res.json({
    success: true,
    data: results,
  });
});

/**
 * Descargar imagen de Unsplash (registra descarga y retorna URL optimizada)
 * POST /api/v1/website/images/download
 */
const descargarImagen = asyncHandler(async (req, res) => {
  const { url, photographer, unsplashId, downloadLocation } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      message: 'URL de imagen requerida',
    });
  }

  // Registrar descarga con Unsplash (requerido por sus terminos)
  if (downloadLocation) {
    await UnsplashService.trackDownload(downloadLocation);
  }

  // Por ahora retornamos la URL directa de Unsplash
  // En produccion podriamos descargar y guardar en nuestro storage
  const optimizedUrl = UnsplashService.getOptimizedUrl(url, {
    width: 1200,
    quality: 85,
  });

  res.json({
    success: true,
    data: {
      url: optimizedUrl,
      photographer,
      source: 'unsplash',
      unsplashId,
    },
  });
});

/**
 * Obtener imagen aleatoria
 * GET /api/v1/website/images/random
 */
const imagenAleatoria = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!UnsplashService.isAvailable()) {
    return res.status(503).json({
      success: false,
      message: 'Servicio de imagenes no disponible',
    });
  }

  const image = await UnsplashService.getRandom(query);

  res.json({
    success: true,
    data: image,
  });
});

module.exports = {
  buscarImagenes,
  descargarImagen,
  imagenAleatoria,
};

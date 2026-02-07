/**
 * ====================================================================
 * GOOGLE MAPS HELPER
 * ====================================================================
 * Extrae coordenadas (latitud/longitud) de URLs de Google Maps.
 * Soporta múltiples formatos de URL incluyendo URLs cortas.
 *
 * @module utils/helpers/GoogleMapsHelper
 */

const axios = require('axios');
const logger = require('../logger');

/**
 * Patrones regex para extraer coordenadas de URLs de Google Maps
 */
const COORDINATE_PATTERNS = [
  // /@lat,lng,zoom — formato estándar
  /\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
  // ?q=lat,lng — formato query
  /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
  // !3dlat!4dlng — formato embed/pb
  /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
  // ll=lat,lng — formato legacy
  /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
  // center=lat,lng — formato embed alternativo
  /[?&]center=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
];

/**
 * Dominios de URLs cortas de Google Maps que requieren seguir redirect
 */
const SHORT_URL_HOSTS = ['maps.app.goo.gl', 'goo.gl'];

/**
 * Valida que las coordenadas estén en rango válido
 */
function validarCoordenadas(lat, lng) {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Intenta extraer coordenadas de una URL larga de Google Maps
 */
function extraerDeUrlLarga(url) {
  for (const pattern of COORDINATE_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng) && validarCoordenadas(lat, lng)) {
        return { latitud: lat, longitud: lng };
      }
    }
  }
  return null;
}

/**
 * Resuelve una URL corta de Google Maps a su URL larga
 */
async function resolverUrlCorta(url) {
  try {
    const response = await axios.head(url, {
      timeout: 3000,
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400,
    });
    // axios sigue redirects por defecto, la URL final está en response.request.res.responseUrl
    return response.request?.res?.responseUrl || response.request?.responseURL || null;
  } catch (error) {
    // En caso de redirect, axios puede lanzar error pero tener la URL en la respuesta
    if (error.response?.headers?.location) {
      return error.response.headers.location;
    }
    logger.warn('GoogleMapsHelper: No se pudo resolver URL corta', { url, error: error.message });
    return null;
  }
}

/**
 * Extrae coordenadas de una URL de Google Maps
 *
 * @param {string} url - URL de Google Maps (larga o corta)
 * @returns {Promise<{latitud: number, longitud: number}|null>} Coordenadas o null
 */
async function extractCoordinates(url) {
  if (!url || typeof url !== 'string') return null;

  const urlTrimmed = url.trim();
  if (!urlTrimmed) return null;

  try {
    // Intentar extraer de la URL directamente
    const coordenadas = extraerDeUrlLarga(urlTrimmed);
    if (coordenadas) return coordenadas;

    // Si es URL corta, resolver y reintentar
    const urlObj = new URL(urlTrimmed);
    const isShortUrl = SHORT_URL_HOSTS.some(host => urlObj.hostname === host);

    if (isShortUrl) {
      const urlLarga = await resolverUrlCorta(urlTrimmed);
      if (urlLarga) {
        const coordenadasResueltas = extraerDeUrlLarga(urlLarga);
        if (coordenadasResueltas) return coordenadasResueltas;
      }
    }

    return null;
  } catch (error) {
    logger.warn('GoogleMapsHelper: Error extrayendo coordenadas', { url: urlTrimmed, error: error.message });
    return null;
  }
}

module.exports = {
  extractCoordinates,
};

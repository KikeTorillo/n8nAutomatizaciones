/**
 * ====================================================================
 * UNSPLASH SERVICE
 * ====================================================================
 * Servicio para buscar y descargar imagenes de Unsplash.
 * Requiere UNSPLASH_ACCESS_KEY en variables de entorno.
 *
 * Limites API (gratuito):
 * - 50 requests/hora (desarrollo)
 * - 5000 requests/hora (produccion, tras aprobacion)
 */

const fetch = require('node-fetch');

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = 'https://api.unsplash.com';

/**
 * Servicio de Unsplash
 */
class UnsplashService {
  /**
   * Verificar si el servicio esta disponible
   */
  static isAvailable() {
    return !!UNSPLASH_ACCESS_KEY;
  }

  /**
   * Buscar imagenes en Unsplash
   * @param {Object} params
   * @param {string} params.query - Termino de busqueda
   * @param {number} params.page - Numero de pagina (default: 1)
   * @param {number} params.per_page - Resultados por pagina (default: 20, max: 30)
   * @param {string} params.orientation - 'landscape' | 'portrait' | 'squarish'
   * @returns {Promise<Object>} Resultados de busqueda
   */
  static async search({ query, page = 1, per_page = 20, orientation = null }) {
    if (!this.isAvailable()) {
      throw new Error('Unsplash API key no configurada');
    }

    const params = new URLSearchParams({
      query,
      page: String(page),
      per_page: String(Math.min(per_page, 30)),
    });

    if (orientation) {
      params.append('orientation', orientation);
    }

    try {
      const response = await fetch(
        `${UNSPLASH_API_URL}/search/photos?${params}`,
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
            'Accept-Version': 'v1',
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[UnsplashService] Error en busqueda:', error);
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const data = await response.json();

      // Mapear resultados a formato simplificado
      return {
        total: data.total,
        total_pages: data.total_pages,
        results: data.results.map((photo) => ({
          id: photo.id,
          width: photo.width,
          height: photo.height,
          color: photo.color,
          blur_hash: photo.blur_hash,
          alt_description: photo.alt_description,
          urls: {
            raw: photo.urls.raw,
            full: photo.urls.full,
            regular: photo.urls.regular,
            small: photo.urls.small,
            thumb: photo.urls.thumb,
          },
          links: {
            html: photo.links.html,
            download_location: photo.links.download_location,
          },
          user: {
            id: photo.user.id,
            name: photo.user.name,
            username: photo.user.username,
            portfolio_url: photo.user.portfolio_url,
            profile_image: photo.user.profile_image?.small,
          },
        })),
      };
    } catch (error) {
      console.error('[UnsplashService] Error:', error.message);
      throw error;
    }
  }

  /**
   * Registrar descarga de imagen (requerido por Unsplash API)
   * @param {string} downloadLocation - URL de download_location
   */
  static async trackDownload(downloadLocation) {
    if (!this.isAvailable() || !downloadLocation) {
      return;
    }

    try {
      await fetch(downloadLocation, {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      });
    } catch (error) {
      // No es critico, solo log
      console.warn('[UnsplashService] Error tracking download:', error.message);
    }
  }

  /**
   * Obtener URL de imagen optimizada
   * @param {string} rawUrl - URL raw de Unsplash
   * @param {Object} options - Opciones de transformacion
   * @param {number} options.width - Ancho deseado
   * @param {number} options.height - Alto deseado
   * @param {number} options.quality - Calidad (1-100)
   * @param {string} options.fit - 'crop' | 'clamp' | 'fill' | 'scale'
   * @returns {string} URL optimizada
   */
  static getOptimizedUrl(rawUrl, options = {}) {
    const {
      width = 1200,
      height = null,
      quality = 80,
      fit = 'crop',
    } = options;

    const params = new URLSearchParams({
      w: String(width),
      q: String(quality),
      fit,
      fm: 'jpg', // Formato
    });

    if (height) {
      params.append('h', String(height));
    }

    return `${rawUrl}&${params}`;
  }

  /**
   * Obtener imagen aleatoria por categoria
   * @param {string} query - Termino de busqueda
   * @returns {Promise<Object>} Imagen aleatoria
   */
  static async getRandom(query = null) {
    if (!this.isAvailable()) {
      throw new Error('Unsplash API key no configurada');
    }

    const params = new URLSearchParams();
    if (query) {
      params.append('query', query);
    }

    try {
      const response = await fetch(
        `${UNSPLASH_API_URL}/photos/random?${params}`,
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
            'Accept-Version': 'v1',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const photo = await response.json();

      return {
        id: photo.id,
        urls: photo.urls,
        user: {
          name: photo.user.name,
          username: photo.user.username,
        },
        links: photo.links,
      };
    } catch (error) {
      console.error('[UnsplashService] Error getting random:', error.message);
      throw error;
    }
  }
}

module.exports = UnsplashService;

/**
 * ====================================================================
 * IMAGES API (Unsplash)
 * ====================================================================
 * API compartida para búsqueda y descarga de imágenes.
 * Desacoplada de websiteApi para uso desde cualquier módulo.
 *
 * @version 1.0.0
 * @since 2026-02-05
 */

import apiClient from '../client';

export const imagesApi = {
  /**
   * Buscar imágenes en Unsplash
   * @param {Object} params - { query, page?, per_page?, orientation? }
   * @returns {Promise<Object>}
   */
  buscarImagenes: (params) =>
    apiClient.get('/website/images/search', { params: { q: params.query, ...params } })
      .then((res) => res.data?.data || res.data),

  /**
   * Descargar imagen de Unsplash
   * @param {Object} datos - { url, photographer, unsplashId, downloadLocation }
   * @returns {Promise<Object>}
   */
  descargarImagen: (datos) =>
    apiClient.post('/website/images/download', datos)
      .then((res) => res.data?.data || res.data),

  /**
   * Obtener imagen aleatoria de Unsplash
   * @param {string} query - Término de búsqueda opcional
   * @returns {Promise<Object>}
   */
  obtenerImagenAleatoria: (query) =>
    apiClient.get('/website/images/random', { params: query ? { query } : {} })
      .then((res) => res.data?.data || res.data),
};

export default imagesApi;

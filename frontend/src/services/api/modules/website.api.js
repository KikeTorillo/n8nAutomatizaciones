import axios from 'axios';
import apiClient from '../client';
/**
 * API de Website
 */
export const websiteApi = {
  // ========== Configuración del Sitio ==========

  /**
   * Crear configuración del sitio
   * @param {Object} data - { slug, nombre_sitio?, descripcion_seo?, ... }
   * @returns {Promise<Object>}
   */
  crearConfig: (data) => apiClient.post('/website/config', data),

  /**
   * Obtener configuración del sitio
   * @returns {Promise<Object>}
   */
  obtenerConfig: () => apiClient.get('/website/config'),

  /**
   * Actualizar configuración del sitio
   * @param {string} id - UUID
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarConfig: (id, data) => apiClient.put(`/website/config/${id}`, data),

  /**
   * Publicar/despublicar sitio
   * @param {string} id - UUID
   * @param {boolean} publicar
   * @returns {Promise<Object>}
   */
  publicarConfig: (id, publicar) => apiClient.post(`/website/config/${id}/publicar`, { publicar }),

  /**
   * Verificar disponibilidad de slug
   * @param {string} slug
   * @param {string} excludeId - UUID opcional para excluir
   * @returns {Promise<Object>}
   */
  verificarSlug: (slug, excludeId) => apiClient.get(`/website/config/slug/${slug}/disponible`, {
    params: excludeId ? { exclude: excludeId } : {}
  }),

  /**
   * Eliminar sitio web
   * @param {string} id - UUID
   * @returns {Promise<Object>}
   */
  eliminarConfig: (id) => apiClient.delete(`/website/config/${id}`),

  // ========== Páginas ==========

  /**
   * Crear página
   * @param {Object} data - { slug?, titulo, descripcion_seo?, orden?, visible_menu?, publicada? }
   * @returns {Promise<Object>}
   */
  crearPagina: (data) => apiClient.post('/website/paginas', data),

  /**
   * Listar páginas
   * @returns {Promise<Object>}
   */
  listarPaginas: () => apiClient.get('/website/paginas'),

  /**
   * Obtener página por ID
   * @param {string} id - UUID
   * @returns {Promise<Object>}
   */
  obtenerPagina: (id) => apiClient.get(`/website/paginas/${id}`),

  /**
   * Actualizar página
   * @param {string} id - UUID
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarPagina: (id, data) => apiClient.put(`/website/paginas/${id}`, data),

  /**
   * Reordenar páginas
   * @param {Array} ordenamiento - [{ id, orden }, ...]
   * @returns {Promise<Object>}
   */
  reordenarPaginas: (ordenamiento) => apiClient.put('/website/paginas/orden', { ordenamiento }),

  /**
   * Eliminar página
   * @param {string} id - UUID
   * @returns {Promise<Object>}
   */
  eliminarPagina: (id) => apiClient.delete(`/website/paginas/${id}`),

  // ========== Bloques ==========

  /**
   * Crear bloque
   * @param {Object} data - { pagina_id, tipo, contenido?, estilos?, orden?, visible? }
   * @returns {Promise<Object>}
   */
  crearBloque: (data) => apiClient.post('/website/bloques', data),

  /**
   * Listar bloques de una página
   * @param {string} paginaId - UUID
   * @returns {Promise<Object>}
   */
  listarBloques: (paginaId) => apiClient.get(`/website/paginas/${paginaId}/bloques`),

  /**
   * Obtener bloque por ID
   * @param {string} id - UUID
   * @returns {Promise<Object>}
   */
  obtenerBloque: (id) => apiClient.get(`/website/bloques/${id}`),

  /**
   * Actualizar bloque
   * @param {string} id - UUID
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarBloque: (id, data) => apiClient.put(`/website/bloques/${id}`, data),

  /**
   * Reordenar bloques de una página
   * @param {string} paginaId - UUID
   * @param {Array} ordenamiento - [{ id, orden }, ...]
   * @returns {Promise<Object>}
   */
  reordenarBloques: (paginaId, ordenamiento) =>
    apiClient.put(`/website/paginas/${paginaId}/bloques/orden`, { ordenamiento }),

  /**
   * Duplicar bloque
   * @param {string} id - UUID
   * @returns {Promise<Object>}
   */
  duplicarBloque: (id) => apiClient.post(`/website/bloques/${id}/duplicar`),

  /**
   * Eliminar bloque
   * @param {string} id - UUID
   * @returns {Promise<Object>}
   */
  eliminarBloque: (id) => apiClient.delete(`/website/bloques/${id}`),

  /**
   * Listar tipos de bloques disponibles
   * @returns {Promise<Object>}
   */
  listarTiposBloques: () => apiClient.get('/website/bloques/tipos'),

  /**
   * Obtener contenido default de un tipo de bloque
   * @param {string} tipo - hero, servicios, testimonios, etc.
   * @returns {Promise<Object>}
   */
  obtenerDefaultBloque: (tipo) => apiClient.get(`/website/bloques/tipos/${tipo}/default`),

  // ========== Rutas Públicas (sin auth) ==========

  /**
   * Obtener sitio público por slug
   * @param {string} slug
   * @returns {Promise<Object>}
   */
  obtenerSitioPublico: (slug) => {
    const publicAxios = axios.create({
      baseURL: '/api/v1',
      headers: { 'Content-Type': 'application/json' }
    });
    return publicAxios.get(`/public/sitio/${slug}`);
  },

  /**
   * Obtener página pública
   * @param {string} slug - Slug del sitio
   * @param {string} pagina - Slug de la página
   * @returns {Promise<Object>}
   */
  obtenerPaginaPublica: (slug, pagina) => {
    const publicAxios = axios.create({
      baseURL: '/api/v1',
      headers: { 'Content-Type': 'application/json' }
    });
    return publicAxios.get(`/public/sitio/${slug}/${pagina}`);
  },

  /**
   * Enviar formulario de contacto
   * @param {string} slug
   * @param {Object} data - { nombre, email, telefono?, mensaje? }
   * @returns {Promise<Object>}
   */
  enviarContacto: (slug, data) => {
    const publicAxios = axios.create({
      baseURL: '/api/v1',
      headers: { 'Content-Type': 'application/json' }
    });
    return publicAxios.post(`/public/sitio/${slug}/contacto`, data);
  },
};

// ==================== CONTABILIDAD ====================

import apiClient, { publicApiClient } from '../client';
/**
 * API de Marketplace
 */
export const marketplaceApi = {
  // ========== Públicas (sin auth) ==========

  /**
   * Listar categorías/industrias disponibles
   * @returns {Promise<Array>} Lista de categorías activas
   */
  getCategorias: () => apiClient.get('/marketplace/categorias'),

  /**
   * Buscar perfiles en directorio
   * @param {Object} params - { ciudad, ciudad_id, categoria_id, rating_minimo, q, pagina, limite }
   * @returns {Promise<Object>} { perfiles, paginacion }
   */
  getPerfiles: (params = {}) => apiClient.get('/marketplace/perfiles/buscar', { params }),

  /**
   * Obtener perfil público por slug
   * @param {string} slug
   * @returns {Promise<Object>}
   */
  getPerfilPorSlug: (slug) => apiClient.get(`/marketplace/perfiles/slug/${slug}`),

  /**
   * Registrar evento de analytics (fire-and-forget)
   * @param {Object} data - { perfil_id, tipo_evento, metadata }
   */
  registrarEvento: (data) => apiClient.post('/marketplace/analytics', data),

  /**
   * Crear cita pública (sin auth - crea cliente automáticamente)
   * @param {Object} data - { organizacion_id, cliente: {...}, servicios_ids, fecha_cita, hora_inicio }
   * @returns {Promise<Object>} Cita creada
   *
   * IMPORTANTE: Crea instancia nueva de axios sin interceptores para evitar enviar token
   */
  crearCitaPublica: (data) =>
    publicApiClient.post('/citas', data),

  /**
   * Consultar disponibilidad pública (sin auth)
   * @param {Object} params - { organizacion_id, fecha, servicios_ids, profesional_id?, intervalo_minutos? }
   * @returns {Promise<Object>} { fecha, slots: [...] }
   *
   * IMPORTANTE: Crea instancia nueva de axios sin interceptores para evitar enviar token
   */
  consultarDisponibilidadPublica: (params) =>
    publicApiClient.get('/disponibilidad', { params }),

  // ========== Privadas (requieren auth) ==========

  /**
   * Crear perfil de marketplace
   * @param {Object} data
   */
  crearPerfil: (data) => apiClient.post('/marketplace/perfiles', data),

  /**
   * Actualizar mi perfil
   * @param {number} id
   * @param {Object} data
   */
  actualizarPerfil: (id, data) => apiClient.put(`/marketplace/perfiles/${id}`, data),

  /**
   * Obtener mi perfil (admin/propietario)
   */
  getMiPerfil: () => apiClient.get('/marketplace/perfiles/mi-perfil'),

  /**
   * Activar/desactivar perfil (super_admin)
   * @param {number} id
   * @param {boolean} activo
   */
  activarPerfil: (id, activo) => apiClient.patch(`/marketplace/perfiles/${id}/activar`, { activo }),

  /**
   * Obtener estadísticas del perfil
   * @param {number} id
   * @param {Object} params - { fecha_desde, fecha_hasta }
   */
  getEstadisticasPerfil: (id, params = {}) =>
    apiClient.get(`/marketplace/perfiles/${id}/estadisticas`, { params }),

  // ========== Reseñas ==========

  /**
   * Listar reseñas de un negocio (público)
   * @param {string} slug
   * @param {Object} params - { pagina, limite, orden }
   */
  getReseñas: (slug, params = {}) =>
    apiClient.get(`/marketplace/resenas/negocio/${slug}`, { params }),

  /**
   * Crear reseña (autenticado - cliente con cita completada)
   * @param {Object} data - { cita_id, rating, comentario }
   */
  crearReseña: (data) => apiClient.post('/marketplace/resenas', data),

  /**
   * Responder reseña (admin/propietario)
   * @param {number} id
   * @param {Object} data - { respuesta }
   */
  responderReseña: (id, data) => apiClient.post(`/marketplace/resenas/${id}/responder`, data),

  /**
   * Moderar reseña (admin/propietario)
   * @param {number} id
   * @param {Object} data - { estado, motivo_moderacion }
   */
  moderarReseña: (id, data) => apiClient.patch(`/marketplace/resenas/${id}/moderar`, data),

  // ========== Super Admin ==========

  /**
   * Listar TODOS los perfiles de marketplace (super_admin)
   * @param {Object} params - { activo, ciudad, rating_min, pagina, limite }
   * @returns {Promise<Object>} { perfiles, paginacion }
   */
  getPerfilesAdmin: (params = {}) => apiClient.get('/superadmin/marketplace/perfiles', { params }),

  /**
   * Limpiar analytics antiguos (super_admin)
   * @param {Object} params - { dias_antiguedad }
   */
  limpiarAnalytics: (params = {}) => apiClient.delete('/marketplace/analytics/limpiar', { params }),
};

// ==================== INVENTARIO ====================

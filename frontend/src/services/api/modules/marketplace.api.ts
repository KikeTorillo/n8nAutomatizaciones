import apiClient, { publicApiClient } from '../client';

/**
 * API de Marketplace
 */
export const marketplaceApi = {
  // ========== Públicas (sin auth) ==========

  /** Listar categorías/industrias disponibles */
  getCategorias: () => apiClient.get('/marketplace/categorias'),

  /** Buscar perfiles en directorio */
  getPerfiles: (params: Record<string, unknown> = {}) => apiClient.get('/marketplace/perfiles/buscar', { params }),

  /** Obtener perfil público por slug */
  getPerfilPorSlug: (slug: string) => apiClient.get(`/marketplace/perfiles/slug/${slug}`),

  /** Registrar evento de analytics (fire-and-forget) */
  registrarEvento: (data: Record<string, unknown>) => apiClient.post('/marketplace/analytics', data),

  /** Crear cita pública (sin auth - crea cliente automáticamente) */
  crearCitaPublica: (data: Record<string, unknown>) =>
    publicApiClient.post('/citas', data),

  /** Consultar disponibilidad pública (sin auth) */
  consultarDisponibilidadPublica: (params: Record<string, unknown>) =>
    publicApiClient.get('/disponibilidad', { params }),

  // ========== Privadas (requieren auth) ==========

  /** Crear perfil de marketplace */
  crearPerfil: (data: Record<string, unknown>) => apiClient.post('/marketplace/perfiles', data),

  /** Actualizar mi perfil */
  actualizarPerfil: (id: number, data: Record<string, unknown>) => apiClient.put(`/marketplace/perfiles/${id}`, data),

  /** Obtener mi perfil (admin/propietario) */
  getMiPerfil: () => apiClient.get('/marketplace/perfiles/mi-perfil'),

  /** Activar/desactivar perfil (super_admin) */
  activarPerfil: (id: number, activo: boolean) => apiClient.patch(`/marketplace/perfiles/${id}/activar`, { activo }),

  /** Obtener estadísticas del perfil */
  getEstadisticasPerfil: (id: number, params: Record<string, unknown> = {}) =>
    apiClient.get(`/marketplace/perfiles/${id}/estadisticas`, { params }),

  // ========== Reseñas ==========

  /** Listar reseñas de un negocio (público) */
  getReseñas: (slug: string, params: Record<string, unknown> = {}) =>
    apiClient.get(`/marketplace/resenas/negocio/${slug}`, { params }),

  /** Crear reseña (autenticado - cliente con cita completada) */
  crearReseña: (data: Record<string, unknown>) => apiClient.post('/marketplace/resenas', data),

  /** Responder reseña (admin/propietario) */
  responderReseña: (id: number, data: Record<string, unknown>) => apiClient.post(`/marketplace/resenas/${id}/responder`, data),

  /** Moderar reseña (admin/propietario) */
  moderarReseña: (id: number, data: Record<string, unknown>) => apiClient.patch(`/marketplace/resenas/${id}/moderar`, data),

  // ========== Super Admin ==========

  /** Listar TODOS los perfiles de marketplace (super_admin) */
  getPerfilesAdmin: (params: Record<string, unknown> = {}) => apiClient.get('/superadmin/marketplace/perfiles', { params }),

  /** Limpiar analytics antiguos (super_admin) */
  limpiarAnalytics: (params: Record<string, unknown> = {}) => apiClient.delete('/marketplace/analytics/limpiar', { params }),
};

import apiClient from '../client';

/**
 * API de Notificaciones
 */
export const notificacionesApi = {
  // ========== Feed de Notificaciones ==========

  /** Listar notificaciones del usuario */
  listar: (params: Record<string, unknown> = {}) => apiClient.get('/notificaciones', { params }),

  /** Contar notificaciones no leídas (para badge) */
  contarNoLeidas: () => apiClient.get('/notificaciones/count'),

  /** Marcar notificación como leída */
  marcarLeida: (id: number) => apiClient.put(`/notificaciones/${id}/leer`),

  /** Marcar todas las notificaciones como leídas */
  marcarTodasLeidas: () => apiClient.put('/notificaciones/leer-todas'),

  /** Archivar notificación */
  archivar: (id: number) => apiClient.put(`/notificaciones/${id}/archivar`),

  /** Eliminar notificación */
  eliminar: (id: number) => apiClient.delete(`/notificaciones/${id}`),

  /** Crear notificación (admin/sistema) */
  crear: (data: Record<string, unknown>) => apiClient.post('/notificaciones', data),

  // ========== Preferencias ==========

  /** Obtener preferencias de notificación del usuario */
  obtenerPreferencias: () => apiClient.get('/notificaciones/preferencias'),

  /** Actualizar preferencias de notificación */
  actualizarPreferencias: (data: Record<string, unknown>) => apiClient.put('/notificaciones/preferencias', data),

  /** Obtener tipos de notificación disponibles */
  obtenerTipos: () => apiClient.get('/notificaciones/tipos'),

  // ========== Plantillas (Admin) ==========

  /** Listar plantillas de la organización */
  listarPlantillas: () => apiClient.get('/notificaciones/plantillas'),

  /** Crear plantilla de notificación */
  crearPlantilla: (data: Record<string, unknown>) => apiClient.post('/notificaciones/plantillas', data),

  /** Actualizar plantilla */
  actualizarPlantilla: (id: number, data: Record<string, unknown>) => apiClient.put(`/notificaciones/plantillas/${id}`, data),

  /** Eliminar plantilla */
  eliminarPlantilla: (id: number) => apiClient.delete(`/notificaciones/plantillas/${id}`),
};

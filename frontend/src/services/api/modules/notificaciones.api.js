import apiClient from '../client';
/**
 * API de Notificaciones
 */
export const notificacionesApi = {
  // ========== Feed de Notificaciones ==========

  /**
   * Listar notificaciones del usuario
   * @param {Object} params - { solo_no_leidas?, categoria?, limit?, offset? }
   */
  listar: (params = {}) => apiClient.get('/notificaciones', { params }),

  /**
   * Contar notificaciones no leídas (para badge)
   */
  contarNoLeidas: () => apiClient.get('/notificaciones/count'),

  /**
   * Marcar notificación como leída
   * @param {number} id
   */
  marcarLeida: (id) => apiClient.put(`/notificaciones/${id}/leer`),

  /**
   * Marcar todas las notificaciones como leídas
   */
  marcarTodasLeidas: () => apiClient.put('/notificaciones/leer-todas'),

  /**
   * Archivar notificación
   * @param {number} id
   */
  archivar: (id) => apiClient.put(`/notificaciones/${id}/archivar`),

  /**
   * Eliminar notificación
   * @param {number} id
   */
  eliminar: (id) => apiClient.delete(`/notificaciones/${id}`),

  /**
   * Crear notificación (admin/sistema)
   * @param {Object} data - { usuario_id, tipo, categoria, titulo, mensaje, nivel?, icono?, accion_url?, accion_texto?, entidad_tipo?, entidad_id?, expira_en? }
   */
  crear: (data) => apiClient.post('/notificaciones', data),

  // ========== Preferencias ==========

  /**
   * Obtener preferencias de notificación del usuario
   */
  obtenerPreferencias: () => apiClient.get('/notificaciones/preferencias'),

  /**
   * Actualizar preferencias de notificación
   * @param {Object} data - { preferencias: [{ tipo, in_app, email, push?, whatsapp? }] }
   */
  actualizarPreferencias: (data) => apiClient.put('/notificaciones/preferencias', data),

  /**
   * Obtener tipos de notificación disponibles
   */
  obtenerTipos: () => apiClient.get('/notificaciones/tipos'),

  // ========== Plantillas (Admin) ==========

  /**
   * Listar plantillas de la organización
   */
  listarPlantillas: () => apiClient.get('/notificaciones/plantillas'),

  /**
   * Crear plantilla de notificación
   * @param {Object} data - { tipo_notificacion, nombre, titulo_template, mensaje_template, icono?, nivel?, activo? }
   */
  crearPlantilla: (data) => apiClient.post('/notificaciones/plantillas', data),

  /**
   * Actualizar plantilla
   * @param {number} id
   * @param {Object} data
   */
  actualizarPlantilla: (id, data) => apiClient.put(`/notificaciones/plantillas/${id}`, data),

  /**
   * Eliminar plantilla
   * @param {number} id
   */
  eliminarPlantilla: (id) => apiClient.delete(`/notificaciones/plantillas/${id}`),
};

// ==================== PERMISOS ====================
/**
 * API de Permisos Normalizados (Dic 2025)
 * Sistema de permisos con catálogo, roles y overrides por usuario/sucursal
 */

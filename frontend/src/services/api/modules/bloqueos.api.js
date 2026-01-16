import apiClient from '../client';
/**
 * API de Bloqueos
 */
export const bloqueosApi = {
  /**
   * Crear bloqueo de horario
   * @param {Object} data - { profesional_id, tipo_bloqueo, titulo, descripcion, fecha_inicio, fecha_fin, hora_inicio, hora_fin, ... }
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/bloqueos-horarios', data),

  /**
   * Listar bloqueos con filtros
   * @param {Object} params - { profesional_id, tipo_bloqueo, fecha_inicio, fecha_fin, solo_organizacionales, limite, offset }
   * @returns {Promise<Object>}
   */
  listar: (params = {}) => apiClient.get('/bloqueos-horarios', { params }),

  /**
   * Obtener bloqueo por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/bloqueos-horarios/${id}`),

  /**
   * Actualizar bloqueo
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/bloqueos-horarios/${id}`, data),

  /**
   * Eliminar bloqueo
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/bloqueos-horarios/${id}`),

  /**
   * Obtener bloqueos de un profesional específico
   * @param {number} profesionalId
   * @param {Object} params - { fecha_inicio, fecha_fin }
   * @returns {Promise<Object>}
   */
  obtenerPorProfesional: (profesionalId, params = {}) =>
    apiClient.get('/bloqueos-horarios', { params: { ...params, profesional_id: profesionalId } }),

  /**
   * Obtener bloqueos organizacionales (sin profesional específico)
   * @param {Object} params - { fecha_inicio, fecha_fin, tipo_bloqueo }
   * @returns {Promise<Object>}
   */
  obtenerOrganizacionales: (params = {}) =>
    apiClient.get('/bloqueos-horarios', { params: { ...params, solo_organizacionales: true } }),

  /**
   * Obtener bloqueos por rango de fechas
   * @param {string} fechaInicio - Formato YYYY-MM-DD
   * @param {string} fechaFin - Formato YYYY-MM-DD
   * @param {Object} params - Filtros adicionales
   * @returns {Promise<Object>}
   */
  obtenerPorRangoFechas: (fechaInicio, fechaFin, params = {}) =>
    apiClient.get('/bloqueos-horarios', {
      params: { ...params, fecha_inicio: fechaInicio, fecha_fin: fechaFin },
    }),
};

// ==================== TIPOS DE BLOQUEO ====================

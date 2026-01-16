import apiClient from '../client';
/**
 * API de Tipos de Bloqueo
 */
export const tiposBloqueoApi = {
  /**
   * Listar tipos de bloqueo disponibles (sistema + personalizados)
   * @param {Object} params - { solo_sistema, solo_personalizados }
   * @returns {Promise<Object>}
   */
  listar: (params = {}) => apiClient.get('/tipos-bloqueo', { params }),

  /**
   * Obtener tipo de bloqueo por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/tipos-bloqueo/${id}`),

  /**
   * Crear tipo de bloqueo personalizado (solo admin/propietario)
   * @param {Object} data - { codigo, nombre, descripcion, permite_todo_el_dia, permite_horario_especifico, requiere_aprobacion, orden_display, metadata }
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/tipos-bloqueo', data),

  /**
   * Actualizar tipo de bloqueo personalizado
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/tipos-bloqueo/${id}`, data),

  /**
   * Eliminar tipo de bloqueo personalizado
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/tipos-bloqueo/${id}`),
};

// ==================== WHATSAPP ====================

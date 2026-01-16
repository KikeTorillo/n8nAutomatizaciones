import apiClient from '../client';
/**
 * API de Ubicaciones de Trabajo
 */
export const ubicacionesTrabajoApi = {
  /**
   * Listar ubicaciones de trabajo de la organización
   * @param {Object} params - { activas, es_remoto, es_oficina_principal, sucursal_id }
   * @returns {Promise<Object>}
   */
  listar: (params = {}) => apiClient.get('/ubicaciones-trabajo', { params }),

  /**
   * Obtener estadísticas de uso por día de la semana
   * @returns {Promise<Object>}
   */
  estadisticas: () => apiClient.get('/ubicaciones-trabajo/estadisticas'),

  /**
   * Obtener ubicación de trabajo por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/ubicaciones-trabajo/${id}`),

  /**
   * Crear ubicación de trabajo (solo admin/propietario)
   * @param {Object} data - { codigo, nombre, direccion, ciudad, es_remoto, es_oficina_principal, color, icono }
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/ubicaciones-trabajo', data),

  /**
   * Actualizar ubicación de trabajo
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/ubicaciones-trabajo/${id}`, data),

  /**
   * Eliminar ubicación de trabajo (soft delete)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/ubicaciones-trabajo/${id}`),
};

// ==================== CATEGORÍAS DE PAGO (GAP-004) ====================

import apiClient from '../client';
/**
 * API de Motivos de Salida
 */
export const motivosSalidaApi = {
  /**
   * Listar motivos de salida disponibles (sistema + personalizados)
   * @param {Object} params - { solo_sistema, solo_personalizados, activos }
   * @returns {Promise<Object>}
   */
  listar: (params = {}) => apiClient.get('/motivos-salida', { params }),

  /**
   * Obtener estadísticas de uso de motivos
   * @returns {Promise<Object>}
   */
  estadisticas: () => apiClient.get('/motivos-salida/estadisticas'),

  /**
   * Obtener motivo de salida por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/motivos-salida/${id}`),

  /**
   * Obtener motivo de salida por código
   * @param {string} codigo
   * @returns {Promise<Object>}
   */
  obtenerPorCodigo: (codigo) => apiClient.get(`/motivos-salida/codigo/${codigo}`),

  /**
   * Crear motivo de salida personalizado (solo admin/propietario)
   * @param {Object} data - { codigo, nombre, descripcion, requiere_documentacion, afecta_finiquito, color, icono }
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/motivos-salida', data),

  /**
   * Actualizar motivo de salida
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/motivos-salida/${id}`, data),

  /**
   * Eliminar motivo de salida (soft delete)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/motivos-salida/${id}`),
};

// ==================== UBICACIONES DE TRABAJO (GAP-003) ====================

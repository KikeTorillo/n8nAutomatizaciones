import apiClient from '../client';
/**
 * API de Planes
 */
export const planesApi = {
  /**
   * Listar planes disponibles
   * @returns {Promise<Object>}
   */
  listar: () => apiClient.get('/planes'),

  /**
   * Obtener plan por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/planes/${id}`),
};

// ==================== BLOQUEOS DE HORARIOS ====================

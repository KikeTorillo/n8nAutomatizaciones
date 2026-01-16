import apiClient from '../client';
/**
 * API de Categorías de Pago
 */
export const categoriasPagoApi = {
  /**
   * Listar categorías de pago de la organización
   * @param {Object} params - { activas, ordenar_por }
   * @returns {Promise<Object>}
   */
  listar: (params = {}) => apiClient.get('/categorias-pago', { params }),

  /**
   * Obtener estadísticas de uso de categorías
   * @returns {Promise<Object>}
   */
  estadisticas: () => apiClient.get('/categorias-pago/estadisticas'),

  /**
   * Obtener categoría de pago por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/categorias-pago/${id}`),

  /**
   * Crear categoría de pago (solo admin/propietario)
   * @param {Object} data - { codigo, nombre, nivel_salarial, permite_comisiones, permite_bonos, permite_viaticos, color, icono }
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/categorias-pago', data),

  /**
   * Actualizar categoría de pago
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/categorias-pago/${id}`, data),

  /**
   * Eliminar categoría de pago (soft delete)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/categorias-pago/${id}`),
};

// ==================== INCAPACIDADES (Enero 2026) ====================

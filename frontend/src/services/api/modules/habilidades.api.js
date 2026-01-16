import apiClient from '../client';
/**
 * API de Habilidades
 */
export const habilidadesApi = {
  /**
   * Listar catálogo de habilidades de la organización
   * @param {Object} params - { categoria, q, limit, offset }
   */
  listar: (params = {}) =>
    apiClient.get('/habilidades', { params }),

  /**
   * Crear habilidad en catálogo
   * @param {Object} data - { nombre, categoria, descripcion, icono, color }
   */
  crear: (data) =>
    apiClient.post('/habilidades', data),

  /**
   * Obtener habilidad del catálogo por ID
   * @param {number} habilidadId
   */
  obtener: (habilidadId) =>
    apiClient.get(`/habilidades/${habilidadId}`),

  /**
   * Actualizar habilidad del catálogo
   * @param {number} habilidadId
   * @param {Object} data - { nombre, categoria, descripcion, icono, color }
   */
  actualizar: (habilidadId, data) =>
    apiClient.put(`/habilidades/${habilidadId}`, data),

  /**
   * Eliminar habilidad del catálogo (soft delete)
   * @param {number} habilidadId
   */
  eliminar: (habilidadId) =>
    apiClient.delete(`/habilidades/${habilidadId}`),

  /**
   * Listar profesionales con una habilidad específica
   * @param {number} habilidadId
   * @param {Object} params - { nivel_minimo, verificado, limit, offset }
   */
  listarProfesionales: (habilidadId, params = {}) =>
    apiClient.get(`/habilidades/${habilidadId}/profesionales`, { params }),
};

// ==================== SERVICIOS ====================

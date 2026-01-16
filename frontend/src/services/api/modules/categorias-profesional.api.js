import apiClient from '../client';
/**
 * API de Categorías de Profesional
 */
export const categoriasProfesionalApi = {
  /**
   * Crear categoría
   * @param {Object} data - { nombre, descripcion?, tipo_categoria?, color?, icono?, orden?, activo? }
   */
  crear: (data) => apiClient.post('/categorias-profesional', data),

  /**
   * Listar categorías
   * @param {Object} params - { activo?, tipo_categoria?, agrupado?, limit?, offset? }
   */
  listar: (params = {}) => apiClient.get('/categorias-profesional', { params }),

  /**
   * Listar categorías agrupadas por tipo
   */
  listarAgrupadas: () => apiClient.get('/categorias-profesional', { params: { agrupado: 'true' } }),

  /**
   * Obtener categoría por ID
   */
  obtener: (id) => apiClient.get(`/categorias-profesional/${id}`),

  /**
   * Obtener profesionales de una categoría
   */
  obtenerProfesionales: (id) => apiClient.get(`/categorias-profesional/${id}/profesionales`),

  /**
   * Actualizar categoría
   */
  actualizar: (id, data) => apiClient.put(`/categorias-profesional/${id}`, data),

  /**
   * Eliminar categoría (soft delete)
   */
  eliminar: (id) => apiClient.delete(`/categorias-profesional/${id}`),
};

// ==================== CUSTOM FIELDS ====================
/**
 * API de Campos Personalizados
 * Permite definir y gestionar campos dinámicos para entidades
 */
// ==================== NOTIFICACIONES ====================

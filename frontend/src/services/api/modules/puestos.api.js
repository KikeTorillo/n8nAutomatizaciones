import apiClient from '../client';
/**
 * API de Puestos
 */
export const puestosApi = {
  /**
   * Crear puesto
   * @param {Object} data - { nombre, descripcion?, codigo?, departamento_id?, salario_minimo?, salario_maximo?, activo? }
   */
  crear: (data) => apiClient.post('/puestos', data),

  /**
   * Listar puestos
   * @param {Object} params - { activo?, departamento_id?, limit?, offset? }
   */
  listar: (params = {}) => apiClient.get('/puestos', { params }),

  /**
   * Obtener puesto por ID
   */
  obtener: (id) => apiClient.get(`/puestos/${id}`),

  /**
   * Actualizar puesto
   */
  actualizar: (id, data) => apiClient.put(`/puestos/${id}`, data),

  /**
   * Eliminar puesto (soft delete)
   */
  eliminar: (id) => apiClient.delete(`/puestos/${id}`),
};

/**
 * API de Categorías de Profesional
 * Categorías flexibles: especialidad, nivel, área, certificación
 */

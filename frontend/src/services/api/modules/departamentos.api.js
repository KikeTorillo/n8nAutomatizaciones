import apiClient from '../client';
/**
 * API de Departamentos
 */
export const departamentosApi = {
  /**
   * Crear departamento
   * @param {Object} data - { nombre, descripcion?, codigo?, parent_id?, gerente_id?, activo? }
   */
  crear: (data) => apiClient.post('/departamentos', data),

  /**
   * Listar departamentos
   * @param {Object} params - { activo?, parent_id?, limit?, offset? }
   */
  listar: (params = {}) => apiClient.get('/departamentos', { params }),

  /**
   * Obtener árbol jerárquico de departamentos
   */
  obtenerArbol: () => apiClient.get('/departamentos/arbol'),

  /**
   * Obtener departamento por ID
   */
  obtener: (id) => apiClient.get(`/departamentos/${id}`),

  /**
   * Actualizar departamento
   */
  actualizar: (id, data) => apiClient.put(`/departamentos/${id}`, data),

  /**
   * Eliminar departamento (soft delete)
   */
  eliminar: (id) => apiClient.delete(`/departamentos/${id}`),
};

/**
 * API de Puestos
 * Gestión de puestos de trabajo
 */

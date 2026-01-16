import apiClient from '../client';
/**
 * API de Workflow Designer
 */
export const workflowDesignerApi = {
  // ========== Utilidades ==========

  /**
   * Listar tipos de entidad disponibles
   * @returns {Promise<Object[]>} Lista de entidades con campos disponibles
   */
  listarEntidades: () => apiClient.get('/workflows/designer/entidades'),

  /**
   * Listar roles disponibles para aprobadores
   * @returns {Promise<Object[]>}
   */
  listarRoles: () => apiClient.get('/workflows/designer/roles'),

  /**
   * Listar permisos disponibles para aprobadores
   * @returns {Promise<Object[]>}
   */
  listarPermisos: () => apiClient.get('/workflows/designer/permisos'),

  // ========== CRUD Definiciones ==========

  /**
   * Crear nueva definición de workflow
   * @param {Object} data - { codigo, nombre, descripcion?, entidad_tipo, condicion_activacion?, prioridad?, activo?, pasos, transiciones }
   * @returns {Promise<Object>} Workflow creado con pasos y transiciones
   */
  crear: (data) => apiClient.post('/workflows/designer/definiciones', data),

  /**
   * Actualizar definición de workflow
   * @param {number} id
   * @param {Object} data - { nombre?, descripcion?, condicion_activacion?, prioridad?, pasos?, transiciones? }
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/workflows/designer/definiciones/${id}`, data),

  /**
   * Eliminar definición de workflow
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/workflows/designer/definiciones/${id}`),

  /**
   * Duplicar un workflow existente
   * @param {number} id
   * @param {Object} data - { nuevo_codigo?, nuevo_nombre? }
   * @returns {Promise<Object>} Workflow duplicado
   */
  duplicar: (id, data) => apiClient.post(`/workflows/designer/definiciones/${id}/duplicar`, data),

  /**
   * Publicar o despublicar workflow
   * @param {number} id
   * @param {boolean} activo
   * @returns {Promise<Object>}
   */
  cambiarEstadoPublicacion: (id, activo) =>
    apiClient.patch(`/workflows/designer/definiciones/${id}/publicar`, { activo }),

  /**
   * Validar estructura de un workflow
   * @param {number} id
   * @returns {Promise<Object>} { valido, errores, estadisticas }
   */
  validar: (id) => apiClient.get(`/workflows/designer/definiciones/${id}/validar`),
};

// ==================== MONEDAS (Multi-Moneda) ====================

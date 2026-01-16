import apiClient from '../client';
/**
 * API de Workflows
 */
export const workflowsApi = {
  // ========== Bandeja de Aprobaciones ==========

  /**
   * Listar aprobaciones pendientes del usuario actual
   * @param {Object} params - { entidad_tipo?, limit?, offset? }
   * @returns {Promise<Object>} { instancias[], total, limit, offset }
   */
  listarPendientes: (params) => apiClient.get('/workflows/pendientes', { params }),

  /**
   * Contar aprobaciones pendientes (para badge)
   * @returns {Promise<Object>} { total }
   */
  contarPendientes: () => apiClient.get('/workflows/pendientes/count'),

  /**
   * Obtener detalle de una instancia de workflow
   * @param {number} id - ID de la instancia
   * @returns {Promise<Object>} Instancia con historial y datos de entidad
   */
  obtenerInstancia: (id) => apiClient.get(`/workflows/instancias/${id}`),

  // ========== Acciones ==========

  /**
   * Aprobar una solicitud
   * @param {number} id - ID de la instancia
   * @param {Object} data - { comentario? }
   * @returns {Promise<Object>}
   */
  aprobar: (id, data) => apiClient.post(`/workflows/instancias/${id}/aprobar`, data),

  /**
   * Rechazar una solicitud
   * @param {number} id - ID de la instancia
   * @param {Object} data - { motivo }
   * @returns {Promise<Object>}
   */
  rechazar: (id, data) => apiClient.post(`/workflows/instancias/${id}/rechazar`, data),

  // ========== Historial ==========

  /**
   * Obtener historial de aprobaciones
   * @param {Object} params - { entidad_tipo?, estado?, fecha_desde?, fecha_hasta?, limit?, offset? }
   * @returns {Promise<Object>} { instancias[], total, limit, offset }
   */
  listarHistorial: (params) => apiClient.get('/workflows/historial', { params }),

  // ========== Delegaciones ==========

  /**
   * Listar delegaciones del usuario
   * @param {Object} params - { activas?, como_delegado? }
   * @returns {Promise<Object[]>}
   */
  listarDelegaciones: (params) => apiClient.get('/workflows/delegaciones', { params }),

  /**
   * Crear delegación
   * @param {Object} data - { usuario_delegado_id, workflow_id?, fecha_inicio, fecha_fin, motivo? }
   * @returns {Promise<Object>}
   */
  crearDelegacion: (data) => apiClient.post('/workflows/delegaciones', data),

  /**
   * Actualizar delegación
   * @param {number} id - ID de la delegación
   * @param {Object} data - { fecha_fin?, activo?, motivo? }
   * @returns {Promise<Object>}
   */
  actualizarDelegacion: (id, data) => apiClient.put(`/workflows/delegaciones/${id}`, data),

  /**
   * Eliminar delegación
   * @param {number} id - ID de la delegación
   * @returns {Promise<Object>}
   */
  eliminarDelegacion: (id) => apiClient.delete(`/workflows/delegaciones/${id}`),

  // ========== Definiciones (lectura) ==========

  /**
   * Listar definiciones de workflows
   * @param {Object} params - { entidad_tipo?, activo? }
   * @returns {Promise<Object[]>}
   */
  listarDefiniciones: (params) => apiClient.get('/workflows/definiciones', { params }),

  /**
   * Obtener definición por ID
   * @param {number} id
   * @returns {Promise<Object>} Definición con pasos y transiciones
   */
  obtenerDefinicion: (id) => apiClient.get(`/workflows/definiciones/${id}`),
};

// ==================== WORKFLOW DESIGNER (Visual Editor) ====================

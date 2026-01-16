import apiClient from '../client';
/**
 * API de Oportunidades (CRM)
 */
export const oportunidadesApi = {
  // ========== ETAPAS DEL PIPELINE ==========

  /**
   * Listar etapas del pipeline
   * @param {Object} params - { incluirInactivas }
   * @returns {Promise<Object>}
   */
  listarEtapas: (params = {}) =>
    apiClient.get('/oportunidades/etapas', { params }),

  /**
   * Crear etapa
   * @param {Object} data - { nombre, descripcion, probabilidad_default, color, orden, es_ganada, es_perdida }
   * @returns {Promise<Object>}
   */
  crearEtapa: (data) =>
    apiClient.post('/oportunidades/etapas', data),

  /**
   * Actualizar etapa
   * @param {number} etapaId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarEtapa: (etapaId, data) =>
    apiClient.put(`/oportunidades/etapas/${etapaId}`, data),

  /**
   * Eliminar etapa
   * @param {number} etapaId
   * @returns {Promise<Object>}
   */
  eliminarEtapa: (etapaId) =>
    apiClient.delete(`/oportunidades/etapas/${etapaId}`),

  /**
   * Reordenar etapas
   * @param {Object} data - { orden: [id1, id2, ...] }
   * @returns {Promise<Object>}
   */
  reordenarEtapas: (data) =>
    apiClient.put('/oportunidades/etapas/reordenar', data),

  // ========== PIPELINE ==========

  /**
   * Obtener pipeline completo para Kanban
   * @param {Object} params - { vendedor_id }
   * @returns {Promise<Object>}
   */
  obtenerPipeline: (params = {}) =>
    apiClient.get('/oportunidades/pipeline', { params }),

  /**
   * Obtener estadísticas del pipeline
   * @param {Object} params - { vendedor_id }
   * @returns {Promise<Object>}
   */
  obtenerEstadisticas: (params = {}) =>
    apiClient.get('/oportunidades/estadisticas', { params }),

  /**
   * Obtener pronóstico de ventas
   * @param {Object} params - { fecha_inicio, fecha_fin }
   * @returns {Promise<Object>}
   */
  obtenerPronostico: (params = {}) =>
    apiClient.get('/oportunidades/pronostico', { params }),

  // ========== CRUD OPORTUNIDADES ==========

  /**
   * Listar oportunidades
   * @param {Object} params - { page, limit, cliente_id, etapa_id, vendedor_id, estado, prioridad, fecha_desde, fecha_hasta, busqueda }
   * @returns {Promise<Object>}
   */
  listar: (params = {}) =>
    apiClient.get('/oportunidades', { params }),

  /**
   * Listar oportunidades por cliente
   * @param {number} clienteId
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  listarPorCliente: (clienteId, params = {}) =>
    apiClient.get(`/clientes/${clienteId}/oportunidades`, { params }),

  /**
   * Crear oportunidad
   * @param {Object} data - { cliente_id, etapa_id, nombre, descripcion, probabilidad, fecha_cierre_esperada, ingreso_esperado, vendedor_id, prioridad, fuente }
   * @returns {Promise<Object>}
   */
  crear: (data) =>
    apiClient.post('/oportunidades', data),

  /**
   * Obtener oportunidad por ID
   * @param {number} oportunidadId
   * @returns {Promise<Object>}
   */
  obtenerPorId: (oportunidadId) =>
    apiClient.get(`/oportunidades/${oportunidadId}`),

  /**
   * Actualizar oportunidad
   * @param {number} oportunidadId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (oportunidadId, data) =>
    apiClient.put(`/oportunidades/${oportunidadId}`, data),

  /**
   * Eliminar oportunidad
   * @param {number} oportunidadId
   * @returns {Promise<Object>}
   */
  eliminar: (oportunidadId) =>
    apiClient.delete(`/oportunidades/${oportunidadId}`),

  // ========== OPERACIONES PIPELINE ==========

  /**
   * Mover oportunidad a otra etapa (drag & drop)
   * @param {number} oportunidadId
   * @param {Object} data - { etapa_id }
   * @returns {Promise<Object>}
   */
  mover: (oportunidadId, data) =>
    apiClient.patch(`/oportunidades/${oportunidadId}/mover`, data),

  /**
   * Marcar oportunidad como ganada
   * @param {number} oportunidadId
   * @returns {Promise<Object>}
   */
  marcarGanada: (oportunidadId) =>
    apiClient.patch(`/oportunidades/${oportunidadId}/ganar`),

  /**
   * Marcar oportunidad como perdida
   * @param {number} oportunidadId
   * @param {Object} data - { motivo_perdida }
   * @returns {Promise<Object>}
   */
  marcarPerdida: (oportunidadId, data) =>
    apiClient.patch(`/oportunidades/${oportunidadId}/perder`, data),

  /**
   * Obtener estadísticas de oportunidades de un cliente
   * @param {number} clienteId
   * @returns {Promise<Object>}
   */
  obtenerEstadisticasCliente: (clienteId) =>
    apiClient.get(`/clientes/${clienteId}/oportunidades/estadisticas`),
};

// ==================== CITAS ====================

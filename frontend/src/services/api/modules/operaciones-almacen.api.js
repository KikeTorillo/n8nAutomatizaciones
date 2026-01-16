import apiClient from '../client';
/**
 * API de Operaciones de Almacén
 */
export const operacionesAlmacenApi = {
  /**
   * Listar operaciones con filtros
   * @param {Object} params - { sucursal_id?, tipo_operacion?, estado?, estados?, asignado_a?, origen_tipo?, limit? }
   * @returns {Promise<Array>} Operaciones
   */
  listar: (params = {}) => apiClient.get('/inventario/operaciones', { params }),

  /**
   * Obtener operacion por ID con items
   * @param {number} id
   * @returns {Promise<Object>} Operacion con items
   */
  obtenerPorId: (id) => apiClient.get(`/inventario/operaciones/${id}`),

  /**
   * Crear operacion manual
   * @param {Object} data - Datos de la operacion
   * @returns {Promise<Object>} Operacion creada
   */
  crear: (data) => apiClient.post('/inventario/operaciones', data),

  /**
   * Actualizar operacion
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>} Operacion actualizada
   */
  actualizar: (id, data) => apiClient.put(`/inventario/operaciones/${id}`, data),

  /**
   * Asignar operacion a usuario
   * @param {number} id
   * @param {Object} data - { usuario_id? }
   * @returns {Promise<Object>} Operacion asignada
   */
  asignar: (id, data = {}) => apiClient.post(`/inventario/operaciones/${id}/asignar`, data),

  /**
   * Iniciar procesamiento de operacion
   * @param {number} id
   * @returns {Promise<Object>} Operacion iniciada
   */
  iniciar: (id) => apiClient.post(`/inventario/operaciones/${id}/iniciar`),

  /**
   * Completar operacion procesando items
   * @param {number} id
   * @param {Object} data - { items: [{ id, cantidad_procesada, ubicacion_destino_id? }] }
   * @returns {Promise<Object>} Resultado con operacion_siguiente si aplica
   */
  completar: (id, data) => apiClient.post(`/inventario/operaciones/${id}/completar`, data),

  /**
   * Cancelar operacion
   * @param {number} id
   * @param {Object} data - { motivo? }
   * @returns {Promise<Object>} Operacion cancelada
   */
  cancelar: (id, data = {}) => apiClient.post(`/inventario/operaciones/${id}/cancelar`, data),

  /**
   * Procesar item individual
   * @param {number} itemId
   * @param {Object} data - { cantidad_procesada, ubicacion_destino_id? }
   * @returns {Promise<Object>} Item procesado
   */
  procesarItem: (itemId, data) => apiClient.post(`/inventario/operaciones/items/${itemId}/procesar`, data),

  /**
   * Cancelar item
   * @param {number} itemId
   * @returns {Promise<Object>} Item cancelado
   */
  cancelarItem: (itemId) => apiClient.post(`/inventario/operaciones/items/${itemId}/cancelar`),

  /**
   * Obtener cadena completa de operaciones
   * @param {number} id
   * @returns {Promise<Array>} Cadena de operaciones
   */
  obtenerCadena: (id) => apiClient.get(`/inventario/operaciones/${id}/cadena`),

  /**
   * Obtener operaciones pendientes por sucursal
   * @param {number} sucursalId
   * @returns {Promise<Object>} { por_tipo, total }
   */
  obtenerPendientes: (sucursalId) => apiClient.get(`/inventario/operaciones/pendientes/${sucursalId}`),

  /**
   * Obtener estadisticas por tipo
   * @param {number} sucursalId
   * @returns {Promise<Object>} Estadisticas
   */
  obtenerEstadisticas: (sucursalId) => apiClient.get(`/inventario/operaciones/estadisticas/${sucursalId}`),

  /**
   * Obtener resumen para vista Kanban
   * @param {number} sucursalId
   * @returns {Promise<Object>} Resumen Kanban
   */
  obtenerResumenKanban: (sucursalId) => apiClient.get(`/inventario/operaciones/kanban/${sucursalId}`),
};

// ==================== BATCH PICKING (Dic 2025) ====================

import apiClient from '../client';
/**
 * API de Batch Picking
 */
export const batchPickingApi = {
  /**
   * Listar batches con filtros
   * @param {Object} params - { sucursal_id?, estado?, estados?, asignado_a?, limit? }
   * @returns {Promise<Array>} Batches
   */
  listar: (params = {}) => apiClient.get('/inventario/batch-picking', { params }),

  /**
   * Obtener batch por ID con operaciones
   * @param {number} id
   * @returns {Promise<Object>} Batch con operaciones
   */
  obtenerPorId: (id) => apiClient.get(`/inventario/batch-picking/${id}`),

  /**
   * Crear batch de picking
   * @param {Object} data - { sucursal_id?, operacion_ids, nombre? }
   * @returns {Promise<Object>} Batch creado
   */
  crear: (data) => apiClient.post('/inventario/batch-picking', data),

  /**
   * Actualizar batch
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>} Batch actualizado
   */
  actualizar: (id, data) => apiClient.put(`/inventario/batch-picking/${id}`, data),

  /**
   * Eliminar batch (solo si esta en borrador)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/inventario/batch-picking/${id}`),

  /**
   * Agregar operacion al batch
   * @param {number} batchId
   * @param {Object} data - { operacion_id }
   * @returns {Promise<Object>} Relacion creada
   */
  agregarOperacion: (batchId, data) => apiClient.post(`/inventario/batch-picking/${batchId}/operaciones`, data),

  /**
   * Quitar operacion del batch
   * @param {number} batchId
   * @param {number} operacionId
   * @returns {Promise<Object>}
   */
  quitarOperacion: (batchId, operacionId) => apiClient.delete(`/inventario/batch-picking/${batchId}/operaciones/${operacionId}`),

  /**
   * Iniciar procesamiento del batch
   * @param {number} id
   * @returns {Promise<Object>} Resultado
   */
  iniciar: (id) => apiClient.post(`/inventario/batch-picking/${id}/iniciar`),

  /**
   * Procesar item del batch
   * @param {number} id
   * @param {Object} data - { producto_id, variante_id?, ubicacion_id?, cantidad }
   * @returns {Promise<Object>} Resultado
   */
  procesarItem: (id, data) => apiClient.post(`/inventario/batch-picking/${id}/procesar-item`, data),

  /**
   * Completar batch
   * @param {number} id
   * @returns {Promise<Object>} Resultado
   */
  completar: (id) => apiClient.post(`/inventario/batch-picking/${id}/completar`),

  /**
   * Cancelar batch
   * @param {number} id
   * @returns {Promise<Object>} Batch cancelado
   */
  cancelar: (id) => apiClient.post(`/inventario/batch-picking/${id}/cancelar`),

  /**
   * Obtener lista consolidada de productos a recoger
   * @param {number} id
   * @returns {Promise<Array>} Lista consolidada
   */
  obtenerListaConsolidada: (id) => apiClient.get(`/inventario/batch-picking/${id}/lista-consolidada`),

  /**
   * Obtener estadisticas del batch
   * @param {number} id
   * @returns {Promise<Object>} Estadisticas
   */
  obtenerEstadisticas: (id) => apiClient.get(`/inventario/batch-picking/${id}/estadisticas`),

  /**
   * Obtener batches pendientes de una sucursal
   * @param {number} sucursalId
   * @returns {Promise<Array>} Batches pendientes
   */
  obtenerPendientes: (sucursalId) => apiClient.get(`/inventario/batch-picking/pendientes/${sucursalId}`),

  /**
   * Obtener operaciones de picking disponibles para batch
   * @param {number} sucursalId
   * @returns {Promise<Array>} Operaciones disponibles
   */
  obtenerOperacionesDisponibles: (sucursalId) => apiClient.get(`/inventario/batch-picking/operaciones-disponibles/${sucursalId}`),
};

// ==================== CONFIGURACION ALMACEN (Dic 2025) ====================

import apiClient from '../client';
/**
 * API de Reorden
 */
export const reordenApi = {
  /**
   * Obtener dashboard de reorden con metricas
   * @returns {Promise<Object>} { metricas, reglas, job }
   */
  obtenerDashboard: () => apiClient.get('/inventario/reorden/dashboard'),

  /**
   * Listar productos que necesitan reabastecimiento
   * @param {Object} params - { solo_sin_oc?, categoria_id?, proveedor_id?, limit? }
   * @returns {Promise<Array>} Productos bajo minimo
   */
  productosBajoMinimo: (params = {}) => apiClient.get('/inventario/reorden/productos-bajo-minimo', { params }),

  /**
   * Listar rutas de operacion disponibles
   * @param {Object} params - { tipo?, activo? }
   * @returns {Promise<Array>} Rutas
   */
  listarRutas: (params = {}) => apiClient.get('/inventario/reorden/rutas', { params }),

  /**
   * Listar reglas de reabastecimiento
   * @param {Object} params - { activo?, producto_id? }
   * @returns {Promise<Array>} Reglas
   */
  listarReglas: (params = {}) => apiClient.get('/inventario/reorden/reglas', { params }),

  /**
   * Obtener regla por ID
   * @param {number} id
   * @returns {Promise<Object>} Regla
   */
  obtenerRegla: (id) => apiClient.get(`/inventario/reorden/reglas/${id}`),

  /**
   * Crear nueva regla de reabastecimiento
   * @param {Object} data - Datos de la regla
   * @returns {Promise<Object>} Regla creada
   */
  crearRegla: (data) => apiClient.post('/inventario/reorden/reglas', data),

  /**
   * Actualizar regla de reabastecimiento
   * @param {number} id
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} Regla actualizada
   */
  actualizarRegla: (id, data) => apiClient.put(`/inventario/reorden/reglas/${id}`, data),

  /**
   * Eliminar regla de reabastecimiento
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarRegla: (id) => apiClient.delete(`/inventario/reorden/reglas/${id}`),

  /**
   * Ejecutar evaluacion de reorden manualmente
   * @returns {Promise<Object>} { reglas_evaluadas, ordenes_generadas, errores, detalles }
   */
  ejecutarManual: () => apiClient.post('/inventario/reorden/ejecutar'),

  /**
   * Listar historial de ejecuciones de reorden
   * @param {Object} params - { tipo?, fecha_desde?, fecha_hasta?, limit?, offset? }
   * @returns {Promise<Array>} Logs de ejecucion
   */
  listarLogs: (params = {}) => apiClient.get('/inventario/reorden/logs', { params }),

  /**
   * Obtener detalle de un log de ejecucion
   * @param {number} id
   * @returns {Promise<Object>} Log con detalles
   */
  obtenerLog: (id) => apiClient.get(`/inventario/reorden/logs/${id}`),
};

// ==================== OPERACIONES DE ALMACEN (Dic 2025) ====================

import apiClient from '../client';
/**
 * API de Comisiones
 */
export const comisionesApi = {
  // ========== Configuración de Comisiones ==========

  /**
   * Crear o actualizar configuración de comisión
   * @param {Object} data - { profesional_id, servicio_id, tipo_comision, valor_comision, activo, notas }
   * @returns {Promise<Object>}
   */
  crearConfiguracion: (data) => apiClient.post('/comisiones/configuracion', data),

  /**
   * Listar configuraciones de comisión
   * @param {Object} params - { profesional_id, servicio_id, activo }
   * @returns {Promise<Object>} { configuraciones, total }
   */
  listarConfiguraciones: (params = {}) => apiClient.get('/comisiones/configuracion', { params }),

  /**
   * Obtener historial de cambios en configuración
   * @param {Object} params - { profesional_id, servicio_id, fecha_desde, fecha_hasta, limite, offset }
   * @returns {Promise<Object>} { historial, total }
   */
  obtenerHistorialConfiguracion: (params = {}) =>
    apiClient.get('/comisiones/configuracion/historial', { params }),

  /**
   * Eliminar configuración de comisión
   * @param {number} id - ID de la configuración
   * @returns {Promise<Object>}
   */
  eliminarConfiguracion: (id) => apiClient.delete(`/comisiones/configuracion/${id}`),

  // ========== Consulta de Comisiones ==========

  /**
   * Obtener comisiones de un profesional
   * @param {number} profesionalId - ID del profesional
   * @param {Object} params - { fecha_desde, fecha_hasta, estado_pago, limite, offset }
   * @returns {Promise<Object>} { comisiones, total, resumen }
   */
  obtenerPorProfesional: (profesionalId, params = {}) =>
    apiClient.get(`/comisiones/profesional/${profesionalId}`, { params }),

  /**
   * Obtener comisiones por período
   * @param {Object} params - { fecha_desde, fecha_hasta, profesional_id, estado_pago, limite, offset }
   * @returns {Promise<Object>} { comisiones, total, resumen }
   */
  obtenerPorPeriodo: (params = {}) => apiClient.get('/comisiones/periodo', { params }),

  /**
   * Obtener comisión por ID
   * @param {number} id - ID de la comisión
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/comisiones/${id}`),

  /**
   * Marcar comisión como pagada
   * @param {number} id - ID de la comisión
   * @param {Object} data - { fecha_pago, metodo_pago, referencia_pago, notas_pago }
   * @returns {Promise<Object>}
   */
  marcarComoPagada: (id, data) => apiClient.patch(`/comisiones/${id}/pagar`, data),

  // ========== Dashboard y Reportes ==========

  /**
   * Obtener métricas del dashboard de comisiones
   * @param {Object} params - { fecha_desde, fecha_hasta, profesional_id }
   * @returns {Promise<Object>} { total_comisiones, comisiones_pendientes, comisiones_pagadas, total_profesionales }
   */
  obtenerDashboard: (params = {}) => apiClient.get('/comisiones/dashboard', { params }),

  /**
   * Obtener estadísticas de comisiones
   * @param {Object} params - { fecha_desde, fecha_hasta, profesional_id }
   * @returns {Promise<Object>} { por_profesional, por_mes, por_servicio, resumen_general }
   */
  obtenerEstadisticas: (params = {}) => apiClient.get('/comisiones/estadisticas', { params }),

  /**
   * Obtener datos para gráfica de comisiones por día
   * @param {Object} params - { fecha_desde, fecha_hasta, profesional_id }
   * @returns {Promise<Object>} { grafica }
   */
  obtenerGraficaPorDia: (params = {}) => apiClient.get('/comisiones/grafica/por-dia', { params }),
};

// ==================== MARKETPLACE ====================

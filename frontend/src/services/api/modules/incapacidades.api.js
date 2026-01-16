import apiClient from '../client';
/**
 * API de Incapacidades
 */
export const incapacidadesApi = {
  /**
   * Crear nueva incapacidad
   * @param {Object} data - { profesional_id, folio_imss, tipo_incapacidad, fecha_inicio, fecha_fin, dias_autorizados, ... }
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/incapacidades', data),

  /**
   * Listar incapacidades (admin)
   * @param {Object} params - { profesional_id, estado, tipo_incapacidad, fecha_inicio, fecha_fin, page, limite }
   * @returns {Promise<Object>}
   */
  listar: (params = {}) => apiClient.get('/incapacidades', { params }),

  /**
   * Listar mis incapacidades (empleado)
   * @param {Object} params - { estado, anio, page, limite }
   * @returns {Promise<Object>}
   */
  listarMis: (params = {}) => apiClient.get('/incapacidades/mis-incapacidades', { params }),

  /**
   * Obtener incapacidad por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/incapacidades/${id}`),

  /**
   * Actualizar incapacidad (campos editables)
   * @param {number} id
   * @param {Object} data - { documento_url, medico_nombre, unidad_medica, diagnostico, notas_internas }
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/incapacidades/${id}`, data),

  /**
   * Finalizar incapacidad anticipadamente
   * @param {number} id
   * @param {Object} data - { notas_internas?, fecha_fin_real? }
   * @returns {Promise<Object>}
   */
  finalizar: (id, data = {}) => apiClient.post(`/incapacidades/${id}/finalizar`, data),

  /**
   * Cancelar incapacidad
   * @param {number} id
   * @param {Object} data - { motivo_cancelacion }
   * @returns {Promise<Object>}
   */
  cancelar: (id, data) => apiClient.delete(`/incapacidades/${id}`, { data }),

  /**
   * Crear prórroga de incapacidad
   * @param {number} id - ID de incapacidad origen
   * @param {Object} data - { folio_imss, fecha_inicio, fecha_fin, dias_autorizados, ... }
   * @returns {Promise<Object>}
   */
  crearProrroga: (id, data) => apiClient.post(`/incapacidades/${id}/prorroga`, data),

  /**
   * Obtener estadísticas de incapacidades
   * @param {Object} params - { anio, departamento_id, tipo_incapacidad }
   * @returns {Promise<Object>}
   */
  obtenerEstadisticas: (params = {}) => apiClient.get('/incapacidades/estadisticas', { params }),

  /**
   * Obtener incapacidades activas de un profesional
   * @param {number} profesionalId
   * @returns {Promise<Object>}
   */
  obtenerActivasPorProfesional: (profesionalId) =>
    apiClient.get(`/incapacidades/profesional/${profesionalId}/activas`),
};

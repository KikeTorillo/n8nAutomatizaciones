import apiClient from '../client';
/**
 * API de Servicios
 */
export const serviciosApi = {
  /**
   * Crear servicio
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/servicios', data),

  /**
   * Crear múltiples servicios en transacción (bulk)
   * @param {Array} servicios - Array de servicios a crear
   * @returns {Promise<Object>} { servicios, total_creados }
   */
  crearBulk: (servicios) => apiClient.post('/servicios/bulk-create', {
    servicios
  }),

  /**
   * Listar servicios con filtros y paginación
   * @param {Object} params - { pagina, limite, busqueda, activo, categoria, precio_min, precio_max }
   * @returns {Promise<Object>}
   */
  listar: (params = {}) => apiClient.get('/servicios', { params }),

  /**
   * Obtener servicio por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/servicios/${id}`),

  /**
   * Actualizar servicio
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/servicios/${id}`, data),

  /**
   * Eliminar servicio (soft delete)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/servicios/${id}`),

  /**
   * Buscar servicios (búsqueda rápida)
   * @param {Object} params - { termino, limite }
   * @returns {Promise<Object>}
   */
  buscar: (params) => apiClient.get('/servicios/buscar', { params }),

  /**
   * Obtener profesionales asignados al servicio
   * @param {number} id - ID del servicio
   * @returns {Promise<Object>}
   */
  obtenerProfesionales: (id) => apiClient.get(`/servicios/${id}/profesionales`),

  /**
   * Asignar profesional al servicio
   * @param {number} id - ID del servicio
   * @param {Object} data - { profesional_id, configuracion }
   * @returns {Promise<Object>}
   */
  asignarProfesional: (id, data) => apiClient.post(`/servicios/${id}/profesionales`, data),

  /**
   * Desasignar profesional del servicio
   * @param {number} id - ID del servicio
   * @param {number} profId - ID del profesional
   * @returns {Promise<Object>}
   */
  desasignarProfesional: (id, profId) => apiClient.delete(`/servicios/${id}/profesionales/${profId}`),

  /**
   * Obtener servicios de un profesional
   * @param {number} profesionalId - ID del profesional
   * @param {Object} params - { solo_activos }
   * @returns {Promise<Object>}
   */
  obtenerServiciosPorProfesional: (profesionalId, params = {}) =>
    apiClient.get(`/servicios/profesionales/${profesionalId}/servicios`, { params }),

  /**
   * Obtener estadísticas de asignaciones servicio-profesional
   * @returns {Promise<Object>} { total_servicios, servicios_activos, servicios_sin_profesional, total_profesionales, profesionales_activos, profesionales_sin_servicio, total_asignaciones_activas }
   */
  obtenerEstadisticasAsignaciones: () =>
    apiClient.get('/servicios/estadisticas/asignaciones'),

  // =====================================================================
  // ROUND-ROBIN: Orden de profesionales (Ene 2026)
  // =====================================================================

  /**
   * Obtener profesionales con orden de rotación
   * @param {number} id - ID del servicio
   * @returns {Promise<Array>} - Profesionales con orden_rotacion
   */
  obtenerProfesionalesConOrden: (id) =>
    apiClient.get(`/servicios/${id}/profesionales/orden`),

  /**
   * Actualizar orden de rotación de profesionales
   * @param {number} id - ID del servicio
   * @param {Array} orden - Array de { profesional_id, orden }
   * @returns {Promise<Array>} - Profesionales actualizados
   */
  actualizarOrdenProfesionales: (id, orden) =>
    apiClient.put(`/servicios/${id}/profesionales/orden`, { orden }),
};

// ==================== HORARIOS PROFESIONALES ====================

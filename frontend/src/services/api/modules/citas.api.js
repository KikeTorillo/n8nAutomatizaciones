import apiClient from '../client';
/**
 * API de Citas
 */
export const citasApi = {
  /**
   * Crear cita
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/citas', data),

  /**
   * Listar citas
   * @param {Object} params - Filtros opcionales
   * @returns {Promise<Object>}
   */
  listar: (params = {}) => apiClient.get('/citas', { params }),

  /**
   * Obtener cita por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/citas/${id}`),

  /**
   * Actualizar cita
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/citas/${id}`, data),

  /**
   * Cancelar cita
   * @param {number} id
   * @param {Object} data - { motivo_cancelacion }
   * @returns {Promise<Object>}
   */
  cancelar: (id, data = {}) => apiClient.put(`/citas/${id}/cancelar`, data),

  /**
   * Confirmar asistencia de cita
   * @param {number} id
   * @param {Object} data - Datos opcionales
   * @returns {Promise<Object>}
   */
  confirmar: (id, data = {}) => apiClient.patch(`/citas/${id}/confirmar-asistencia`, data),

  /**
   * Iniciar cita (cambiar a estado en_curso)
   * @param {number} id
   * @param {Object} data - { notas_inicio }
   * @returns {Promise<Object>}
   */
  iniciar: (id, data = {}) => apiClient.post(`/citas/${id}/start-service`, data),

  /**
   * Completar cita
   * @param {number} id
   * @param {Object} data - { notas_finalizacion, precio_total_real, metodo_pago }
   * @returns {Promise<Object>}
   */
  completar: (id, data = {}) => apiClient.post(`/citas/${id}/complete`, data),

  /**
   * Marcar cita como no show (cliente no llegó)
   * @param {number} id
   * @param {Object} data - { motivo }
   * @returns {Promise<Object>}
   */
  noShow: (id, data = {}) => apiClient.put(`/citas/${id}/no-show`, data),

  /**
   * Enviar recordatorio de cita por WhatsApp
   * @param {number} id
   * @returns {Promise<Object>}
   */
  enviarRecordatorio: (id) => apiClient.post(`/citas/${id}/enviar-recordatorio`),

  /**
   * Obtener historial de recordatorios de una cita
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerRecordatorios: (id) => apiClient.get(`/citas/${id}/recordatorios`),

  /**
   * Crear cita walk-in (cliente sin cita previa)
   * @param {Object} data - { cliente_id, nombre_cliente, profesional_id, servicio_id, tiempo_espera_aceptado, notas_walk_in }
   * @returns {Promise<Object>}
   */
  crearWalkIn: (data) => apiClient.post('/citas/walk-in', data),

  /**
   * Consultar disponibilidad inmediata para walk-in
   * @param {Object} params - { servicio_id, profesional_id }
   * @returns {Promise<Object>}
   */
  disponibilidadInmediata: (params) => apiClient.get('/citas/disponibilidad-inmediata', { params }),

  // ==================== CITAS RECURRENTES ====================

  /**
   * Crear serie de citas recurrentes
   * @param {Object} data - Datos de la cita + patron_recurrencia
   * @returns {Promise<Object>} { cita_serie_id, citas_creadas, citas_omitidas, estadisticas }
   */
  crearRecurrente: (data) => apiClient.post('/citas/recurrente', data),

  /**
   * Obtener todas las citas de una serie recurrente
   * @param {string} serieId - UUID de la serie
   * @param {Object} params - { incluir_canceladas: boolean }
   * @returns {Promise<Object>} Serie completa con citas y estadísticas
   */
  obtenerSerie: (serieId, params = {}) => apiClient.get(`/citas/serie/${serieId}`, { params }),

  /**
   * Cancelar todas las citas pendientes de una serie
   * @param {string} serieId - UUID de la serie
   * @param {Object} data - { motivo_cancelacion, cancelar_desde_fecha, cancelar_solo_pendientes }
   * @returns {Promise<Object>} Resumen de cancelación
   */
  cancelarSerie: (serieId, data) => apiClient.post(`/citas/serie/${serieId}/cancelar`, data),

  /**
   * Preview de fechas para serie recurrente (sin crear)
   * @param {Object} data - { fecha_inicio, hora_inicio, duracion_minutos, profesional_id, patron_recurrencia }
   * @returns {Promise<Object>} { fechas_disponibles, fechas_no_disponibles, porcentaje_disponibilidad }
   */
  previewRecurrencia: (data) => apiClient.post('/citas/recurrente/preview', data),
};

// ==================== CONFIGURACIÓN AGENDAMIENTO (Ene 2026) ====================

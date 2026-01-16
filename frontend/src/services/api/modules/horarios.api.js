import apiClient from '../client';
/**
 * API de Horarios
 */
export const horariosApi = {
  /**
   * Crear horarios semanales estándar (batch para Lun-Vie)
   * @param {Object} data - { profesional_id, dias, hora_inicio, hora_fin, tipo_horario, nombre_horario, fecha_inicio }
   * @returns {Promise<Object>} { horarios_creados, horarios: [...] }
   */
  crearSemanalesEstandar: (data) => apiClient.post('/horarios-profesionales/semanales-estandar', data),

  /**
   * Crear horario individual
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/horarios-profesionales', data),

  /**
   * Listar horarios de un profesional
   * @param {Object} params - { profesional_id, dia_semana, tipo_horario, etc. }
   * @returns {Promise<Object>}
   */
  listar: (params) => apiClient.get('/horarios-profesionales', { params }),

  /**
   * Obtener horario por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/horarios-profesionales/${id}`),

  /**
   * Actualizar horario
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/horarios-profesionales/${id}`, data),

  /**
   * Eliminar horario
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/horarios-profesionales/${id}`),

  /**
   * Validar configuración de horarios de un profesional
   * @param {number} profesionalId
   * @returns {Promise<Object>}
   */
  validarConfiguracion: (profesionalId) => apiClient.get(`/horarios-profesionales/validar/${profesionalId}`),
};

// ==================== CLIENTES ====================

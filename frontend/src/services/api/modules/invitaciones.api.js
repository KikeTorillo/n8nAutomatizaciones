import apiClient from '../client';
/**
 * API de Invitaciones
 */
export const invitacionesApi = {
  /**
   * Validar token de invitación (público)
   * @param {string} token - Token de 64 caracteres
   * @returns {Promise<Object>} { valido, invitacion: { email, nombre_sugerido, organizacion_nombre, ... } }
   */
  validar: (token) => apiClient.get(`/invitaciones/validar/${token}`),

  /**
   * Aceptar invitación y crear usuario (público)
   * @param {string} token - Token de invitación
   * @param {Object} data - { nombre, apellidos?, password }
   * @returns {Promise<Object>} { usuario, profesional }
   */
  aceptar: (token, data) => apiClient.post(`/invitaciones/aceptar/${token}`, data),

  /**
   * Crear y enviar invitación (requiere auth)
   * @param {Object} data - { profesional_id, email, nombre_sugerido? }
   * @returns {Promise<Object>} { invitacion: { id, email, estado, expira_en } }
   */
  crear: (data) => apiClient.post('/invitaciones', data),

  /**
   * Listar invitaciones de la organización
   * @param {Object} params - { estado? }
   * @returns {Promise<Object>} { invitaciones: [...] }
   */
  listar: (params) => apiClient.get('/invitaciones', { params }),

  /**
   * Obtener invitación de un profesional
   * @param {number} profesionalId - ID del profesional
   * @returns {Promise<Object>} { invitacion }
   */
  obtenerPorProfesional: (profesionalId) => apiClient.get(`/invitaciones/profesional/${profesionalId}`),

  /**
   * Reenviar invitación
   * @param {number} id - ID de la invitación
   * @returns {Promise<Object>} { invitacion }
   */
  reenviar: (id) => apiClient.post(`/invitaciones/${id}/reenviar`),

  /**
   * Cancelar invitación
   * @param {number} id - ID de la invitación
   * @returns {Promise<Object>}
   */
  cancelar: (id) => apiClient.delete(`/invitaciones/${id}`),
};

// ==================== EVENTOS DIGITALES (Dic 2025) ====================

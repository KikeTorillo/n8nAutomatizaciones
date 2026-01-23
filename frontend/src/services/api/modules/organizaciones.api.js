import apiClient from '../client';
/**
 * API de Organizaciones
 */
export const organizacionesApi = {
  /**
   * Registro de organización (Onboarding público - Sin autenticación)
   * @param {Object} data - { organizacion, admin, aplicar_plantilla_servicios }
   * @returns {Promise<Object>} { organizacion, admin: { id, nombre, apellidos, email, rol, token }, servicios_creados }
   */
  register: (data) => apiClient.post('/organizaciones/register', data),

  /**
   * Crear organización (solo super_admin - Requiere autenticación)
   * @param {Object} data - Datos de la organización
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/organizaciones', data),

  /**
   * Obtener organización por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/organizaciones/${id}`),

  /**
   * Actualizar organización
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/organizaciones/${id}`, data),

  /**
   * Obtener estadísticas de la organización
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerEstadisticas: (id) => apiClient.get(`/organizaciones/${id}/estadisticas`),

  /**
   * Obtener progreso del setup inicial
   * @param {number} id
   * @returns {Promise<Object>} { completed, profesionales, horarios_configurados, servicios, asignaciones, progress }
   */
  getSetupProgress: (id) => apiClient.get(`/organizaciones/${id}/setup-progress`),

  /**
   * Obtener estado de suscripción de la organización
   * @param {number} id
   * @returns {Promise<Object>} { plan_actual, es_trial, dias_restantes_trial, fecha_fin_trial, trial_expirado }
   */
  getEstadoSuscripcion: (id) => apiClient.get(`/organizaciones/${id}/estado-suscripcion`),
};

// ==================== USUARIOS ====================

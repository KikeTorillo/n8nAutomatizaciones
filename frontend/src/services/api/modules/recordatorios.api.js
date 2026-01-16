import apiClient from '../client';
/**
 * API de Recordatorios
 */
export const recordatoriosApi = {
  // ========== Configuración ==========

  /**
   * Obtener configuración de recordatorios de la organización
   * @returns {Promise<Object>} { habilitado, recordatorio_1_horas, plantilla_mensaje, ... }
   */
  obtenerConfiguracion: () => apiClient.get('/recordatorios/configuracion'),

  /**
   * Actualizar configuración de recordatorios
   * @param {Object} data - Campos a actualizar
   * @returns {Promise<Object>} Configuración actualizada
   */
  actualizarConfiguracion: (data) => apiClient.put('/recordatorios/configuracion', data),

  // ========== Estadísticas ==========

  /**
   * Obtener estadísticas de recordatorios
   * @param {Object} params - { fecha_desde?, fecha_hasta? }
   * @returns {Promise<Object>} { total, enviados, confirmados, tasa_confirmacion, ... }
   */
  obtenerEstadisticas: (params) => apiClient.get('/recordatorios/estadisticas', { params }),

  // ========== Historial ==========

  /**
   * Obtener historial de recordatorios de una cita
   * @param {number} citaId - ID de la cita
   * @returns {Promise<Object>} { recordatorios: [...] }
   */
  obtenerHistorial: (citaId) => apiClient.get('/recordatorios/historial', { params: { cita_id: citaId } }),

  // ========== Testing ==========

  /**
   * Enviar mensaje de prueba
   * @param {Object} data - { telefono, mensaje? }
   * @returns {Promise<Object>} { enviado: boolean, plataforma, mensaje_id }
   */
  enviarPrueba: (data) => apiClient.post('/recordatorios/test', data),
};

// ==================== STORAGE (Dic 2025 - MinIO) ====================

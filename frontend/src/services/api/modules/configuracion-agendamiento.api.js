import apiClient from '../client';
/**
 * API de Configuración de Agendamiento
 */
export const configuracionAgendamientoApi = {
  /**
   * Obtener configuración de agendamiento de la organización
   * @returns {Promise<Object>} { round_robin_habilitado, verificar_disponibilidad }
   */
  obtener: () => apiClient.get('/agendamiento/configuracion'),

  /**
   * Actualizar configuración de agendamiento
   * @param {Object} data - { round_robin_habilitado?, verificar_disponibilidad? }
   * @returns {Promise<Object>} Configuración actualizada
   */
  actualizar: (data) => apiClient.put('/agendamiento/configuracion', data),

  /**
   * Toggle rápido para round-robin
   * @returns {Promise<Object>} { round_robin_habilitado, estado_anterior }
   */
  toggleRoundRobin: () => apiClient.post('/agendamiento/configuracion/round-robin/toggle'),
};

// ==================== PLANES ====================

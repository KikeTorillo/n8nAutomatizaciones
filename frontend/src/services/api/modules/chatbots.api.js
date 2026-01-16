import apiClient from '../client';
/**
 * API de Chatbots
 */
export const chatbotsApi = {
  /**
   * Configurar chatbot de Telegram
   * @param {Object} data - { nombre, plataforma, config_plataforma, ai_model, ai_temperature, system_prompt }
   * @returns {Promise<Object>} { chatbot, workflow, credential }
   */
  configurarTelegram: (data) => apiClient.post('/chatbots/configurar', data),

  /**
   * Configurar chatbot de WhatsApp Business Cloud API
   * @param {Object} data - { nombre, plataforma, config_plataforma, ai_model, ai_temperature }
   * @returns {Promise<Object>} { chatbot, workflow, credential }
   */
  configurarWhatsApp: (data) => apiClient.post('/chatbots/configurar', data),

  /**
   * Listar chatbots configurados
   * @param {Object} params - { plataforma, activo }
   * @returns {Promise<Object>} { chatbots, total }
   */
  listar: (params = {}) => apiClient.get('/chatbots', { params }),

  /**
   * Obtener chatbot por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/chatbots/${id}`),

  /**
   * Actualizar chatbot
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/chatbots/${id}`, data),

  /**
   * Eliminar chatbot
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/chatbots/${id}`),

  /**
   * Activar/Desactivar chatbot
   * @param {number} id
   * @param {boolean} activo
   * @returns {Promise<Object>}
   */
  cambiarEstado: (id, activo) => apiClient.patch(`/chatbots/${id}/estado`, { activo }),

  /**
   * Obtener estadísticas del chatbot
   * @param {number} id
   * @param {Object} params - { fecha_inicio, fecha_fin }
   * @returns {Promise<Object>}
   */
  obtenerEstadisticas: (id, params = {}) => apiClient.get(`/chatbots/${id}/estadisticas`, { params }),
};

// Exportar todo como default también
// ==================== SUBSCRIPCIONES ====================

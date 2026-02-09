import apiClient from '../client';

// ========== TYPES ==========

export interface ChatbotConfigData {
  nombre: string;
  plataforma: 'telegram' | 'whatsapp';
  config_plataforma: Record<string, unknown>;
  ai_model?: string;
  ai_temperature?: number;
  system_prompt?: string;
}

export interface ChatbotUpdateData {
  nombre?: string;
  config_plataforma?: Record<string, unknown>;
  ai_model?: string;
  ai_temperature?: number;
  system_prompt?: string;
}

export interface ChatbotListParams {
  plataforma?: 'telegram' | 'whatsapp';
  activo?: boolean;
}

export interface ChatbotEstadisticasParams {
  fecha_inicio?: string;
  fecha_fin?: string;
}

// ========== API ==========

/**
 * API de Chatbots
 */
export const chatbotsApi = {
  /** Configurar chatbot de Telegram */
  configurarTelegram: (data: ChatbotConfigData) =>
    apiClient.post('/chatbots/configurar', data),

  /** Configurar chatbot de WhatsApp Business Cloud API */
  configurarWhatsApp: (data: ChatbotConfigData) =>
    apiClient.post('/chatbots/configurar', data),

  /** Listar chatbots configurados */
  listar: (params: ChatbotListParams = {}) =>
    apiClient.get('/chatbots', { params }),

  /** Obtener chatbot por ID */
  obtener: (id: number) =>
    apiClient.get(`/chatbots/${id}`),

  /** Actualizar chatbot */
  actualizar: (id: number, data: ChatbotUpdateData) =>
    apiClient.put(`/chatbots/${id}`, data),

  /** Eliminar chatbot */
  eliminar: (id: number) =>
    apiClient.delete(`/chatbots/${id}`),

  /** Activar/Desactivar chatbot */
  cambiarEstado: (id: number, activo: boolean) =>
    apiClient.patch(`/chatbots/${id}/estado`, { activo }),

  /** Obtener estadísticas del chatbot */
  obtenerEstadisticas: (id: number, params: ChatbotEstadisticasParams = {}) =>
    apiClient.get(`/chatbots/${id}/estadisticas`, { params }),
};

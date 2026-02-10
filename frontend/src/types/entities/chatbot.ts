/**
 * Entity Types — Chatbot
 */

export type PlataformaChatbot = 'telegram' | 'whatsapp';

export interface Chatbot {
  id: number;
  organizacion_id: number;
  nombre: string;
  plataforma: PlataformaChatbot;
  config_plataforma: Record<string, unknown>;
  ai_model?: string;
  ai_temperature?: number;
  system_prompt?: string;
  activo: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ChatbotConfigData {
  nombre: string;
  plataforma: PlataformaChatbot;
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
  plataforma?: PlataformaChatbot;
  activo?: boolean;
}

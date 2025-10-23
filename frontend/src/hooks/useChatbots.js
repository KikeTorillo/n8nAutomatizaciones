import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatbotsApi } from '@/services/api/endpoints';

/**
 * Hook para listar chatbots configurados
 */
export function useChatbots(params = {}) {
  return useQuery({
    queryKey: ['chatbots', params],
    queryFn: async () => {
      const response = await chatbotsApi.listar(params);
      return {
        chatbots: response.data.data,
        total: response.data.total,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obtener chatbot por ID
 */
export function useChatbot(id) {
  return useQuery({
    queryKey: ['chatbot', id],
    queryFn: async () => {
      const response = await chatbotsApi.obtener(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para configurar chatbot de Telegram
 */
export function useConfigurarTelegram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      // Construir payload según schema del backend
      const payload = {
        nombre: data.nombre,
        plataforma: 'telegram',
        config_plataforma: {
          bot_token: data.bot_token,
        },
        ai_model: data.configuracion?.ai_model || 'deepseek-chat',
        ai_temperature: data.configuracion?.ai_temperature || 0.7,
        // NO enviar system_prompt - el backend lo generará automáticamente
        // data.descripcion es solo una descripción corta del bot, no el system prompt
      };

      const response = await chatbotsApi.configurarTelegram(payload);
      return response.data;
    },
    onSuccess: () => {
      // Invalidar lista de chatbots
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
    },
  });
}

/**
 * Hook para actualizar chatbot
 */
export function useActualizarChatbot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await chatbotsApi.actualizar(id, data);
      return response.data.data;
    },
    onSuccess: (data) => {
      // Invalidar cache del chatbot específico y la lista
      queryClient.invalidateQueries({ queryKey: ['chatbot', data.id] });
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
    },
  });
}

/**
 * Hook para eliminar chatbot
 */
export function useEliminarChatbot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await chatbotsApi.eliminar(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
    },
  });
}

/**
 * Hook para cambiar estado del chatbot (activo/inactivo)
 */
export function useCambiarEstadoChatbot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, activo }) => {
      const response = await chatbotsApi.cambiarEstado(id, activo);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chatbot', data.id] });
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
    },
  });
}

/**
 * Hook para obtener estadísticas del chatbot
 */
export function useEstadisticasChatbot(id, params = {}) {
  return useQuery({
    queryKey: ['chatbot-estadisticas', id, params],
    queryFn: async () => {
      const response = await chatbotsApi.obtenerEstadisticas(id, params);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60, // 1 minuto
  });
}

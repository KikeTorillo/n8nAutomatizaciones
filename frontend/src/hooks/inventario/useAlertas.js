import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';
import { sanitizeParams } from '@/lib/params';
import { STALE_TIMES } from '@/app/queryClient';

/**
 * Hook para listar alertas con filtros
 * @param {Object} params - { tipo_alerta?, nivel?, leida?, producto_id?, fecha_desde?, fecha_hasta?, limit?, offset? }
 */
export function useAlertas(params = {}) {
  return useQuery({
    queryKey: ['alertas', params],
    queryFn: async () => {
      const response = await inventarioApi.listarAlertas(sanitizeParams(params));
      return response.data.data || { alertas: [], total: 0 };
    },
    staleTime: STALE_TIMES.FREQUENT, // 1 minuto (alertas requieren actualización frecuente)
  });
}

/**
 * Hook para obtener dashboard de alertas
 */
export function useDashboardAlertas() {
  return useQuery({
    queryKey: ['dashboard-alertas'],
    queryFn: async () => {
      const response = await inventarioApi.obtenerDashboardAlertas();
      return response.data.data || { resumen: {}, alertas_recientes: [] };
    },
    staleTime: STALE_TIMES.FREQUENT, // 1 minuto
  });
}

/**
 * Hook para obtener alerta por ID
 */
export function useAlerta(id) {
  return useQuery({
    queryKey: ['alerta', id],
    queryFn: async () => {
      const response = await inventarioApi.obtenerAlerta(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para marcar alerta como leída
 */
export function useMarcarAlertaLeida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await inventarioApi.marcarAlertaLeida(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-alertas'] });
    },
  });
}

/**
 * Hook para marcar múltiples alertas como leídas
 */
export function useMarcarVariasAlertasLeidas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alerta_ids) => {
      const response = await inventarioApi.marcarVariasAlertasLeidas({ alerta_ids });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-alertas'] });
    },
  });
}

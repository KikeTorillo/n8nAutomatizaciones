/**
 * ====================================================================
 * HOOKS ALERTAS DE INVENTARIO
 * ====================================================================
 *
 * Optimizado Ene 2026:
 * - exact:true en invalidaciones específicas
 * - keepPreviousData en listados
 * - Optimistic update en marcar leída
 * ====================================================================
 */

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
    staleTime: STALE_TIMES.FREQUENT,
    keepPreviousData: true,
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
    staleTime: STALE_TIMES.FREQUENT,
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
 * Incluye optimistic update para feedback instantáneo
 */
export function useMarcarAlertaLeida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await inventarioApi.marcarAlertaLeida(id);
      return response.data.data;
    },
    onMutate: async (alertaId) => {
      // Cancelar queries en vuelo
      await queryClient.cancelQueries({ queryKey: ['alertas'] });
      await queryClient.cancelQueries({ queryKey: ['dashboard-alertas'], exact: true });

      // Snapshot del estado anterior
      const previousAlertas = queryClient.getQueriesData({ queryKey: ['alertas'] });
      const previousDashboard = queryClient.getQueryData(['dashboard-alertas']);

      // Optimistic update: marcar como leída en cache
      queryClient.setQueriesData({ queryKey: ['alertas'] }, (old) => {
        if (!old?.alertas) return old;
        return {
          ...old,
          alertas: old.alertas.map((a) =>
            a.id === alertaId ? { ...a, leida: true, fecha_leida: new Date().toISOString() } : a
          ),
        };
      });

      // Optimistic update en dashboard
      if (previousDashboard) {
        queryClient.setQueryData(['dashboard-alertas'], (old) => {
          if (!old) return old;
          return {
            ...old,
            resumen: {
              ...old.resumen,
              no_leidas: Math.max(0, (old.resumen?.no_leidas || 0) - 1),
            },
            alertas_recientes: old.alertas_recientes?.map((a) =>
              a.id === alertaId ? { ...a, leida: true } : a
            ),
          };
        });
      }

      return { previousAlertas, previousDashboard };
    },
    onError: (err, alertaId, context) => {
      // Rollback en caso de error
      if (context?.previousAlertas) {
        context.previousAlertas.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousDashboard) {
        queryClient.setQueryData(['dashboard-alertas'], context.previousDashboard);
      }
    },
    onSettled: () => {
      // Refetch para asegurar consistencia
      queryClient.invalidateQueries({ queryKey: ['alertas'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['dashboard-alertas'], exact: true, refetchType: 'active' });
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
    onMutate: async (alertaIds) => {
      await queryClient.cancelQueries({ queryKey: ['alertas'] });

      const previousAlertas = queryClient.getQueriesData({ queryKey: ['alertas'] });

      // Optimistic update
      queryClient.setQueriesData({ queryKey: ['alertas'] }, (old) => {
        if (!old?.alertas) return old;
        return {
          ...old,
          alertas: old.alertas.map((a) =>
            alertaIds.includes(a.id) ? { ...a, leida: true, fecha_leida: new Date().toISOString() } : a
          ),
        };
      });

      return { previousAlertas };
    },
    onError: (err, alertaIds, context) => {
      if (context?.previousAlertas) {
        context.previousAlertas.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['dashboard-alertas'], exact: true, refetchType: 'active' });
    },
  });
}

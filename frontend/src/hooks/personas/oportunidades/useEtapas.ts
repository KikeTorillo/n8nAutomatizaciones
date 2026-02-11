/**
 * Hooks para Etapas del Pipeline de Oportunidades
 * Extraído de useOportunidades.ts — Feb 2026
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { oportunidadesApi } from '@/services/api/endpoints';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';
import type {
  EtapaData,
  ActualizarEtapaParams,
} from './oportunidadesConstants';

// ====================================================================
// QUERIES
// ====================================================================

export function useEtapasPipeline(incluirInactivas: boolean = false) {
  return useQuery({
    queryKey: queryKeys.personas.oportunidades.etapasPipeline(incluirInactivas),
    queryFn: async () => {
      const response = await oportunidadesApi.listarEtapas({
        incluirInactivas,
      });
      return (response as any).data.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

export function useEstadisticasPipeline(vendedorId: number | null = null) {
  return useQuery({
    queryKey: queryKeys.personas.oportunidades.estadisticas(vendedorId),
    queryFn: async () => {
      const response = await oportunidadesApi.obtenerEstadisticas({
        vendedor_id: vendedorId,
      });
      return (response as any).data.data;
    },
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

// ====================================================================
// MUTATIONS
// ====================================================================

export function useCrearEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EtapaData) => {
      const response = await oportunidadesApi.crearEtapa(data as any);
      return (response as any).data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.oportunidades.etapasPipeline(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.oportunidades.pipeline(null),
        refetchType: 'active',
      });
    },
    onError: createCRUDErrorHandler('create', 'Etapa'),
  });
}

export function useActualizarEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ etapaId, data }: ActualizarEtapaParams) => {
      const response = await oportunidadesApi.actualizarEtapa(
        etapaId,
        data as any
      );
      return (response as any).data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.oportunidades.etapasPipeline(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.oportunidades.pipeline(null),
        refetchType: 'active',
      });
    },
    onError: createCRUDErrorHandler('update', 'Etapa'),
  });
}

export function useEliminarEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (etapaId: number) => {
      await oportunidadesApi.eliminarEtapa(etapaId);
      return etapaId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.oportunidades.etapasPipeline(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.oportunidades.pipeline(null),
        refetchType: 'active',
      });
    },
    onError: createCRUDErrorHandler('delete', 'Etapa'),
  });
}

export function useReordenarEtapas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ordenIds: number[]) => {
      const response = await oportunidadesApi.reordenarEtapas({
        orden: ordenIds,
      });
      return (response as any).data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.oportunidades.etapasPipeline(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.oportunidades.pipeline(null),
        refetchType: 'active',
      });
    },
    onError: createCRUDErrorHandler('update', 'Etapas'),
  });
}

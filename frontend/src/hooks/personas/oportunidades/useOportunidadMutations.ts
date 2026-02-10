/**
 * Hooks de mutations para Oportunidades
 * Extraído de useOportunidades.ts — Feb 2026
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { oportunidadesApi } from '@/services/api/endpoints';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';
import type {
  OportunidadData,
  ActualizarOportunidadParams,
  MoverOportunidadParams,
  MarcarPerdidaParams,
} from './oportunidadesConstants';

export function useCrearOportunidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: OportunidadData) => {
      const response = await oportunidadesApi.crear(data as any);
      return (response as any).data.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.oportunidades.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pipeline'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pipeline-estadisticas'], refetchType: 'active' });
      if (data.cliente_id) {
        queryClient.invalidateQueries({ queryKey: ['oportunidades-cliente', data.cliente_id], refetchType: 'active' });
        queryClient.invalidateQueries({ queryKey: ['oportunidades-cliente-estadisticas', data.cliente_id], refetchType: 'active' });
      }
    },
    onError: createCRUDErrorHandler('create', 'Oportunidad'),
  });
}

export function useActualizarOportunidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ oportunidadId, data }: ActualizarOportunidadParams) => {
      const response = await oportunidadesApi.actualizar(oportunidadId, data as any);
      return (response as any).data.data;
    },
    onSuccess: (_data: unknown, variables: ActualizarOportunidadParams) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.oportunidades.detail(variables.oportunidadId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.oportunidades.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pipeline'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pipeline-estadisticas'], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Oportunidad'),
  });
}

export function useEliminarOportunidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (oportunidadId: number) => {
      await oportunidadesApi.eliminar(oportunidadId);
      return oportunidadId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.oportunidades.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pipeline'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pipeline-estadisticas'], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('delete', 'Oportunidad'),
  });
}

export function useMoverOportunidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ oportunidadId, etapaId }: MoverOportunidadParams) => {
      const response = await oportunidadesApi.mover(oportunidadId, { etapa_id: etapaId });
      return (response as any).data.data;
    },
    onMutate: async (_variables: MoverOportunidadParams) => {
      await queryClient.cancelQueries({ queryKey: ['pipeline'] });
      const previousPipeline = queryClient.getQueryData(['pipeline']);
      return { previousPipeline };
    },
    onError: (error: Error, _variables: MoverOportunidadParams, context) => {
      if (context?.previousPipeline) {
        queryClient.setQueryData(['pipeline'], context.previousPipeline);
      }
      createCRUDErrorHandler('update', 'Oportunidad')(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pipeline-estadisticas'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.oportunidades.all, refetchType: 'active' });
    },
  });
}

export function useMarcarGanada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (oportunidadId: number) => {
      const response = await oportunidadesApi.marcarGanada(oportunidadId);
      return (response as any).data.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.oportunidades.detail(data.id), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.oportunidades.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pipeline'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pipeline-estadisticas'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pronostico-ventas'], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Oportunidad'),
  });
}

export function useMarcarPerdida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ oportunidadId, motivoPerdida }: MarcarPerdidaParams) => {
      const response = await oportunidadesApi.marcarPerdida(oportunidadId, { motivo_perdida: motivoPerdida });
      return (response as any).data.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.oportunidades.detail(data.id), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.oportunidades.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pipeline'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pipeline-estadisticas'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pronostico-ventas'], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Oportunidad'),
  });
}

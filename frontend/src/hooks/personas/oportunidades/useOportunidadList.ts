/**
 * Hooks de queries para Oportunidades
 * Extraído de useOportunidades.ts — Feb 2026
 */

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { oportunidadesApi } from '@/services/api/endpoints';
import { queryKeys } from '@/hooks/config';
import type { OportunidadesListParams } from './oportunidadesConstants';

export function useOportunidades(params: OportunidadesListParams = {}) {
  return useQuery({
    queryKey: queryKeys.personas.oportunidades.list(params),
    queryFn: async () => {
      const response = await oportunidadesApi.listar(params);
      return {
        oportunidades: (response as any).data.data,
        paginacion: (response as any).data.pagination,
      };
    },
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

export function useOportunidadesCliente(clienteId: number | null | undefined, params: OportunidadesListParams = {}) {
  return useQuery({
    queryKey: ['oportunidades-cliente', clienteId, params],
    queryFn: async () => {
      const response = await oportunidadesApi.listarPorCliente(clienteId!, params);
      return {
        oportunidades: (response as any).data.data,
        paginacion: (response as any).data.pagination,
      };
    },
    enabled: !!clienteId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

export function useOportunidad(oportunidadId: number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.personas.oportunidades.detail(oportunidadId!),
    queryFn: async () => {
      const response = await oportunidadesApi.obtenerPorId(oportunidadId!);
      return (response as any).data.data;
    },
    enabled: !!oportunidadId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

export function usePipeline(vendedorId: number | null = null) {
  return useQuery({
    queryKey: queryKeys.personas.oportunidades.pipeline(vendedorId),
    queryFn: async () => {
      const response = await oportunidadesApi.obtenerPipeline({ vendedor_id: vendedorId });
      return (response as any).data.data;
    },
    staleTime: STALE_TIMES.FREQUENT,
  });
}

export function usePronosticoVentas(fechaInicio: string, fechaFin: string) {
  return useQuery({
    queryKey: ['pronostico-ventas', fechaInicio, fechaFin],
    queryFn: async () => {
      const response = await oportunidadesApi.obtenerPronostico({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });
      return (response as any).data.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

export function useEstadisticasOportunidadesCliente(clienteId: number | null | undefined) {
  return useQuery({
    queryKey: ['oportunidades-cliente-estadisticas', clienteId],
    queryFn: async () => {
      const response = await oportunidadesApi.obtenerEstadisticasCliente(clienteId!);
      return (response as any).data.data;
    },
    enabled: !!clienteId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

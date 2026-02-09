/**
 * Queries: Batch Picking (Wave Picking)
 * React Query hooks de lectura para batch picking
 */

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { batchPickingApi } from '@/services/api/endpoints';
import useSucursalStore, { selectGetSucursalId } from '@/store/sucursalStore';
import { BATCH_PICKING_KEYS } from './constants';

/**
 * Hook para listar batches con filtros
 * @param {Object} params - { sucursal_id?, estado?, estados?, asignado_a?, limit? }
 */
export function useBatchPickings(params = {}) {
  const getSucursalId = useSucursalStore(selectGetSucursalId);

  return useQuery({
    queryKey: BATCH_PICKING_KEYS.list(params),
    queryFn: async () => {
      const sanitizedParams = {
        ...params,
        sucursal_id: params.sucursal_id || getSucursalId() || undefined,
      };

      // Limpiar valores vacíos
      Object.keys(sanitizedParams).forEach(key => {
        if (sanitizedParams[key] === '' || sanitizedParams[key] === null || sanitizedParams[key] === undefined) {
          delete sanitizedParams[key];
        }
      });

      const response = await batchPickingApi.listar(sanitizedParams);
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
  });
}

/**
 * Hook para obtener batch por ID con operaciones
 * @param {number} id - ID del batch
 */
export function useBatchPicking(id) {
  return useQuery({
    queryKey: BATCH_PICKING_KEYS.detail(id),
    queryFn: async () => {
      const response = await batchPickingApi.obtenerPorId(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener lista consolidada de productos a recoger
 * @param {number} id - ID del batch
 */
export function useListaConsolidada(id) {
  return useQuery({
    queryKey: BATCH_PICKING_KEYS.listaConsolidada(id),
    queryFn: async () => {
      const response = await batchPickingApi.obtenerListaConsolidada(id);
      return response.data.data || [];
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener estadísticas del batch
 * @param {number} id - ID del batch
 */
export function useEstadisticasBatch(id) {
  return useQuery({
    queryKey: BATCH_PICKING_KEYS.estadisticas(id),
    queryFn: async () => {
      const response = await batchPickingApi.obtenerEstadisticas(id);
      return response.data.data || {};
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener batches pendientes de una sucursal
 * @param {number} sucursalId - ID de la sucursal
 */
export function useBatchesPendientes(sucursalId) {
  const getSucursalId = useSucursalStore(selectGetSucursalId);
  const efectiveSucursalId = sucursalId || getSucursalId();

  return useQuery({
    queryKey: BATCH_PICKING_KEYS.pendientes(efectiveSucursalId),
    queryFn: async () => {
      const response = await batchPickingApi.obtenerPendientes(efectiveSucursalId);
      return response.data.data || [];
    },
    enabled: !!efectiveSucursalId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener operaciones de picking disponibles para batch
 * @param {number} sucursalId - ID de la sucursal
 */
export function useOperacionesDisponiblesParaBatch(sucursalId) {
  const getSucursalId = useSucursalStore(selectGetSucursalId);
  const efectiveSucursalId = sucursalId || getSucursalId();

  return useQuery({
    queryKey: BATCH_PICKING_KEYS.operacionesDisponibles(efectiveSucursalId),
    queryFn: async () => {
      const response = await batchPickingApi.obtenerOperacionesDisponibles(efectiveSucursalId);
      return response.data.data || [];
    },
    enabled: !!efectiveSucursalId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

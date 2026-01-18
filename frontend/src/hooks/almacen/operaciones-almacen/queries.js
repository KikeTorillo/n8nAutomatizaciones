/**
 * ====================================================================
 * QUERIES: Operaciones de Almacén
 * ====================================================================
 * React Query hooks de lectura
 * Ene 2026 - Fragmentación de hooks
 */

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { operacionesAlmacenApi } from '@/services/api/endpoints';
import { useSucursalContext } from '@/hooks/factories';
import { OPERACIONES_ALMACEN_KEYS } from './constants';

/**
 * Hook para listar operaciones con filtros
 */
export function useOperacionesAlmacen(params = {}) {
  const sucursalId = useSucursalContext(params.sucursal_id);

  return useQuery({
    queryKey: OPERACIONES_ALMACEN_KEYS.list(params),
    queryFn: async () => {
      const sanitizedParams = {
        ...params,
        sucursal_id: sucursalId || undefined,
      };

      Object.keys(sanitizedParams).forEach(key => {
        if (sanitizedParams[key] === '' || sanitizedParams[key] === null || sanitizedParams[key] === undefined) {
          delete sanitizedParams[key];
        }
      });

      const response = await operacionesAlmacenApi.listar(sanitizedParams);
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener operacion por ID con items
 */
export function useOperacionAlmacen(id) {
  return useQuery({
    queryKey: OPERACIONES_ALMACEN_KEYS.detail(id),
    queryFn: async () => {
      const response = await operacionesAlmacenApi.obtenerPorId(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener cadena completa de operaciones
 */
export function useCadenaOperaciones(id) {
  return useQuery({
    queryKey: OPERACIONES_ALMACEN_KEYS.cadena(id),
    queryFn: async () => {
      const response = await operacionesAlmacenApi.obtenerCadena(id);
      return response.data.data || [];
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener operaciones pendientes por sucursal
 */
export function useOperacionesPendientes(sucursalId) {
  const efectiveSucursalId = useSucursalContext(sucursalId);

  return useQuery({
    queryKey: OPERACIONES_ALMACEN_KEYS.pendientes(efectiveSucursalId),
    queryFn: async () => {
      const response = await operacionesAlmacenApi.obtenerPendientes(efectiveSucursalId);
      return response.data.data || { por_tipo: [], total: 0 };
    },
    enabled: !!efectiveSucursalId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener estadísticas de operaciones
 */
export function useEstadisticasOperaciones(sucursalId) {
  const efectiveSucursalId = useSucursalContext(sucursalId);

  return useQuery({
    queryKey: OPERACIONES_ALMACEN_KEYS.estadisticas(efectiveSucursalId),
    queryFn: async () => {
      const response = await operacionesAlmacenApi.obtenerEstadisticas(efectiveSucursalId);
      return response.data.data || {};
    },
    enabled: !!efectiveSucursalId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para obtener resumen Kanban de operaciones
 */
export function useOperacionesKanban(sucursalId) {
  const efectiveSucursalId = useSucursalContext(sucursalId);

  return useQuery({
    queryKey: OPERACIONES_ALMACEN_KEYS.kanban(efectiveSucursalId),
    queryFn: async () => {
      const response = await operacionesAlmacenApi.obtenerResumenKanban(efectiveSucursalId);
      return response.data.data || {};
    },
    enabled: !!efectiveSucursalId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

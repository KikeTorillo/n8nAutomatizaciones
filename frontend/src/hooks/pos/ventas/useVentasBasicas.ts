import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { posApi } from '@/services/api/endpoints';
import useSucursalStore, { selectGetSucursalId } from '@/store/sucursalStore';
import { sanitizeParams } from '@/lib/params';
import { queryKeys } from '@/hooks/config';
import type { ListarVentasParams, VentasResponse, VentaDetailResponse } from './types';

// ========== Query Hooks ==========

/**
 * Hook para listar ventas con filtros
 */
export function useVentas(params: ListarVentasParams = {}) {
  const getSucursalId = useSucursalStore(selectGetSucursalId);
  const sucursalId = getSucursalId();

  return useQuery({
    queryKey: [...queryKeys.pos.ventas.list(params), sucursalId],
    queryFn: async (): Promise<VentasResponse> => {
      // Fix 27-Dic-2025: Agregar sucursalId para permisos
      const queryParams = sanitizeParams({
        ...params,
        ...(sucursalId && { sucursalId })
      });

      const response = await posApi.listarVentas(queryParams);
      return response.data.data || { ventas: [], total: 0 };
    },
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
    enabled: !!sucursalId, // Solo ejecutar si hay sucursal
  });
}

/**
 * Hook para obtener venta por ID con items
 */
export function useVenta(ventaId: number | undefined | null) {
  return useQuery({
    queryKey: queryKeys.pos.ventas.detail(ventaId),
    queryFn: async (): Promise<VentaDetailResponse> => {
      const response = await posApi.obtenerVenta(ventaId!);
      return response.data.data || { venta: null, items: [] };
    },
    enabled: !!ventaId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

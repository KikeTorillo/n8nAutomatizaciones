import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { posApi } from '@/services/api/endpoints';
import useSucursalStore, { selectGetSucursalId } from '@/store/sucursalStore';
import { sanitizeParams } from '@/lib/params';
import { queryKeys } from '@/hooks/config';
import type { CorteCajaParams, CorteCajaResponse, VentasDiariasParams, VentasDiariasResponse } from './types';

// ==================== REPORTES POS ====================

/**
 * Hook para obtener corte de caja
 */
export function useCorteCaja(params: CorteCajaParams) {
  const getSucursalId = useSucursalStore(selectGetSucursalId);
  const sucursalId = getSucursalId();

  return useQuery({
    queryKey: [...queryKeys.pos.ventas.corteCaja(params), sucursalId],
    queryFn: async (): Promise<CorteCajaResponse> => {
      // Fix 27-Dic-2025: Agregar sucursalId para permisos
      const queryParams = sanitizeParams({
        ...params,
        ...(sucursalId && { sucursalId })
      });

      const response = await posApi.obtenerCorteCaja(queryParams);
      return response.data.data || { resumen: {}, totales_por_metodo: [], ventas_por_hora: [], top_productos: [] };
    },
    enabled: !!params.fecha_inicio && !!params.fecha_fin && !!sucursalId,
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para obtener ventas diarias
 */
export function useVentasDiarias(params: VentasDiariasParams) {
  return useQuery({
    queryKey: queryKeys.pos.ventas.diarias(params),
    queryFn: async (): Promise<VentasDiariasResponse> => {
      const response = await posApi.obtenerVentasDiarias(sanitizeParams(params));
      return response.data.data || { resumen: {}, ventas_por_hora: [], top_productos: [], detalle: [] };
    },
    enabled: !!params.fecha,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

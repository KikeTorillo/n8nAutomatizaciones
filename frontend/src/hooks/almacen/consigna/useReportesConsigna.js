/**
 * ====================================================================
 * HOOKS: Reportes de Consigna
 * ====================================================================
 * Queries para reportes de consignacion
 */

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { consignaApi } from '@/services/api/endpoints';
import { CONSIGNA_KEYS } from './consignaKeys';

// ==================== QUERIES ====================

/**
 * Hook para reporte de stock consigna
 * @param {Object} filtros - { proveedor_id? }
 */
export function useReporteStockConsigna(filtros = {}) {
  return useQuery({
    queryKey: CONSIGNA_KEYS.reporteStock(filtros),
    queryFn: async () => {
      const response = await consignaApi.reporteStock(filtros);
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para reporte de ventas consigna
 * @param {Object} filtros - { fecha_desde, fecha_hasta }
 */
export function useReporteVentasConsigna(filtros) {
  return useQuery({
    queryKey: CONSIGNA_KEYS.reporteVentas(filtros),
    queryFn: async () => {
      const response = await consignaApi.reporteVentas(filtros);
      return response.data.data || [];
    },
    enabled: !!(filtros?.fecha_desde && filtros?.fecha_hasta),
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para reporte pendiente de liquidar
 */
export function usePendienteLiquidar() {
  return useQuery({
    queryKey: CONSIGNA_KEYS.reportePendiente(),
    queryFn: async () => {
      const response = await consignaApi.reportePendiente();
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

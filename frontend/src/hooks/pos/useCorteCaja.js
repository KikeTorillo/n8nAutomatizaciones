import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { posApi } from '@/services/api/endpoints';
import { sanitizeParams } from '@/lib/params';

/**
 * Hook para obtener corte de caja por período
 * @param {Object} params - { fecha_inicio, fecha_fin, usuario_id? }
 */
export function useCorteCaja(params) {
  return useQuery({
    queryKey: ['corte-caja', params],
    queryFn: async () => {
      const response = await posApi.obtenerCorteCaja(sanitizeParams(params));
      return response.data.data || {
        resumen: {},
        totales_por_metodo: [],
        ventas_por_hora: [],
        top_productos: [],
      };
    },
    enabled: !!params.fecha_inicio && !!params.fecha_hasta,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener reporte de ventas diarias
 * @param {Object} params - { fecha, profesional_id?, usuario_id? }
 */
export function useVentasDiarias(params) {
  return useQuery({
    queryKey: ['ventas-diarias', params],
    queryFn: async () => {
      const response = await posApi.obtenerVentasDiarias(sanitizeParams(params));
      return response.data.data || {
        resumen: {},
        ventas_por_hora: [],
        top_productos: [],
        detalle: [],
      };
    },
    enabled: !!params.fecha,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

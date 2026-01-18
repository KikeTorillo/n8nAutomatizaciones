import { useQuery } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';
import { sanitizeParams } from '@/lib/params';
import { STALE_TIMES } from '@/app/queryClient';

/**
 * Hook para obtener valor total del inventario
 */
export function useValorInventario() {
  return useQuery({
    queryKey: ['valor-inventario'],
    queryFn: async () => {
      const response = await inventarioApi.obtenerValorInventario();
      return response.data.data || {
        total_productos: 0,
        total_unidades: 0,
        valor_compra: 0,
        valor_venta: 0,
        margen_potencial: 0,
      };
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para obtener análisis ABC de productos (clasificación Pareto)
 * @param {Object} params - { fecha_desde, fecha_hasta, categoria_id? }
 */
export function useAnalisisABC(params) {
  return useQuery({
    queryKey: ['analisis-abc', params],
    queryFn: async () => {
      const response = await inventarioApi.obtenerAnalisisABC(sanitizeParams(params));
      return response.data.data.productos_abc || [];
    },
    enabled: !!params.fecha_desde && !!params.fecha_hasta,
    staleTime: STALE_TIMES.STATIC_DATA, // 10 minutos (análisis costoso, cachear más tiempo)
  });
}

/**
 * Hook para obtener reporte de rotación de inventario
 * @param {Object} params - { fecha_desde, fecha_hasta, categoria_id?, top? }
 */
export function useRotacionInventario(params) {
  return useQuery({
    queryKey: ['rotacion-inventario', params],
    queryFn: async () => {
      const response = await inventarioApi.obtenerRotacionInventario(sanitizeParams(params));
      return response.data.data.productos_rotacion || [];
    },
    enabled: !!params.fecha_desde && !!params.fecha_hasta,
    staleTime: STALE_TIMES.STATIC_DATA,
  });
}

/**
 * Hook para obtener resumen de alertas agrupadas
 */
export function useResumenAlertas() {
  return useQuery({
    queryKey: ['resumen-alertas'],
    queryFn: async () => {
      const response = await inventarioApi.obtenerResumenAlertas();
      return response.data.data.resumen_alertas || {};
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

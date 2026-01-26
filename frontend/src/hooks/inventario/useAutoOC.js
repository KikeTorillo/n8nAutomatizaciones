import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi, ordenesCompraApi } from '@/services/api/endpoints';
import { STALE_TIMES } from '@/app/queryClient';

/**
 * Hook para obtener sugerencias de OC (productos con stock bajo)
 */
export function useSugerenciasOC() {
  return useQuery({
    queryKey: ['sugerencias-oc'],
    queryFn: async () => {
      const response = await inventarioApi.obtenerSugerenciasOC();
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para generar OC desde un producto con stock bajo
 */
export function useGenerarOCDesdeProducto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productoId) => {
      const response = await ordenesCompraApi.generarOCDesdeProducto(productoId);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sugerencias-oc'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['alertas'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'], refetchType: 'active' });
    },
  });
}

/**
 * Hook para generar OCs automáticas para todos los productos con stock bajo
 */
export function useAutoGenerarOCs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await ordenesCompraApi.autoGenerarOCs();
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sugerencias-oc'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['alertas'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'], refetchType: 'active' });
    },
  });
}

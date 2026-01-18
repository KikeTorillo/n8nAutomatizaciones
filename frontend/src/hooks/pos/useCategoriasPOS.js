import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { inventarioApi } from '@/services/api/endpoints';

/**
 * Hook para obtener categorías de productos para POS
 * Solo categorías activas con conteo de productos
 */
export function useCategoriasPOS() {
  return useQuery({
    queryKey: ['categorias-pos'],
    queryFn: async () => {
      const response = await inventarioApi.listarCategorias({
        solo_activas: true,
        incluir_conteo: true
      });
      return response.data.data?.categorias || [];
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para obtener productos para el grid visual del POS
 * @param {Object} params - { categoria_id?, limit? }
 */
export function useProductosPOS(params = {}) {
  return useQuery({
    queryKey: ['productos-pos', params],
    queryFn: async () => {
      const response = await inventarioApi.listarProductos({
        solo_activos: true,
        solo_con_stock: false,
        categoria_id: params.categoria_id || undefined,
        limit: params.limit || 50,
        orden: 'nombre',
        direccion: 'asc'
      });
      return response.data.data?.productos || [];
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
    refetchOnWindowFocus: false,
  });
}

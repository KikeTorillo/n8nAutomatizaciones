import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';
import { STALE_TIMES } from '@/app/queryClient';

/**
 * Hook para listar variantes de un producto
 */
export function useVariantes(productoId) {
  return useQuery({
    queryKey: ['variantes', productoId],
    queryFn: async () => {
      const response = await inventarioApi.listarVariantes(productoId);
      return response.data.data || [];
    },
    enabled: !!productoId,
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
  });
}

/**
 * Hook para obtener variante por ID
 */
export function useVariante(id) {
  return useQuery({
    queryKey: ['variante', id],
    queryFn: async () => {
      const response = await inventarioApi.obtenerVariante(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para buscar variante por SKU o codigo de barras
 */
export function useBuscarVariante(termino) {
  return useQuery({
    queryKey: ['buscar-variante', termino],
    queryFn: async () => {
      const response = await inventarioApi.buscarVariante(termino);
      return response.data.data;
    },
    enabled: !!termino && termino.length >= 2,
    staleTime: STALE_TIMES.REAL_TIME, // 30 segundos
  });
}

/**
 * Hook para obtener resumen de stock por variantes
 */
export function useResumenVariantes(productoId) {
  return useQuery({
    queryKey: ['variantes-resumen', productoId],
    queryFn: async () => {
      const response = await inventarioApi.obtenerResumenVariantes(productoId);
      return response.data.data;
    },
    enabled: !!productoId,
    staleTime: STALE_TIMES.FREQUENT, // 1 minuto
  });
}

/**
 * Hook para crear variante individual
 */
export function useCrearVariante() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productoId, data }) => {
      const response = await inventarioApi.crearVariante(productoId, data);
      return response.data.data;
    },
    onSuccess: (_, { productoId }) => {
      queryClient.invalidateQueries({ queryKey: ['variantes', productoId] });
      queryClient.invalidateQueries({ queryKey: ['variantes-resumen', productoId] });
      queryClient.invalidateQueries({ queryKey: ['producto', productoId] });
    },
  });
}

/**
 * Hook para generar variantes automaticamente
 */
export function useGenerarVariantes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productoId, atributos, opciones = {} }) => {
      const response = await inventarioApi.generarVariantes(productoId, { atributos, opciones });
      return response.data.data;
    },
    onSuccess: (_, { productoId }) => {
      queryClient.invalidateQueries({ queryKey: ['variantes', productoId] });
      queryClient.invalidateQueries({ queryKey: ['variantes-resumen', productoId] });
      queryClient.invalidateQueries({ queryKey: ['producto', productoId] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
  });
}

/**
 * Hook para actualizar variante
 */
export function useActualizarVariante() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await inventarioApi.actualizarVariante(id, data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['variante', data.id] });
      queryClient.invalidateQueries({ queryKey: ['variantes', data.producto_id] });
      queryClient.invalidateQueries({ queryKey: ['variantes-resumen', data.producto_id] });
    },
  });
}

/**
 * Hook para ajustar stock de variante
 */
export function useAjustarStockVariante() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, cantidad, tipo, motivo }) => {
      const response = await inventarioApi.ajustarStockVariante(id, { cantidad, tipo, motivo });
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['variantes'] });
      queryClient.invalidateQueries({ queryKey: ['variantes-resumen'] });
      queryClient.invalidateQueries({ queryKey: ['variante', data.variante_id] });
    },
  });
}

/**
 * Hook para eliminar variante
 */
export function useEliminarVariante() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await inventarioApi.eliminarVariante(id);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['variantes'] });
      queryClient.invalidateQueries({ queryKey: ['variantes-resumen'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
  });
}

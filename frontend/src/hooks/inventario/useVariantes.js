/**
 * ====================================================================
 * HOOKS: Variantes de Productos
 * ====================================================================
 * Ene 2026 - Refactorizado con query keys centralizadas
 *
 * Nota: Este hook no usa createCRUDHooks porque tiene una API diferente
 * (las variantes pertenecen a un producto, no son entidades independientes)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';
import { STALE_TIMES } from '@/app/queryClient';
import { queryKeys } from '@/hooks/config';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { createSearchHook } from '@/hooks/factories';

// ==================== HELPERS ====================

/**
 * Invalida queries relacionadas con variantes de un producto
 */
function invalidarVariantesProducto(queryClient, productoId) {
  queryClient.invalidateQueries({ queryKey: queryKeys.inventario.variantes.list(productoId), refetchType: 'active' });
  queryClient.invalidateQueries({ queryKey: ['variantes-resumen', productoId], refetchType: 'active' });
  queryClient.invalidateQueries({ queryKey: queryKeys.inventario.productos.detail(productoId), refetchType: 'active' });
}

// ==================== QUERIES ====================

/**
 * Hook para listar variantes de un producto
 */
export function useVariantes(productoId) {
  return useQuery({
    queryKey: queryKeys.inventario.variantes.list(productoId),
    queryFn: async () => {
      const response = await inventarioApi.listarVariantes(productoId);
      return response.data.data || [];
    },
    enabled: !!productoId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener variante por ID
 */
export function useVariante(id) {
  return useQuery({
    queryKey: queryKeys.inventario.variantes.detail(id),
    queryFn: async () => {
      const response = await inventarioApi.obtenerVariante(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para buscar variante por SKU o código de barras
 * Refactorizado con createSearchHook - Ene 2026
 */
export const useBuscarVariante = createSearchHook({
  key: 'variantes',
  searchFn: (params) => inventarioApi.buscarVariante(params.q),
  staleTime: STALE_TIMES.REAL_TIME,
});

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
    staleTime: STALE_TIMES.FREQUENT,
  });
}

// ==================== MUTATIONS ====================

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
      invalidarVariantesProducto(queryClient, productoId);
    },
    onError: createCRUDErrorHandler('create', 'Variante'),
  });
}

/**
 * Hook para generar variantes automáticamente
 */
export function useGenerarVariantes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productoId, atributos, opciones = {} }) => {
      const response = await inventarioApi.generarVariantes(productoId, { atributos, opciones });
      return response.data.data;
    },
    onSuccess: (_, { productoId }) => {
      invalidarVariantesProducto(queryClient, productoId);
      // También invalidar lista de productos por si cambia el conteo de variantes
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventario.productos.all,
        refetchType: 'active'
      });
    },
    onError: createCRUDErrorHandler('create', 'Variantes'),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.variantes.detail(data.id), refetchType: 'active' });
      if (data.producto_id) {
        invalidarVariantesProducto(queryClient, data.producto_id);
      }
    },
    onError: createCRUDErrorHandler('update', 'Variante'),
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
      // Invalidar variante específica
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.variantes.detail(data.variante_id), refetchType: 'active' });
      // Invalidar queries de variantes (refetch solo activas)
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventario.variantes.all,
        refetchType: 'active'
      });
      // Invalidar resumen de variantes
      queryClient.invalidateQueries({ queryKey: ['variantes-resumen'], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Stock variante'),
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
    onSuccess: () => {
      // Invalidar queries de variantes (refetch solo activas)
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventario.variantes.all,
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ queryKey: ['variantes-resumen'], refetchType: 'active' });
      // Invalidar lista de productos (puede cambiar estado de producto)
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventario.productos.all,
        refetchType: 'active'
      });
    },
    onError: createCRUDErrorHandler('delete', 'Variante'),
  });
}

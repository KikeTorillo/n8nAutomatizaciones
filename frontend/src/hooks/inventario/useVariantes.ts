/**
 * ====================================================================
 * HOOKS: Variantes de Productos
 * ====================================================================
 * Ene 2026 - Refactorizado con query keys centralizadas
 * Feb 2026 - Mutations extraídas a helper interno createVarianteMutation
 * Feb 2026 - Migrado a TypeScript
 *
 * Nota: Este hook no usa createCRUDHooks porque tiene una API diferente
 * (las variantes pertenecen a un producto, no son entidades independientes)
 */

import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';
import { STALE_TIMES } from '@/app/queryClient';
import { queryKeys } from '@/hooks/config';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { createSearchHook } from '@/hooks/factories';

// ==================== TIPOS ====================

interface CrearVarianteParams {
  productoId: number;
  data: Record<string, unknown>;
}

interface GenerarVariantesParams {
  productoId: number;
  atributos: Record<string, unknown>;
  opciones?: Record<string, unknown>;
}

interface ActualizarVarianteParams {
  id: number;
  data: Record<string, unknown>;
}

interface AjustarStockVarianteParams {
  id: number;
  cantidad: number;
  tipo: string;
  motivo: string;
}

// ==================== HELPERS ====================

/**
 * Invalida queries relacionadas con variantes de un producto
 */
function invalidarVariantesProducto(queryClient: QueryClient, productoId: number) {
  queryClient.invalidateQueries({ queryKey: queryKeys.inventario.variantes.list(productoId), refetchType: 'active' });
  queryClient.invalidateQueries({ queryKey: ['variantes-resumen', productoId], refetchType: 'active' });
  queryClient.invalidateQueries({ queryKey: queryKeys.inventario.productos.detail(productoId), refetchType: 'active' });
}

/**
 * Factory interna para mutations de variantes.
 * Reduce boilerplate de useQueryClient + useMutation + onError en cada mutation.
 */
type CRUDOp = 'create' | 'update' | 'delete' | 'fetch';

function createVarianteMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
  { errorOp = 'update', errorName = 'Variante', onSuccess }: {
    errorOp?: CRUDOp;
    errorName?: string;
    onSuccess?: (queryClient: QueryClient, data: any, variables: TVariables) => void;
  } = {}
) {
  return function useVarianteMutation() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn,
      onSuccess: (data, variables) => {
        if (onSuccess) {
          onSuccess(queryClient, data, variables);
        }
      },
      onError: createCRUDErrorHandler(errorOp, errorName),
    });
  };
}

// ==================== QUERIES ====================

/**
 * Hook para listar variantes de un producto
 */
export function useVariantes(productoId: number | undefined | null) {
  return useQuery({
    queryKey: queryKeys.inventario.variantes.list(productoId),
    queryFn: async () => {
      const response = await inventarioApi.listarVariantes(productoId!);
      return (response as any).data.data || [];
    },
    enabled: !!productoId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener variante por ID
 */
export function useVariante(id: number | undefined | null) {
  return useQuery({
    queryKey: queryKeys.inventario.variantes.detail(id),
    queryFn: async () => {
      const response = await inventarioApi.obtenerVariante(id!);
      return (response as any).data.data;
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
  searchFn: (params: { q: string }) => inventarioApi.buscarVariante(params.q),
  staleTime: STALE_TIMES.REAL_TIME,
});

/**
 * Hook para obtener resumen de stock por variantes
 */
export function useResumenVariantes(productoId: number | undefined | null) {
  return useQuery({
    queryKey: ['variantes-resumen', productoId],
    queryFn: async () => {
      const response = await inventarioApi.obtenerResumenVariantes(productoId!);
      return (response as any).data.data;
    },
    enabled: !!productoId,
    staleTime: STALE_TIMES.FREQUENT,
  });
}

// ==================== MUTATIONS (via factory helper) ====================

/** Hook para crear variante individual */
export const useCrearVariante = createVarianteMutation<CrearVarianteParams>(
  async ({ productoId, data }) => {
    const response = await inventarioApi.crearVariante(productoId, data);
    return (response as any).data.data;
  },
  {
    errorOp: 'create',
    onSuccess: (queryClient, _, { productoId }) => {
      invalidarVariantesProducto(queryClient, productoId);
    },
  }
);

/** Hook para generar variantes automaticamente */
export const useGenerarVariantes = createVarianteMutation<GenerarVariantesParams>(
  async ({ productoId, atributos, opciones = {} }) => {
    const response = await inventarioApi.generarVariantes(productoId, { atributos, opciones });
    return (response as any).data.data;
  },
  {
    errorOp: 'create',
    errorName: 'Variantes',
    onSuccess: (queryClient, _, { productoId }) => {
      invalidarVariantesProducto(queryClient, productoId);
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.productos.all, refetchType: 'active' });
    },
  }
);

/** Hook para actualizar variante */
export const useActualizarVariante = createVarianteMutation<ActualizarVarianteParams>(
  async ({ id, data }) => {
    const response = await inventarioApi.actualizarVariante(id, data);
    return (response as any).data.data;
  },
  {
    onSuccess: (queryClient, data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.variantes.detail(data.id), refetchType: 'active' });
      if (data.producto_id) {
        invalidarVariantesProducto(queryClient, data.producto_id);
      }
    },
  }
);

/** Hook para ajustar stock de variante */
export const useAjustarStockVariante = createVarianteMutation<AjustarStockVarianteParams>(
  async ({ id, cantidad, tipo, motivo }) => {
    const response = await inventarioApi.ajustarStockVariante(id, { cantidad, tipo, motivo });
    return (response as any).data.data;
  },
  {
    errorName: 'Stock variante',
    onSuccess: (queryClient, data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.variantes.detail(data.variante_id), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.variantes.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['variantes-resumen'], refetchType: 'active' });
    },
  }
);

/** Hook para eliminar variante */
export const useEliminarVariante = createVarianteMutation<number>(
  async (id) => {
    const response = await inventarioApi.eliminarVariante(id);
    return (response as any).data.data;
  },
  {
    errorOp: 'delete',
    onSuccess: (queryClient) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.variantes.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['variantes-resumen'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.productos.all, refetchType: 'active' });
    },
  }
);

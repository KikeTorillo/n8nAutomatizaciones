import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';
import { STALE_TIMES } from '@/app/queryClient';
import { sanitizeParams } from '@/lib/params';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

/**
 * Hook para listar categorías con filtros
 * @param {Object} params - { activo?, categoria_padre_id?, busqueda? }
 */
export function useCategorias(params = {}) {
  return useQuery({
    queryKey: ['categorias', params],
    queryFn: async () => {
      const response = await inventarioApi.listarCategorias(sanitizeParams(params));
      return response.data.data || { categorias: [], total: 0 };
    },
    staleTime: STALE_TIMES.STATIC_DATA, // 10 minutos (categorías cambian poco)
  });
}

/**
 * Hook para obtener árbol jerárquico de categorías
 */
export function useArbolCategorias() {
  return useQuery({
    queryKey: ['categorias-arbol'],
    queryFn: async () => {
      const response = await inventarioApi.obtenerArbolCategorias();
      // Backend retorna data directamente como array, no data.arbol
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.STATIC_DATA, // 10 minutos
  });
}

/**
 * Hook para obtener categoría por ID
 */
export function useCategoria(id) {
  return useQuery({
    queryKey: ['categoria', id],
    queryFn: async () => {
      const response = await inventarioApi.obtenerCategoria(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.STATIC_DATA,
  });
}

/**
 * Hook para crear categoría
 */
export function useCrearCategoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = {
        ...data,
        descripcion: data.descripcion?.trim() || undefined,
        categoria_padre_id: data.categoria_padre_id || undefined,
        icono: data.icono?.trim() || undefined,
        color: data.color?.trim() || undefined,
      };

      const response = await inventarioApi.crearCategoria(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      queryClient.invalidateQueries({ queryKey: ['categorias-arbol'] });
    },
    onError: createCRUDErrorHandler('create', 'Categoría', {
      409: 'Ya existe una categoría con ese nombre',
    }),
  });
}

/**
 * Hook para actualizar categoría
 */
export function useActualizarCategoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const sanitized = {
        ...data,
        descripcion: data.descripcion?.trim() || undefined,
        categoria_padre_id: data.categoria_padre_id || undefined,
        icono: data.icono?.trim() || undefined,
        color: data.color?.trim() || undefined,
      };

      const response = await inventarioApi.actualizarCategoria(id, sanitized);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      queryClient.invalidateQueries({ queryKey: ['categorias-arbol'] });
      queryClient.invalidateQueries({ queryKey: ['categoria', variables.id] });
    },
    onError: createCRUDErrorHandler('update', 'Categoría', {
      409: 'Ya existe otra categoría con ese nombre',
      400: 'Datos inválidos o crearía un ciclo en la jerarquía',
    }),
  });
}

/**
 * Hook para eliminar categoría (soft delete)
 */
export function useEliminarCategoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await inventarioApi.eliminarCategoria(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      queryClient.invalidateQueries({ queryKey: ['categorias-arbol'] });
    },
    onError: createCRUDErrorHandler('delete', 'Categoría', {
      409: 'No se puede eliminar la categoría porque tiene productos o subcategorías asociadas',
    }),
  });
}

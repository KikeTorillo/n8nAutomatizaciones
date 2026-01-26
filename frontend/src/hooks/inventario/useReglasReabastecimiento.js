import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';

/**
 * Hook para listar reglas de reabastecimiento
 */
export function useReglasReabastecimiento(filtros = {}) {
  return useQuery({
    queryKey: ['reglas-reabastecimiento', filtros],
    queryFn: async () => {
      const response = await inventarioApi.listarReglasReabastecimiento(filtros);
      return response.data.data;
    },
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook para crear regla de reabastecimiento
 */
export function useCrearReglaReabastecimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await inventarioApi.crearReglaReabastecimiento(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reglas-reabastecimiento'], refetchType: 'active' });
    },
  });
}

/**
 * Hook para actualizar regla de reabastecimiento
 */
export function useActualizarReglaReabastecimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const response = await inventarioApi.actualizarReglaReabastecimiento(id, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reglas-reabastecimiento'], refetchType: 'active' });
    },
  });
}

/**
 * Hook para eliminar regla de reabastecimiento
 */
export function useEliminarReglaReabastecimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await inventarioApi.eliminarReglaReabastecimiento(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reglas-reabastecimiento'], refetchType: 'active' });
    },
  });
}

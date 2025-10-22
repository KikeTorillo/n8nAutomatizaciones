import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tiposBloqueoApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/useToast';

/**
 * Hook para gestionar tipos de bloqueo
 */

// Query Keys
export const tiposBloqueoKeys = {
  all: ['tipos-bloqueo'],
  lists: () => [...tiposBloqueoKeys.all, 'list'],
  list: (filters) => [...tiposBloqueoKeys.lists(), { filters }],
  details: () => [...tiposBloqueoKeys.all, 'detail'],
  detail: (id) => [...tiposBloqueoKeys.details(), id],
};

/**
 * Hook para listar tipos de bloqueo
 * @param {Object} filtros - { solo_sistema, solo_personalizados }
 * @returns {Object} Query de React Query
 */
export const useTiposBloqueo = (filtros = {}) => {
  return useQuery({
    queryKey: tiposBloqueoKeys.list(filtros),
    queryFn: async () => {
      const response = await tiposBloqueoApi.listar(filtros);
      return response.data.data; // Extraer el objeto data interno que contiene tipos, total, filtros_aplicados
    },
    staleTime: 5 * 60 * 1000, // 5 minutos (los tipos de bloqueo no cambian frecuentemente)
  });
};

/**
 * Hook para obtener un tipo de bloqueo por ID
 * @param {number} id
 * @param {Object} options - Opciones adicionales para useQuery
 * @returns {Object} Query de React Query
 */
export const useTipoBloqueo = (id, options = {}) => {
  return useQuery({
    queryKey: tiposBloqueoKeys.detail(id),
    queryFn: async () => {
      const response = await tiposBloqueoApi.obtener(id);
      return response.data.data; // Extraer el objeto data interno
    },
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook para crear un tipo de bloqueo personalizado
 * @returns {Object} Mutation de React Query
 */
export const useCrearTipoBloqueo = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (data) => {
      const response = await tiposBloqueoApi.crear(data);
      return response.data.data; // Extraer el objeto data interno
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tiposBloqueoKeys.lists() });
      success('Tipo de bloqueo creado exitosamente');
    },
    onError: (err) => {
      error(err.response?.data?.mensaje || 'Error al crear tipo de bloqueo');
    },
  });
};

/**
 * Hook para actualizar un tipo de bloqueo
 * @returns {Object} Mutation de React Query
 */
export const useActualizarTipoBloqueo = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await tiposBloqueoApi.actualizar(id, data);
      return response.data.data; // Extraer el objeto data interno
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: tiposBloqueoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tiposBloqueoKeys.detail(variables.id) });
      success('Tipo de bloqueo actualizado exitosamente');
    },
    onError: (err) => {
      error(err.response?.data?.mensaje || 'Error al actualizar tipo de bloqueo');
    },
  });
};

/**
 * Hook para eliminar un tipo de bloqueo
 * @returns {Object} Mutation de React Query
 */
export const useEliminarTipoBloqueo = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (id) => {
      const response = await tiposBloqueoApi.eliminar(id);
      return response.data.data; // Extraer el objeto data interno
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tiposBloqueoKeys.lists() });
      success('Tipo de bloqueo eliminado exitosamente');
    },
    onError: (err) => {
      error(err.response?.data?.mensaje || 'Error al eliminar tipo de bloqueo');
    },
  });
};

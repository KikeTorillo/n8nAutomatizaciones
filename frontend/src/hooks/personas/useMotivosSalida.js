import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motivosSalidaApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/useToast';

/**
 * Hook para gestionar motivos de salida
 * GAP-001 vs Odoo 19: Catálogo dinámico de razones de terminación
 */

// Query Keys
export const motivosSalidaKeys = {
  all: ['motivos-salida'],
  lists: () => [...motivosSalidaKeys.all, 'list'],
  list: (filters) => [...motivosSalidaKeys.lists(), { filters }],
  details: () => [...motivosSalidaKeys.all, 'detail'],
  detail: (id) => [...motivosSalidaKeys.details(), id],
  estadisticas: () => [...motivosSalidaKeys.all, 'estadisticas'],
};

/**
 * Hook para listar motivos de salida
 * @param {Object} filtros - { solo_sistema, solo_personalizados, activos }
 * @returns {Object} Query de React Query
 */
export const useMotivosSalida = (filtros = {}) => {
  return useQuery({
    queryKey: motivosSalidaKeys.list(filtros),
    queryFn: async () => {
      const response = await motivosSalidaApi.listar(filtros);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para obtener estadísticas de uso de motivos
 * @returns {Object} Query de React Query
 */
export const useMotivosSalidaEstadisticas = () => {
  return useQuery({
    queryKey: motivosSalidaKeys.estadisticas(),
    queryFn: async () => {
      const response = await motivosSalidaApi.estadisticas();
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para obtener un motivo de salida por ID
 * @param {number} id
 * @param {Object} options - Opciones adicionales para useQuery
 * @returns {Object} Query de React Query
 */
export const useMotivoSalida = (id, options = {}) => {
  return useQuery({
    queryKey: motivosSalidaKeys.detail(id),
    queryFn: async () => {
      const response = await motivosSalidaApi.obtener(id);
      return response.data.data;
    },
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook para crear un motivo de salida personalizado
 * @returns {Object} Mutation de React Query
 */
export const useCrearMotivoSalida = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (data) => {
      const response = await motivosSalidaApi.crear(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: motivosSalidaKeys.lists() });
      success('Motivo de salida creado exitosamente');
    },
    onError: (err) => {
      error(err.response?.data?.mensaje || 'Error al crear motivo de salida');
    },
  });
};

/**
 * Hook para actualizar un motivo de salida
 * @returns {Object} Mutation de React Query
 */
export const useActualizarMotivoSalida = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await motivosSalidaApi.actualizar(id, data);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: motivosSalidaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: motivosSalidaKeys.detail(variables.id) });
      success('Motivo de salida actualizado exitosamente');
    },
    onError: (err) => {
      error(err.response?.data?.mensaje || 'Error al actualizar motivo de salida');
    },
  });
};

/**
 * Hook para eliminar un motivo de salida
 * @returns {Object} Mutation de React Query
 */
export const useEliminarMotivoSalida = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (id) => {
      const response = await motivosSalidaApi.eliminar(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: motivosSalidaKeys.lists() });
      success('Motivo de salida eliminado exitosamente');
    },
    onError: (err) => {
      error(err.response?.data?.mensaje || 'Error al eliminar motivo de salida');
    },
  });
};

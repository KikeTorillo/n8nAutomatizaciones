import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { categoriasPagoApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';
import { queryKeys } from '@/hooks/config';

/**
 * Hook para gestionar categorías de pago
 * Clasificación de empleados para nómina
 */

// Query Keys
export const categoriasPagoKeys = {
  all: queryKeys.catalogos.categoriasPago,
  lists: () => [...categoriasPagoKeys.all, 'list'],
  list: (filters) => [...categoriasPagoKeys.lists(), { filters }],
  details: () => [...categoriasPagoKeys.all, 'detail'],
  detail: (id) => [...categoriasPagoKeys.details(), id],
  estadisticas: () => [...categoriasPagoKeys.all, 'estadisticas'],
};

/**
 * Hook para listar categorías de pago
 * @param {Object} filtros - { activas, ordenar_por }
 * @returns {Object} Query de React Query
 */
export const useCategoriasPago = (filtros = {}) => {
  return useQuery({
    queryKey: categoriasPagoKeys.list(filtros),
    queryFn: async () => {
      const response = await categoriasPagoApi.listar(filtros);
      return response.data.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
};

/**
 * Hook para obtener estadísticas de uso de categorías
 * @returns {Object} Query de React Query
 */
export const useCategoriasPagoEstadisticas = () => {
  return useQuery({
    queryKey: categoriasPagoKeys.estadisticas(),
    queryFn: async () => {
      const response = await categoriasPagoApi.estadisticas();
      return response.data.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
};

/**
 * Hook para obtener una categoría de pago por ID
 * @param {number} id
 * @param {Object} options - Opciones adicionales para useQuery
 * @returns {Object} Query de React Query
 */
export const useCategoriaPago = (id, options = {}) => {
  return useQuery({
    queryKey: categoriasPagoKeys.detail(id),
    queryFn: async () => {
      const response = await categoriasPagoApi.obtener(id);
      return response.data.data;
    },
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook para crear una categoría de pago
 * @returns {Object} Mutation de React Query
 */
export const useCrearCategoriaPago = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (data) => {
      const response = await categoriasPagoApi.crear(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriasPagoKeys.lists(), refetchType: 'active' });
      success('Categoría de pago creada exitosamente');
    },
    onError: (err) => {
      error(err.response?.data?.mensaje || 'Error al crear categoría de pago');
    },
  });
};

/**
 * Hook para actualizar una categoría de pago
 * @returns {Object} Mutation de React Query
 */
export const useActualizarCategoriaPago = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await categoriasPagoApi.actualizar(id, data);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: categoriasPagoKeys.lists(), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: categoriasPagoKeys.detail(variables.id), refetchType: 'active' });
      success('Categoría de pago actualizada exitosamente');
    },
    onError: (err) => {
      error(err.response?.data?.mensaje || 'Error al actualizar categoría de pago');
    },
  });
};

/**
 * Hook para eliminar una categoría de pago
 * @returns {Object} Mutation de React Query
 */
export const useEliminarCategoriaPago = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (id) => {
      const response = await categoriasPagoApi.eliminar(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriasPagoKeys.lists(), refetchType: 'active' });
      success('Categoría de pago eliminada exitosamente');
    },
    onError: (err) => {
      error(err.response?.data?.mensaje || 'Error al eliminar categoría de pago');
    },
  });
};

/**
 * Hook para obtener opciones de categoría para select
 * Devuelve las categorías activas formateadas para usar en un Select
 * @returns {Object} Query con categorías formateadas
 */
export const useCategoriasPagoOptions = () => {
  const query = useCategoriasPago({ activas: true });

  const options = (query.data?.categorias || []).map((categoria) => ({
    value: categoria.id,
    label: categoria.nombre,
    color: categoria.color,
    nivel: categoria.nivel_salarial,
    codigo: categoria.codigo,
    permiteBonos: categoria.permite_bonos,
    permiteComisiones: categoria.permite_comisiones,
    permiteViaticos: categoria.permite_viaticos,
  }));

  return {
    ...query,
    options,
  };
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ubicacionesTrabajoApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';

/**
 * Hook para gestionar ubicaciones de trabajo
 * GAP-003 vs Odoo 19: Soporte para trabajo híbrido
 */

// Query Keys
export const ubicacionesTrabajoKeys = {
  all: ['ubicaciones-trabajo'],
  lists: () => [...ubicacionesTrabajoKeys.all, 'list'],
  list: (filters) => [...ubicacionesTrabajoKeys.lists(), { filters }],
  details: () => [...ubicacionesTrabajoKeys.all, 'detail'],
  detail: (id) => [...ubicacionesTrabajoKeys.details(), id],
  estadisticas: () => [...ubicacionesTrabajoKeys.all, 'estadisticas'],
};

/**
 * Hook para listar ubicaciones de trabajo
 * @param {Object} filtros - { activas, es_remoto, es_oficina_principal, sucursal_id }
 * @returns {Object} Query de React Query
 */
export const useUbicacionesTrabajo = (filtros = {}) => {
  return useQuery({
    queryKey: ubicacionesTrabajoKeys.list(filtros),
    queryFn: async () => {
      const response = await ubicacionesTrabajoApi.listar(filtros);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para obtener estadísticas de uso por día de la semana
 * @returns {Object} Query de React Query
 */
export const useUbicacionesTrabajoEstadisticas = () => {
  return useQuery({
    queryKey: ubicacionesTrabajoKeys.estadisticas(),
    queryFn: async () => {
      const response = await ubicacionesTrabajoApi.estadisticas();
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para obtener una ubicación de trabajo por ID
 * @param {number} id
 * @param {Object} options - Opciones adicionales para useQuery
 * @returns {Object} Query de React Query
 */
export const useUbicacionTrabajo = (id, options = {}) => {
  return useQuery({
    queryKey: ubicacionesTrabajoKeys.detail(id),
    queryFn: async () => {
      const response = await ubicacionesTrabajoApi.obtener(id);
      return response.data.data;
    },
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook para crear una ubicación de trabajo
 * @returns {Object} Mutation de React Query
 */
export const useCrearUbicacionTrabajo = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (data) => {
      const response = await ubicacionesTrabajoApi.crear(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ubicacionesTrabajoKeys.lists() });
      success('Ubicación de trabajo creada exitosamente');
    },
    onError: (err) => {
      error(err.response?.data?.mensaje || 'Error al crear ubicación de trabajo');
    },
  });
};

/**
 * Hook para actualizar una ubicación de trabajo
 * @returns {Object} Mutation de React Query
 */
export const useActualizarUbicacionTrabajo = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await ubicacionesTrabajoApi.actualizar(id, data);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ubicacionesTrabajoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ubicacionesTrabajoKeys.detail(variables.id) });
      success('Ubicación de trabajo actualizada exitosamente');
    },
    onError: (err) => {
      error(err.response?.data?.mensaje || 'Error al actualizar ubicación de trabajo');
    },
  });
};

/**
 * Hook para eliminar una ubicación de trabajo
 * @returns {Object} Mutation de React Query
 */
export const useEliminarUbicacionTrabajo = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (id) => {
      const response = await ubicacionesTrabajoApi.eliminar(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ubicacionesTrabajoKeys.lists() });
      success('Ubicación de trabajo eliminada exitosamente');
    },
    onError: (err) => {
      error(err.response?.data?.mensaje || 'Error al eliminar ubicación de trabajo');
    },
  });
};

/**
 * Hook para obtener opciones de ubicación para select
 * Devuelve las ubicaciones activas formateadas para usar en un Select
 * @returns {Object} Query con ubicaciones formateadas
 */
export const useUbicacionesTrabajoOptions = () => {
  const query = useUbicacionesTrabajo({ activas: true });

  const options = (query.data?.ubicaciones || []).map((ubicacion) => ({
    value: ubicacion.id,
    label: ubicacion.nombre,
    color: ubicacion.color,
    esRemoto: ubicacion.es_remoto,
    esOficinaPrincipal: ubicacion.es_oficina_principal,
    icono: ubicacion.icono,
  }));

  return {
    ...query,
    options,
  };
};

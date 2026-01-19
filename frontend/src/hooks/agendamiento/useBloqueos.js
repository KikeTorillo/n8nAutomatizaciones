import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { bloqueosApi } from '@/services/api/endpoints';
import { useToast } from '../utils/useToast';
import { createCRUDErrorHandler, getErrorMessage } from '@/hooks/config/errorHandlerFactory';

/**
 * Hook para listar bloqueos con filtros
 * @param {Object} params - Filtros: { profesional_id, tipo_bloqueo, fecha_inicio, fecha_fin, solo_organizacionales, limite, offset }
 * @returns {Object} Query result de React Query
 *
 * @example
 * const { data: bloqueos, isLoading } = useBloqueos({ profesional_id: 1 });
 */
export const useBloqueos = (params = {}) => {
  return useQuery({
    queryKey: ['bloqueos', params],
    queryFn: async () => {
      const response = await bloqueosApi.listar(params);
      // El API devuelve { success, data: { bloqueos, paginacion, filtros_aplicados } }
      return response.data.data?.bloqueos || [];
    },
    staleTime: STALE_TIMES.DYNAMIC, // 2 min - Ene 2026: bloqueos afectan disponibilidad en tiempo real
    enabled: true,
  });
};

/**
 * Hook para obtener un bloqueo por ID
 * @param {number} id - ID del bloqueo
 * @returns {Object} Query result de React Query
 *
 * @example
 * const { data: bloqueo } = useBloqueo(1);
 */
export const useBloqueo = (id) => {
  return useQuery({
    queryKey: ['bloqueo', id],
    queryFn: async () => {
      const response = await bloqueosApi.obtener(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
};

/**
 * Hook para obtener bloqueos de un profesional específico
 * @param {number} profesionalId - ID del profesional
 * @param {Object} params - Filtros adicionales: { fecha_inicio, fecha_fin }
 * @returns {Object} Query result de React Query
 *
 * @example
 * const { data: bloqueos } = useBloqueosPorProfesional(1, {
 *   fecha_inicio: '2025-01-01',
 *   fecha_fin: '2025-12-31'
 * });
 */
export const useBloqueosPorProfesional = (profesionalId, params = {}) => {
  return useQuery({
    queryKey: ['bloqueos', 'profesional', profesionalId, params],
    queryFn: async () => {
      const response = await bloqueosApi.obtenerPorProfesional(profesionalId, params);
      return response.data;
    },
    enabled: !!profesionalId,
    staleTime: STALE_TIMES.MEDIUM, // 3 minutos
  });
};

/**
 * Hook para obtener bloqueos organizacionales (sin profesional específico)
 * @param {Object} params - Filtros: { fecha_inicio, fecha_fin, tipo_bloqueo }
 * @returns {Object} Query result de React Query
 *
 * @example
 * const { data: bloqueosOrg } = useBloquesOrganizacionales({ tipo_bloqueo: 'feriado' });
 */
export const useBloqueosOrganizacionales = (params = {}) => {
  return useQuery({
    queryKey: ['bloqueos', 'organizacionales', params],
    queryFn: async () => {
      const response = await bloqueosApi.obtenerOrganizacionales(params);
      return response.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
};

/**
 * Hook para obtener bloqueos por rango de fechas
 * @param {string} fechaInicio - Fecha inicio (YYYY-MM-DD)
 * @param {string} fechaFin - Fecha fin (YYYY-MM-DD)
 * @param {Object} params - Filtros adicionales
 * @returns {Object} Query result de React Query
 *
 * @example
 * const { data: bloqueos } = useBloqueosPorRangoFechas('2025-01-01', '2025-01-31');
 */
export const useBloqueosPorRangoFechas = (fechaInicio, fechaFin, params = {}) => {
  return useQuery({
    queryKey: ['bloqueos', 'rango', fechaInicio, fechaFin, params],
    queryFn: async () => {
      const response = await bloqueosApi.obtenerPorRangoFechas(fechaInicio, fechaFin, params);
      return response.data;
    },
    enabled: !!fechaInicio && !!fechaFin,
    staleTime: STALE_TIMES.MEDIUM,
  });
};

/**
 * Hook para obtener bloqueos por tipo
 * @param {string} tipo - Tipo de bloqueo: vacaciones, feriado, mantenimiento, etc.
 * @param {Object} params - Filtros adicionales
 * @returns {Object} Query result de React Query
 *
 * @example
 * const { data: vacaciones } = useBloqueosPorTipo('vacaciones');
 */
export const useBloqueosPorTipo = (tipo, params = {}) => {
  return useQuery({
    queryKey: ['bloqueos', 'tipo', tipo, params],
    queryFn: async () => {
      const response = await bloqueosApi.listar({ ...params, tipo_bloqueo: tipo });
      return response.data;
    },
    enabled: !!tipo,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
};

// ==================== MUTATION HOOKS ====================

/**
 * Hook para crear un bloqueo
 * @returns {Object} Mutation result de React Query
 *
 * @example
 * const crearBloqueo = useCrearBloqueo();
 * crearBloqueo.mutate({
 *   tipo_bloqueo: 'vacaciones',
 *   titulo: 'Vacaciones de verano',
 *   fecha_inicio: '2025-07-01',
 *   fecha_fin: '2025-07-15',
 *   profesional_id: 1
 * });
 */
export const useCrearBloqueo = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (data) => {
      // Sanitizar campos opcionales vacíos
      const sanitizedData = {
        ...data,
        descripcion: data.descripcion?.trim() || undefined,
        hora_inicio: data.hora_inicio?.trim() || undefined,
        hora_fin: data.hora_fin?.trim() || undefined,
        mensaje_clientes: data.mensaje_clientes?.trim() || undefined,
        notas_internas: data.notas_internas?.trim() || undefined,
        profesional_id: data.profesional_id || undefined,
        servicio_id: data.servicio_id || undefined,
      };

      const response = await bloqueosApi.crear(sanitizedData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bloqueos'] });
      toast.success('Bloqueo creado exitosamente');
      return data;
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('create', 'Bloqueo')(error);
      } catch (e) {
        toast.error(getErrorMessage(e));
      }
    },
  });
};

/**
 * Hook para actualizar un bloqueo
 * @returns {Object} Mutation result de React Query
 *
 * @example
 * const actualizarBloqueo = useActualizarBloqueo();
 * actualizarBloqueo.mutate({
 *   id: 1,
 *   titulo: 'Vacaciones modificadas'
 * });
 */
export const useActualizarBloqueo = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      // Sanitizar campos opcionales vacíos
      const sanitizedData = {
        ...data,
        descripcion: data.descripcion?.trim() || undefined,
        hora_inicio: data.hora_inicio?.trim() || undefined,
        hora_fin: data.hora_fin?.trim() || undefined,
        mensaje_clientes: data.mensaje_clientes?.trim() || undefined,
        notas_internas: data.notas_internas?.trim() || undefined,
      };

      const response = await bloqueosApi.actualizar(id, sanitizedData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bloqueos'] });
      queryClient.invalidateQueries({ queryKey: ['bloqueo', variables.id] });
      toast.success('Bloqueo actualizado exitosamente');
      return data;
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('update', 'Bloqueo')(error);
      } catch (e) {
        toast.error(getErrorMessage(e));
      }
    },
  });
};

/**
 * Hook para eliminar un bloqueo
 * @returns {Object} Mutation result de React Query
 *
 * @example
 * const eliminarBloqueo = useEliminarBloqueo();
 * eliminarBloqueo.mutate(1);
 */
export const useEliminarBloqueo = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (id) => {
      const response = await bloqueosApi.eliminar(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloqueos'] });
      toast.success('Bloqueo eliminado exitosamente');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('delete', 'Bloqueo')(error);
      } catch (e) {
        toast.error(getErrorMessage(e));
      }
    },
  });
};

/**
 * Hook para crear múltiples bloqueos (batch)
 * Útil para bloqueos recurrentes o masivos
 * @returns {Object} Mutation result de React Query
 *
 * @example
 * const batchCrear = useBatchCrearBloqueos();
 * batchCrear.mutate([
 *   { tipo_bloqueo: 'feriado', titulo: 'Año Nuevo', ... },
 *   { tipo_bloqueo: 'feriado', titulo: 'Navidad', ... },
 * ]);
 */
export const useBatchCrearBloqueos = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (bloqueosArray) => {
      // Crear todos los bloqueos en paralelo
      const promesas = bloqueosArray.map((bloqueo) => {
        const sanitizedData = {
          ...bloqueo,
          descripcion: bloqueo.descripcion?.trim() || undefined,
          hora_inicio: bloqueo.hora_inicio?.trim() || undefined,
          hora_fin: bloqueo.hora_fin?.trim() || undefined,
          mensaje_clientes: bloqueo.mensaje_clientes?.trim() || undefined,
          notas_internas: bloqueo.notas_internas?.trim() || undefined,
          profesional_id: bloqueo.profesional_id || undefined,
          servicio_id: bloqueo.servicio_id || undefined,
        };
        return bloqueosApi.crear(sanitizedData);
      });

      const resultados = await Promise.allSettled(promesas);

      const exitosos = resultados.filter((r) => r.status === 'fulfilled');
      const fallidos = resultados.filter((r) => r.status === 'rejected');

      return {
        exitosos: exitosos.length,
        fallidos: fallidos.length,
        total: resultados.length,
        resultados: exitosos.map((r) => r.value.data),
        errores: fallidos.map((r) => r.reason?.response?.data?.mensaje || 'Error desconocido'),
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bloqueos'] });

      if (data.fallidos === 0) {
        toast.success(`${data.exitosos} bloqueos creados exitosamente`);
      } else if (data.exitosos > 0) {
        toast.warning(
          `${data.exitosos} bloqueos creados, ${data.fallidos} fallaron. Revisa los detalles.`
        );
      } else {
        toast.error('No se pudo crear ningún bloqueo');
      }
      return data;
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('create', 'Bloqueos en batch')(error);
      } catch (e) {
        toast.error(getErrorMessage(e));
      }
    },
  });
};

export default {
  useBloqueos,
  useBloqueo,
  useBloqueosPorProfesional,
  useBloqueosOrganizacionales,
  useBloqueosPorRangoFechas,
  useBloqueosPorTipo,
  useCrearBloqueo,
  useActualizarBloqueo,
  useEliminarBloqueo,
  useBatchCrearBloqueos,
};

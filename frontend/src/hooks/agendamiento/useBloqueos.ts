import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { bloqueosApi } from '@/services/api/endpoints';
import { useToast } from '../utils/useToast';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';

// ==================== Interfaces ====================

interface BloqueoData {
  tipo_bloqueo: string;
  titulo: string;
  descripcion?: string;
  fecha_inicio: string;
  fecha_fin: string;
  hora_inicio?: string;
  hora_fin?: string;
  mensaje_clientes?: string;
  notas_internas?: string;
  profesional_id?: number | null;
  servicio_id?: number | null;
}

interface ActualizarBloqueoVariables {
  id: number;
  descripcion?: string;
  titulo?: string;
  tipo_bloqueo?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  hora_inicio?: string;
  hora_fin?: string;
  mensaje_clientes?: string;
  notas_internas?: string;
  profesional_id?: number | null;
  servicio_id?: number | null;
  [key: string]: unknown;
}

interface BatchResultado {
  exitosos: number;
  fallidos: number;
  total: number;
  resultados: unknown[];
  errores: string[];
}

// ==================== QUERY HOOKS ====================

/**
 * Hook para listar bloqueos con filtros
 * @param params - Filtros: { profesional_id, tipo_bloqueo, fecha_inicio, fecha_fin, solo_organizacionales, limite, offset }
 *
 * @example
 * const { data: bloqueos, isLoading } = useBloqueos({ profesional_id: 1 });
 */
export const useBloqueos = (params: Record<string, unknown> = {}) => {
  return useQuery({
    queryKey: queryKeys.agendamiento.bloqueos.list(params),
    queryFn: async () => {
      const response = await bloqueosApi.listar(params);
      // El API devuelve { success, data: { bloqueos, paginacion, filtros_aplicados } }
      return (response as any).data.data?.bloqueos || [];
    },
    staleTime: STALE_TIMES.DYNAMIC, // 2 min - Ene 2026: bloqueos afectan disponibilidad en tiempo real
    enabled: true,
  });
};

/**
 * Hook para obtener un bloqueo por ID
 * @param id - ID del bloqueo
 *
 * @example
 * const { data: bloqueo } = useBloqueo(1);
 */
export const useBloqueo = (id: number | undefined | null) => {
  return useQuery({
    queryKey: [...queryKeys.agendamiento.bloqueos.all, 'detail', id],
    queryFn: async () => {
      const response = await bloqueosApi.obtener(id!);
      return (response as any).data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
};

/**
 * Hook para obtener bloqueos de un profesional especifico
 * @param profesionalId - ID del profesional
 * @param params - Filtros adicionales: { fecha_inicio, fecha_fin }
 *
 * @example
 * const { data: bloqueos } = useBloqueosPorProfesional(1, {
 *   fecha_inicio: '2025-01-01',
 *   fecha_fin: '2025-12-31'
 * });
 */
export const useBloqueosPorProfesional = (profesionalId: number | undefined | null, params: Record<string, unknown> = {}) => {
  return useQuery({
    queryKey: [...queryKeys.agendamiento.bloqueos.all, 'profesional', profesionalId, params],
    queryFn: async () => {
      const response = await bloqueosApi.obtenerPorProfesional(profesionalId!, params);
      return (response as any).data;
    },
    enabled: !!profesionalId,
    staleTime: STALE_TIMES.MEDIUM, // 3 minutos
  });
};

/**
 * Hook para obtener bloqueos organizacionales (sin profesional especifico)
 * @param params - Filtros: { fecha_inicio, fecha_fin, tipo_bloqueo }
 *
 * @example
 * const { data: bloqueosOrg } = useBloqueosOrganizacionales({ tipo_bloqueo: 'feriado' });
 */
export const useBloqueosOrganizacionales = (params: Record<string, unknown> = {}) => {
  return useQuery({
    queryKey: [...queryKeys.agendamiento.bloqueos.all, 'organizacionales', params],
    queryFn: async () => {
      const response = await bloqueosApi.obtenerOrganizacionales(params);
      return (response as any).data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
};

/**
 * Hook para obtener bloqueos por rango de fechas
 * @param fechaInicio - Fecha inicio (YYYY-MM-DD)
 * @param fechaFin - Fecha fin (YYYY-MM-DD)
 * @param params - Filtros adicionales
 *
 * @example
 * const { data: bloqueos } = useBloqueosPorRangoFechas('2025-01-01', '2025-01-31');
 */
export const useBloqueosPorRangoFechas = (fechaInicio: string | undefined | null, fechaFin: string | undefined | null, params: Record<string, unknown> = {}) => {
  return useQuery({
    queryKey: [...queryKeys.agendamiento.bloqueos.all, 'rango', fechaInicio, fechaFin, params],
    queryFn: async () => {
      const response = await bloqueosApi.obtenerPorRangoFechas(fechaInicio!, fechaFin!, params);
      return (response as any).data;
    },
    enabled: !!fechaInicio && !!fechaFin,
    staleTime: STALE_TIMES.MEDIUM,
  });
};

/**
 * Hook para obtener bloqueos por tipo
 * @param tipo - Tipo de bloqueo: vacaciones, feriado, mantenimiento, etc.
 * @param params - Filtros adicionales
 *
 * @example
 * const { data: vacaciones } = useBloqueosPorTipo('vacaciones');
 */
export const useBloqueosPorTipo = (tipo: string | undefined | null, params: Record<string, unknown> = {}) => {
  return useQuery({
    queryKey: [...queryKeys.agendamiento.bloqueos.all, 'tipo', tipo, params],
    queryFn: async () => {
      const response = await bloqueosApi.listar({ ...params, tipo_bloqueo: tipo });
      return (response as any).data;
    },
    enabled: !!tipo,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
};

// ==================== MUTATION HOOKS ====================

/**
 * Hook para crear un bloqueo
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
    mutationFn: async (data: BloqueoData) => {
      // Sanitizar campos opcionales vacios
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
      return (response as any).data;
    },
    onSuccess: (data: unknown) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agendamiento.bloqueos.all, refetchType: 'active' });
      toast.success('Bloqueo creado exitosamente');
      return data;
    },
    onError: createCRUDErrorHandler('create', 'Bloqueo'),
  });
};

/**
 * Hook para actualizar un bloqueo
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
    mutationFn: async ({ id, ...data }: ActualizarBloqueoVariables) => {
      // Sanitizar campos opcionales vacios
      const sanitizedData = {
        ...data,
        descripcion: data.descripcion?.trim() || undefined,
        hora_inicio: data.hora_inicio?.trim() || undefined,
        hora_fin: data.hora_fin?.trim() || undefined,
        mensaje_clientes: data.mensaje_clientes?.trim() || undefined,
        notas_internas: data.notas_internas?.trim() || undefined,
      };

      const response = await bloqueosApi.actualizar(id, sanitizedData);
      return (response as any).data;
    },
    onSuccess: (data: unknown, variables: ActualizarBloqueoVariables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agendamiento.bloqueos.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.agendamiento.bloqueos.all, 'detail', variables.id], refetchType: 'active' });
      toast.success('Bloqueo actualizado exitosamente');
      return data;
    },
    onError: createCRUDErrorHandler('update', 'Bloqueo'),
  });
};

/**
 * Hook para eliminar un bloqueo
 *
 * @example
 * const eliminarBloqueo = useEliminarBloqueo();
 * eliminarBloqueo.mutate(1);
 */
export const useEliminarBloqueo = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await bloqueosApi.eliminar(id);
      return (response as any).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agendamiento.bloqueos.all, refetchType: 'active' });
      toast.success('Bloqueo eliminado exitosamente');
    },
    onError: createCRUDErrorHandler('delete', 'Bloqueo'),
  });
};

/**
 * Hook para crear multiples bloqueos (batch)
 * Util para bloqueos recurrentes o masivos
 *
 * @example
 * const batchCrear = useBatchCrearBloqueos();
 * batchCrear.mutate([
 *   { tipo_bloqueo: 'feriado', titulo: 'Anio Nuevo', ... },
 *   { tipo_bloqueo: 'feriado', titulo: 'Navidad', ... },
 * ]);
 */
export const useBatchCrearBloqueos = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (bloqueosArray: BloqueoData[]): Promise<BatchResultado> => {
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

      const exitosos = resultados.filter((r) => r.status === 'fulfilled') as PromiseFulfilledResult<unknown>[];
      const fallidos = resultados.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];

      return {
        exitosos: exitosos.length,
        fallidos: fallidos.length,
        total: resultados.length,
        resultados: exitosos.map((r) => (r.value as any).data),
        errores: fallidos.map((r) => r.reason?.response?.data?.mensaje || 'Error desconocido'),
      };
    },
    onSuccess: (data: BatchResultado) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agendamiento.bloqueos.all, refetchType: 'active' });

      if (data.fallidos === 0) {
        toast.success(`${data.exitosos} bloqueos creados exitosamente`);
      } else if (data.exitosos > 0) {
        toast.warning(
          `${data.exitosos} bloqueos creados, ${data.fallidos} fallaron. Revisa los detalles.`
        );
      } else {
        toast.error('No se pudo crear ningun bloqueo');
      }
      return data;
    },
    onError: createCRUDErrorHandler('create', 'Bloqueos en batch'),
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

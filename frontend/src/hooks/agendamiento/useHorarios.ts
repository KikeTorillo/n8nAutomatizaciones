import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { horariosApi } from '@/services/api/endpoints';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';
import { extractData } from '@/lib/apiHelpers';

// ==================== Interfaces ====================

interface HorarioSemanalData {
  profesional_id: number;
  dias: number[];
  hora_inicio: string;
  hora_fin: string;
  tipo_horario?: string;
  nombre_horario?: string;
  fecha_inicio?: string;
}

interface HorarioData {
  profesional_id: number;
  dia_semana?: number;
  hora_inicio: string;
  hora_fin: string;
  tipo_horario?: string;
  nombre_horario?: string;
  fecha_inicio?: string;
  [key: string]: unknown;
}

interface ActualizarHorarioVariables {
  id: number;
  data: Record<string, unknown>;
}

// ==================== QUERY HOOKS ====================

/**
 * Hook para listar horarios de un profesional
 * @param profesionalId - ID del profesional
 * @param options - Opciones adicionales (dia_semana, tipo_horario, etc.)
 */
export function useHorariosProfesional(
  profesionalId: number | undefined | null,
  options: Record<string, unknown> = {}
) {
  return useQuery({
    queryKey: queryKeys.agendamiento.horarios.profesional(profesionalId),
    queryFn: async () => {
      if (!profesionalId) {
        throw new Error('El ID del profesional es requerido');
      }

      // Sanitizar parametros vacios
      const params = {
        profesional_id: profesionalId,
        ...Object.fromEntries(
          Object.entries(options).filter(
            ([, value]) => value !== '' && value !== null && value !== undefined
          )
        ),
      };

      const response = await horariosApi.listar(params);

      // Backend retorna 204 (No Content) cuando no hay horarios
      if (!(response as any).data) {
        return [];
      }

      // Si hay datos, puede ser array directo o { data: { horarios: [...] } }
      if (Array.isArray(extractData(response))) {
        return extractData(response);
      }

      return extractData<any>(response)?.horarios || [];
    },
    enabled: !!profesionalId,
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para obtener un horario por ID
 * @param horarioId - ID del horario
 */
export function useHorario(horarioId: number | undefined | null) {
  return useQuery({
    queryKey: queryKeys.agendamiento.horarios.detail(horarioId),
    queryFn: async () => {
      const response = await horariosApi.obtener(horarioId!);
      return (response as any).data;
    },
    enabled: !!horarioId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

// ==================== MUTATION HOOKS ====================

/**
 * Hook para crear horarios semanales estandar (batch)
 * Este es el metodo principal para configurar horarios semanales
 */
export function useCrearHorarioSemanal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: HorarioSemanalData) => {
      const response = await horariosApi.crearSemanalesEstandar(data);
      return (response as any).data;
    },
    onSuccess: (_: unknown, variables: HorarioSemanalData) => {
      // Invalidar horarios del profesional
      queryClient.invalidateQueries({
        queryKey: queryKeys.agendamiento.horarios.profesional(
          variables.profesional_id
        ),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.agendamiento.horarios.all,
        refetchType: 'active',
      });
    },
    onError: createCRUDErrorHandler('create', 'Horarios semanales', {
      409: 'Ya existen horarios configurados para estos dias',
    }),
  });
}

/**
 * Hook para crear un horario individual
 */
export function useCrearHorario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: HorarioData) => {
      const response = await horariosApi.crear(data);
      return (response as any).data;
    },
    onSuccess: (_: unknown, variables: HorarioData) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.agendamiento.horarios.profesional(
          variables.profesional_id
        ),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.agendamiento.horarios.all,
        refetchType: 'active',
      });
    },
    onError: createCRUDErrorHandler('create', 'Horario', {
      409: 'Ya existe un horario para este dia',
    }),
  });
}

/**
 * Hook para actualizar un horario
 */
export function useActualizarHorario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: ActualizarHorarioVariables) => {
      const response = await horariosApi.actualizar(id, data);
      return (response as any).data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.agendamiento.horarios.profesional(
          data.profesional_id
        ),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.agendamiento.horarios.all,
        refetchType: 'active',
      });
    },
    onError: createCRUDErrorHandler('update', 'Horario'),
  });
}

/**
 * Hook para eliminar un horario (soft delete)
 */
export function useEliminarHorario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (horarioId: number) => {
      const response = await horariosApi.eliminar(horarioId);
      return (response as any).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.agendamiento.horarios.all,
        refetchType: 'active',
      });
    },
    onError: createCRUDErrorHandler('delete', 'Horario', {
      409: 'No se puede eliminar. El horario tiene citas asociadas.',
    }),
  });
}

/**
 * Hook para validar si un profesional tiene horarios configurados
 * @param profesionalId - ID del profesional
 */
export function useValidarConfiguracion(
  profesionalId: number | undefined | null
) {
  return useQuery({
    queryKey: [
      ...queryKeys.agendamiento.horarios.all,
      'validacion',
      profesionalId,
    ],
    queryFn: async () => {
      const response = await horariosApi.validarConfiguracion(profesionalId!);
      return (response as any).data;
    },
    enabled: !!profesionalId,
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos (validaciones mas frecuentes)
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { horariosApi } from '@/services/api/endpoints';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

/**
 * Hook para listar horarios de un profesional
 * @param {number} profesionalId - ID del profesional
 * @param {object} options - Opciones adicionales (dia_semana, tipo_horario, etc.)
 */
export function useHorariosProfesional(profesionalId, options = {}) {
  return useQuery({
    queryKey: ['horarios', profesionalId, options],
    queryFn: async () => {
      if (!profesionalId) {
        throw new Error('El ID del profesional es requerido');
      }

      // Sanitizar parámetros vacíos
      const params = {
        profesional_id: profesionalId,
        ...Object.fromEntries(
          Object.entries(options).filter(([, value]) => value !== '' && value !== null && value !== undefined)
        ),
      };

      const response = await horariosApi.listar(params);

      // Backend retorna 204 (No Content) cuando no hay horarios
      if (!response.data) {
        return [];
      }

      // Si hay datos, puede ser array directo o { data: { horarios: [...] } }
      if (Array.isArray(response.data.data)) {
        return response.data.data;
      }

      return response.data.data?.horarios || [];
    },
    enabled: !!profesionalId,
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para obtener un horario por ID
 * @param {number} horarioId - ID del horario
 */
export function useHorario(horarioId) {
  return useQuery({
    queryKey: ['horarios', horarioId],
    queryFn: async () => {
      const response = await horariosApi.obtener(horarioId);
      return response.data;
    },
    enabled: !!horarioId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para crear horarios semanales estándar (batch)
 * Este es el método principal para configurar horarios semanales
 */
export function useCrearHorarioSemanal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await horariosApi.crearSemanalesEstandar(data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidar horarios del profesional
      queryClient.invalidateQueries({ queryKey: ['horarios', variables.profesional_id], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['horarios'], refetchType: 'active' });
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
    mutationFn: async (data) => {
      const response = await horariosApi.crear(data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['horarios', variables.profesional_id], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['horarios'], refetchType: 'active' });
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
    mutationFn: async ({ id, data }) => {
      const response = await horariosApi.actualizar(id, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['horarios', data.profesional_id], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['horarios'], refetchType: 'active' });
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
    mutationFn: async (horarioId) => {
      const response = await horariosApi.eliminar(horarioId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horarios'], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('delete', 'Horario', {
      409: 'No se puede eliminar. El horario tiene citas asociadas.',
    }),
  });
}

/**
 * Hook para validar si un profesional tiene horarios configurados
 * @param {number} profesionalId - ID del profesional
 */
export function useValidarConfiguracion(profesionalId) {
  return useQuery({
    queryKey: ['horarios', 'validacion', profesionalId],
    queryFn: async () => {
      const response = await horariosApi.validarConfiguracion(profesionalId);
      return response.data;
    },
    enabled: !!profesionalId,
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos (validaciones más frecuentes)
  });
}

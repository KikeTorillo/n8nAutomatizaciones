import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { horariosApi } from '@/services/api/endpoints';

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
    staleTime: 5 * 60 * 1000, // 5 minutos
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
    staleTime: 5 * 60 * 1000,
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
      queryClient.invalidateQueries({ queryKey: ['horarios', variables.profesional_id] });
      queryClient.invalidateQueries({ queryKey: ['horarios'] });
    },
    onError: (error) => {
      // Priorizar mensaje del backend si existe
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const status = error.response?.status;
      let message = 'Error al crear horarios semanales';

      if (status === 400) {
        message = error.response?.data?.mensaje || 'Datos inválidos. Verifica los campos.';
      } else if (status === 404) {
        message = 'Profesional no encontrado';
      } else if (status === 409) {
        message = 'Ya existen horarios configurados para estos días';
      }

      throw new Error(message);
    },
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
      queryClient.invalidateQueries({ queryKey: ['horarios', variables.profesional_id] });
      queryClient.invalidateQueries({ queryKey: ['horarios'] });
    },
    onError: (error) => {
      // Priorizar mensaje del backend si existe
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const status = error.response?.status;
      let message = 'Error al crear horario';

      if (status === 400) {
        message = error.response?.data?.mensaje || 'Datos inválidos. Verifica los campos.';
      } else if (status === 404) {
        message = 'Profesional no encontrado';
      } else if (status === 409) {
        message = 'Ya existe un horario para este día';
      }

      throw new Error(message);
    },
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
      queryClient.invalidateQueries({ queryKey: ['horarios', data.profesional_id] });
      queryClient.invalidateQueries({ queryKey: ['horarios'] });
    },
    onError: (error) => {
      // Priorizar mensaje del backend si existe
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const status = error.response?.status;
      let message = 'Error al actualizar horario';

      if (status === 400) {
        message = error.response?.data?.mensaje || 'Datos inválidos. Verifica los campos.';
      } else if (status === 404) {
        message = 'Horario no encontrado';
      }

      throw new Error(message);
    },
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
      queryClient.invalidateQueries({ queryKey: ['horarios'] });
    },
    onError: (error) => {
      // Priorizar mensaje del backend si existe
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const status = error.response?.status;
      let message = 'Error al eliminar horario';

      if (status === 404) {
        message = 'Horario no encontrado';
      } else if (status === 409) {
        message = 'No se puede eliminar. El horario tiene citas asociadas.';
      }

      throw new Error(message);
    },
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
    staleTime: 2 * 60 * 1000, // 2 minutos (validaciones más frecuentes)
  });
}

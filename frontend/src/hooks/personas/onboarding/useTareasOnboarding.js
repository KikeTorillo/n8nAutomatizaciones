/**
 * useTareasOnboarding - Hooks para gestión de tareas de plantillas
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { onboardingEmpleadosApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { onboardingKeys } from './onboardingKeys';

/**
 * Crea una nueva tarea en una plantilla
 */
export function useCrearTarea() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ plantillaId, data }) => {
      const response = await onboardingEmpleadosApi.crearTarea(plantillaId, data);
      return response.data?.data || response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: onboardingKeys.plantillaDetail(variables.plantillaId)
      });
      toast.success('Tarea agregada');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('create', 'Tarea')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

/**
 * Actualiza una tarea
 */
export function useActualizarTarea() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ tareaId, data, plantillaId }) => {
      const response = await onboardingEmpleadosApi.actualizarTarea(tareaId, data);
      return { ...response.data?.data || response.data, plantillaId };
    },
    onSuccess: (data) => {
      if (data.plantillaId) {
        queryClient.invalidateQueries({
          queryKey: onboardingKeys.plantillaDetail(data.plantillaId)
        });
      }
      queryClient.invalidateQueries({ queryKey: onboardingKeys.plantillas(), refetchType: 'active' });
      toast.success('Tarea actualizada');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('update', 'Tarea')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

/**
 * Elimina una tarea
 */
export function useEliminarTarea() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ tareaId, plantillaId }) => {
      const response = await onboardingEmpleadosApi.eliminarTarea(tareaId);
      return { ...response.data?.data || response.data, plantillaId };
    },
    onSuccess: (data) => {
      if (data.plantillaId) {
        queryClient.invalidateQueries({
          queryKey: onboardingKeys.plantillaDetail(data.plantillaId)
        });
      }
      toast.success('Tarea eliminada');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('delete', 'Tarea')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

/**
 * Reordena tareas de una plantilla
 */
export function useReordenarTareas() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ plantillaId, items }) => {
      const response = await onboardingEmpleadosApi.reordenarTareas(plantillaId, items);
      return { ...response.data?.data || response.data, plantillaId };
    },
    onSuccess: (data) => {
      if (data.plantillaId) {
        queryClient.invalidateQueries({
          queryKey: onboardingKeys.plantillaDetail(data.plantillaId)
        });
      }
      toast.success('Orden actualizado');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('update', 'Tareas')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

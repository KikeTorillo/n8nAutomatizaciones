/**
 * useProgresoOnboarding - Hooks para progreso de onboarding de empleados
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { profesionalesApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { onboardingKeys } from './onboardingKeys';

/**
 * Obtiene el progreso de onboarding de un profesional
 * @param {number} profesionalId
 * @param {Object} options
 */
export function useProgresoOnboarding(profesionalId, options = {}) {
  const { soloPendientes = false, enabled = true } = options;

  return useQuery({
    queryKey: onboardingKeys.progresoByProfesional(profesionalId),
    queryFn: async () => {
      const response = await profesionalesApi.obtenerProgresoOnboarding(profesionalId, {
        solo_pendientes: soloPendientes
      });
      return response.data?.data || response.data;
    },
    enabled: enabled && !!profesionalId,
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

/**
 * Aplica una plantilla a un profesional
 */
export function useAplicarPlantilla() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ profesionalId, plantillaId }) => {
      const response = await profesionalesApi.aplicarOnboarding(profesionalId, plantillaId);
      return response.data?.data || response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: onboardingKeys.progresoByProfesional(variables.profesionalId)
      });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.dashboard(), refetchType: 'active' });
      toast.success(`Plantilla aplicada (${data.tareas_creadas} tareas creadas)`);
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('create', 'Plantilla')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

/**
 * Marca una tarea de onboarding como completada o pendiente
 */
export function useMarcarTareaOnboarding() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ profesionalId, tareaId, completado = true, notas }) => {
      const response = await profesionalesApi.marcarTareaOnboarding(profesionalId, tareaId, {
        completado,
        notas
      });
      return { ...response.data?.data || response.data, profesionalId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: onboardingKeys.progresoByProfesional(data.profesionalId)
      });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.dashboard(), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.tareasVencidas({}), refetchType: 'active' });
      const mensaje = data.completado ? 'Tarea completada' : 'Tarea marcada como pendiente';
      toast.success(mensaje);
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
 * Elimina todo el progreso de onboarding de un profesional
 */
export function useEliminarProgresoOnboarding() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (profesionalId) => {
      const response = await profesionalesApi.eliminarProgresoOnboarding(profesionalId);
      return { ...response.data?.data || response.data, profesionalId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: onboardingKeys.progresoByProfesional(data.profesionalId)
      });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.dashboard(), refetchType: 'active' });
      toast.success('Progreso de onboarding eliminado');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('delete', 'Progreso')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

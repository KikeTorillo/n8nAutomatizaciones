/**
 * usePlantillasOnboarding - Hooks para gestión de plantillas de onboarding
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { onboardingEmpleadosApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { onboardingKeys } from './onboardingKeys';

/**
 * Lista plantillas de onboarding
 * @param {Object} options
 * @param {Object} options.filtros - { departamento_id, puesto_id, activo, limite, offset }
 * @param {boolean} options.enabled
 */
export function usePlantillasOnboarding(options = {}) {
  const { filtros = {}, enabled = true } = options;

  return useQuery({
    queryKey: onboardingKeys.plantillasList(filtros),
    queryFn: async () => {
      const response = await onboardingEmpleadosApi.listarPlantillas(filtros);
      return response.data?.data || response.data;
    },
    enabled,
    staleTime: STALE_TIMES.FREQUENT, // 1 minuto
  });
}

/**
 * Obtiene una plantilla con sus tareas
 * @param {number} plantillaId
 */
export function usePlantillaOnboarding(plantillaId) {
  return useQuery({
    queryKey: onboardingKeys.plantillaDetail(plantillaId),
    queryFn: async () => {
      const response = await onboardingEmpleadosApi.obtenerPlantilla(plantillaId);
      return response.data?.data || response.data;
    },
    enabled: !!plantillaId,
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

/**
 * Obtiene plantillas sugeridas para un profesional
 * @param {number} profesionalId
 */
export function usePlantillasSugeridas(profesionalId) {
  return useQuery({
    queryKey: onboardingKeys.plantillasSugeridas(profesionalId),
    queryFn: async () => {
      const response = await onboardingEmpleadosApi.obtenerPlantillasSugeridas(profesionalId);
      return response.data?.data || response.data;
    },
    enabled: !!profesionalId,
    staleTime: STALE_TIMES.FREQUENT,
  });
}

/**
 * Crea una nueva plantilla
 */
export function useCrearPlantilla() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (data) => {
      const response = await onboardingEmpleadosApi.crearPlantilla(data);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.plantillas(), refetchType: 'active' });
      toast.success('Plantilla creada exitosamente');
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
 * Actualiza una plantilla
 */
export function useActualizarPlantilla() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ plantillaId, data }) => {
      const response = await onboardingEmpleadosApi.actualizarPlantilla(plantillaId, data);
      return response.data?.data || response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.plantillas(), refetchType: 'active' });
      queryClient.invalidateQueries({
        queryKey: onboardingKeys.plantillaDetail(variables.plantillaId)
      });
      toast.success('Plantilla actualizada');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('update', 'Plantilla')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

/**
 * Elimina una plantilla (soft delete)
 */
export function useEliminarPlantilla() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (plantillaId) => {
      const response = await onboardingEmpleadosApi.eliminarPlantilla(plantillaId);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.plantillas(), refetchType: 'active' });
      toast.success('Plantilla eliminada');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('delete', 'Plantilla')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

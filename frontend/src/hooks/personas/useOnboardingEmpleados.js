/**
 * useOnboardingEmpleados - Hooks para Onboarding de Empleados
 * Fase 5 del Plan de Empleados Competitivo
 * Enero 2026
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { profesionalesApi, onboardingEmpleadosApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import {
  calcularDiasRestantesDetallado as calcularDiasRestantesDetalladoLib,
  formatearFecha,
} from '@/lib/dateHelpers';

// ==================== QUERY KEYS ====================

export const onboardingKeys = {
  all: ['onboarding-empleados'],

  // Plantillas
  plantillas: () => [...onboardingKeys.all, 'plantillas'],
  plantillasList: (filters) => [...onboardingKeys.plantillas(), 'list', filters],
  plantillaDetail: (id) => [...onboardingKeys.plantillas(), 'detail', id],
  plantillasSugeridas: (profesionalId) => [...onboardingKeys.plantillas(), 'sugeridas', profesionalId],

  // Progreso
  progreso: () => [...onboardingKeys.all, 'progreso'],
  progresoByProfesional: (profesionalId) => [...onboardingKeys.progreso(), profesionalId],

  // Dashboard
  dashboard: () => [...onboardingKeys.all, 'dashboard'],
  dashboardData: (filters) => [...onboardingKeys.dashboard(), filters],
  tareasVencidas: (filters) => [...onboardingKeys.all, 'vencidas', filters],
};

// ==================== HOOKS DE PLANTILLAS ====================

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
      queryClient.invalidateQueries({ queryKey: onboardingKeys.plantillas() });
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
      queryClient.invalidateQueries({ queryKey: onboardingKeys.plantillas() });
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
      queryClient.invalidateQueries({ queryKey: onboardingKeys.plantillas() });
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

// ==================== HOOKS DE TAREAS ====================

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
      queryClient.invalidateQueries({ queryKey: onboardingKeys.plantillas() });
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

// ==================== HOOKS DE PROGRESO ====================

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
      queryClient.invalidateQueries({ queryKey: onboardingKeys.dashboard() });
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
      queryClient.invalidateQueries({ queryKey: onboardingKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.tareasVencidas({}) });
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
      queryClient.invalidateQueries({ queryKey: onboardingKeys.dashboard() });
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

// ==================== HOOKS DE DASHBOARD ====================

/**
 * Obtiene el dashboard de onboarding para RRHH
 * @param {Object} options
 */
export function useDashboardOnboarding(options = {}) {
  const { filtros = {}, enabled = true } = options;

  return useQuery({
    queryKey: onboardingKeys.dashboardData(filtros),
    queryFn: async () => {
      const response = await onboardingEmpleadosApi.obtenerDashboard(filtros);
      return response.data?.data || response.data;
    },
    enabled,
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

/**
 * Obtiene las tareas vencidas de todos los empleados
 * @param {Object} options
 */
export function useTareasVencidasOnboarding(options = {}) {
  const { filtros = {}, enabled = true } = options;

  return useQuery({
    queryKey: onboardingKeys.tareasVencidas(filtros),
    queryFn: async () => {
      const response = await onboardingEmpleadosApi.obtenerTareasVencidas(filtros);
      return response.data?.data || response.data;
    },
    enabled,
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

// ==================== UTILIDADES ====================

/**
 * Calcula el color del badge de estado de tarea
 * @param {string} estado - 'completada' | 'vencida' | 'hoy' | 'proxima' | 'pendiente'
 * @returns {string} Clase CSS de color
 */
export function getColorEstadoTarea(estado) {
  const colores = {
    completada: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    vencida: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    hoy: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    proxima: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    pendiente: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  };
  return colores[estado] || colores.pendiente;
}

/**
 * Calcula el icono del responsable de tarea
 * @param {string} tipo - 'empleado' | 'supervisor' | 'rrhh'
 * @returns {Object} { icono, label }
 */
export function getResponsableInfo(tipo) {
  const info = {
    empleado: { label: 'Empleado', color: 'text-primary-600 dark:text-primary-400' },
    supervisor: { label: 'Supervisor', color: 'text-secondary-600 dark:text-secondary-400' },
    rrhh: { label: 'RRHH', color: 'text-green-600 dark:text-green-400' },
  };
  return info[tipo] || info.empleado;
}

/**
 * Calcula el color de la barra de progreso
 * @param {number} porcentaje - Porcentaje de progreso (0-100)
 * @returns {string} Clase CSS de color
 */
export function getColorProgreso(porcentaje) {
  if (porcentaje >= 100) return 'bg-green-500';
  if (porcentaje >= 75) return 'bg-primary-500';
  if (porcentaje >= 50) return 'bg-yellow-500';
  if (porcentaje >= 25) return 'bg-orange-500';
  return 'bg-red-500';
}

/**
 * Formatea fecha para visualización
 * Re-exportado desde @/lib/dateHelpers
 */
export function formatearFechaOnboarding(fecha) {
  return formatearFecha(fecha);
}

/**
 * Calcula días restantes o vencidos
 * Re-exportado desde @/lib/dateHelpers
 */
export const calcularDiasRestantes = calcularDiasRestantesDetalladoLib;

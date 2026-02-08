/**
 * useDashboardOnboarding - Hooks para dashboard y estadísticas de onboarding
 */
import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { onboardingEmpleadosApi } from '@/services/api/endpoints';
import { onboardingKeys } from './onboardingKeys';
import {
  calcularDiasRestantesDetallado as calcularDiasRestantesDetalladoLib,
  formatearFecha,
} from '@/lib/dateHelpers';

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

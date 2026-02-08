/**
 * Onboarding Hooks - Barrel export
 * Hooks para Onboarding de Empleados - Fase 5 del Plan de Empleados Competitivo
 */

// Query keys
export { onboardingKeys } from './onboardingKeys';

// Plantillas
export {
  usePlantillasOnboarding,
  usePlantillaOnboarding,
  usePlantillasSugeridas,
  useCrearPlantilla,
  useActualizarPlantilla,
  useEliminarPlantilla,
} from './usePlantillasOnboarding';

// Tareas
export {
  useCrearTarea,
  useActualizarTarea,
  useEliminarTarea,
  useReordenarTareas,
} from './useTareasOnboarding';

// Progreso
export {
  useProgresoOnboarding,
  useAplicarPlantilla,
  useMarcarTareaOnboarding,
  useEliminarProgresoOnboarding,
} from './useProgresoOnboarding';

// Dashboard y estadísticas
export {
  useDashboardOnboarding,
  useTareasVencidasOnboarding,
  getColorEstadoTarea,
  getResponsableInfo,
  getColorProgreso,
  formatearFechaOnboarding,
  calcularDiasRestantes,
} from './useDashboardOnboarding';

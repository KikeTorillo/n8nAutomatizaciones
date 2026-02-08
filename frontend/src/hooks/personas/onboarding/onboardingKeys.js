/**
 * onboardingKeys - Query keys para Onboarding de Empleados
 * Centralizados para reutilización en hooks
 */

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

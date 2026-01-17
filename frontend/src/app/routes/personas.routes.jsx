/**
 * Rutas de Personas
 * Incluye clientes, profesionales, vacaciones, ausencias, etc.
 */

import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { protectedRoute, ROLES } from './helpers/routeHelpers';

// Clientes
const ClientesPage = lazy(() => import('@/pages/clientes/ClientesPage'));
const ClienteFormPage = lazy(() => import('@/pages/clientes/ClienteFormPage'));
const ClienteDetailPage = lazy(() => import('@/pages/clientes/ClienteDetailPage'));
const EtiquetasPage = lazy(() => import('@/pages/clientes/EtiquetasPage'));
const OportunidadesPage = lazy(() => import('@/pages/clientes/OportunidadesPage'));

// Profesionales
const ProfesionalesPage = lazy(() => import('@/pages/profesionales/ProfesionalesPage'));
const ProfesionalDetailPage = lazy(() => import('@/pages/profesionales/ProfesionalDetailPage'));
const NuevoProfesionalWizard = lazy(() => import('@/pages/profesionales/NuevoProfesionalWizard'));
const OrganigramaPage = lazy(() => import('@/pages/organizacion/OrganigramaPage'));

// Ausencias y Vacaciones
const AusenciasPage = lazy(() => import('@/pages/ausencias/AusenciasPage'));

// Mi Perfil (Autoservicio)
const MiPerfilPage = lazy(() => import('@/pages/mi-perfil/MiPerfilPage'));

// Onboarding Empleados
const OnboardingAdminPage = lazy(() => import('@/pages/onboarding-empleados/OnboardingAdminPage'));

export const personasRoutes = [
  // Clientes
  protectedRoute('clientes', ClientesPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),
  protectedRoute('clientes/nuevo', ClienteFormPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),
  protectedRoute('clientes/:id', ClienteDetailPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),
  protectedRoute('clientes/:id/editar', ClienteFormPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),
  protectedRoute('clientes/etiquetas', EtiquetasPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),
  protectedRoute('clientes/oportunidades', OportunidadesPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),

  // Profesionales (rutas específicas ANTES de rutas dinámicas :id)
  protectedRoute('profesionales', ProfesionalesPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),
  protectedRoute('profesionales/nuevo', NuevoProfesionalWizard, { requiredRole: ROLES.ALL_AUTHENTICATED }),
  protectedRoute('profesionales/organigrama', OrganigramaPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),
  // Redirect: Incapacidades ahora está en /ausencias
  {
    path: 'profesionales/incapacidades',
    element: <Navigate to="/ausencias?tab=incapacidades" replace />,
  },
  protectedRoute('profesionales/:id', ProfesionalDetailPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),
  protectedRoute('profesionales/:id/:tab', ProfesionalDetailPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),

  // Ausencias (módulo unificado vacaciones + incapacidades)
  protectedRoute('ausencias', AusenciasPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),

  // Mi Perfil (Portal Autoservicio)
  protectedRoute('mi-perfil', MiPerfilPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),

  // Onboarding Empleados (solo admin)
  protectedRoute('onboarding-empleados', OnboardingAdminPage, { requiredRole: ROLES.ADMIN_ONLY }),
];

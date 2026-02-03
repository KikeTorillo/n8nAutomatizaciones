/**
 * Rutas de Personas
 * Incluye clientes, profesionales, vacaciones, ausencias, etc.
 */

import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { protectedRoute, ROLES } from './helpers/routeHelpers';

// Clientes
const ClientesPage = lazy(() => import('@/pages/clientes/ClientesPage'));
const ClienteDetailPage = lazy(() => import('@/pages/clientes/ClienteDetailPage'));
const EtiquetasPage = lazy(() => import('@/pages/clientes/EtiquetasPage'));
const OportunidadesPage = lazy(() => import('@/pages/clientes/OportunidadesPage'));

// Profesionales
const ProfesionalesPage = lazy(() => import('@/pages/profesionales/ProfesionalesPage'));
const ProfesionalDetailPage = lazy(() => import('@/pages/profesionales/ProfesionalDetailPage'));
const OrganigramaPage = lazy(() => import('@/pages/organizacion/OrganigramaPage'));
const CategoriasProfesionalPage = lazy(() => import('@/pages/profesionales/CategoriasProfesionalPage'));

// Ausencias y Vacaciones
const AusenciasPage = lazy(() => import('@/pages/ausencias/AusenciasPage'));

// Mi Perfil (Autoservicio)
const MiPerfilPage = lazy(() => import('@/pages/mi-perfil/MiPerfilPage'));

// Mi Cuenta (Accesible para todos)
const MiCuentaPage = lazy(() => import('@/pages/mi-cuenta/MiCuentaPage'));

// Onboarding Empleados
const OnboardingAdminPage = lazy(() => import('@/pages/onboarding-empleados/OnboardingAdminPage'));

export const personasRoutes = [
  // Clientes
  protectedRoute('clientes', ClientesPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),
  // Nota: /clientes/nuevo y /clientes/:id/editar eliminadas - ahora usan ClienteFormDrawer
  protectedRoute('clientes/:id', ClienteDetailPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),
  // Redirect para URLs antiguas de edición
  {
    path: 'clientes/:id/editar',
    element: <Navigate to=".." replace />,
  },
  protectedRoute('clientes/etiquetas', EtiquetasPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),
  protectedRoute('clientes/oportunidades', OportunidadesPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),

  // Profesionales (solo admin - FIX RBAC Ene 2026)
  protectedRoute('profesionales', ProfesionalesPage, { requiredRole: ROLES.ADMIN_ONLY }),
  protectedRoute('profesionales/organigrama', OrganigramaPage, { requiredRole: ROLES.ADMIN_ONLY }),
  protectedRoute('profesionales/categorias', CategoriasProfesionalPage, { requiredRole: ROLES.ADMIN_ONLY }),
  // Redirect: Incapacidades ahora está en /ausencias
  {
    path: 'profesionales/incapacidades',
    element: <Navigate to="/ausencias?tab=incapacidades" replace />,
  },
  protectedRoute('profesionales/:id', ProfesionalDetailPage, { requiredRole: ROLES.ADMIN_ONLY }),
  protectedRoute('profesionales/:id/:tab', ProfesionalDetailPage, { requiredRole: ROLES.ADMIN_ONLY }),

  // Ausencias (módulo unificado vacaciones + incapacidades)
  protectedRoute('ausencias', AusenciasPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),

  // Mi Perfil (Portal Autoservicio)
  protectedRoute('mi-perfil', MiPerfilPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),

  // Mi Cuenta (Gestión de cuenta - Accesible para todos)
  protectedRoute('mi-cuenta', MiCuentaPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),

  // Onboarding Empleados (solo admin)
  protectedRoute('onboarding-empleados', OnboardingAdminPage, { requiredRole: ROLES.ADMIN_ONLY }),
];

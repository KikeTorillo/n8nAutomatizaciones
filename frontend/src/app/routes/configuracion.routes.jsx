/**
 * Rutas de Configuración
 * Incluye negocio, módulos, permisos, usuarios, workflows, etc.
 */

import { lazy } from 'react';
import { protectedRoute, ROLES } from './helpers/routeHelpers';

// Configuración General
const ConfiguracionPage = lazy(() => import('@/pages/configuracion/ConfiguracionPage'));
const NegocioPage = lazy(() => import('@/pages/configuracion/NegocioPage'));
const ModulosPage = lazy(() => import('@/pages/configuracion/ModulosPage'));
const RecordatoriosPage = lazy(() => import('@/pages/configuracion/RecordatoriosPage'));

// Organización
const DepartamentosPage = lazy(() => import('@/pages/configuracion/DepartamentosPage'));
const PuestosPage = lazy(() => import('@/pages/configuracion/PuestosPage'));
const CategoriasConfigPage = lazy(() => import('@/pages/configuracion/CategoriasPage'));
const DiasFestivosPage = lazy(() => import('@/pages/configuracion/DiasFestivosPage'));

// Usuarios, Roles y Permisos
const RolesPage = lazy(() => import('@/pages/configuracion/RolesPage'));
const PermisosPage = lazy(() => import('@/pages/configuracion/PermisosPage'));
const UsuariosPage = lazy(() => import('@/pages/configuracion/UsuariosPage'));

// Monedas
const MonedasPage = lazy(() => import('@/pages/configuracion/MonedasPage'));

// Workflows
const WorkflowsListPage = lazy(() => import('@/pages/configuracion/workflows/WorkflowsListPage'));
const WorkflowDesignerPage = lazy(() => import('@/pages/configuracion/workflows/WorkflowDesignerPage'));

export const configuracionRoutes = [
  // Configuración General
  protectedRoute('configuracion', ConfiguracionPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),
  protectedRoute('configuracion/negocio', NegocioPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),
  protectedRoute('configuracion/modulos', ModulosPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),
  protectedRoute('recordatorios', RecordatoriosPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),

  // Organización (solo admin)
  protectedRoute('configuracion/departamentos', DepartamentosPage, { requiredRole: ROLES.ADMIN_ONLY }),
  protectedRoute('configuracion/puestos', PuestosPage, { requiredRole: ROLES.ADMIN_ONLY }),
  protectedRoute('configuracion/categorias', CategoriasConfigPage, { requiredRole: ROLES.ADMIN_ONLY }),
  protectedRoute('configuracion/dias-festivos', DiasFestivosPage, { requiredRole: ROLES.ADMIN_ONLY }),

  // Usuarios, Roles y Permisos (solo admin)
  protectedRoute('configuracion/roles', RolesPage, { requiredRole: ROLES.ADMIN_ONLY }),
  protectedRoute('configuracion/permisos', PermisosPage, { requiredRole: ROLES.ADMIN_ONLY }),
  protectedRoute('configuracion/usuarios', UsuariosPage, { requiredRole: ROLES.ADMIN_ONLY }),

  // Monedas (solo admin)
  protectedRoute('configuracion/monedas', MonedasPage, { requiredRole: ROLES.ADMIN_ONLY }),

  // Workflows (solo admin)
  protectedRoute('configuracion/workflows', WorkflowsListPage, { requiredRole: ROLES.ADMIN_ONLY }),
  protectedRoute('configuracion/workflows/nuevo', WorkflowDesignerPage, { requiredRole: ROLES.ADMIN_ONLY }),
  protectedRoute('configuracion/workflows/:id', WorkflowDesignerPage, { requiredRole: ROLES.ADMIN_ONLY }),
];

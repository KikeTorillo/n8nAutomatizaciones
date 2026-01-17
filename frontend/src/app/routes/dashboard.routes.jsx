/**
 * Rutas del Dashboard y Módulos Principales
 * Incluye home, dashboard, servicios, citas, chatbots, comisiones, marketplace, eventos, etc.
 */

import { lazy } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { protectedRoute, withSuspense, ROLES } from './helpers/routeHelpers';
import { lazyLoadWithRetry } from '@/utils/lazyLoadWithRetry';

// Home y Dashboard
const AppHomePage = lazy(() => import('@/pages/home/AppHomePage'));
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'));

// Servicios y Citas
const ServiciosPage = lazy(() => import('@/pages/servicios/ServiciosPage'));
const CitasPage = lazy(() => import('@/pages/citas/CitasPage'));

// Chatbots
const ChatbotsPage = lazy(() => import('@/pages/chatbots/ChatbotsPage'));

// Comisiones
const ComisionesPage = lazy(() => import('@/pages/comisiones/ComisionesPage'));
const ConfiguracionComisionesPage = lazy(() => import('@/pages/comisiones/ConfiguracionComisionesPage'));
const ReportesComisionesPage = lazy(() => import('@/pages/comisiones/ReportesComisionesPage'));

// Marketplace (privado)
const MiMarketplacePage = lazy(() => import('@/pages/marketplace/MiMarketplacePage'));

// Eventos Digitales (protegidos)
const EventosPage = lazy(() => import('@/pages/eventos-digitales/EventosPage'));
const EventoDetailPage = lazy(() => import('@/pages/eventos-digitales/EventoDetailPage'));
const EventoFormPage = lazy(() => import('@/pages/eventos-digitales/EventoFormPage'));

// Website
const WebsiteEditorPage = lazy(() => import('@/pages/website/WebsiteEditorPage'));

// Notificaciones
const NotificacionesPage = lazy(() => import('@/pages/notificaciones/NotificacionesPage'));
const NotificacionesPreferenciasPage = lazy(() => import('@/pages/notificaciones/NotificacionesPreferenciasPage'));

// Aprobaciones (con retry para chunks problemáticos)
const AprobacionesPage = lazyLoadWithRetry(
  () => import('@/pages/aprobaciones/AprobacionesPage'),
  'AprobacionesPage'
);

export const dashboardRoutes = [
  // Home (super_admin NO tiene acceso - es usuario de plataforma sin organización)
  {
    path: 'home',
    element: (
      <ProtectedRoute excludeRoles="super_admin" redirectTo="/superadmin">
        {withSuspense(AppHomePage)}
      </ProtectedRoute>
    ),
  },

  // Dashboard
  protectedRoute('dashboard', Dashboard, { requiredRole: ROLES.ALL_AUTHENTICATED }),

  // Servicios y Citas
  protectedRoute('servicios', ServiciosPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),
  protectedRoute('citas', CitasPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),

  // Chatbots (solo admin)
  protectedRoute('chatbots', ChatbotsPage, { requiredRole: ROLES.ADMIN_ONLY }),

  // Comisiones (solo admin)
  protectedRoute('comisiones', ComisionesPage, { requiredRole: ROLES.ADMIN_ONLY }),
  protectedRoute('comisiones/configuracion', ConfiguracionComisionesPage, { requiredRole: ROLES.ADMIN_ONLY }),
  protectedRoute('comisiones/reportes', ReportesComisionesPage, { requiredRole: ROLES.ADMIN_ONLY }),

  // Marketplace (privado, solo admin)
  protectedRoute('mi-marketplace', MiMarketplacePage, { requiredRole: ROLES.ADMIN_ONLY }),

  // Eventos Digitales (protegidos, solo admin)
  protectedRoute('eventos-digitales', EventosPage, { requiredRole: ROLES.ADMIN_ONLY }),
  protectedRoute('eventos-digitales/nuevo', EventoFormPage, { requiredRole: ROLES.ADMIN_ONLY }),
  protectedRoute('eventos-digitales/:id', EventoDetailPage, { requiredRole: ROLES.ADMIN_ONLY }),
  protectedRoute('eventos-digitales/:id/editar', EventoFormPage, { requiredRole: ROLES.ADMIN_ONLY }),

  // Website
  protectedRoute('website', WebsiteEditorPage, { requiredRole: ROLES.ADMIN_ONLY }),

  // Notificaciones
  protectedRoute('notificaciones', NotificacionesPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),
  protectedRoute('notificaciones/preferencias', NotificacionesPreferenciasPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),

  // Aprobaciones
  protectedRoute('aprobaciones', AprobacionesPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),
];

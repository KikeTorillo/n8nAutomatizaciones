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
const AprobacionesPendientesPage = lazyLoadWithRetry(
  () => import('@/pages/aprobaciones/AprobacionesPendientesPage'),
  'AprobacionesPendientesPage'
);
const AprobacionesHistorialPage = lazyLoadWithRetry(
  () => import('@/pages/aprobaciones/AprobacionesHistorialPage'),
  'AprobacionesHistorialPage'
);

export const dashboardRoutes = [
  // Home - Ene 2026: super_admin ahora tiene organización (Nexo Team)
  protectedRoute('home', AppHomePage, { requiredRole: ROLES.ALL_AUTHENTICATED }),

  // Dashboard
  protectedRoute('dashboard', Dashboard, { requiredRole: ROLES.ALL_AUTHENTICATED }),

  // Servicios y Citas (requieren módulo agendamiento)
  protectedRoute('servicios', ServiciosPage, { requiredRole: ROLES.ALL_AUTHENTICATED, requiredModule: 'agendamiento' }),
  protectedRoute('citas', CitasPage, { requiredRole: ROLES.ALL_AUTHENTICATED, requiredModule: 'agendamiento' }),

  // Chatbots (solo admin, requiere módulo chatbots)
  protectedRoute('chatbots', ChatbotsPage, { requiredRole: ROLES.ADMIN_ONLY, requiredModule: 'chatbots' }),

  // Comisiones (solo admin, requiere módulo comisiones)
  protectedRoute('comisiones', ComisionesPage, { requiredRole: ROLES.ADMIN_ONLY, requiredModule: 'comisiones' }),
  protectedRoute('comisiones/configuracion', ConfiguracionComisionesPage, { requiredRole: ROLES.ADMIN_ONLY, requiredModule: 'comisiones' }),
  protectedRoute('comisiones/reportes', ReportesComisionesPage, { requiredRole: ROLES.ADMIN_ONLY, requiredModule: 'comisiones' }),

  // Marketplace (privado, solo admin, requiere módulo marketplace)
  protectedRoute('mi-marketplace', MiMarketplacePage, { requiredRole: ROLES.ADMIN_ONLY, requiredModule: 'marketplace' }),

  // Eventos Digitales (protegidos, solo admin, requiere módulo eventos-digitales)
  protectedRoute('eventos-digitales', EventosPage, { requiredRole: ROLES.ADMIN_ONLY, requiredModule: 'eventos-digitales' }),
  protectedRoute('eventos-digitales/nuevo', EventoFormPage, { requiredRole: ROLES.ADMIN_ONLY, requiredModule: 'eventos-digitales' }),
  protectedRoute('eventos-digitales/:id', EventoDetailPage, { requiredRole: ROLES.ADMIN_ONLY, requiredModule: 'eventos-digitales' }),
  protectedRoute('eventos-digitales/:id/editar', EventoFormPage, { requiredRole: ROLES.ADMIN_ONLY, requiredModule: 'eventos-digitales' }),

  // Website
  protectedRoute('website', WebsiteEditorPage, { requiredRole: ROLES.ADMIN_ONLY }),

  // Notificaciones
  protectedRoute('notificaciones', NotificacionesPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),
  protectedRoute('notificaciones/preferencias', NotificacionesPreferenciasPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),

  // Aprobaciones
  protectedRoute('aprobaciones', AprobacionesPendientesPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),
  protectedRoute('aprobaciones/historial', AprobacionesHistorialPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),
];

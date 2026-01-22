/**
 * Rutas de Suscripciones Negocio
 * Módulo de gestión de suscripciones SaaS para negocios.
 */

import { lazy } from 'react';
import { protectedRoute, ROLES } from './helpers/routeHelpers';

// Lazy load pages
const SuscripcionesNegocioPage = lazy(() => import('@/pages/suscripciones-negocio/SuscripcionesNegocioPage'));
const PlanesPage = lazy(() => import('@/pages/suscripciones-negocio/PlanesPage'));
const SuscripcionesListPage = lazy(() => import('@/pages/suscripciones-negocio/SuscripcionesListPage'));
const SuscripcionDetailPage = lazy(() => import('@/pages/suscripciones-negocio/SuscripcionDetailPage'));
const CuponesPage = lazy(() => import('@/pages/suscripciones-negocio/CuponesPage'));
const PagosPage = lazy(() => import('@/pages/suscripciones-negocio/PagosPage'));
const MetricasPage = lazy(() => import('@/pages/suscripciones-negocio/MetricasPage'));

export const suscripcionesNegocioRoutes = [
  // Dashboard principal
  protectedRoute('suscripciones-negocio', SuscripcionesNegocioPage, {
    requiredRole: ROLES.ADMIN_ONLY,
    requiredModule: 'suscripciones-negocio',
  }),

  // Planes de suscripción
  protectedRoute('suscripciones-negocio/planes', PlanesPage, {
    requiredRole: ROLES.ADMIN_ONLY,
    requiredModule: 'suscripciones-negocio',
  }),

  // Listado de suscripciones
  protectedRoute('suscripciones-negocio/suscripciones', SuscripcionesListPage, {
    requiredRole: ROLES.ADMIN_ONLY,
    requiredModule: 'suscripciones-negocio',
  }),

  // Detalle de suscripción
  protectedRoute('suscripciones-negocio/suscripciones/:id', SuscripcionDetailPage, {
    requiredRole: ROLES.ADMIN_ONLY,
    requiredModule: 'suscripciones-negocio',
  }),

  // Cupones de descuento
  protectedRoute('suscripciones-negocio/cupones', CuponesPage, {
    requiredRole: ROLES.ADMIN_ONLY,
    requiredModule: 'suscripciones-negocio',
  }),

  // Historial de pagos
  protectedRoute('suscripciones-negocio/pagos', PagosPage, {
    requiredRole: ROLES.ADMIN_ONLY,
    requiredModule: 'suscripciones-negocio',
  }),

  // Métricas y análisis
  protectedRoute('suscripciones-negocio/metricas', MetricasPage, {
    requiredRole: ROLES.ADMIN_ONLY,
    requiredModule: 'suscripciones-negocio',
  }),
];

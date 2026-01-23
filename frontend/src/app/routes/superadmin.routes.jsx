/**
 * Rutas de Super Admin
 * Rutas anidadas bajo el layout de Super Admin
 */

import { lazy, Suspense } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { withSuspense, loadingFallback, ROLES } from './helpers/routeHelpers';

// Super Admin Layout y páginas
const SuperAdminLayout = lazy(() => import('@/components/superadmin/SuperAdminLayout'));
const SuperAdminDashboard = lazy(() => import('@/pages/superadmin/Dashboard'));
const MarketplaceGestion = lazy(() => import('@/pages/superadmin/MarketplaceGestion'));
const PlantillasEventos = lazy(() => import('@/pages/superadmin/PlantillasEventos'));

/**
 * Rutas de Super Admin con nested routes
 * Requiere estructura especial porque tiene un layout propio con children
 *
 * Dashboard ahora incluye el listado de organizaciones consolidado
 */
export const superadminRoutes = [
  {
    path: 'superadmin',
    element: (
      <ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}>
        <Suspense fallback={loadingFallback}>
          <SuperAdminLayout />
        </Suspense>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: withSuspense(SuperAdminDashboard),
      },
      {
        path: 'marketplace',
        element: withSuspense(MarketplaceGestion),
      },
      {
        path: 'plantillas-eventos',
        element: withSuspense(PlantillasEventos),
      },
    ],
  },
];

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
const SuperAdminOrganizaciones = lazy(() => import('@/pages/superadmin/Organizaciones'));
const SuperAdminPlanes = lazy(() => import('@/pages/superadmin/Planes'));
const MarketplaceGestion = lazy(() => import('@/pages/superadmin/MarketplaceGestion'));
const PlantillasEventos = lazy(() => import('@/pages/superadmin/PlantillasEventos'));

/**
 * Rutas de Super Admin con nested routes
 * Requiere estructura especial porque tiene un layout propio con children
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
        path: 'organizaciones',
        element: withSuspense(SuperAdminOrganizaciones),
      },
      {
        path: 'planes',
        element: withSuspense(SuperAdminPlanes),
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

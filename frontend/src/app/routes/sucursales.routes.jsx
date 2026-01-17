/**
 * Rutas de Sucursales
 * Incluye gestión de sucursales, transferencias, dashboard multi-sucursal
 */

import { lazy } from 'react';
import { protectedRoute, ROLES } from './helpers/routeHelpers';

// Sucursales
const SucursalesPage = lazy(() => import('@/pages/sucursales/SucursalesPage'));
const SucursalDetailPage = lazy(() => import('@/pages/sucursales/SucursalDetailPage'));
const TransferenciasPage = lazy(() => import('@/pages/sucursales/TransferenciasPage'));
const TransferenciaDetailPage = lazy(() => import('@/pages/sucursales/TransferenciaDetailPage'));
const DashboardSucursalesPage = lazy(() => import('@/pages/sucursales/DashboardSucursalesPage'));

export const sucursalesRoutes = [
  // Lista de sucursales
  protectedRoute('sucursales', SucursalesPage, { requiredRole: ROLES.ADMIN_ONLY }),

  // Rutas específicas ANTES de rutas dinámicas (:id)
  protectedRoute('sucursales/dashboard', DashboardSucursalesPage, { requiredRole: ROLES.ADMIN_ONLY }),
  protectedRoute('sucursales/transferencias', TransferenciasPage, { requiredRole: ROLES.ADMIN_ONLY }),
  protectedRoute('sucursales/transferencias/:id', TransferenciaDetailPage, { requiredRole: ROLES.ADMIN_ONLY }),

  // Detalle de sucursal (ruta dinámica al final)
  protectedRoute('sucursales/:id', SucursalDetailPage, { requiredRole: ROLES.ADMIN_ONLY }),
];

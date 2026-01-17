/**
 * Rutas de Punto de Venta (POS)
 * Incluye ventas, corte de caja, promociones, cupones, etc.
 */

import { lazy } from 'react';
import { protectedRoute, ROLES } from './helpers/routeHelpers';

// POS
const VentaPOSPage = lazy(() => import('@/pages/pos/VentaPOSPage'));
const VentasListPage = lazy(() => import('@/pages/pos/VentasListPage'));
const CorteCajaPage = lazy(() => import('@/pages/pos/CorteCajaPage'));
const ReporteVentasDiariasPage = lazy(() => import('@/pages/pos/ReporteVentasDiariasPage'));
const PromocionesPage = lazy(() => import('@/pages/pos/PromocionesPage'));
const CuponesPage = lazy(() => import('@/pages/pos/CuponesPage'));
const LealtadPage = lazy(() => import('@/pages/pos/LealtadPage'));

export const posRoutes = [
  // Venta (acceso para todo el equipo)
  protectedRoute('pos/venta', VentaPOSPage, { requiredRole: ROLES.TEAM }),
  protectedRoute('pos/ventas', VentasListPage, { requiredRole: ROLES.TEAM }),

  // Administración (solo admin)
  protectedRoute('pos/corte-caja', CorteCajaPage, { requiredRole: ROLES.ADMIN_ONLY }),
  protectedRoute('pos/reportes', ReporteVentasDiariasPage, { requiredRole: ROLES.ADMIN_ONLY }),
  protectedRoute('pos/promociones', PromocionesPage, { requiredRole: ROLES.ADMIN_ONLY }),
  protectedRoute('pos/cupones', CuponesPage, { requiredRole: ROLES.ADMIN_ONLY }),
  protectedRoute('pos/lealtad', LealtadPage, { requiredRole: ROLES.ADMIN_ONLY }),
];

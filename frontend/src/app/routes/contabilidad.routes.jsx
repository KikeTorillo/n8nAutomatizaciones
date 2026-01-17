/**
 * Rutas de Contabilidad
 * Incluye cuentas contables, asientos, reportes, etc.
 */

import { lazy } from 'react';
import { protectedRoute, ROLES } from './helpers/routeHelpers';

// Contabilidad
const ContabilidadPage = lazy(() => import('@/pages/contabilidad/ContabilidadPage'));
const CuentasContablesPage = lazy(() => import('@/pages/contabilidad/CuentasContablesPage'));
const AsientosContablesPage = lazy(() => import('@/pages/contabilidad/AsientosContablesPage'));
const ReportesContablesPage = lazy(() => import('@/pages/contabilidad/ReportesContablesPage'));
const ConfiguracionContablePage = lazy(() => import('@/pages/contabilidad/ConfiguracionContablePage'));

export const contabilidadRoutes = [
  protectedRoute('contabilidad', ContabilidadPage, { requiredRole: ROLES.ADMIN_ONLY }),
  protectedRoute('contabilidad/cuentas', CuentasContablesPage, { requiredRole: ROLES.ADMIN_ONLY }),
  protectedRoute('contabilidad/asientos', AsientosContablesPage, { requiredRole: ROLES.ADMIN_ONLY }),
  protectedRoute('contabilidad/reportes', ReportesContablesPage, { requiredRole: ROLES.ADMIN_ONLY }),
  protectedRoute('contabilidad/configuracion', ConfiguracionContablePage, { requiredRole: ROLES.ADMIN_ONLY }),
];

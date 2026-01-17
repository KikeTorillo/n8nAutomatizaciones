/**
 * Helpers para configuración de rutas
 * Proporciona utilidades para crear rutas protegidas y públicas de manera consistente
 */

import { Suspense } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ChunkErrorBoundary from '@/components/common/ChunkErrorBoundary';

/**
 * Fallback de carga mientras se carga el componente lazy
 */
export const loadingFallback = (
  <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

/**
 * Envuelve un componente con Suspense y ChunkErrorBoundary
 * @param {React.LazyExoticComponent} Component - Componente lazy a envolver
 * @returns {JSX.Element}
 */
export const withSuspense = (Component) => (
  <ChunkErrorBoundary>
    <Suspense fallback={loadingFallback}>
      <Component />
    </Suspense>
  </ChunkErrorBoundary>
);

/**
 * Crea una ruta protegida con las opciones especificadas
 * @param {string} path - Ruta del path
 * @param {React.LazyExoticComponent} Component - Componente lazy
 * @param {Object} options - Opciones de ProtectedRoute
 * @param {string|string[]} [options.requiredRole] - Roles permitidos
 * @param {string|string[]} [options.excludeRoles] - Roles excluidos
 * @param {string} [options.redirectTo] - Redirección si no tiene acceso
 * @returns {Object} Objeto de configuración de ruta
 */
export const protectedRoute = (path, Component, options = {}) => ({
  path,
  element: (
    <ProtectedRoute {...options}>
      {withSuspense(Component)}
    </ProtectedRoute>
  ),
});

/**
 * Crea una ruta pública sin protección
 * @param {string} path - Ruta del path
 * @param {React.LazyExoticComponent} Component - Componente lazy
 * @returns {Object} Objeto de configuración de ruta
 */
export const publicRoute = (path, Component) => ({
  path,
  element: withSuspense(Component),
});

/**
 * Crea una ruta con index
 * @param {React.LazyExoticComponent} Component - Componente lazy
 * @param {Object} [options] - Opciones de ProtectedRoute (si se pasa, es protegida)
 * @returns {Object} Objeto de configuración de ruta index
 */
export const indexRoute = (Component, options = null) => ({
  index: true,
  element: options
    ? (
        <ProtectedRoute {...options}>
          {withSuspense(Component)}
        </ProtectedRoute>
      )
    : withSuspense(Component),
});

/**
 * Constantes de roles comunes para reutilizar
 */
export const ROLES = {
  ADMIN_ONLY: ['admin', 'propietario'],
  TEAM: ['admin', 'propietario', 'empleado'],
  SUPER_ADMIN: ['super_admin'],
  ALL_AUTHENTICATED: undefined, // Sin restricción de rol, solo autenticado
};

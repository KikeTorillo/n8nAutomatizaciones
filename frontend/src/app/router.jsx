import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Lazy loading de páginas
import { lazy, Suspense } from 'react';

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

// Lazy load de páginas
const LandingPage = lazy(() => import('@/pages/landing/LandingPage'));
const LoginPage = lazy(() => import('@/pages/auth/Login'));
const OnboardingFlow = lazy(() => import('@/pages/onboarding/OnboardingFlow'));
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'));

// Páginas de Clientes
const ClientesPage = lazy(() => import('@/pages/clientes/ClientesPage'));
const ClienteFormPage = lazy(() => import('@/pages/clientes/ClienteFormPage'));
const ClienteDetailPage = lazy(() => import('@/pages/clientes/ClienteDetailPage'));

// Páginas de Servicios
const ServiciosPage = lazy(() => import('@/pages/servicios/ServiciosPage'));

// Páginas de Profesionales
const ProfesionalesPage = lazy(() => import('@/pages/profesionales/ProfesionalesPage'));

// Páginas de Citas
const CitasPage = lazy(() => import('@/pages/citas/CitasPage'));

// Páginas de Bloqueos
const BloqueosPage = lazy(() => import('@/pages/bloqueos/BloqueosPage'));

// Wrapper para lazy loading
const withSuspense = (Component) => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  );
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: withSuspense(LandingPage),
      },
      {
        path: 'login',
        element: withSuspense(LoginPage),
      },
      {
        path: 'onboarding',
        element: withSuspense(OnboardingFlow),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            {withSuspense(Dashboard)}
          </ProtectedRoute>
        ),
      },
      // Rutas de Clientes
      {
        path: 'clientes',
        element: (
          <ProtectedRoute>
            {withSuspense(ClientesPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'clientes/nuevo',
        element: (
          <ProtectedRoute>
            {withSuspense(ClienteFormPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'clientes/:id',
        element: (
          <ProtectedRoute>
            {withSuspense(ClienteDetailPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'clientes/:id/editar',
        element: (
          <ProtectedRoute>
            {withSuspense(ClienteFormPage)}
          </ProtectedRoute>
        ),
      },
      // Rutas de Servicios
      {
        path: 'servicios',
        element: (
          <ProtectedRoute>
            {withSuspense(ServiciosPage)}
          </ProtectedRoute>
        ),
      },
      // Rutas de Profesionales
      {
        path: 'profesionales',
        element: (
          <ProtectedRoute>
            {withSuspense(ProfesionalesPage)}
          </ProtectedRoute>
        ),
      },
      // Rutas de Citas
      {
        path: 'citas',
        element: (
          <ProtectedRoute>
            {withSuspense(CitasPage)}
          </ProtectedRoute>
        ),
      },
      // Rutas de Bloqueos
      {
        path: 'bloqueos',
        element: (
          <ProtectedRoute>
            {withSuspense(BloqueosPage)}
          </ProtectedRoute>
        ),
      },
      // Agregar más rutas protegidas aquí
      // {
      //   path: 'settings',
      //   element: (
      //     <ProtectedRoute requiredRole={['admin', 'propietario']}>
      //       {withSuspense(SettingsPage)}
      //     </ProtectedRoute>
      //   ),
      // },
    ],
  },
]);

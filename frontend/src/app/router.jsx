import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Lazy loading de páginas
import { lazy, Suspense } from 'react';

// Lazy load de páginas
const LandingPage = lazy(() => import('@/pages/landing/LandingPage'));
const LoginPage = lazy(() => import('@/pages/auth/Login'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPassword'));
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

// Páginas de Chatbots
const ChatbotsPage = lazy(() => import('@/pages/chatbots/ChatbotsPage'));

// Páginas de Super Admin
const SuperAdminLayout = lazy(() => import('@/components/superadmin/SuperAdminLayout'));
const SuperAdminDashboard = lazy(() => import('@/pages/superadmin/Dashboard'));
const SuperAdminOrganizaciones = lazy(() => import('@/pages/superadmin/Organizaciones'));
const SuperAdminPlanes = lazy(() => import('@/pages/superadmin/Planes'));

// Página de Setup Inicial
const InitialSetup = lazy(() => import('@/pages/setup/InitialSetup'));

// Loading fallback
const loadingFallback = (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

// Wrapper para lazy loading
// eslint-disable-next-line no-unused-vars
const withSuspense = (Component) => (
  <Suspense fallback={loadingFallback}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: withSuspense(LandingPage),
      },
      // Rutas de autenticación
      {
        path: 'auth/login',
        element: withSuspense(LoginPage),
      },
      {
        path: 'auth/forgot-password',
        element: withSuspense(ForgotPasswordPage),
      },
      {
        path: 'auth/reset-password/:token',
        element: withSuspense(ResetPasswordPage),
      },
      // Mantener ruta legacy de login sin /auth/ para compatibilidad
      {
        path: 'login',
        element: withSuspense(LoginPage),
      },
      // Ruta de setup inicial (primera vez)
      {
        path: 'setup',
        element: withSuspense(InitialSetup),
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
      // Rutas de Chatbots
      {
        path: 'chatbots',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(ChatbotsPage)}
          </ProtectedRoute>
        ),
      },
      // Rutas de Super Admin (requiere rol super_admin)
      {
        path: 'superadmin',
        element: (
          <ProtectedRoute requiredRole={['super_admin']}>
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
        ],
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

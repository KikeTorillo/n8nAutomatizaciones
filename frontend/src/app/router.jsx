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

// Páginas de Comisiones
const ComisionesPage = lazy(() => import('@/pages/comisiones/ComisionesPage'));
const ConfiguracionComisionesPage = lazy(() => import('@/pages/comisiones/ConfiguracionComisionesPage'));
const ReportesComisionesPage = lazy(() => import('@/pages/comisiones/ReportesComisionesPage'));

// Páginas de Inventario
const ProductosPage = lazy(() => import('@/pages/inventario/ProductosPage'));
const CategoriasPage = lazy(() => import('@/pages/inventario/CategoriasPage'));
const ProveedoresPage = lazy(() => import('@/pages/inventario/ProveedoresPage'));
const MovimientosPage = lazy(() => import('@/pages/inventario/MovimientosPage'));
const AlertasPage = lazy(() => import('@/pages/inventario/AlertasPage'));
const ReportesInventarioPage = lazy(() => import('@/pages/inventario/ReportesInventarioPage'));
const OrdenesCompraPage = lazy(() => import('@/pages/inventario/OrdenesCompraPage'));

// Páginas de Punto de Venta (POS)
const VentaPOSPage = lazy(() => import('@/pages/pos/VentaPOSPage'));
const VentasListPage = lazy(() => import('@/pages/pos/VentasListPage'));
const CorteCajaPage = lazy(() => import('@/pages/pos/CorteCajaPage'));
const ReporteVentasDiariasPage = lazy(() => import('@/pages/pos/ReporteVentasDiariasPage'));

// Páginas de Marketplace
const DirectorioMarketplacePage = lazy(() => import('@/pages/marketplace/DirectorioMarketplacePage'));
const PerfilPublicoPage = lazy(() => import('@/pages/marketplace/PerfilPublicoPage'));
const MiMarketplacePage = lazy(() => import('@/pages/marketplace/MiMarketplacePage'));
const AgendarPublicoPage = lazy(() => import('@/pages/marketplace/AgendarPublicoPage'));

// Páginas de Suscripción
const ActivarSuscripcion = lazy(() => import('@/pages/subscripcion/ActivarSuscripcion'));
const SubscripcionResultado = lazy(() => import('@/pages/subscripcion/SubscripcionResultado'));

// Páginas de Super Admin
const SuperAdminLayout = lazy(() => import('@/components/superadmin/SuperAdminLayout'));
const SuperAdminDashboard = lazy(() => import('@/pages/superadmin/Dashboard'));
const SuperAdminOrganizaciones = lazy(() => import('@/pages/superadmin/Organizaciones'));
const SuperAdminPlanes = lazy(() => import('@/pages/superadmin/Planes'));
const SuperAdminGestionPlanes = lazy(() => import('@/pages/superadmin/GestionPlanes'));
const MarketplaceGestion = lazy(() => import('@/pages/superadmin/MarketplaceGestion'));

// Página de Setup Inicial
const InitialSetup = lazy(() => import('@/pages/setup/InitialSetup'));

// Página de Configuración de Módulos
const ModulosPage = lazy(() => import('@/pages/configuracion/ModulosPage'));

// Página de Configuración de Recordatorios (Nov 2025)
const RecordatoriosPage = lazy(() => import('@/pages/configuracion/RecordatoriosPage'));

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
      // Rutas de Marketplace (públicas)
      {
        path: 'marketplace',
        element: withSuspense(DirectorioMarketplacePage),
      },
      // Rutas de Marketplace (protegidas)
      {
        path: 'mi-marketplace',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(MiMarketplacePage)}
          </ProtectedRoute>
        ),
      },
      // Rutas de suscripción
      {
        path: 'suscripcion',
        element: (
          <ProtectedRoute>
            {withSuspense(ActivarSuscripcion)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'subscripcion/resultado',
        element: withSuspense(SubscripcionResultado),
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
      // Rutas de Comisiones
      {
        path: 'comisiones',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(ComisionesPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'comisiones/configuracion',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(ConfiguracionComisionesPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'comisiones/reportes',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(ReportesComisionesPage)}
          </ProtectedRoute>
        ),
      },
      // Rutas de Inventario
      {
        path: 'inventario/productos',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario', 'empleado']}>
            {withSuspense(ProductosPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventario/categorias',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario', 'empleado']}>
            {withSuspense(CategoriasPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventario/proveedores',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario', 'empleado']}>
            {withSuspense(ProveedoresPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventario/movimientos',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario', 'empleado']}>
            {withSuspense(MovimientosPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventario/alertas',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario', 'empleado']}>
            {withSuspense(AlertasPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventario/reportes',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(ReportesInventarioPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventario/ordenes-compra',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(OrdenesCompraPage)}
          </ProtectedRoute>
        ),
      },
      // Rutas de Punto de Venta (POS)
      {
        path: 'pos/venta',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario', 'empleado']}>
            {withSuspense(VentaPOSPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'pos/ventas',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario', 'empleado']}>
            {withSuspense(VentasListPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'pos/corte-caja',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(CorteCajaPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'pos/reportes',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(ReporteVentasDiariasPage)}
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
          {
            path: 'planes/mercadopago',
            element: withSuspense(SuperAdminGestionPlanes),
          },
          {
            path: 'marketplace',
            element: withSuspense(MarketplaceGestion),
          },
        ],
      },
      // Rutas de Configuración
      {
        path: 'configuracion/modulos',
        element: (
          <ProtectedRoute>
            {withSuspense(ModulosPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'configuracion/recordatorios',
        element: (
          <ProtectedRoute>
            {withSuspense(RecordatoriosPage)}
          </ProtectedRoute>
        ),
      },

      // ⚠️ IMPORTANTE: Rutas dinámicas DEBEN IR AL FINAL
      // Pero las rutas más específicas (/agendar/:slug) ANTES de las genéricas (/:slug)
      {
        path: 'agendar/:slug',
        element: withSuspense(AgendarPublicoPage),
      },
      {
        path: ':slug',
        element: withSuspense(PerfilPublicoPage),
      },
    ],
  },
]);

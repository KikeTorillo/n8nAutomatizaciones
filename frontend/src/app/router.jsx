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
const RegistroPage = lazy(() => import('@/pages/auth/RegistroPage'));
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
const UbicacionesAlmacenPage = lazy(() => import('@/pages/inventario/UbicacionesAlmacenPage'));
const NumerosSeriesPage = lazy(() => import('@/pages/inventario/NumerosSeriesPage'));
const RutasOperacionPage = lazy(() => import('@/pages/inventario/RutasOperacionPage'));
const InventarioHistoricoPage = lazy(() => import('@/pages/inventario/InventarioHistoricoPage'));
const ConteosPage = lazy(() => import('@/pages/inventario/ConteosPage'));
const ConteoDetallePage = lazy(() => import('@/pages/inventario/ConteoDetallePage'));
const AjustesMasivosPage = lazy(() => import('@/pages/inventario/AjustesMasivosPage'));
const AjusteMasivoDetallePage = lazy(() => import('@/pages/inventario/AjusteMasivoDetallePage'));
const ReordenPage = lazy(() => import('@/pages/inventario/ReordenPage'));
const ReglasReordenPage = lazy(() => import('@/pages/inventario/ReglasReordenPage'));
const DropshipPage = lazy(() => import('@/pages/inventario/DropshipPage'));

// Páginas de Precios (Fase 5)
const ListasPreciosPage = lazy(() => import('@/pages/precios/ListasPreciosPage'));

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
const MarketplaceGestion = lazy(() => import('@/pages/superadmin/MarketplaceGestion'));
const PlantillasEventos = lazy(() => import('@/pages/superadmin/PlantillasEventos'));

// Página de Setup Inicial
const InitialSetup = lazy(() => import('@/pages/setup/InitialSetup'));

// Páginas de Configuración
const ConfiguracionPage = lazy(() => import('@/pages/configuracion/ConfiguracionPage'));
const NegocioPage = lazy(() => import('@/pages/configuracion/NegocioPage'));
const ModulosPage = lazy(() => import('@/pages/configuracion/ModulosPage'));
const RecordatoriosPage = lazy(() => import('@/pages/configuracion/RecordatoriosPage'));
const DepartamentosPage = lazy(() => import('@/pages/configuracion/DepartamentosPage'));
const PuestosPage = lazy(() => import('@/pages/configuracion/PuestosPage'));
const CategoriasConfigPage = lazy(() => import('@/pages/configuracion/CategoriasPage'));
const OrganigramaPage = lazy(() => import('@/pages/organizacion/OrganigramaPage'));
const PermisosPage = lazy(() => import('@/pages/configuracion/PermisosPage'));
const MonedasPage = lazy(() => import('@/pages/configuracion/MonedasPage'));
const UsuariosPage = lazy(() => import('@/pages/configuracion/UsuariosPage'));

// Página de App Home / Launcher (Nov 2025)
const AppHomePage = lazy(() => import('@/pages/home/AppHomePage'));

// Página de Registro por Invitación (Nov 2025 - Sistema Profesional-Usuario)
const RegistroInvitacionPage = lazy(() => import('@/pages/auth/RegistroInvitacionPage'));

// Páginas de Activación de Cuenta (Nov 2025 - Fase 2)
const ActivarCuentaPage = lazy(() => import('@/pages/auth/ActivarCuentaPage'));

// Páginas de OAuth y Magic Links (Dic 2025)
const MagicLinkVerifyPage = lazy(() => import('@/pages/auth/MagicLinkVerifyPage'));
const OnboardingPage = lazy(() => import('@/pages/auth/OnboardingPage'));

// Páginas de Eventos Digitales (Dic 2025)
const EventosPage = lazy(() => import('@/pages/eventos-digitales/EventosPage'));
const EventoDetailPage = lazy(() => import('@/pages/eventos-digitales/EventoDetailPage'));
const EventoFormPage = lazy(() => import('@/pages/eventos-digitales/EventoFormPage'));
const EventoPublicoPage = lazy(() => import('@/pages/eventos-digitales/EventoPublicoPage'));

// Páginas de Contabilidad (Dic 2025)
const ContabilidadPage = lazy(() => import('@/pages/contabilidad/ContabilidadPage'));
const CuentasContablesPage = lazy(() => import('@/pages/contabilidad/CuentasContablesPage'));
const AsientosContablesPage = lazy(() => import('@/pages/contabilidad/AsientosContablesPage'));
const ReportesContablesPage = lazy(() => import('@/pages/contabilidad/ReportesContablesPage'));
const ConfiguracionContablePage = lazy(() => import('@/pages/contabilidad/ConfiguracionContablePage'));

// Páginas de Website (Dic 2025)
const WebsiteEditorPage = lazy(() => import('@/pages/website/WebsiteEditorPage'));
const SitioPublicoPage = lazy(() => import('@/pages/public/SitioPublicoPage'));

// Páginas de Sucursales (Dic 2025)
const SucursalesPage = lazy(() => import('@/pages/sucursales/SucursalesPage'));
const SucursalDetailPage = lazy(() => import('@/pages/sucursales/SucursalDetailPage'));
const TransferenciasPage = lazy(() => import('@/pages/sucursales/TransferenciasPage'));
const TransferenciaDetailPage = lazy(() => import('@/pages/sucursales/TransferenciaDetailPage'));
const DashboardSucursalesPage = lazy(() => import('@/pages/sucursales/DashboardSucursalesPage'));

// Páginas de Notificaciones (Dic 2025)
const NotificacionesPage = lazy(() => import('@/pages/notificaciones/NotificacionesPage'));
const NotificacionesPreferenciasPage = lazy(() => import('@/pages/notificaciones/NotificacionesPreferenciasPage'));

// Páginas de Aprobaciones (Dic 2025)
const AprobacionesPage = lazy(() => import('@/pages/aprobaciones/AprobacionesPage'));

// Loading fallback
const loadingFallback = (
  <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
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
      // Ruta de registro por invitación (pública)
      {
        path: 'registro-invitacion/:token',
        element: withSuspense(RegistroInvitacionPage),
      },
      // Ruta de Registro (Nov 2025 - Fase 2: Onboarding Simplificado)
      {
        path: 'registro',
        element: withSuspense(RegistroPage),
      },
      {
        path: 'activar-cuenta/:token',
        element: withSuspense(ActivarCuentaPage),
      },
      // Magic Link Verify (Dic 2025)
      {
        path: 'auth/magic-link/:token',
        element: withSuspense(MagicLinkVerifyPage),
      },
      // Onboarding para usuarios OAuth sin organización (Dic 2025)
      {
        path: 'onboarding',
        element: withSuspense(OnboardingPage),
      },
      // Ruta de setup inicial (primera vez)
      {
        path: 'setup',
        element: withSuspense(InitialSetup),
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
      // App Home - Página principal post-login (Nov 2025)
      // Super admin NO tiene acceso (es usuario de plataforma sin organización)
      {
        path: 'home',
        element: (
          <ProtectedRoute excludeRoles="super_admin" redirectTo="/superadmin">
            {withSuspense(AppHomePage)}
          </ProtectedRoute>
        ),
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
      // Conteos de Inventario (Dic 2025)
      {
        path: 'inventario/conteos',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario', 'empleado']}>
            {withSuspense(ConteosPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventario/conteos/:id',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario', 'empleado']}>
            {withSuspense(ConteoDetallePage)}
          </ProtectedRoute>
        ),
      },
      // Ajustes Masivos de Inventario (Dic 2025)
      {
        path: 'inventario/ajustes-masivos',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(AjustesMasivosPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventario/ajustes-masivos/:id',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(AjusteMasivoDetallePage)}
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
          <ProtectedRoute requiredRole={['admin', 'propietario', 'empleado']}>
            {withSuspense(OrdenesCompraPage)}
          </ProtectedRoute>
        ),
      },
      // Listas de Precios (Fase 5)
      {
        path: 'inventario/listas-precios',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(ListasPreciosPage)}
          </ProtectedRoute>
        ),
      },
      // Alias legacy para compatibilidad
      {
        path: 'listas-precios',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(ListasPreciosPage)}
          </ProtectedRoute>
        ),
      },
      // Ubicaciones de Almacén - WMS (Fase 3 Gaps)
      {
        path: 'inventario/ubicaciones',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario', 'empleado']}>
            {withSuspense(UbicacionesAlmacenPage)}
          </ProtectedRoute>
        ),
      },
      // Números de Serie / Lotes (Dic 2025 - Gap Media Prioridad)
      {
        path: 'inventario/numeros-serie',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario', 'empleado']}>
            {withSuspense(NumerosSeriesPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventario/rutas-operacion',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(RutasOperacionPage)}
          </ProtectedRoute>
        ),
      },
      // Inventario Histórico (Dic 2025)
      {
        path: 'inventario/historico',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(InventarioHistoricoPage)}
          </ProtectedRoute>
        ),
      },
      // Reorden Automático (Dic 2025)
      {
        path: 'inventario/reorden',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(ReordenPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventario/reorden/reglas',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(ReglasReordenPage)}
          </ProtectedRoute>
        ),
      },
      // Dropshipping (Dic 2025)
      {
        path: 'inventario/dropship',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(DropshipPage)}
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
            path: 'marketplace',
            element: withSuspense(MarketplaceGestion),
          },
          {
            path: 'plantillas-eventos',
            element: withSuspense(PlantillasEventos),
          },
        ],
      },
      // Rutas de Configuración
      {
        path: 'configuracion',
        element: (
          <ProtectedRoute>
            {withSuspense(ConfiguracionPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'configuracion/negocio',
        element: (
          <ProtectedRoute>
            {withSuspense(NegocioPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'configuracion/modulos',
        element: (
          <ProtectedRoute>
            {withSuspense(ModulosPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'configuracion/departamentos',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(DepartamentosPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'configuracion/puestos',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(PuestosPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'configuracion/categorias',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(CategoriasConfigPage)}
          </ProtectedRoute>
        ),
      },
      // Organigrama (Dic 2025)
      {
        path: 'configuracion/organigrama',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(OrganigramaPage)}
          </ProtectedRoute>
        ),
      },
      // Permisos (Dic 2025 - Sistema Normalizado)
      {
        path: 'configuracion/permisos',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(PermisosPage)}
          </ProtectedRoute>
        ),
      },
      // Usuarios (Dic 2025 - Gestión estilo Odoo)
      {
        path: 'configuracion/usuarios',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(UsuariosPage)}
          </ProtectedRoute>
        ),
      },
      // Monedas (Dic 2025 - Fase 5)
      {
        path: 'configuracion/monedas',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(MonedasPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'recordatorios',
        element: (
          <ProtectedRoute>
            {withSuspense(RecordatoriosPage)}
          </ProtectedRoute>
        ),
      },

      // Rutas de Sucursales (Dic 2025)
      {
        path: 'sucursales',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(SucursalesPage)}
          </ProtectedRoute>
        ),
      },
      /// ⚠️ Rutas específicas ANTES de rutas dinámicas (:id)
      {
        path: 'sucursales/dashboard',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(DashboardSucursalesPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'sucursales/transferencias',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(TransferenciasPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'sucursales/transferencias/:id',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(TransferenciaDetailPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'sucursales/:id',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(SucursalDetailPage)}
          </ProtectedRoute>
        ),
      },

      // Rutas de Contabilidad (Dic 2025)
      {
        path: 'contabilidad',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(ContabilidadPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'contabilidad/cuentas',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(CuentasContablesPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'contabilidad/asientos',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(AsientosContablesPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'contabilidad/reportes',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(ReportesContablesPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'contabilidad/configuracion',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(ConfiguracionContablePage)}
          </ProtectedRoute>
        ),
      },

      // Rutas de Notificaciones (Dic 2025)
      {
        path: 'notificaciones',
        element: (
          <ProtectedRoute>
            {withSuspense(NotificacionesPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'notificaciones/preferencias',
        element: (
          <ProtectedRoute>
            {withSuspense(NotificacionesPreferenciasPage)}
          </ProtectedRoute>
        ),
      },

      // Rutas de Aprobaciones (Dic 2025)
      {
        path: 'aprobaciones',
        element: (
          <ProtectedRoute>
            {withSuspense(AprobacionesPage)}
          </ProtectedRoute>
        ),
      },

      // Rutas de Website Editor (Dic 2025)
      {
        path: 'website',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(WebsiteEditorPage)}
          </ProtectedRoute>
        ),
      },

      // Rutas de Eventos Digitales (Dic 2025)
      {
        path: 'eventos-digitales',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(EventosPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'eventos-digitales/nuevo',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(EventoFormPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'eventos-digitales/:id',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(EventoDetailPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'eventos-digitales/:id/editar',
        element: (
          <ProtectedRoute requiredRole={['admin', 'propietario']}>
            {withSuspense(EventoFormPage)}
          </ProtectedRoute>
        ),
      },

      // Rutas públicas de Eventos Digitales (Dic 2025)
      {
        path: 'e/:slug',
        element: withSuspense(EventoPublicoPage),
      },
      {
        path: 'e/:slug/:token',
        element: withSuspense(EventoPublicoPage),
      },

      // Rutas públicas de Website (Dic 2025)
      {
        path: 'sitio/:slug',
        element: withSuspense(SitioPublicoPage),
      },
      {
        path: 'sitio/:slug/:pagina',
        element: withSuspense(SitioPublicoPage),
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

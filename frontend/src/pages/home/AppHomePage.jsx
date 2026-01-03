import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Package,
  ShoppingCart,
  DollarSign,
  Bot,
  Store,
  BarChart3,
  Settings,
  LogOut,
  LayoutDashboard,
  Users,
  Briefcase,
  UserCircle,
  Shield,
  PartyPopper,
  BookOpen,
  Globe,
  Building2,
  ClipboardCheck,
  Palmtree,
} from 'lucide-react';

import useAuthStore from '@/store/authStore';
import useOnboardingStore from '@/store/onboardingStore';
import { useModulos } from '@/hooks/useModulos';
import { useAppNotifications } from '@/hooks/useAppNotifications';
import { useSucursales, useMetricasSucursales } from '@/hooks/useSucursales';
import { authApi } from '@/services/api/endpoints';

import AppCard from '@/components/home/AppCard';
import QuickActions from '@/components/home/QuickActions';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import TrialStatusWidget from '@/components/dashboard/TrialStatusWidget';
import PlanStatusBanner from '@/components/dashboard/PlanStatusBanner';
import ThemeToggle from '@/components/ui/ThemeToggle';
import SucursalSelector from '@/components/sucursales/SucursalSelector';
import { NotificacionesBell } from '@/components/notificaciones';

/**
 * AppHomePage - Página principal con App Launcher estilo Odoo
 * Muestra todas las aplicaciones disponibles en un grid visual
 */
function AppHomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout: clearAuth, user } = useAuthStore();
  const { resetOnboarding } = useOnboardingStore();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Módulos activos según el plan (para empleados, ya viene filtrado por backend)
  const {
    tieneAgendamiento,
    tieneInventario,
    tienePOS,
    tieneComisiones,
    tieneContabilidad,
    tieneChatbots,
    tieneMarketplace,
    tieneEventosDigitales,
    tieneWebsite,
    tieneWorkflows,
    esPlanFree,
  } = useModulos();

  // Notificaciones por app
  const notifications = useAppNotifications();

  // Multi-sucursal: verificar si tiene múltiples sucursales activas
  const { data: sucursales = [] } = useSucursales({ activo: true });
  const tieneMultiplesSucursales = sucursales.length > 1;
  const { data: metricasSucursales } = useMetricasSucursales({});


  // Detectar rol para adaptar la UI
  const esEmpleado = user?.rol === 'empleado';
  const esSuperAdmin = user?.rol === 'super_admin';

  // Mutation de logout
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
      resetOnboarding();
      clearAuth();
      navigate('/login');
    },
    onError: () => {
      queryClient.clear();
      resetOnboarding();
      clearAuth();
      navigate('/login');
    },
  });

  const handleLogout = () => setShowLogoutDialog(true);
  const confirmLogout = () => {
    setShowLogoutDialog(false);
    logoutMutation.mutate();
  };

  // Definir aplicaciones disponibles
  // Para empleados: solo mostrar apps habilitadas y no administrativas
  const allApps = [
    {
      id: 'agendamiento',
      name: 'Agendamiento',
      description: esEmpleado ? 'Mis citas' : 'Gestiona tus citas',
      icon: Calendar,
      path: '/citas',
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-100 dark:bg-primary-900/40',
      enabled: tieneAgendamiento,
      badge: notifications.agendamiento,
      badgeColor: 'bg-primary-500',
    },
    {
      id: 'profesionales',
      name: 'Profesionales',
      description: 'Equipo y horarios',
      icon: Users,
      path: '/profesionales',
      color: 'text-primary-700 dark:text-primary-300',
      bgColor: 'bg-primary-100 dark:bg-primary-900/40',
      enabled: tieneAgendamiento,
      badge: 0,
      adminOnly: true, // Solo admin/propietario
    },
    {
      id: 'servicios',
      name: 'Servicios',
      description: 'Catálogo y precios',
      icon: Briefcase,
      path: '/servicios',
      color: 'text-primary-500 dark:text-primary-400',
      bgColor: 'bg-primary-50 dark:bg-primary-900/30',
      enabled: tieneAgendamiento,
      badge: 0,
      adminOnly: true, // Solo admin/propietario
    },
    {
      id: 'clientes',
      name: 'Clientes',
      description: 'CRM y base de clientes',
      icon: UserCircle,
      path: '/clientes',
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-100 dark:bg-primary-900/40',
      enabled: true, // Siempre activo (módulo core compartido)
      badge: 0,
      adminOnly: false, // Visible para empleados también
    },
    {
      id: 'vacaciones',
      name: 'Vacaciones',
      description: esEmpleado ? 'Mis vacaciones' : 'Gestiona vacaciones',
      icon: Palmtree,
      path: '/vacaciones',
      color: 'text-primary-500 dark:text-primary-400',
      bgColor: 'bg-primary-50 dark:bg-primary-900/30',
      enabled: true, // Siempre activo (módulo core de empleados)
      badge: 0,
      adminOnly: false, // Visible para empleados también
    },
    {
      id: 'inventario',
      name: 'Inventario',
      description: 'Productos, stock y proveedores',
      icon: Package,
      path: '/inventario/productos',
      color: 'text-primary-800 dark:text-primary-300',
      bgColor: 'bg-primary-100 dark:bg-primary-900/40',
      enabled: tieneInventario,
      badge: notifications.inventario,
      badgeColor: 'bg-primary-500',
    },
    {
      id: 'pos',
      name: 'Punto de Venta',
      description: 'Ventas y cobros',
      icon: ShoppingCart,
      path: '/pos/venta',
      color: 'text-primary-500 dark:text-primary-400',
      bgColor: 'bg-primary-50 dark:bg-primary-900/30',
      enabled: tienePOS,
      badge: notifications.pos,
      badgeColor: 'bg-primary-500',
    },
    {
      id: 'comisiones',
      name: 'Comisiones',
      description: 'Cálculo y pago a profesionales',
      icon: DollarSign,
      path: '/comisiones',
      color: 'text-primary-700 dark:text-primary-300',
      bgColor: 'bg-primary-100 dark:bg-primary-900/40',
      enabled: tieneComisiones,
      badge: 0,
      adminOnly: true, // Solo admin/propietario
    },
    {
      id: 'contabilidad',
      name: 'Contabilidad',
      description: 'Catálogo de cuentas y asientos',
      icon: BookOpen,
      path: '/contabilidad',
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-100 dark:bg-primary-900/40',
      enabled: tieneContabilidad,
      badge: 0,
      adminOnly: true, // Solo admin/propietario
    },
    {
      id: 'chatbots',
      name: 'Chatbots IA',
      description: 'Telegram, WhatsApp con IA',
      icon: Bot,
      path: '/chatbots',
      color: 'text-primary-400 dark:text-primary-300',
      bgColor: 'bg-primary-50 dark:bg-primary-900/30',
      enabled: tieneChatbots,
      badge: 0,
      adminOnly: true, // Solo admin/propietario
    },
    {
      id: 'marketplace',
      name: 'Marketplace',
      description: 'Tu perfil público y reseñas',
      icon: Store,
      path: '/mi-marketplace',
      color: 'text-primary-500 dark:text-primary-400',
      bgColor: 'bg-primary-50 dark:bg-primary-900/30',
      enabled: tieneMarketplace,
      badge: 0,
      adminOnly: true, // Solo admin/propietario
    },
    {
      id: 'eventos-digitales',
      name: 'Invitaciones',
      description: 'Bodas, XV años y más',
      icon: PartyPopper,
      path: '/eventos-digitales',
      color: 'text-primary-400 dark:text-primary-300',
      bgColor: 'bg-primary-50 dark:bg-primary-900/30',
      enabled: tieneEventosDigitales,
      badge: 0,
      adminOnly: true, // Solo admin/propietario
    },
    {
      id: 'website',
      name: 'Mi Sitio Web',
      description: 'Crea tu página web',
      icon: Globe,
      path: '/website',
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-100 dark:bg-primary-900/40',
      enabled: tieneWebsite,
      badge: 0,
      adminOnly: true, // Solo admin/propietario
    },
    {
      id: 'sucursales',
      name: 'Sucursales',
      description: 'Gestiona tus sucursales',
      icon: Building2,
      path: '/sucursales',
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-100 dark:bg-primary-900/40',
      enabled: true,
      badge: 0,
      adminOnly: true, // Solo admin/propietario
    },
    {
      id: 'aprobaciones',
      name: 'Aprobaciones',
      description: 'Solicitudes pendientes',
      icon: ClipboardCheck,
      path: '/aprobaciones',
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-100 dark:bg-primary-900/40',
      enabled: tieneWorkflows,
      badge: notifications.aprobaciones,
      badgeColor: 'bg-amber-500',
      adminOnly: true, // Solo admin/propietario
    },
    {
      id: 'estadisticas',
      name: 'Estadísticas',
      description: 'Métricas y KPIs del negocio',
      icon: BarChart3,
      path: '/dashboard',
      color: 'text-primary-700 dark:text-primary-300',
      bgColor: 'bg-primary-100 dark:bg-primary-900/40',
      enabled: true,
      badge: 0,
      adminOnly: true, // Solo admin/propietario
    },
    {
      id: 'configuracion',
      name: 'Configuración',
      description: 'Módulos y preferencias',
      icon: Settings,
      path: '/configuracion',
      color: 'text-primary-700 dark:text-primary-300',
      bgColor: 'bg-primary-100 dark:bg-primary-900/40',
      enabled: true,
      badge: 0,
      adminOnly: true, // Solo admin/propietario
    },
    // App exclusiva para super_admin - Admin de Plataforma
    {
      id: 'admin-plataforma',
      name: 'Admin Plataforma',
      description: 'Gestión global del SaaS',
      icon: Shield,
      path: '/superadmin',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/40',
      enabled: true,
      badge: 0,
      superAdminOnly: true, // Solo super_admin
    },
  ];

  // Filtrar apps según el rol
  // Empleados: solo ven apps habilitadas y no administrativas
  // Admin/Propietario: ven todas las apps (excepto superAdminOnly)
  // Super_admin: ve todas las apps incluyendo Admin Plataforma
  const apps = allApps.filter(app => {
    // Super_admin ve todo
    if (esSuperAdmin) return app.enabled;

    // Empleado: solo apps no admin y habilitadas
    if (esEmpleado) return !app.adminOnly && !app.superAdminOnly && app.enabled;

    // Admin/Propietario: todo excepto superAdminOnly
    return !app.superAdminOnly && app.enabled;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Bienvenido, {user?.nombre}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ¿Qué quieres hacer hoy?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Selector de sucursal (solo si hay múltiples) */}
              <SucursalSelector />

              {/* Toggle de tema */}
              <ThemeToggle />

              {/* Centro de notificaciones */}
              <NotificacionesBell />

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                isLoading={logoutMutation.isPending}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Widgets de estado - Solo para admin/propietario */}
        {!esEmpleado && (
          <>
            <TrialStatusWidget />
            <PlanStatusBanner />

            {/* Widget Multi-Sucursal - Solo si tiene 2+ sucursales */}
            {tieneMultiplesSucursales && metricasSucursales && (
              <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      Resumen Multi-Sucursal
                    </h3>
                  </div>
                  <button
                    onClick={() => navigate('/sucursales/dashboard')}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Ver Dashboard →
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {sucursales.length}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sucursales</p>
                  </div>
                  <div className="text-center p-2 bg-primary-50 dark:bg-primary-900/20 rounded">
                    <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(metricasSucursales?.ventas?.hoy?.total || 0)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ventas Hoy</p>
                  </div>
                  <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {metricasSucursales?.citas?.hoy?.total || 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Citas Hoy</p>
                  </div>
                  <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {(metricasSucursales?.transferencias?.pendientes || 0) + (metricasSucursales?.transferencias?.enviadas || 0)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Transferencias</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Grid de Apps */}
        <div className="mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {apps.map((app) => (
              <AppCard
                key={app.id}
                id={app.id}
                name={app.name}
                description={app.description}
                icon={app.icon}
                path={app.path}
                color={app.color}
                bgColor={app.bgColor}
                enabled={app.enabled}
                badge={app.badge}
                badgeColor={app.badgeColor}
              />
            ))}
          </div>
        </div>

        {/* Accesos Rápidos - Solo para admin/propietario */}
        {!esEmpleado && <QuickActions />}

        {/* Mensaje para plan Free - Solo para admin/propietario */}
        {!esEmpleado && esPlanFree && (
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-full text-amber-700 dark:text-amber-300 text-sm">
              <span>Algunas apps requieren</span>
              <button
                onClick={() => navigate('/suscripcion')}
                className="font-semibold hover:underline"
              >
                Plan Pro
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modal de confirmación de logout */}
      <ConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={confirmLogout}
        title="Cerrar Sesión"
        message="¿Estás seguro que deseas cerrar sesión?"
        confirmText="Cerrar Sesión"
        cancelText="Cancelar"
        variant="warning"
        isLoading={logoutMutation.isPending}
      />
    </div>
  );
}

export default AppHomePage;

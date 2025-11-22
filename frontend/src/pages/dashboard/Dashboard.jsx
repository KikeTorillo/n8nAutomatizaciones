import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi, serviciosApi } from '@/services/api/endpoints';
import useAuthStore from '@/store/authStore';
import useOnboardingStore from '@/store/onboardingStore';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import StatCard from '@/components/dashboard/StatCard';
import LimitProgressBar from '@/components/dashboard/LimitProgressBar';
import CitasDelDia from '@/components/dashboard/CitasDelDia';
import TrialStatusWidget from '@/components/dashboard/TrialStatusWidget';
import SetupChecklist from '@/components/dashboard/SetupChecklist';
import MarketplaceActivationCard from '@/components/dashboard/MarketplaceActivationCard';
import AlertasWidget from '@/components/inventario/AlertasWidget';
import {
  useEstadisticasOrganizacion,
  useServiciosDashboard,
  useBloqueosDashboard,
} from '@/hooks/useEstadisticas';
import { useCitasDelDia } from '@/hooks/useCitas';
import { useProfesionales } from '@/hooks/useProfesionales';
import { useClientes } from '@/hooks/useClientes';
import { useChatbots } from '@/hooks/useChatbots';
import {
  LogOut,
  Calendar,
  Users,
  Briefcase,
  UserCheck,
  AlertCircle,
  Lock,
  AlertTriangle,
  CheckCircle,
  Bot,
} from 'lucide-react';

/**
 * Dashboard Principal con Datos Reales
 */
function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout: clearAuth, user } = useAuthStore();
  const { resetOnboarding } = useOnboardingStore();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Queries de datos
  const { data: estadisticas, isLoading: loadingEstadisticas, error: errorEstadisticas } =
    useEstadisticasOrganizacion();
  const { data: citasDelDia, isLoading: loadingCitas } = useCitasDelDia();
  const { data: profesionales, isLoading: loadingProfesionales } = useProfesionales();
  const { data: servicios, isLoading: loadingServicios } = useServiciosDashboard();
  const { data: clientesData, isLoading: loadingClientes } = useClientes();
  const { data: bloqueos, isLoading: loadingBloqueos } = useBloqueosDashboard();
  const { data: chatbotsData, isLoading: loadingChatbots } = useChatbots();

  // Extraer array de clientes (useClientes retorna { clientes, pagination })
  const clientes = clientesData?.clientes || [];

  // Hook para estadísticas de asignaciones servicio-profesional
  const { data: statsAsignaciones, isLoading: loadingStats } = useQuery({
    queryKey: ['estadisticas-asignaciones'],
    queryFn: () => serviciosApi.obtenerEstadisticasAsignaciones(),
    select: (response) => response.data.data,
    staleTime: 5 * 60 * 1000, // Cache de 5 minutos
  });

  // Mutation de logout
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      console.log('✅ Logout exitoso');

      // 🧹 CRÍTICO: Limpiar cache de React Query al cerrar sesión
      // Evita que se muestren datos al iniciar sesión con otra cuenta
      queryClient.clear();
      console.log('✅ Cache de React Query limpiado');

      // 🧹 CRÍTICO: Limpiar onboarding storage
      resetOnboarding();
      console.log('✅ Onboarding storage limpiado');

      clearAuth();
      navigate('/login');
    },
    onError: (error) => {
      console.error('❌ Error en logout:', error);

      // Limpiar cache incluso si hay error
      queryClient.clear();
      resetOnboarding();

      clearAuth();
      navigate('/login');
    },
  });

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    setShowLogoutDialog(false);
    logoutMutation.mutate();
  };

  // Calcular totales
  const totalCitasHoy = citasDelDia?.length || 0;
  const totalProfesionales = profesionales?.filter((p) => p.activo).length || 0;
  const totalServicios = servicios?.filter((s) => s.activo).length || 0;
  const totalClientes = clientes?.length || 0;
  const totalBloqueosProximos = bloqueos?.filter((b) => b.activo).length || 0;
  const totalChatbotsActivos = chatbotsData?.chatbots?.filter((c) => c.activo).length || 0;

  // Generar subtítulo de plataformas para Chatbots
  const plataformasChatbots = chatbotsData?.chatbots
    ?.filter((c) => c.activo)
    .map((c) => c.plataforma === 'telegram' ? 'Telegram' : 'WhatsApp');
  const subtituloChatbots = plataformasChatbots?.length > 0
    ? [...new Set(plataformasChatbots)].join(' + ')
    : 'Sin chatbots';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
                {estadisticas?.organizacion && (
                  <p className="text-sm text-gray-600">
                    {estadisticas.organizacion.nombre}
                  </p>
                )}
              </div>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-6">
                <button
                  onClick={() => navigate('/clientes')}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Clientes
                </button>
                <button
                  onClick={() => navigate('/citas')}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Citas
                </button>
                <button
                  onClick={() => navigate('/profesionales')}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Profesionales
                </button>
                <button
                  onClick={() => navigate('/servicios')}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Servicios
                </button>
                <button
                  onClick={() => navigate('/chatbots')}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Chatbots
                </button>
                <button
                  onClick={() => navigate('/comisiones')}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Comisiones
                </button>
                <button
                  onClick={() => navigate('/inventario/productos')}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Inventario
                </button>
                <button
                  onClick={() => navigate('/pos/venta')}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  POS
                </button>
                <button
                  onClick={() => navigate('/bloqueos')}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Bloqueos
                </button>
                <button
                  onClick={() => navigate('/mi-marketplace')}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Marketplace
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user?.nombre} {user?.apellidos}
              </span>
              <Button
                variant="outline"
                onClick={handleLogout}
                isLoading={logoutMutation.isPending}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Widget de Estado de Trial */}
        <TrialStatusWidget />

        {/* Checklist de Configuración Inicial */}
        <SetupChecklist />

        {/* Card de Activación del Marketplace */}
        <MarketplaceActivationCard />

        {/* Mensaje de Error */}
        {errorEstadisticas && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-800">
                Error al cargar estadísticas
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {errorEstadisticas.message || 'Ocurrió un error al cargar los datos'}
              </p>
            </div>
          </div>
        )}

        {/* Cards de Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <StatCard
            title="Citas Hoy"
            value={totalCitasHoy}
            subtitle={`${citasDelDia?.filter((c) => c.estado === 'programada').length || 0} programadas`}
            icon={Calendar}
            color="blue"
            isLoading={loadingCitas}
            onClick={() => navigate('/citas')}
          />

          <StatCard
            title="Profesionales"
            value={totalProfesionales}
            subtitle="Activos"
            icon={Users}
            color="green"
            isLoading={loadingProfesionales}
            onClick={() => navigate('/profesionales')}
          />

          <StatCard
            title="Servicios"
            value={totalServicios}
            subtitle="Disponibles"
            icon={Briefcase}
            color="purple"
            isLoading={loadingServicios}
            onClick={() => navigate('/servicios')}
          />

          <StatCard
            title="Clientes"
            value={totalClientes}
            subtitle="Registrados"
            icon={UserCheck}
            color="orange"
            isLoading={loadingClientes}
            onClick={() => navigate('/clientes')}
          />

          <StatCard
            title="Bloqueos"
            value={totalBloqueosProximos}
            subtitle="Próximos 30 días"
            icon={Lock}
            color="red"
            isLoading={loadingBloqueos}
            onClick={() => navigate('/bloqueos')}
          />

          <StatCard
            title="Chatbots IA"
            value={totalChatbotsActivos}
            subtitle={subtituloChatbots}
            icon={Bot}
            color="cyan"
            isLoading={loadingChatbots}
            onClick={() => navigate('/chatbots')}
          />
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda: Citas del Día */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Citas de Hoy
            </h2>
            <CitasDelDia citas={citasDelDia} isLoading={loadingCitas} />
          </div>

          {/* Columna Derecha: Uso del Plan */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Uso del Plan
            </h2>

            {loadingEstadisticas ? (
              <div className="space-y-6 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : estadisticas?.uso_actual ? (
              <div className="space-y-6">
                <LimitProgressBar
                  label="Citas este mes"
                  usado={estadisticas.uso_actual.citas.usado}
                  limite={estadisticas.uso_actual.citas.limite}
                  porcentaje={estadisticas.uso_actual.citas.porcentaje_uso}
                />

                <LimitProgressBar
                  label="Profesionales"
                  usado={estadisticas.uso_actual.profesionales.usado}
                  limite={estadisticas.uso_actual.profesionales.limite}
                  porcentaje={estadisticas.uso_actual.profesionales.porcentaje_uso}
                />

                <LimitProgressBar
                  label="Servicios"
                  usado={estadisticas.uso_actual.servicios.usado}
                  limite={estadisticas.uso_actual.servicios.limite}
                  porcentaje={estadisticas.uso_actual.servicios.porcentaje_uso}
                />

                {/* Botón para Upgrade Plan */}
                {Object.values(estadisticas.uso_actual).some(
                  (recurso) => recurso.porcentaje_uso >= 80
                ) && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 mb-2">
                      Te estás acercando al límite de tu plan
                    </p>
                    <Button className="w-full" size="sm">
                      Actualizar Plan
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay datos disponibles
              </p>
            )}
          </div>
        </div>

        {/* Widget de Alertas de Inventario */}
        <div className="mt-8">
          <AlertasWidget />
        </div>

        {/* Tarjeta de Asignaciones Servicio-Profesional */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Asignaciones Servicio-Profesional
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/servicios')}
            >
              Ver Servicios
            </Button>
          </div>

          {loadingStats ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : statsAsignaciones ? (
            <div className="space-y-4">
              {/* Alerta si hay servicios sin profesionales */}
              {statsAsignaciones.servicios_sin_profesional > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Atención: {statsAsignaciones.servicios_sin_profesional} servicio{statsAsignaciones.servicios_sin_profesional !== 1 ? 's' : ''} sin profesionales asignados
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Asigna profesionales a estos servicios para poder crear citas con ellos.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/servicios')}
                        className="mt-3 bg-white hover:bg-yellow-50 text-yellow-800 border-yellow-300"
                      >
                        Ir a Servicios
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Alerta si hay profesionales sin servicios */}
              {statsAsignaciones.profesionales_sin_servicio > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-blue-800">
                        {statsAsignaciones.profesionales_sin_servicio} profesional{statsAsignaciones.profesionales_sin_servicio !== 1 ? 'es' : ''} sin servicios asignados
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Asigna servicios a estos profesionales para que puedan atender citas.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/servicios')}
                        className="mt-3 bg-white hover:bg-blue-50 text-blue-800 border-blue-300"
                      >
                        Asignar Servicios
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Todo en orden */}
              {statsAsignaciones.servicios_sin_profesional === 0 &&
               statsAsignaciones.profesionales_sin_servicio === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-green-800">
                        Todas las asignaciones están completas
                      </h3>
                      <p className="text-sm text-green-700 mt-1">
                        Todos los servicios y profesionales activos tienen asignaciones correctas.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Resumen de estadísticas */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {statsAsignaciones.servicios_activos || 0}
                  </p>
                  <p className="text-sm text-gray-600">Servicios activos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {statsAsignaciones.profesionales_activos || 0}
                  </p>
                  <p className="text-sm text-gray-600">Profesionales activos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {statsAsignaciones.total_asignaciones_activas || 0}
                  </p>
                  <p className="text-sm text-gray-600">Asignaciones activas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {((statsAsignaciones.total_asignaciones_activas || 0) /
                      Math.max(1, (statsAsignaciones.servicios_activos || 0))).toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600">Promedio prof./servicio</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No hay datos de asignaciones disponibles
            </p>
          )}
        </div>

        {/* Información de la Cuenta */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Información de la Cuenta
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-gray-600">Nombre completo:</span>
              <p className="font-medium text-gray-900">
                {user?.nombre} {user?.apellidos}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Email:</span>
              <p className="font-medium text-gray-900">{user?.email}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Rol:</span>
              <p className="font-medium text-gray-900 capitalize">{user?.rol}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de confirmación de logout */}
      <ConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={confirmLogout}
        title="Cerrar Sesión"
        message="¿Estás seguro que deseas cerrar sesión? Tendrás que volver a iniciar sesión para acceder."
        confirmText="Cerrar Sesión"
        cancelText="Cancelar"
        variant="warning"
        isLoading={logoutMutation.isPending}
      />
    </div>
  );
}

export default Dashboard;

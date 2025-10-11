import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/services/api/endpoints';
import useAuthStore from '@/store/authStore';
import Button from '@/components/ui/Button';
import StatCard from '@/components/dashboard/StatCard';
import LimitProgressBar from '@/components/dashboard/LimitProgressBar';
import CitasDelDia from '@/components/dashboard/CitasDelDia';
import {
  useEstadisticasOrganizacion,
  useCitasDelDia,
  useProfesionales,
  useServicios,
  useClientes,
} from '@/hooks/useDashboard';
import {
  LogOut,
  Calendar,
  Users,
  Briefcase,
  UserCheck,
  AlertCircle,
} from 'lucide-react';

/**
 * Dashboard Principal con Datos Reales
 */
function Dashboard() {
  const navigate = useNavigate();
  const { logout: clearAuth, user } = useAuthStore();

  // Queries de datos
  const { data: estadisticas, isLoading: loadingEstadisticas, error: errorEstadisticas } =
    useEstadisticasOrganizacion();
  const { data: citasDelDia, isLoading: loadingCitas } = useCitasDelDia();
  const { data: profesionales, isLoading: loadingProfesionales } = useProfesionales();
  const { data: servicios, isLoading: loadingServicios } = useServicios();
  const { data: clientes, isLoading: loadingClientes } = useClientes();

  // Mutation de logout
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      console.log('✅ Logout exitoso');
      clearAuth();
      navigate('/login');
    },
    onError: (error) => {
      console.error('❌ Error en logout:', error);
      clearAuth();
      navigate('/login');
    },
  });

  const handleLogout = () => {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
      logoutMutation.mutate();
    }
  };

  // Calcular totales
  const totalCitasHoy = citasDelDia?.length || 0;
  const totalProfesionales = profesionales?.filter((p) => p.activo).length || 0;
  const totalServicios = servicios?.filter((s) => s.activo).length || 0;
  const totalClientes = clientes?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
              {estadisticas?.organizacion && (
                <p className="text-sm text-gray-600">
                  {estadisticas.organizacion.nombre}
                </p>
              )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Citas Hoy"
            value={totalCitasHoy}
            subtitle={`${citasDelDia?.filter((c) => c.estado === 'programada').length || 0} programadas`}
            icon={Calendar}
            color="blue"
            isLoading={loadingCitas}
          />

          <StatCard
            title="Profesionales"
            value={totalProfesionales}
            subtitle="Activos"
            icon={Users}
            color="green"
            isLoading={loadingProfesionales}
          />

          <StatCard
            title="Servicios"
            value={totalServicios}
            subtitle="Disponibles"
            icon={Briefcase}
            color="purple"
            isLoading={loadingServicios}
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
    </div>
  );
}

export default Dashboard;

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { serviciosApi } from '@/services/api/endpoints';
import useAuthStore, { selectUser } from '@/store/authStore';
import { useModulos } from '@/hooks/sistema';
import { BackButton, Button, LimitProgressBar } from '@/components/ui';
import CitasDelDia from '@/components/dashboard/CitasDelDia';
import AlertasWidget from '@/components/inventario/AlertasWidget';
import { useEstadisticasOrganizacion } from '@/hooks/otros';
import { useCitasDelDia } from '@/hooks/agendamiento';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  BarChart3,
} from 'lucide-react';

/**
 * Dashboard de Estadísticas
 * Vista consolidada de métricas, KPIs y alertas del negocio.
 * La navegación principal está en /home (App Launcher).
 */
function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore(selectUser);

  // Hook de módulos activos
  const { tieneInventario } = useModulos();

  // Queries de datos
  const { data: estadisticas, isLoading: loadingEstadisticas, error: errorEstadisticas } =
    useEstadisticasOrganizacion();
  const { data: citasDelDia, isLoading: loadingCitas } = useCitasDelDia();

  // Estadísticas de asignaciones servicio-profesional
  const { data: statsAsignaciones, isLoading: loadingStats } = useQuery({
    queryKey: ['estadisticas-asignaciones'],
    queryFn: () => serviciosApi.obtenerEstadisticasAsignaciones(),
    select: (response) => response.data.data,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Simple - La navegación principal está en /home */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <BackButton to="/home" label="Inicio" />
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Estadísticas</h1>
                  {estadisticas?.organizacion && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {estadisticas.organizacion.nombre}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user?.nombre} {user?.apellidos}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensaje de Error */}
        {errorEstadisticas && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                Error al cargar estadísticas
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {errorEstadisticas.message || 'Ocurrió un error al cargar los datos'}
              </p>
            </div>
          </div>
        )}

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda: Citas del Día */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Citas de Hoy
            </h2>
            <CitasDelDia citas={citasDelDia} isLoading={loadingCitas} />
          </div>

          {/* Columna Derecha: Uso del Plan */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Uso del Plan
            </h2>

            {loadingEstadisticas ? (
              <div className="space-y-6 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
                  <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                      Te estás acercando al límite de tu plan
                    </p>
                    <Button className="w-full" size="sm">
                      Actualizar Plan
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No hay datos disponibles
              </p>
            )}
          </div>
        </div>

        {/* Widget de Alertas de Inventario - Solo si tiene módulo */}
        {tieneInventario && (
          <div className="mt-8">
            <AlertasWidget />
          </div>
        )}

        {/* Tarjeta de Asignaciones Servicio-Profesional */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
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
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ) : statsAsignaciones ? (
            <div className="space-y-4">
              {/* Alerta si hay servicios sin profesionales */}
              {statsAsignaciones.servicios_sin_profesional > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Atención: {statsAsignaciones.servicios_sin_profesional} servicio{statsAsignaciones.servicios_sin_profesional !== 1 ? 's' : ''} sin profesionales asignados
                      </h3>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Asigna profesionales a estos servicios para poder crear citas con ellos.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/servicios')}
                        className="mt-3 bg-white dark:bg-gray-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700"
                      >
                        Ir a Servicios
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Alerta si hay profesionales sin servicios */}
              {statsAsignaciones.profesionales_sin_servicio > 0 && (
                <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-primary-800 dark:text-primary-200">
                        {statsAsignaciones.profesionales_sin_servicio} profesional{statsAsignaciones.profesionales_sin_servicio !== 1 ? 'es' : ''} sin servicios asignados
                      </h3>
                      <p className="text-sm text-primary-700 dark:text-primary-300 mt-1">
                        Asigna servicios a estos profesionales para que puedan atender citas.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/servicios')}
                        className="mt-3 bg-white dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/50 text-primary-800 dark:text-primary-200 border-primary-300 dark:border-primary-700"
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
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                        Todas las asignaciones están completas
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Todos los servicios y profesionales activos tienen asignaciones correctas.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Resumen de estadísticas */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {statsAsignaciones.servicios_activos || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Servicios activos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {statsAsignaciones.profesionales_activos || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Profesionales activos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {statsAsignaciones.total_asignaciones_activas || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Asignaciones activas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {((statsAsignaciones.total_asignaciones_activas || 0) /
                      Math.max(1, (statsAsignaciones.servicios_activos || 0))).toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Promedio prof./servicio</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No hay datos de asignaciones disponibles
            </p>
          )}
        </div>

      </main>
    </div>
  );
}

export default Dashboard;

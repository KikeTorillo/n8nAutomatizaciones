/**
 * DashboardAusenciasTab - Dashboard de ausencias con gráficas
 * Muestra métricas generales y visualizaciones
 * Enero 2026
 */
import { useState, useMemo, memo } from 'react';
import {
  BarChart3,
  Users,
  Calendar,
  HeartPulse,
  Clock,
  RefreshCw,
  AlertCircle,
  PieChart,
  TrendingUp,
  Lock,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Select, StatCardGrid, Alert } from '@/components/ui';
import {
  useEstadisticasVacaciones,
  useEstadisticasIncapacidades,
  TIPOS_INCAPACIDAD_CONFIG,
} from '@/hooks/personas';
import { useBloqueos } from '@/hooks/agendamiento';
import {
  calcularEstadisticasBloqueos,
  esBloqueoAutoGenerado,
  LABELS_TIPO_BLOQUEO,
} from '@/utils/bloqueoHelpers';

/**
 * Barra de progreso para distribución por tipo
 */
const DistributionBar = memo(function DistributionBar({ items }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-center py-4">
        Sin datos disponibles
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const percentage = Math.round((item.value / total) * 100);
        return (
          <div key={index}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {item.label}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {item.value} ({percentage}%)
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${item.color} rounded-full transition-all`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
});

/**
 * Gráfico de barras horizontal por mes
 */
const MonthlyChart = memo(function MonthlyChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-center py-4">
        Sin datos disponibles
      </p>
    );
  }

  const maxCount = Math.max(...Object.values(data));

  return (
    <div className="space-y-2">
      {Object.entries(data).map(([mes, count]) => {
        const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
        const mesLabel = new Date(2024, parseInt(mes) - 1).toLocaleDateString(
          'es-MX',
          { month: 'short' }
        );
        return (
          <div key={mes} className="flex items-center gap-3">
            <span className="w-12 text-sm text-gray-500 dark:text-gray-400">
              {mesLabel}
            </span>
            <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="w-8 text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
});

/**
 * Skeleton de carga
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-gray-100 dark:bg-gray-800 rounded-lg h-24"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg h-64" />
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg h-64" />
      </div>
    </div>
  );
}

/**
 * Dashboard de ausencias con gráficas
 */
function DashboardAusenciasTab() {
  const queryClient = useQueryClient();
  const [anio, setAnio] = useState(new Date().getFullYear());

  // Hooks de estadísticas
  const {
    data: statsVacaciones,
    isLoading: loadingVacaciones,
    error: errorVacaciones,
  } = useEstadisticasVacaciones({ anio });

  const {
    data: statsIncapacidades,
    isLoading: loadingIncapacidades,
    error: errorIncapacidades,
  } = useEstadisticasIncapacidades({ anio });

  // Query de bloqueos
  const {
    data: bloqueos = [],
    isLoading: loadingBloqueos,
  } = useBloqueos({});

  const isLoading = loadingVacaciones || loadingIncapacidades || loadingBloqueos;
  const error = errorVacaciones || errorIncapacidades;

  // Opciones de años (últimos 5 años)
  const opcionesAnio = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y >= currentYear - 5; y--) {
      years.push({ value: y.toString(), label: y.toString() });
    }
    return years;
  }, []);

  // Distribución por tipo de incapacidad
  const distribucionTipo = useMemo(() => {
    if (!statsIncapacidades?.por_tipo) return [];
    return Object.entries(TIPOS_INCAPACIDAD_CONFIG).map(([key, config]) => ({
      label: config.label,
      value: statsIncapacidades.por_tipo[key] || 0,
      color:
        key === 'enfermedad_general'
          ? 'bg-red-500'
          : key === 'maternidad'
          ? 'bg-pink-500'
          : 'bg-orange-500',
    }));
  }, [statsIncapacidades]);

  // Estadísticas de bloqueos manuales
  const statsBloqueos = useMemo(() => {
    const bloqueosManuales = bloqueos.filter((b) => !esBloqueoAutoGenerado(b));
    return calcularEstadisticasBloqueos(bloqueosManuales);
  }, [bloqueos]);

  // Distribución por tipo de bloqueo
  const distribucionBloqueos = useMemo(() => {
    if (!statsBloqueos.porTipo || Object.keys(statsBloqueos.porTipo).length === 0) return [];

    const colores = {
      mantenimiento: 'bg-amber-500',
      evento_especial: 'bg-purple-500',
      emergencia: 'bg-rose-500',
      personal: 'bg-green-500',
      organizacional: 'bg-gray-500',
    };

    return Object.entries(statsBloqueos.porTipo).map(([tipo, count]) => ({
      label: LABELS_TIPO_BLOQUEO[tipo] || tipo,
      value: count,
      color: colores[tipo] || 'bg-gray-500',
    }));
  }, [statsBloqueos]);

  // Refresh de datos
  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: ['vacaciones'],
      refetchType: 'active',
    });
    queryClient.invalidateQueries({
      queryKey: ['incapacidades'],
      refetchType: 'active',
    });
    queryClient.invalidateQueries({
      queryKey: ['bloqueos'],
      refetchType: 'active',
    });
  };

  // Métricas de vacaciones
  const vacaciones = statsVacaciones || {};
  const totalProfesionales = vacaciones.saldos?.total_empleados || 0;
  const pendientesVac = vacaciones.solicitudes?.pendientes || 0;
  const diasOtorgados = vacaciones.saldos?.total_dias_usados || 0;

  // Métricas de incapacidades
  const incapacidades = statsIncapacidades || {};

  // Métricas generales consolidadas
  const totalAusentes =
    (incapacidades.activas || 0) +
    (vacaciones.solicitudes?.en_curso || 0);
  const totalDiasAusencia =
    (incapacidades.dias_totales || 0) + diasOtorgados;

  if (error) {
    return (
      <Alert variant="danger" className="my-4">
        <AlertCircle className="h-5 w-5" />
        <span>Error al cargar estadísticas: {error.message}</span>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Dashboard de Ausencias
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-28">
            <Select
              value={anio.toString()}
              onChange={(e) => setAnio(parseInt(e.target.value))}
              options={opcionesAnio}
            />
          </div>
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* Resumen General */}
          <section className="space-y-3">
            <h3 className="text-base font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Resumen General
            </h3>
            <StatCardGrid
              stats={[
                {
                  key: 'profesionales',
                  icon: Users,
                  label: 'Total profesionales',
                  value: totalProfesionales,
                  color: 'primary',
                },
                {
                  key: 'pendientes',
                  icon: Clock,
                  label: 'Solicitudes pendientes',
                  value: pendientesVac,
                  color: 'yellow',
                },
                {
                  key: 'ausentes',
                  icon: AlertCircle,
                  label: 'Ausentes hoy',
                  value: totalAusentes,
                  color: 'red',
                },
                {
                  key: 'dias-total',
                  icon: Calendar,
                  label: 'Días ausencia (año)',
                  value: totalDiasAusencia,
                  color: 'blue',
                },
              ]}
              columns={4}
            />
          </section>

          {/* Gráficos de Incapacidades */}
          <section className="space-y-3">
            <h3 className="text-base font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-red-500" />
              Incapacidades
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Por tipo */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-gray-400" />
                  Distribución por Tipo
                </h4>
                <DistributionBar items={distribucionTipo} />
              </div>

              {/* Por mes */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-gray-400" />
                  Incapacidades por Mes
                </h4>
                <MonthlyChart data={incapacidades.por_mes} />
              </div>
            </div>
          </section>

          {/* Gráfico de Bloqueos */}
          {distribucionBloqueos.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-base font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                Bloqueos Manuales
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-gray-400" />
                  Distribución por Tipo
                </h4>
                <DistributionBar items={distribucionBloqueos} />
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default DashboardAusenciasTab;

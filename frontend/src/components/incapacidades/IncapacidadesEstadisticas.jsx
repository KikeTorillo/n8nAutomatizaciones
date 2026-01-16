/**
 * IncapacidadesEstadisticas - Dashboard de estadísticas de incapacidades
 * Módulo de Profesionales - Enero 2026
 */
import { useState, useMemo } from 'react';
import {
  HeartPulse,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Clock,
  AlertCircle,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { Select } from '@/components/ui';
import {
  useEstadisticasIncapacidades,
  TIPOS_INCAPACIDAD_CONFIG,
} from '@/hooks/useIncapacidades';

/**
 * Tarjeta de estadística
 */
function StatCard({ icon: Icon, label, value, sublabel, trend, color = 'primary' }) {
  const colorClasses = {
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    gray: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-red-500' : 'text-green-500'}`}>
            {trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {value}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {label}
        </p>
        {sublabel && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Barra de progreso para distribución
 */
function DistributionBar({ items }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return null;

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
}

/**
 * Dashboard de estadísticas de incapacidades
 */
function IncapacidadesEstadisticas() {
  const [anio, setAnio] = useState(new Date().getFullYear());

  const { data: estadisticas, isLoading, error } = useEstadisticasIncapacidades({
    anio,
  });

  // Opciones de años
  const opcionesAnio = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y >= currentYear - 5; y--) {
      years.push({ value: y.toString(), label: y.toString() });
    }
    return years;
  }, []);

  // Distribución por tipo
  const distribucionTipo = useMemo(() => {
    if (!estadisticas?.por_tipo) return [];
    return Object.entries(TIPOS_INCAPACIDAD_CONFIG).map(([key, config]) => ({
      label: config.label,
      value: estadisticas.por_tipo[key] || 0,
      color: key === 'enfermedad_general' ? 'bg-red-500' :
             key === 'maternidad' ? 'bg-pink-500' : 'bg-orange-500',
    }));
  }, [estadisticas]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
        <span className="text-red-700 dark:text-red-300">
          Error al cargar estadísticas: {error.message}
        </span>
      </div>
    );
  }

  const stats = estadisticas || {};

  return (
    <div className="space-y-6">
      {/* Filtro de año */}
      <div className="flex justify-end">
        <div className="w-32">
          <Select
            value={anio.toString()}
            onChange={(e) => setAnio(parseInt(e.target.value))}
            options={opcionesAnio}
          />
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={HeartPulse}
          label="Total Incapacidades"
          value={stats.total || 0}
          sublabel={`Año ${anio}`}
          color="primary"
        />
        <StatCard
          icon={Users}
          label="Activas Actualmente"
          value={stats.activas || 0}
          sublabel="Profesionales con incapacidad"
          color="green"
        />
        <StatCard
          icon={Calendar}
          label="Días Totales"
          value={stats.dias_totales || 0}
          sublabel="Días de incapacidad acumulados"
          color="orange"
        />
        <StatCard
          icon={Clock}
          label="Promedio de Días"
          value={stats.promedio_dias ? parseFloat(stats.promedio_dias).toFixed(1) : '0'}
          sublabel="Por incapacidad"
          color="gray"
        />
      </div>

      {/* Distribuciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por tipo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-gray-400" />
            Distribución por Tipo
          </h3>
          {distribucionTipo.length > 0 ? (
            <DistributionBar items={distribucionTipo} />
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Sin datos disponibles
            </p>
          )}
        </div>

        {/* Por mes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-gray-400" />
            Incapacidades por Mes
          </h3>
          {stats.por_mes && Object.keys(stats.por_mes).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(stats.por_mes).map(([mes, count]) => {
                const maxCount = Math.max(...Object.values(stats.por_mes));
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                const mesLabel = new Date(2024, parseInt(mes) - 1).toLocaleDateString('es-MX', { month: 'short' });
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
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Sin datos disponibles
            </p>
          )}
        </div>
      </div>

      {/* Profesionales con más incapacidades */}
      {stats.top_profesionales && stats.top_profesionales.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-400" />
            Profesionales con Más Incapacidades
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Profesional
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Incapacidades
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Días Totales
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.top_profesionales.map((prof, index) => (
                  <tr key={prof.id || index} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {prof.nombre}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                      {prof.total_incapacidades}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                      {prof.dias_totales}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resumen de costos estimados */}
      {stats.costo_estimado !== undefined && (
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Impacto Estimado</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-primary-100 text-sm">Días perdidos</p>
              <p className="text-2xl font-bold">{stats.dias_totales || 0}</p>
            </div>
            <div>
              <p className="text-primary-100 text-sm">Citas potencialmente afectadas</p>
              <p className="text-2xl font-bold">{stats.citas_afectadas || '-'}</p>
            </div>
            <div>
              <p className="text-primary-100 text-sm">Costo estimado</p>
              <p className="text-2xl font-bold">
                {stats.costo_estimado
                  ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(stats.costo_estimado)
                  : '-'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IncapacidadesEstadisticas;

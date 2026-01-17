import { useState, useMemo } from 'react';
import { useEstadisticasPerfil } from '@/hooks/useMarketplace';
import { LoadingSpinner } from '@/components/ui';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Eye, MousePointerClick, Calendar, TrendingUp } from 'lucide-react';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

/**
 * Dashboard de analytics para el perfil de marketplace
 * Muestra métricas de vistas, clics y conversiones
 */
function AnalyticsDashboard({ perfilId }) {
  // Estado: rango de fechas (últimos 30 días por defecto)
  const [fechaInicio, setFechaInicio] = useState(() => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 30);
    return fecha.toISOString().split('T')[0];
  });

  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Query: estadísticas
  const { data: stats, isLoading } = useEstadisticasPerfil(perfilId, {
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
  });

  // Procesar datos para gráficas
  const chartData = useMemo(() => {
    if (!stats) return null;

    // Datos de vistas por día (últimos 30 días)
    const vistasPorDia = stats.vistas_por_dia || [];
    const fechas = vistasPorDia.map((item) =>
      new Date(item.fecha).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })
    );
    const vistas = vistasPorDia.map((item) => item.total || 0);

    // Datos de clics por tipo
    const clicsPorTipo = stats.clics_por_tipo || [];
    const tiposEvento = clicsPorTipo.map((item) => {
      const nombres = {
        clic_agendar: 'Agendar',
        clic_telefono: 'Teléfono',
        clic_sitio_web: 'Sitio Web',
        clic_instagram: 'Instagram',
        clic_facebook: 'Facebook',
        clic_whatsapp: 'WhatsApp',
      };
      return nombres[item.evento_tipo] || item.evento_tipo;
    });
    const clics = clicsPorTipo.map((item) => item.total || 0);

    return {
      vistas: {
        labels: fechas,
        datasets: [
          {
            label: 'Vistas del Perfil',
            data: vistas,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
          },
        ],
      },
      clics: {
        labels: tiposEvento,
        datasets: [
          {
            label: 'Número de Clics',
            data: clics,
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(139, 92, 246, 0.8)',
              'rgba(236, 72, 153, 0.8)',
            ],
          },
        ],
      },
      conversion: {
        labels: ['Vistas', 'Clics'],
        datasets: [
          {
            data: [stats.total_vistas || 0, stats.total_clics || 0],
            backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)'],
          },
        ],
      },
    };
  }, [stats]);

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  // Sin datos
  if (!stats) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <TrendingUp className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">No hay datos de analytics aún</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Las estadísticas aparecerán cuando los usuarios visiten tu perfil público
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros de fecha */}
      <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <div className="flex items-center gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Desde</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Hasta</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Vistas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Vistas</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{stats.total_vistas || 0}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>

        {/* Total Clics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Clics</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{stats.total_clics || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
              <MousePointerClick className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Tasa de Conversión */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tasa de Conversión</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                {stats.total_vistas > 0
                  ? ((stats.total_clics / stats.total_vistas) * 100).toFixed(1)
                  : '0.0'}
                %
              </p>
            </div>
            <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900/40 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica de Vistas por Día */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Vistas por Día</h3>
          {chartData && chartData.vistas.datasets[0].data.length > 0 ? (
            <Line
              data={chartData.vistas}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      precision: 0,
                    },
                  },
                },
              }}
            />
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Sin datos en este período</p>
          )}
        </div>

        {/* Gráfica de Clics por Tipo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Clics por Acción</h3>
          {chartData && chartData.clics.datasets[0].data.length > 0 ? (
            <Bar
              data={chartData.clics}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      precision: 0,
                    },
                  },
                },
              }}
            />
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Sin datos en este período</p>
          )}
        </div>
      </div>

      {/* Tabla de fuentes de tráfico */}
      {stats.fuentes_trafico && stats.fuentes_trafico.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Fuentes de Tráfico</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fuente
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Visitas
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">%</th>
                </tr>
              </thead>
              <tbody>
                {stats.fuentes_trafico.map((fuente, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                      {fuente.fuente || 'Directo'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100 text-right">
                      {fuente.total}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                      {((fuente.total / stats.total_vistas) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalyticsDashboard;

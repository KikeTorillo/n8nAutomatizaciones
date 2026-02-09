import { memo, useMemo } from 'react';
import { PieChart } from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { ESTADO_LABELS } from '@/hooks/suscripciones-negocio';

ChartJS.register(ArcElement, Tooltip, Legend);

// Colores para estados
const ESTADO_CHART_COLORS = {
  trial: { bg: 'rgba(59, 130, 246, 0.8)', border: 'rgb(59, 130, 246)' },
  activa: { bg: 'rgba(34, 197, 94, 0.8)', border: 'rgb(34, 197, 94)' },
  pausada: { bg: 'rgba(234, 179, 8, 0.8)', border: 'rgb(234, 179, 8)' },
  cancelada: { bg: 'rgba(239, 68, 68, 0.8)', border: 'rgb(239, 68, 68)' },
  vencida: { bg: 'rgba(107, 114, 128, 0.8)', border: 'rgb(107, 114, 128)' },
  pendiente_pago: { bg: 'rgba(249, 115, 22, 0.8)', border: 'rgb(249, 115, 22)' },
};

/**
 * Gráfica de distribución de suscriptores por estado
 * @param {Array} data - Datos [{ estado, cantidad }]
 * @param {boolean} isLoading - Estado de carga
 */
function DistribucionEstadoChart({ data = [], isLoading }) {
  const chartData = useMemo(() => ({
    labels: data.map(d => ESTADO_LABELS[d.estado] || d.estado),
    datasets: [
      {
        data: data.map(d => parseInt(d.cantidad || 0)),
        backgroundColor: data.map(d => ESTADO_CHART_COLORS[d.estado]?.bg || 'rgba(156, 163, 175, 0.8)'),
        borderColor: data.map(d => ESTADO_CHART_COLORS[d.estado]?.border || 'rgb(156, 163, 175)'),
        borderWidth: 2,
      },
    ],
  }), [data]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
    cutout: '60%',
  }), []);

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + parseInt(d.cantidad || 0), 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center mb-4">
        <PieChart className="w-5 h-5 text-purple-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Distribución por Estado
        </h3>
      </div>
      <div className="h-64 relative">
        <Doughnut data={chartData} options={options} />
        {/* Centro con total */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center -ml-16">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{total}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
          </div>
        </div>
      </div>
    </div>
  );
}

DistribucionEstadoChart.displayName = 'DistribucionEstadoChart';

export default memo(DistribucionEstadoChart);

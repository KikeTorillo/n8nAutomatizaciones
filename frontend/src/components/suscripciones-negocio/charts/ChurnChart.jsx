import { memo, useMemo } from 'react';
import { TrendingDown } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Gráfica de evolución de Churn Rate
 * @param {Array} data - Datos de evolución [{ periodo, churn_rate }]
 * @param {boolean} isLoading - Estado de carga
 */
function ChurnChart({ data = [], isLoading }) {
  const chartData = useMemo(() => ({
    labels: data.map(d => {
      if (d.periodo) {
        const [year, month] = d.periodo.split('-');
        return format(new Date(year, parseInt(month) - 1), 'MMM yyyy', { locale: es });
      }
      return d.mes || '';
    }),
    datasets: [
      {
        label: 'Churn Rate',
        data: data.map(d => parseFloat(d.churn_rate || 0)),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }), [data]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `Churn: ${context.parsed.y.toFixed(2)}%`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `${value}%`,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  }), []);

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center mb-4">
        <TrendingDown className="w-5 h-5 text-red-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Tasa de Cancelación (Churn)
        </h3>
      </div>
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

ChurnChart.displayName = 'ChurnChart';

export default memo(ChurnChart);

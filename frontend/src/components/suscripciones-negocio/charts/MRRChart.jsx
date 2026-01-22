import { memo, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Registrar componentes
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Gráfica de evolución de MRR
 * @param {Array} data - Datos de evolución [{ periodo, mrr }]
 * @param {boolean} isLoading - Estado de carga
 */
function MRRChart({ data = [], isLoading }) {
  const chartData = useMemo(() => ({
    labels: data.map(d => {
      if (d.periodo) {
        // Formato: "2026-01" -> "Ene 2026"
        const [year, month] = d.periodo.split('-');
        return format(new Date(year, parseInt(month) - 1), 'MMM yyyy', { locale: es });
      }
      return d.mes || '';
    }),
    datasets: [
      {
        label: 'MRR',
        data: data.map(d => parseFloat(d.mrr || 0)),
        borderColor: 'rgb(117, 53, 114)',
        backgroundColor: 'rgba(117, 53, 114, 0.1)',
        fill: true,
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
          label: (context) => `MRR: ${formatCurrency(context.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(value),
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
        <TrendingUp className="w-5 h-5 text-primary-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Evolución MRR
        </h3>
      </div>
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

MRRChart.displayName = 'MRRChart';

export default memo(MRRChart);

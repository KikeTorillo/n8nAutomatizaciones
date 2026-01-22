import { memo, useMemo } from 'react';
import { Users } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Gráfica de evolución de suscriptores (nuevos, cancelados, neto)
 * @param {Array} data - Datos [{ periodo, nuevos, cancelados, neto }]
 * @param {boolean} isLoading - Estado de carga
 */
function SuscriptoresChart({ data = [], isLoading }) {
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
        label: 'Nuevos',
        data: data.map(d => parseInt(d.nuevos || 0)),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderRadius: 4,
      },
      {
        label: 'Cancelados',
        data: data.map(d => -parseInt(d.cancelados || 0)),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderRadius: 4,
      },
    ],
  }), [data]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = Math.abs(context.parsed.y);
            return `${context.dataset.label}: ${value}`;
          },
        },
      },
    },
    scales: {
      y: {
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
        <Users className="w-5 h-5 text-blue-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Evolución de Suscriptores
        </h3>
      </div>
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}

SuscriptoresChart.displayName = 'SuscriptoresChart';

export default memo(SuscriptoresChart);

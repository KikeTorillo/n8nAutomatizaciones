import { useState } from 'react';
import { DollarSign, TrendingUp, Clock, Users, Calendar, ShoppingBag } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import Select from '@/components/ui/Select';
import { useDashboardComisiones, useGraficaComisionesPorDia } from '@/hooks/useComisiones';
import { useProfesionales } from '@/hooks/useProfesionales';
import { formatCurrency } from '@/lib/utils';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';

// Opciones de origen
const ORIGEN_OPTIONS = [
  { value: '', label: 'Todos los orígenes' },
  { value: 'cita', label: 'Citas (Servicios)' },
  { value: 'venta', label: 'Ventas POS (Productos)' },
];
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
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

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
  Filler
);

/**
 * Dashboard completo de comisiones con métricas y gráficas
 */
function ComisionesDashboard() {
  const hoy = new Date();
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('mes_actual');
  const [profesionalSeleccionado, setProfesionalSeleccionado] = useState('');
  const [origenSeleccionado, setOrigenSeleccionado] = useState('');

  // Fetch profesionales
  const { data: profesionalesData } = useProfesionales();
  const profesionales = profesionalesData?.profesionales || [];

  // Calcular fechas según periodo
  const getFechas = () => {
    switch (periodoSeleccionado) {
      case 'mes_actual':
        return {
          desde: format(startOfMonth(hoy), 'yyyy-MM-dd'),
          hasta: format(endOfMonth(hoy), 'yyyy-MM-dd'),
        };
      case 'mes_anterior':
        const mesAnterior = subMonths(hoy, 1);
        return {
          desde: format(startOfMonth(mesAnterior), 'yyyy-MM-dd'),
          hasta: format(endOfMonth(mesAnterior), 'yyyy-MM-dd'),
        };
      case 'ultimos_3_meses':
        return {
          desde: format(startOfMonth(subMonths(hoy, 2)), 'yyyy-MM-dd'),
          hasta: format(endOfMonth(hoy), 'yyyy-MM-dd'),
        };
      case 'ultimos_6_meses':
        return {
          desde: format(startOfMonth(subMonths(hoy, 5)), 'yyyy-MM-dd'),
          hasta: format(endOfMonth(hoy), 'yyyy-MM-dd'),
        };
      default:
        return {
          desde: format(startOfMonth(hoy), 'yyyy-MM-dd'),
          hasta: format(endOfMonth(hoy), 'yyyy-MM-dd'),
        };
    }
  };

  const { desde, hasta } = getFechas();

  // Fetch datos del dashboard
  const { data: dashboard, isLoading: loadingDashboard } = useDashboardComisiones({
    fecha_desde: desde,
    fecha_hasta: hasta,
    profesional_id: profesionalSeleccionado || undefined,
    origen: origenSeleccionado || undefined,
  });

  // Fetch datos para gráfica
  const { data: graficaData, isLoading: loadingGrafica } = useGraficaComisionesPorDia({
    fecha_desde: desde,
    fecha_hasta: hasta,
    profesional_id: profesionalSeleccionado || undefined,
    origen: origenSeleccionado || undefined,
  });

  // Métricas
  const totalComisiones = parseFloat(dashboard?.resumen?.total_monto || 0);
  const comisionesPendientes = parseFloat(dashboard?.resumen?.monto_pendiente || 0);
  const comisionesPagadas = parseFloat(dashboard?.resumen?.monto_pagado || 0);
  const totalProfesionales = parseInt(dashboard?.resumen?.profesionales_activos || 0);

  // Datos para gráfica de barras por día
  const barChartDataPorDia = {
    labels: graficaData?.map(d => format(new Date(d.fecha), 'dd MMM', { locale: es })) || [],
    datasets: [
      {
        label: 'Comisiones',
        data: graficaData?.map(d => parseFloat(d.total_monto)) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
    ],
  };

  const barChartOptionsPorDia = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `${formatCurrency(context.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(value),
        },
      },
    },
  };

  // Datos para gráfica de barras (pendientes vs pagadas)
  const barChartData = {
    labels: ['Comisiones'],
    datasets: [
      {
        label: 'Pendientes',
        data: [comisionesPendientes],
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
      },
      {
        label: 'Pagadas',
        data: [comisionesPagadas],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(value),
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Selector de período */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Período
            </label>
            <Select
              value={periodoSeleccionado}
              onChange={(e) => setPeriodoSeleccionado(e.target.value)}
            >
              <option value="mes_actual">Mes Actual</option>
              <option value="mes_anterior">Mes Anterior</option>
              <option value="ultimos_3_meses">Últimos 3 Meses</option>
              <option value="ultimos_6_meses">Últimos 6 Meses</option>
            </Select>
          </div>

          {/* Selector de profesional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Profesional
            </label>
            <Select
              value={profesionalSeleccionado}
              onChange={(e) => setProfesionalSeleccionado(e.target.value)}
            >
              <option value="">Todos los profesionales</option>
              {profesionales?.map(prof => (
                <option key={prof.id} value={prof.id}>
                  {prof.nombre} {prof.apellidos}
                </option>
              ))}
            </Select>
          </div>

          {/* Selector de origen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Origen
            </label>
            <Select
              value={origenSeleccionado}
              onChange={(e) => setOrigenSeleccionado(e.target.value)}
            >
              {ORIGEN_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total"
          value={formatCurrency(totalComisiones)}
          subtitle="Comisiones generadas"
          icon={DollarSign}
          color="green"
          isLoading={loadingDashboard}
        />

        <StatCard
          title="Pendientes"
          value={formatCurrency(comisionesPendientes)}
          subtitle="Por pagar"
          icon={Clock}
          color="orange"
          isLoading={loadingDashboard}
        />

        <StatCard
          title="Pagadas"
          value={formatCurrency(comisionesPagadas)}
          subtitle="Este período"
          icon={TrendingUp}
          color="blue"
          isLoading={loadingDashboard}
        />

        <StatCard
          title="Profesionales"
          value={totalProfesionales}
          subtitle="Con comisiones"
          icon={Users}
          color="purple"
          isLoading={loadingDashboard}
        />
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica de barras - Comisiones por día */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Comisiones por Día
            </h3>
          </div>
          {loadingGrafica ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="h-64">
              <Bar data={barChartDataPorDia} options={barChartOptionsPorDia} />
            </div>
          )}
        </div>

        {/* Gráfica de barras - Pendientes vs Pagadas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Estado de Pagos
            </h3>
          </div>
          {loadingDashboard ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="h-64">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ComisionesDashboard;

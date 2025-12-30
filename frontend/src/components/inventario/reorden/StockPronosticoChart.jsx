/**
 * Componente de Grafico de Pronostico de Stock
 * Muestra historico, lineas min/max, proyeccion y OC pendientes
 * Tipo Odoo - Modal al hacer clic en producto
 * Fecha: 30 Diciembre 2025
 */

import { useMemo } from 'react';
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
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  TrendingDown,
  Package,
  ShoppingCart,
  AlertTriangle,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { useHistoricoStock } from '@/hooks/useReorden';

// Registrar componentes de Chart.js
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
 * Grafico de pronostico de stock tipo Odoo
 * @param {Object} props
 * @param {number} props.productoId - ID del producto
 * @param {number} props.dias - Dias de historico (default: 30)
 */
export default function StockPronosticoChart({ productoId, dias = 30 }) {
  const { data, isLoading, error } = useHistoricoStock(productoId, dias);

  // Preparar datos para el grafico
  const chartData = useMemo(() => {
    if (!data) return null;

    const { snapshots, producto, oc_pendientes, proyeccion } = data;

    // Combinar fechas historicas y proyectadas
    const fechasHistoricas = snapshots.map(s => s.fecha);
    const fechasProyectadas = proyeccion.map(p => p.fecha);
    const hoy = new Date().toISOString().split('T')[0];

    // Labels combinados (historico + hoy + proyeccion)
    const allLabels = [
      ...fechasHistoricas,
      hoy,
      ...fechasProyectadas,
    ].filter((v, i, a) => a.indexOf(v) === i); // Eliminar duplicados

    // Dataset de stock historico (hasta hoy)
    const stockHistorico = allLabels.map(fecha => {
      if (fecha > hoy) return null;
      const snapshot = snapshots.find(s => s.fecha === fecha);
      if (snapshot) return snapshot.stock_actual;
      if (fecha === hoy) return producto.stock_actual;
      return null;
    });

    // Dataset de proyeccion (desde hoy)
    const stockProyectado = allLabels.map(fecha => {
      if (fecha < hoy) return null;
      if (fecha === hoy) return producto.stock_actual;
      const proy = proyeccion.find(p => p.fecha === fecha);
      return proy ? proy.stock_proyectado : null;
    });

    // Dataset de stock minimo (linea horizontal)
    const stockMinimo = allLabels.map(() => producto.stock_minimo);

    // Dataset de stock maximo (linea horizontal)
    const stockMaximo = allLabels.map(() =>
      producto.stock_maximo > 0 ? producto.stock_maximo : null
    );

    // Puntos de llegada de OC
    const ocPuntos = allLabels.map(fecha => {
      const oc = oc_pendientes.find(o => o.fecha_estimada === fecha);
      if (oc) {
        // Calcular stock proyectado en esa fecha + cantidad OC
        const proy = proyeccion.find(p => p.fecha === fecha);
        return proy ? proy.stock_proyectado : producto.stock_actual;
      }
      return null;
    });

    return {
      labels: allLabels.map(fecha => format(parseISO(fecha), 'dd MMM', { locale: es })),
      datasets: [
        {
          label: 'Stock Real',
          data: stockHistorico,
          borderColor: 'rgb(117, 53, 114)', // primary color
          backgroundColor: 'rgba(117, 53, 114, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5,
          order: 1,
        },
        {
          label: 'Proyeccion',
          data: stockProyectado,
          borderColor: 'rgb(147, 51, 234)', // purple
          backgroundColor: 'rgba(147, 51, 234, 0.05)',
          borderDash: [5, 5],
          fill: true,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 4,
          order: 2,
        },
        {
          label: 'Stock Minimo',
          data: stockMinimo,
          borderColor: 'rgb(239, 68, 68)', // red
          borderWidth: 2,
          borderDash: [10, 5],
          fill: false,
          pointRadius: 0,
          order: 3,
        },
        ...(producto.stock_maximo > 0
          ? [
              {
                label: 'Stock Maximo',
                data: stockMaximo,
                borderColor: 'rgb(34, 197, 94)', // green
                borderWidth: 2,
                borderDash: [10, 5],
                fill: false,
                pointRadius: 0,
                order: 4,
              },
            ]
          : []),
        {
          label: 'Llegada OC',
          data: ocPuntos,
          type: 'scatter',
          backgroundColor: 'rgb(249, 115, 22)', // orange
          borderColor: 'rgb(249, 115, 22)',
          pointRadius: 8,
          pointHoverRadius: 10,
          pointStyle: 'triangle',
          order: 0,
        },
      ],
    };
  }, [data]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              if (value === null) return '';
              return `${label}: ${value} ${data?.producto?.unidad_medida || 'unidades'}`;
            },
            afterBody: (tooltipItems) => {
              // Mostrar info de OC si hay en esta fecha
              if (!data?.oc_pendientes) return '';
              const idx = tooltipItems[0]?.dataIndex;
              if (idx === undefined) return '';

              const allLabels = chartData?.labels || [];
              const fechaLabel = allLabels[idx];

              // Buscar OC que llegue en esta fecha
              const ocEnFecha = data.oc_pendientes.find((oc) => {
                if (!oc.fecha_estimada) return false;
                const fechaOC = format(parseISO(oc.fecha_estimada), 'dd MMM', { locale: es });
                return fechaOC === fechaLabel;
              });

              if (ocEnFecha) {
                return [``, `OC ${ocEnFecha.folio}: +${ocEnFecha.cantidad} unidades`];
              }
              return '';
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(107, 114, 128, 0.1)',
          },
          title: {
            display: true,
            text: data?.producto?.unidad_medida || 'Cantidad',
          },
        },
      },
    }),
    [data, chartData]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-gray-500 dark:text-gray-400">
        <RefreshCw className="h-8 w-8 animate-spin mb-2" />
        <p>Cargando historico...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-red-500">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p>Error al cargar datos</p>
        <p className="text-sm text-gray-500">{error.message}</p>
      </div>
    );
  }

  if (!data || !chartData) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-gray-500 dark:text-gray-400">
        <Package className="h-8 w-8 mb-2 opacity-50" />
        <p>Sin datos disponibles</p>
      </div>
    );
  }

  const { producto, oc_pendientes, metricas } = data;

  return (
    <div className="space-y-4">
      {/* Header con info del producto */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {producto.nombre}
          </h3>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
            {producto.sku && <span>SKU: {producto.sku}</span>}
            {producto.categoria && <span>{producto.categoria}</span>}
            {producto.proveedor && <span>{producto.proveedor}</span>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Stock Actual</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {producto.stock_actual}
            </p>
          </div>
          <div className="text-center px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-xs text-red-600 dark:text-red-400">Minimo</p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">
              {producto.stock_minimo}
            </p>
          </div>
          {producto.stock_maximo > 0 && (
            <div className="text-center px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-xs text-green-600 dark:text-green-400">Maximo</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {producto.stock_maximo}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Grafico principal */}
      <div className="h-80">
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Metricas y OC pendientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        {/* Metricas de consumo */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="h-5 w-5 text-gray-500" />
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Metricas de Consumo</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Consumo diario promedio:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {metricas.consumo_diario_promedio} {producto.unidad_medida || 'u'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Dias hasta stock cero:</span>
              <span
                className={`font-medium ${
                  metricas.dias_hasta_stock_cero && metricas.dias_hasta_stock_cero < 7
                    ? 'text-red-600 dark:text-red-400'
                    : metricas.dias_hasta_stock_cero && metricas.dias_hasta_stock_cero < 14
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                {metricas.dias_hasta_stock_cero !== null
                  ? `${metricas.dias_hasta_stock_cero} dias`
                  : 'N/A (sin consumo)'}
              </span>
            </div>
          </div>
        </div>

        {/* OC Pendientes */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart className="h-5 w-5 text-gray-500" />
            <h4 className="font-medium text-gray-900 dark:text-gray-100">OC Pendientes</h4>
          </div>
          {oc_pendientes.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No hay ordenes de compra pendientes
            </p>
          ) : (
            <div className="space-y-2">
              {oc_pendientes.slice(0, 3).map((oc) => (
                <div
                  key={oc.id}
                  className="flex items-center justify-between text-sm bg-white dark:bg-gray-800 rounded px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {oc.folio}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      +{oc.cantidad}
                    </span>
                    {oc.fecha_estimada && (
                      <span className="text-gray-500 dark:text-gray-400 ml-2">
                        {format(parseISO(oc.fecha_estimada), 'dd MMM', { locale: es })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {oc_pendientes.length > 3 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  +{oc_pendientes.length - 3} OC mas
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

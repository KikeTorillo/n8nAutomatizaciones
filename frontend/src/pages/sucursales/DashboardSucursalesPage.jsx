import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore, { selectUser } from '@/store/authStore';
import { useSucursales, useMetricasSucursales } from '@/hooks/useSucursales';
import { BackButton, Button } from '@/components/ui';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  CalendarCheck,
  ShoppingCart,
  DollarSign,
  Package,
  ArrowRightLeft,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

/**
 * Dashboard Multi-Sucursal
 * Vista consolidada de métricas por sucursal con comparativas y tendencias
 */
function DashboardSucursalesPage() {
  const navigate = useNavigate();
  const user = useAuthStore(selectUser);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);

  // Cargar sucursales para el selector
  const { data: sucursales = [], isLoading: loadingSucursales } = useSucursales({ activo: true });

  // Cargar métricas según sucursal seleccionada
  const {
    data: metricas,
    isLoading: loadingMetricas,
    error: errorMetricas,
    refetch: refetchMetricas
  } = useMetricasSucursales({
    sucursal_id: sucursalSeleccionada || undefined,
  });

  // Formatear moneda
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Calcular variación porcentual
  const calcularVariacion = (actual, anterior) => {
    if (!anterior || anterior === 0) return null;
    return ((actual - anterior) / anterior * 100).toFixed(1);
  };

  // Componente de Card KPI
  const KPICard = ({ title, value, previousValue, icon: Icon, color = 'primary', isMoney = false }) => {
    const displayValue = isMoney ? formatMoney(value) : value?.toLocaleString() || '0';
    const variacion = calcularVariacion(value, previousValue);
    const isPositive = variacion > 0;
    const isNegative = variacion < 0;

    const colorClasses = {
      primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
      green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      blue: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
      amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          {variacion !== null && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              isPositive ? 'text-green-600 dark:text-green-400' :
              isNegative ? 'text-red-600 dark:text-red-400' :
              'text-gray-500 dark:text-gray-400'
            }`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : isNegative ? <TrendingDown className="w-4 h-4" /> : null}
              {Math.abs(variacion)}%
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{displayValue}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{title}</p>
      </div>
    );
  };

  // Componente de barra de progreso para comparativa
  const ProgressBar = ({ label, value, maxValue, color = 'primary' }) => {
    const percentage = maxValue > 0 ? (value / maxValue * 100) : 0;
    const colorClasses = {
      primary: 'bg-primary-500',
      blue: 'bg-primary-500',
      green: 'bg-green-500',
      amber: 'bg-amber-500',
    };

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[60%]">
            {label}
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatMoney(value)}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${colorClasses[color]}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    );
  };

  // Encontrar el valor máximo para las barras de progreso
  const maxVentas = useMemo(() => {
    if (!metricas?.comparativaSucursales) return 0;
    return Math.max(...metricas.comparativaSucursales.map(s => s.total_ventas || 0));
  }, [metricas?.comparativaSucursales]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <BackButton to="/sucursales" label="Sucursales" />
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Dashboard Multi-Sucursal
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {sucursalSeleccionada
                      ? sucursales.find(s => s.id === sucursalSeleccionada)?.nombre
                      : 'Todas las sucursales'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Selector de Sucursal */}
              <select
                value={sucursalSeleccionada || ''}
                onChange={(e) => setSucursalSeleccionada(e.target.value ? parseInt(e.target.value) : null)}
                className="text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={loadingSucursales}
              >
                <option value="">Todas las sucursales</option>
                {sucursales.map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchMetricas()}
                disabled={loadingMetricas}
              >
                <RefreshCw className={`w-4 h-4 ${loadingMetricas ? 'animate-spin' : ''}`} />
              </Button>

              <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                {user?.nombre}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {errorMetricas && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                Error al cargar métricas
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {errorMetricas.message || 'Ocurrió un error al cargar los datos'}
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loadingMetricas ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  <div className="w-16 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : metricas ? (
          <>
            {/* Cards KPI */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <KPICard
                title="Ventas Hoy"
                value={metricas.ventas?.hoy?.total || 0}
                previousValue={metricas.ventas?.ayer?.total}
                icon={ShoppingCart}
                color="primary"
                isMoney
              />
              <KPICard
                title="Citas Hoy"
                value={metricas.citas?.hoy?.total || 0}
                previousValue={metricas.citas?.ayer?.total}
                icon={CalendarCheck}
                color="blue"
              />
              <KPICard
                title="Ingresos del Mes"
                value={metricas.ventas?.mes?.total || 0}
                previousValue={metricas.ventas?.mes_anterior?.total}
                icon={DollarSign}
                color="green"
                isMoney
              />
              <KPICard
                title="Ticket Promedio"
                value={metricas.ventas?.hoy?.ticket_promedio || 0}
                previousValue={metricas.ventas?.ayer?.ticket_promedio}
                icon={TrendingUp}
                color="amber"
                isMoney
              />
            </div>

            {/* Grid de contenido */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Comparativa por Sucursal */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Ventas por Sucursal
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/sucursales')}
                  >
                    Ver todas
                  </Button>
                </div>

                {metricas.comparativaSucursales?.length > 0 ? (
                  <div className="space-y-4">
                    {metricas.comparativaSucursales.map((sucursal, index) => (
                      <ProgressBar
                        key={sucursal.id}
                        label={sucursal.nombre}
                        value={sucursal.total_ventas || 0}
                        maxValue={maxVentas}
                        color={index === 0 ? 'primary' : index === 1 ? 'blue' : index === 2 ? 'green' : 'amber'}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No hay datos de ventas para mostrar
                    </p>
                  </div>
                )}
              </div>

              {/* Panel lateral */}
              <div className="space-y-6">
                {/* Transferencias Pendientes */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Transferencias
                    </h3>
                    <ArrowRightLeft className="w-5 h-5 text-gray-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {metricas.transferencias?.pendientes || 0}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">Pendientes</p>
                    </div>
                    <div className="text-center p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {metricas.transferencias?.enviadas || 0}
                      </p>
                      <p className="text-xs text-primary-700 dark:text-primary-300">Enviadas</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => navigate('/sucursales/transferencias')}
                  >
                    Ver Transferencias
                  </Button>
                </div>

                {/* Tendencia 7 días */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Tendencia 7 días
                  </h3>

                  {metricas.tendencia?.length > 0 ? (
                    <div className="space-y-2">
                      {metricas.tendencia.map((dia, index) => {
                        const maxDia = Math.max(...metricas.tendencia.map(d => d.total || 0));
                        const percentage = maxDia > 0 ? ((dia.total || 0) / maxDia * 100) : 0;

                        return (
                          <div key={index} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 dark:text-gray-400 w-8">
                              {new Date(dia.fecha).toLocaleDateString('es-MX', { weekday: 'short' })}
                            </span>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-primary-500 transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-16 text-right">
                              {formatMoney(dia.total || 0)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      Sin datos de tendencia
                    </p>
                  )}
                </div>

                {/* Resumen de citas */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Citas del Mes
                  </h3>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {metricas.citas?.mes?.confirmadas || 0}
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300">Confirmadas</p>
                    </div>
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                      <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                        {metricas.citas?.mes?.pendientes || 0}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">Pendientes</p>
                    </div>
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
                      <p className="text-lg font-bold text-red-600 dark:text-red-400">
                        {metricas.citas?.mes?.canceladas || 0}
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300">Canceladas</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => navigate('/citas')}
                  >
                    Ver Calendario
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabla de resumen por sucursal */}
            {metricas.comparativaSucursales?.length > 0 && (
              <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Resumen Detallado por Sucursal
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Sucursal
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Ventas
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Transacciones
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Citas
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Ticket Promedio
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {metricas.comparativaSucursales.map((sucursal) => (
                        <tr
                          key={sucursal.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                          onClick={() => navigate(`/sucursales/${sucursal.id}`)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                sucursal.es_matriz
                                  ? 'bg-primary-100 dark:bg-primary-900/30'
                                  : 'bg-gray-100 dark:bg-gray-700'
                              }`}>
                                <Building2 className={`w-4 h-4 ${
                                  sucursal.es_matriz
                                    ? 'text-primary-600 dark:text-primary-400'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`} />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {sucursal.nombre}
                                </p>
                                {sucursal.es_matriz && (
                                  <span className="text-xs text-primary-600 dark:text-primary-400">
                                    Matriz
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {formatMoney(sucursal.total_ventas || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700 dark:text-gray-300">
                            {sucursal.num_transacciones || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700 dark:text-gray-300">
                            {sucursal.total_citas || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700 dark:text-gray-300">
                            {formatMoney(sucursal.ticket_promedio || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Sin datos disponibles
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              No hay métricas para mostrar en este momento
            </p>
            <Button onClick={() => refetchMetricas()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardSucursalesPage;

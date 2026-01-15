/**
 * Pagina de Reorden Automatico
 * Dashboard con metricas, productos bajo minimo y acciones rapidas
 * Fecha: 29 Diciembre 2025
 */

import { useState } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  ShoppingCart,
  Clock,
  Play,
  Settings,
  Package,
  TrendingDown,
  CheckCircle,
  XCircle,
  ChevronRight,
  LineChart,
} from 'lucide-react';
import { useModalManager } from '@/hooks/useModalManager';
import {
  useDashboardReorden,
  useProductosBajoMinimo,
  useEjecutarReordenManual,
  useLogsReorden,
} from '@/hooks/useReorden';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Button from '@/components/ui/Button';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import StockPronosticoChart from '@/components/inventario/reorden/StockPronosticoChart';

export default function ReordenPage() {
  const [soloSinOC, setSoloSinOC] = useState(true);

  // Modales centralizados
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    pronostico: { isOpen: false, data: null },
    ejecutar: { isOpen: false },
  });

  const { data: dashboard, isLoading: loadingDashboard } = useDashboardReorden();
  const { data: productosBajoMinimo, isLoading: loadingProductos } = useProductosBajoMinimo({
    solo_sin_oc: soloSinOC,
    limit: 20,
  });
  const { data: logs, isLoading: loadingLogs } = useLogsReorden({ limit: 5 });
  const ejecutarMutation = useEjecutarReordenManual();

  const handleEjecutar = () => {
    openModal('ejecutar');
  };

  const confirmEjecutar = () => {
    ejecutarMutation.mutate(undefined, {
      onSettled: () => closeModal('ejecutar'),
    });
  };

  return (
    <InventarioPageLayout
      icon={RefreshCw}
      title="Reorden Automático"
      subtitle="Sistema de reabastecimiento automático basado en reglas"
      actions={
        <div className="flex gap-2">
          <Link
            to="/inventario/reorden/reglas"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Configurar Reglas</span>
            <span className="sm:hidden">Reglas</span>
          </Link>
          <Button
            variant="primary"
            onClick={handleEjecutar}
            disabled={ejecutarMutation.isPending}
            icon={ejecutarMutation.isPending ? RefreshCw : Play}
            className={ejecutarMutation.isPending ? '[&_svg]:animate-spin' : ''}
          >
            <span className="hidden sm:inline">Ejecutar Ahora</span>
            <span className="sm:hidden">Ejecutar</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">

      {/* Metricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Reglas Activas"
          value={dashboard?.reglas?.activas || 0}
          subtitle={`${dashboard?.reglas?.inactivas || 0} inactivas`}
          icon={Settings}
          color="primary"
          loading={loadingDashboard}
        />
        <MetricCard
          title="Productos Bajo Minimo"
          value={dashboard?.metricas?.total_productos_bajo_minimo || 0}
          subtitle={`${dashboard?.metricas?.total_productos_sin_oc || 0} sin OC pendiente`}
          icon={TrendingDown}
          color="red"
          loading={loadingDashboard}
        />
        <MetricCard
          title="OCs Generadas Hoy"
          value={dashboard?.metricas?.ordenes_generadas_hoy || 0}
          subtitle={`${dashboard?.metricas?.ordenes_generadas_semana || 0} esta semana`}
          icon={ShoppingCart}
          color="green"
          loading={loadingDashboard}
        />
        <MetricCard
          title="Proxima Ejecucion"
          value={dashboard?.metricas?.proxima_ejecucion_estimada ? '6:00 AM' : '-'}
          subtitle={
            dashboard?.metricas?.ultima_ejecucion
              ? `Ultima: ${formatDistanceToNow(new Date(dashboard.metricas.ultima_ejecucion), { addSuffix: true, locale: es })}`
              : 'Sin ejecuciones'
          }
          icon={Clock}
          color="blue"
          loading={loadingDashboard}
        />
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productos bajo minimo */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Productos Bajo Minimo
                </h2>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={soloSinOC}
                  onChange={(e) => setSoloSinOC(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Solo sin OC pendiente
              </label>
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {loadingProductos ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                Cargando productos...
              </div>
            ) : productosBajoMinimo?.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="font-medium">Todos los productos tienen stock suficiente</p>
                <p className="text-sm mt-1">O ya tienen ordenes de compra pendientes</p>
              </div>
            ) : (
              productosBajoMinimo?.slice(0, 10).map((producto) => (
                <div
                  key={producto.producto_id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => openModal('pronostico', producto)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && openModal('pronostico', producto)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {producto.producto_nombre}
                        </p>
                        <LineChart className="h-4 w-4 text-primary-500 flex-shrink-0" title="Ver pronostico" />
                        {producto.tiene_oc_pendiente && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            OC: {producto.oc_pendiente_folio}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        {producto.producto_sku && <span>SKU: {producto.producto_sku}</span>}
                        {producto.categoria_nombre && <span>{producto.categoria_nombre}</span>}
                        {producto.proveedor_nombre && <span>{producto.proveedor_nombre}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-sm font-semibold ${
                              producto.stock_actual <= 0
                                ? 'text-red-600 dark:text-red-400'
                                : producto.stock_actual <= producto.stock_minimo / 2
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-gray-900 dark:text-gray-100'
                            }`}
                          >
                            {producto.stock_actual}
                          </span>
                          <span className="text-xs text-gray-500">/ {producto.stock_minimo} min</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Sugerido: +{producto.cantidad_sugerida}
                        </p>
                      </div>

                      <Link
                        to={`/inventario/ordenes-compra/nueva?producto=${producto.producto_id}`}
                        className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                        title="Crear OC"
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {productosBajoMinimo?.length > 10 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
              <Link
                to="/inventario/productos?stock_critico=true"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Ver todos ({productosBajoMinimo.length} productos)
                <ChevronRight className="h-4 w-4 inline ml-1" />
              </Link>
            </div>
          )}
        </div>

        {/* Historial de ejecuciones */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Ultimas Ejecuciones
              </h2>
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {loadingLogs ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                Cargando...
              </div>
            ) : logs?.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Sin ejecuciones registradas</p>
              </div>
            ) : (
              logs?.map((log) => (
                <div key={log.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {log.ordenes_generadas > 0 ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : log.errores > 0 ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {log.tipo === 'job_cron' ? 'Automatico' : 'Manual'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(log.inicio_en), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-gray-900 dark:text-gray-100">
                        {log.ordenes_generadas} OCs
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {log.reglas_evaluadas} reglas
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <Link
              to="/inventario/reorden/logs"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Ver historial completo
              <ChevronRight className="h-4 w-4 inline ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Info del job */}
      {dashboard?.job && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-200">
                Job automatico configurado: {dashboard.job.schedule}
              </p>
              <p className="text-blue-600 dark:text-blue-400 mt-1">
                El sistema evalua las reglas de reabastecimiento todos los dias a las 6:00 AM.
                Los productos con stock bajo y reglas activas generaran OCs automaticamente en estado borrador.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>

      {/* Modal de Pronostico de Stock */}
      <Modal
        isOpen={isOpen('pronostico')}
        onClose={() => closeModal('pronostico')}
        title="Pronostico de Stock"
        subtitle={getModalData('pronostico')?.producto_nombre}
        size="xl"
      >
        {getModalData('pronostico') && (
          <StockPronosticoChart productoId={getModalData('pronostico').producto_id} dias={30} />
        )}
      </Modal>

      {/* Confirm Dialog para ejecutar reorden */}
      <ConfirmDialog
        isOpen={isOpen('ejecutar')}
        onClose={() => closeModal('ejecutar')}
        onConfirm={confirmEjecutar}
        title="Ejecutar Reorden"
        message="¿Ejecutar evaluacion de reorden ahora? Esto generara OCs para productos con stock bajo segun las reglas configuradas."
        confirmLabel="Ejecutar"
        variant="primary"
        isLoading={ejecutarMutation.isPending}
      />
    </InventarioPageLayout>
  );
}

// Componente de tarjeta de metrica
function MetricCard({ title, value, subtitle, icon: Icon, color, loading }) {
  const colorClasses = {
    primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{title}</p>
          {loading ? (
            <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

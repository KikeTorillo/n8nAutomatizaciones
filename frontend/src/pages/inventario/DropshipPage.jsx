/**
 * Pagina de Dropshipping
 * Dashboard con ventas pendientes, OC dropship y configuracion
 * Fecha: 30 Diciembre 2025
 */

import { useState } from 'react';
import {
  RefreshCw,
  Truck,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Eye,
  Settings,
  ShoppingBag,
  MapPin,
  Phone,
  User,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import {
  useDropshipEstadisticas,
  useDropshipConfiguracion,
  useVentasPendientesDropship,
  useOrdenesDropship,
  useActualizarConfigDropship,
  useCrearOCDesdeVenta,
  useConfirmarEntregaDropship,
  useCancelarDropship,
} from '@/hooks/useDropship';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils';
import BackButton from '@/components/ui/BackButton';
import InventarioNavTabs from '@/components/inventario/InventarioNavTabs';

// Estados con colores
const ESTADOS = {
  borrador: { label: 'Borrador', color: 'gray', icon: Clock },
  enviada: { label: 'Enviada', color: 'blue', icon: Truck },
  recibida: { label: 'Entregada', color: 'green', icon: CheckCircle },
  cancelada: { label: 'Cancelada', color: 'red', icon: XCircle },
};

export default function DropshipPage() {
  const [filtroEstado, setFiltroEstado] = useState('');
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [showConfigurar, setShowConfigurar] = useState(false);

  const { data: stats, isLoading: loadingStats } = useDropshipEstadisticas();
  const { data: config } = useDropshipConfiguracion();
  const { data: ventasPendientes, isLoading: loadingPendientes } = useVentasPendientesDropship();
  const { data: ordenes, isLoading: loadingOrdenes } = useOrdenesDropship(
    filtroEstado ? { estado: filtroEstado } : {}
  );

  const crearOCMutation = useCrearOCDesdeVenta();
  const confirmarMutation = useConfirmarEntregaDropship();
  const cancelarMutation = useCancelarDropship();
  const actualizarConfigMutation = useActualizarConfigDropship();

  const handleCrearOC = (ventaId) => {
    if (confirm('Generar OC dropship para esta venta?')) {
      crearOCMutation.mutate(ventaId);
    }
  };

  const handleConfirmarEntrega = (id) => {
    if (confirm('Confirmar que el cliente recibio el producto?')) {
      confirmarMutation.mutate({ id });
      setOrdenSeleccionada(null);
    }
  };

  const handleCancelar = (id) => {
    const motivo = prompt('Motivo de cancelacion:');
    if (motivo) {
      cancelarMutation.mutate({ id, motivo });
      setOrdenSeleccionada(null);
    }
  };

  const toggleAutoGenerar = () => {
    actualizarConfigMutation.mutate({
      dropship_auto_generar_oc: !config?.dropship_auto_generar_oc,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header con navegación */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <BackButton to="/home" label="Volver al Inicio" className="mb-3" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventario</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gestiona productos, proveedores y stock
        </p>
      </div>

      {/* Tabs de navegación */}
      <InventarioNavTabs />

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header de sección */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Truck className="h-7 w-7 sm:h-8 sm:w-8 text-primary-600 dark:text-primary-400 flex-shrink-0" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                Dropshipping
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Gestión de envíos directos del proveedor al cliente
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowConfigurar(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Settings className="h-4 w-4" />
            Configuración
          </button>
        </div>

      {/* Metricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Ventas Pendientes"
          value={stats?.ventas_pendientes || 0}
          icon={ShoppingBag}
          color="amber"
          loading={loadingStats}
        />
        <MetricCard
          title="Borradores"
          value={stats?.borradores || 0}
          icon={Clock}
          color="gray"
          loading={loadingStats}
        />
        <MetricCard
          title="Enviadas"
          value={stats?.enviadas || 0}
          icon={Truck}
          color="blue"
          loading={loadingStats}
        />
        <MetricCard
          title="Entregadas"
          value={stats?.entregadas || 0}
          icon={CheckCircle}
          color="green"
          loading={loadingStats}
        />
        <MetricCard
          title="Total Pendiente"
          value={formatCurrency(parseFloat(stats?.total_pendiente) || 0)}
          icon={Package}
          color="primary"
          loading={loadingStats}
          isMonetary
        />
      </div>

      {/* Ventas Pendientes de Generar OC */}
      {(ventasPendientes?.length > 0 || loadingPendientes) && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-200">
              Ventas Pendientes de Procesar
            </h2>
          </div>

          {loadingPendientes ? (
            <div className="flex justify-center py-4">
              <RefreshCw className="h-5 w-5 animate-spin text-amber-600" />
            </div>
          ) : (
            <div className="space-y-2">
              {ventasPendientes?.map((venta) => (
                <div
                  key={venta.venta_id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{venta.folio}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {venta.cliente_nombre} - {venta.items_dropship} items dropship
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(parseFloat(venta.total))}
                    </span>
                    <button
                      onClick={() => handleCrearOC(venta.venta_id)}
                      disabled={crearOCMutation.isPending}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50"
                    >
                      {crearOCMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Generar OC
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filtros y Lista de OC */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Ordenes Dropship
            </h2>
            <div className="flex gap-2">
              {['', 'borrador', 'enviada', 'recibida', 'cancelada'].map((estado) => (
                <button
                  key={estado}
                  onClick={() => setFiltroEstado(estado)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    filtroEstado === estado
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {estado === '' ? 'Todas' : ESTADOS[estado]?.label || estado}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabla de OC */}
        <div className="overflow-x-auto">
          {loadingOrdenes ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : ordenes?.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No hay órdenes dropship"
              description="Las órdenes dropship aparecerán cuando haya ventas con productos de envío directo"
            />
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Folio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {ordenes?.map((orden) => {
                  const estadoInfo = ESTADOS[orden.estado] || ESTADOS.borrador;
                  const IconEstado = estadoInfo.icon;

                  return (
                    <tr
                      key={orden.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {orden.folio}
                          </span>
                          {orden.venta_folio && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ({orden.venta_folio})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {orden.cliente_nombre || 'Sin cliente'}
                          </span>
                          {orden.cliente_telefono && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {orden.cliente_telefono}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {orden.proveedor_nombre}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(parseFloat(orden.total))}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full
                            ${estadoInfo.color === 'gray' && 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}
                            ${estadoInfo.color === 'blue' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}
                            ${estadoInfo.color === 'green' && 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'}
                            ${estadoInfo.color === 'red' && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}
                          `}
                        >
                          <IconEstado className="h-3 w-3" />
                          {estadoInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(orden.creado_en), 'dd/MM/yy HH:mm', { locale: es })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          onClick={() => setOrdenSeleccionada(orden)}
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      </div>

      {/* Modal Detalle de Orden */}
      <Modal
        isOpen={!!ordenSeleccionada}
        onClose={() => setOrdenSeleccionada(null)}
        title={`Orden ${ordenSeleccionada?.folio}`}
        size="lg"
      >
        {ordenSeleccionada && (
          <div className="space-y-4">
            {/* Info Cliente */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Datos del Cliente
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-gray-100">
                    {ordenSeleccionada.cliente_nombre || 'Sin nombre'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-gray-100">
                    {ordenSeleccionada.cliente_telefono || 'Sin telefono'}
                  </span>
                </div>
                <div className="flex items-start gap-2 col-span-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span className="text-gray-900 dark:text-gray-100">
                    {ordenSeleccionada.direccion_envio_cliente || 'Sin direccion'}
                  </span>
                </div>
              </div>
            </div>

            {/* Info Orden */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Proveedor:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">
                  {ordenSeleccionada.proveedor_nombre}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Venta:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">
                  {ordenSeleccionada.venta_folio || '-'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Total:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(parseFloat(ordenSeleccionada.total))}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Items:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">
                  {ordenSeleccionada.total_items || '-'}
                </span>
              </div>
            </div>

            {/* Acciones */}
            {ordenSeleccionada.estado !== 'recibida' &&
              ordenSeleccionada.estado !== 'cancelada' && (
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="ghost"
                    onClick={() => handleCancelar(ordenSeleccionada.id)}
                    disabled={cancelarMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleConfirmarEntrega(ordenSeleccionada.id)}
                    disabled={confirmarMutation.isPending}
                  >
                    {confirmarMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    )}
                    Confirmar Entrega
                  </Button>
                </div>
              )}
          </div>
        )}
      </Modal>

      {/* Modal Configuracion */}
      <Modal
        isOpen={showConfigurar}
        onClose={() => setShowConfigurar(false)}
        title="Configuracion de Dropshipping"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                Generacion Automatica de OC
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Al confirmar una venta con productos dropship, generar OC automaticamente
              </p>
            </div>
            <button
              onClick={toggleAutoGenerar}
              disabled={actualizarConfigMutation.isPending}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                ${config?.dropship_auto_generar_oc ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'}
              `}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                  ${config?.dropship_auto_generar_oc ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Si esta desactivado, las ventas con productos dropship apareceran en la seccion
            &quot;Pendientes de Procesar&quot; para generar la OC manualmente.
          </p>
        </div>
      </Modal>
    </div>
  );
}

// Componente de Metrica
function MetricCard({ title, value, icon: Icon, color, loading, isMonetary }) {
  const colorClasses = {
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    gray: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3">
        {loading ? (
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ) : (
          <p
            className={`text-2xl font-bold text-gray-900 dark:text-gray-100 ${isMonetary ? 'text-lg' : ''}`}
          >
            {value}
          </p>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      </div>
    </div>
  );
}

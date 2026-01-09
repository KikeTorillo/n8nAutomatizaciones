/**
 * Pagina de Consigna (Inventario en Consignacion)
 * Stock de proveedores en tu almacen, pago solo al vender
 * Fecha: 31 Diciembre 2025
 */

import { useState } from 'react';
import {
  RefreshCw,
  Plus,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Handshake,
  Warehouse,
  FileText,
  DollarSign,
  Pause,
  Play,
  PackagePlus,
  PackageMinus,
  AlertTriangle,
  Percent,
  Calendar,
  Building2,
} from 'lucide-react';
import {
  useAcuerdosConsigna,
  useStockConsigna,
  useLiquidacionesConsigna,
  usePendienteLiquidar,
  useActivarAcuerdoConsigna,
  usePausarAcuerdoConsigna,
  useTerminarAcuerdoConsigna,
  useConfirmarLiquidacion,
  useCancelarLiquidacion,
} from '@/hooks/useConsigna';
import { useProveedores } from '@/hooks/useProveedores';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatCurrency } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import AcuerdoFormDrawer from '@/components/inventario/consigna/AcuerdoFormDrawer';
import AcuerdoDetalleModal from '@/components/inventario/consigna/AcuerdoDetalleModal';
import RecibirMercanciaDrawer from '@/components/inventario/consigna/RecibirMercanciaDrawer';
import DevolverMercanciaDrawer from '@/components/inventario/consigna/DevolverMercanciaDrawer';
import LiquidacionFormModal from '@/components/inventario/consigna/LiquidacionFormModal';
import LiquidacionDetalleModal from '@/components/inventario/consigna/LiquidacionDetalleModal';

// Estados de acuerdos con colores
const ESTADOS_ACUERDO = {
  borrador: { label: 'Borrador', color: 'gray', icon: Clock },
  activo: { label: 'Activo', color: 'green', icon: CheckCircle },
  pausado: { label: 'Pausado', color: 'amber', icon: Pause },
  terminado: { label: 'Terminado', color: 'red', icon: XCircle },
};

// Estados de liquidaciones con colores
const ESTADOS_LIQUIDACION = {
  borrador: { label: 'Borrador', color: 'gray', icon: Clock },
  confirmada: { label: 'Confirmada', color: 'blue', icon: CheckCircle },
  pagada: { label: 'Pagada', color: 'green', icon: DollarSign },
  cancelada: { label: 'Cancelada', color: 'red', icon: XCircle },
};

// Tabs disponibles
const TABS = [
  { id: 'acuerdos', label: 'Acuerdos', icon: Handshake },
  { id: 'stock', label: 'Stock', icon: Warehouse },
  { id: 'liquidaciones', label: 'Liquidaciones', icon: FileText },
];

export default function ConsignaPage() {
  // Estado de UI
  const [activeTab, setActiveTab] = useState('acuerdos');
  const [filtroEstadoAcuerdo, setFiltroEstadoAcuerdo] = useState('');
  const [filtroEstadoLiq, setFiltroEstadoLiq] = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState('');

  // Modales/Drawers
  const [showNuevoAcuerdo, setShowNuevoAcuerdo] = useState(false);
  const [acuerdoSeleccionado, setAcuerdoSeleccionado] = useState(null);
  const [acuerdoRecibir, setAcuerdoRecibir] = useState(null);
  const [acuerdoDevolver, setAcuerdoDevolver] = useState(null);
  const [showNuevaLiquidacion, setShowNuevaLiquidacion] = useState(false);
  const [liquidacionSeleccionada, setLiquidacionSeleccionada] = useState(null);

  // Estados para ConfirmDialogs
  const [confirmActivar, setConfirmActivar] = useState(null);
  const [confirmPausar, setConfirmPausar] = useState(null);
  const [confirmTerminar, setConfirmTerminar] = useState(null);
  const [confirmLiq, setConfirmLiq] = useState(null);
  const [confirmCancelarLiq, setConfirmCancelarLiq] = useState(null);

  // Queries
  const { data: acuerdosData, isLoading: loadingAcuerdos } = useAcuerdosConsigna({
    estado: filtroEstadoAcuerdo || undefined,
    proveedor_id: filtroProveedor || undefined,
  });
  const acuerdos = acuerdosData?.data || acuerdosData || [];

  const { data: stockData, isLoading: loadingStock } = useStockConsigna({
    proveedor_id: filtroProveedor || undefined,
    solo_disponible: true,
  });
  const stockConsigna = stockData?.stock || stockData || [];

  const { data: liquidacionesData, isLoading: loadingLiq } = useLiquidacionesConsigna({
    estado: filtroEstadoLiq || undefined,
  });
  const liquidaciones = liquidacionesData?.data || liquidacionesData || [];

  const { data: pendienteLiquidar } = usePendienteLiquidar();

  const { data: proveedoresData } = useProveedores();
  const proveedores = proveedoresData?.proveedores || [];

  // Mutations
  const activarMutation = useActivarAcuerdoConsigna();
  const pausarMutation = usePausarAcuerdoConsigna();
  const terminarMutation = useTerminarAcuerdoConsigna();
  const confirmarLiqMutation = useConfirmarLiquidacion();
  const cancelarLiqMutation = useCancelarLiquidacion();

  // Calcular estadisticas
  const stats = {
    acuerdosActivos: acuerdos?.filter((a) => a.estado === 'activo').length || 0,
    totalStock: stockConsigna?.reduce((sum, s) => sum + parseInt(s.cantidad_disponible || 0), 0) || 0,
    valorStock:
      stockConsigna?.reduce(
        (sum, s) => sum + parseFloat(s.cantidad_disponible || 0) * parseFloat(s.precio_consigna || 0),
        0
      ) || 0,
    pendienteLiquidar: pendienteLiquidar?.length || 0,
  };

  // Handlers - abren ConfirmDialog
  const handleActivar = (id) => setConfirmActivar(id);
  const handlePausar = (id) => setConfirmPausar(id);
  const handleTerminar = (id) => setConfirmTerminar(id);
  const handleConfirmarLiq = (id) => setConfirmLiq(id);
  const handleCancelarLiq = (id) => setConfirmCancelarLiq(id);

  // Confirmaciones
  const doActivar = () => {
    activarMutation.mutate(confirmActivar, { onSettled: () => setConfirmActivar(null) });
  };
  const doPausar = () => {
    pausarMutation.mutate(confirmPausar, { onSettled: () => setConfirmPausar(null) });
  };
  const doTerminar = () => {
    terminarMutation.mutate(confirmTerminar, { onSettled: () => setConfirmTerminar(null) });
  };
  const doConfirmarLiq = () => {
    confirmarLiqMutation.mutate(confirmLiq, { onSettled: () => setConfirmLiq(null) });
  };
  const doCancelarLiq = () => {
    cancelarLiqMutation.mutate(confirmCancelarLiq, { onSettled: () => setConfirmCancelarLiq(null) });
  };

  return (
    <InventarioPageLayout
      icon={Handshake}
      title="Consigna"
      subtitle="Inventario en consignación - stock de proveedores, pago al vender"
      actions={
        <Button variant="primary" onClick={() => setShowNuevoAcuerdo(true)} icon={Plus}>
          <span className="hidden sm:inline">Nuevo Acuerdo</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      }
    >
      <div className="space-y-6">

      {/* Metricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Acuerdos Activos"
          value={stats.acuerdosActivos}
          icon={Handshake}
          color="green"
          loading={loadingAcuerdos}
        />
        <MetricCard
          title="Unidades en Stock"
          value={stats.totalStock}
          icon={Package}
          color="blue"
          loading={loadingStock}
        />
        <MetricCard
          title="Valor en Consigna"
          value={formatCurrency(stats.valorStock)}
          icon={DollarSign}
          color="primary"
          loading={loadingStock}
          isMonetary
        />
        <MetricCard
          title="Pend. Liquidar"
          value={stats.pendienteLiquidar}
          icon={AlertTriangle}
          color={stats.pendienteLiquidar > 0 ? 'amber' : 'gray'}
          loading={false}
        />
      </div>

      {/* Alerta de pendientes de liquidar */}
      {pendienteLiquidar?.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span className="font-medium text-amber-800 dark:text-amber-200">
              Hay {pendienteLiquidar.length} acuerdo(s) con ventas pendientes de liquidar
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveTab('liquidaciones');
              setShowNuevaLiquidacion(true);
            }}
          >
            Generar Liquidacion
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex gap-4 px-4" aria-label="Tabs">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenido de Tabs */}
        <div className="p-4">
          {/* TAB: ACUERDOS */}
          {activeTab === 'acuerdos' && (
            <div className="space-y-4">
              {/* Filtros */}
              <div className="flex flex-wrap gap-2">
                {['', 'borrador', 'activo', 'pausado', 'terminado'].map((estado) => (
                  <button
                    key={estado}
                    onClick={() => setFiltroEstadoAcuerdo(estado)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      filtroEstadoAcuerdo === estado
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {estado === '' ? 'Todos' : ESTADOS_ACUERDO[estado]?.label || estado}
                  </button>
                ))}
              </div>

              {/* Tabla de acuerdos */}
              <div className="overflow-x-auto">
                {loadingAcuerdos ? (
                  <LoadingSpinner />
                ) : acuerdos?.length === 0 ? (
                  <EmptyState
                    icon={Handshake}
                    title="No hay acuerdos de consignación"
                    description="Crea un acuerdo para recibir productos en consignación"
                  />
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Folio
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Proveedor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Comision
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Productos
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {acuerdos?.map((acuerdo) => {
                        const estadoInfo = ESTADOS_ACUERDO[acuerdo.estado] || ESTADOS_ACUERDO.borrador;
                        const IconEstado = estadoInfo.icon;

                        return (
                          <tr
                            key={acuerdo.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">
                              {acuerdo.folio}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              {acuerdo.proveedor_nombre || acuerdo.proveedor_razon_social}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              <span className="inline-flex items-center gap-1">
                                <Percent className="h-3 w-3" />
                                {acuerdo.porcentaje_comision}%
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              {acuerdo.total_productos || 0}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <EstadoBadge estado={acuerdo.estado} config={ESTADOS_ACUERDO} />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setAcuerdoSeleccionado(acuerdo)}
                                  className="p-1.5 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400"
                                  title="Ver detalle"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                {acuerdo.estado === 'activo' && (
                                  <>
                                    <button
                                      onClick={() => setAcuerdoRecibir(acuerdo)}
                                      className="p-1.5 text-gray-500 hover:text-green-600"
                                      title="Recibir mercancia"
                                    >
                                      <PackagePlus className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => setAcuerdoDevolver(acuerdo)}
                                      className="p-1.5 text-gray-500 hover:text-amber-600"
                                      title="Devolver mercancia"
                                    >
                                      <PackageMinus className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handlePausar(acuerdo.id)}
                                      className="p-1.5 text-gray-500 hover:text-amber-600"
                                      title="Pausar"
                                    >
                                      <Pause className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                                {(acuerdo.estado === 'borrador' || acuerdo.estado === 'pausado') && (
                                  <button
                                    onClick={() => handleActivar(acuerdo.id)}
                                    className="p-1.5 text-gray-500 hover:text-green-600"
                                    title="Activar"
                                  >
                                    <Play className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB: STOCK */}
          {activeTab === 'stock' && (
            <div className="space-y-4">
              {/* Filtro por proveedor */}
              <div className="flex gap-4">
                <select
                  value={filtroProveedor}
                  onChange={(e) => setFiltroProveedor(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Todos los proveedores</option>
                  {proveedores?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre || p.razon_social}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tabla de stock */}
              <div className="overflow-x-auto">
                {loadingStock ? (
                  <LoadingSpinner />
                ) : stockConsigna?.length === 0 ? (
                  <EmptyState
                    icon={Warehouse}
                    title="No hay stock en consignación"
                    description="El stock aparecerá cuando recibas mercancía de un acuerdo activo"
                  />
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Producto
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Acuerdo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Proveedor
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Disponible
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Reservado
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Precio Consigna
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {stockConsigna?.map((stock, idx) => (
                        <tr
                          key={`${stock.id}-${idx}`}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {stock.producto_nombre}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {stock.producto_sku}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {stock.acuerdo_folio}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {stock.proveedor_nombre}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                            {stock.cantidad_disponible}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                            {stock.cantidad_reservada || 0}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-700 dark:text-gray-300">
                            {formatCurrency(parseFloat(stock.precio_consigna || 0))}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(
                              parseFloat(stock.cantidad_disponible || 0) *
                                parseFloat(stock.precio_consigna || 0)
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB: LIQUIDACIONES */}
          {activeTab === 'liquidaciones' && (
            <div className="space-y-4">
              {/* Header con boton */}
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {['', 'borrador', 'confirmada', 'pagada', 'cancelada'].map((estado) => (
                    <button
                      key={estado}
                      onClick={() => setFiltroEstadoLiq(estado)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        filtroEstadoLiq === estado
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {estado === '' ? 'Todas' : ESTADOS_LIQUIDACION[estado]?.label || estado}
                    </button>
                  ))}
                </div>
                <Button variant="outline" onClick={() => setShowNuevaLiquidacion(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva Liquidacion
                </Button>
              </div>

              {/* Tabla de liquidaciones */}
              <div className="overflow-x-auto">
                {loadingLiq ? (
                  <LoadingSpinner />
                ) : liquidaciones?.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No hay liquidaciones"
                    description="Las liquidaciones se generan para pagar al proveedor las ventas realizadas"
                  />
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Folio
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Acuerdo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Proveedor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Periodo
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Ventas
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Comision
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          A Pagar
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {liquidaciones?.map((liq) => (
                        <tr
                          key={liq.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">
                            {liq.folio}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {liq.acuerdo_folio}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {liq.proveedor_nombre}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {liq.fecha_desde && format(new Date(liq.fecha_desde), 'dd/MM', { locale: es })}
                              {' - '}
                              {liq.fecha_hasta && format(new Date(liq.fecha_hasta), 'dd/MM', { locale: es })}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900 dark:text-gray-100">
                            {formatCurrency(parseFloat(liq.subtotal_ventas || 0))}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                            {formatCurrency(parseFloat(liq.comision || 0))}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(parseFloat(liq.total_pagar_proveedor || 0))}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <EstadoBadge estado={liq.estado} config={ESTADOS_LIQUIDACION} />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setLiquidacionSeleccionada(liq)}
                                className="p-1.5 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400"
                                title="Ver detalle"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {liq.estado === 'borrador' && (
                                <>
                                  <button
                                    onClick={() => handleConfirmarLiq(liq.id)}
                                    className="p-1.5 text-gray-500 hover:text-green-600"
                                    title="Confirmar"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleCancelarLiq(liq.id)}
                                    className="p-1.5 text-gray-500 hover:text-red-600"
                                    title="Cancelar"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              {liq.estado === 'confirmada' && (
                                <button
                                  onClick={() => setLiquidacionSeleccionada(liq)}
                                  className="p-1.5 text-gray-500 hover:text-green-600"
                                  title="Registrar pago"
                                >
                                  <DollarSign className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Modales y Drawers */}
      <AcuerdoFormDrawer
        isOpen={showNuevoAcuerdo}
        onClose={() => setShowNuevoAcuerdo(false)}
      />

      <AcuerdoDetalleModal
        acuerdo={acuerdoSeleccionado}
        isOpen={!!acuerdoSeleccionado}
        onClose={() => setAcuerdoSeleccionado(null)}
        onRecibir={() => {
          setAcuerdoRecibir(acuerdoSeleccionado);
          setAcuerdoSeleccionado(null);
        }}
        onDevolver={() => {
          setAcuerdoDevolver(acuerdoSeleccionado);
          setAcuerdoSeleccionado(null);
        }}
        onActivar={() => handleActivar(acuerdoSeleccionado?.id)}
        onPausar={() => handlePausar(acuerdoSeleccionado?.id)}
        onTerminar={() => handleTerminar(acuerdoSeleccionado?.id)}
      />

      <RecibirMercanciaDrawer
        acuerdo={acuerdoRecibir}
        isOpen={!!acuerdoRecibir}
        onClose={() => setAcuerdoRecibir(null)}
      />

      <DevolverMercanciaDrawer
        acuerdo={acuerdoDevolver}
        isOpen={!!acuerdoDevolver}
        onClose={() => setAcuerdoDevolver(null)}
      />

      <LiquidacionFormModal
        isOpen={showNuevaLiquidacion}
        onClose={() => setShowNuevaLiquidacion(false)}
        acuerdos={acuerdos?.filter((a) => a.estado === 'activo') || []}
      />

      <LiquidacionDetalleModal
        liquidacion={liquidacionSeleccionada}
        isOpen={!!liquidacionSeleccionada}
        onClose={() => setLiquidacionSeleccionada(null)}
      />

      {/* ConfirmDialogs */}
      <ConfirmDialog
        isOpen={!!confirmActivar}
        onClose={() => setConfirmActivar(null)}
        onConfirm={doActivar}
        title="Activar Acuerdo"
        message="Activar este acuerdo de consignacion? Podras recibir y vender productos."
        confirmText="Activar"
        isLoading={activarMutation.isPending}
      />
      <ConfirmDialog
        isOpen={!!confirmPausar}
        onClose={() => setConfirmPausar(null)}
        onConfirm={doPausar}
        title="Pausar Acuerdo"
        message="Pausar este acuerdo? No se podran recibir ni vender productos."
        confirmText="Pausar"
        variant="warning"
        isLoading={pausarMutation.isPending}
      />
      <ConfirmDialog
        isOpen={!!confirmTerminar}
        onClose={() => setConfirmTerminar(null)}
        onConfirm={doTerminar}
        title="Terminar Acuerdo"
        message="Terminar este acuerdo? Debe devolver todo el stock primero. Esta accion no se puede deshacer."
        confirmText="Terminar"
        variant="danger"
        isLoading={terminarMutation.isPending}
      />
      <ConfirmDialog
        isOpen={!!confirmLiq}
        onClose={() => setConfirmLiq(null)}
        onConfirm={doConfirmarLiq}
        title="Confirmar Liquidacion"
        message="Confirmar esta liquidacion? Se marcara como lista para pago."
        confirmText="Confirmar"
        isLoading={confirmarLiqMutation.isPending}
      />
      <ConfirmDialog
        isOpen={!!confirmCancelarLiq}
        onClose={() => setConfirmCancelarLiq(null)}
        onConfirm={doCancelarLiq}
        title="Cancelar Liquidacion"
        message="Cancelar esta liquidacion? Los movimientos quedaran disponibles para una nueva liquidacion."
        confirmText="Cancelar Liquidacion"
        variant="danger"
        isLoading={cancelarLiqMutation.isPending}
      />
    </InventarioPageLayout>
  );
}

// ==================== COMPONENTES AUXILIARES ====================

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

function EstadoBadge({ estado, config }) {
  const info = config[estado] || { label: estado, color: 'gray', icon: Clock };
  const Icon = info.icon;

  const colorClasses = {
    gray: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${colorClasses[info.color]}`}
    >
      <Icon className="h-3 w-3" />
      {info.label}
    </span>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-8">
      <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  );
}

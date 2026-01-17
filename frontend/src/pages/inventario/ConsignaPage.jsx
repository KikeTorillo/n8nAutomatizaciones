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
import { useModalManager } from '@/hooks/utils';
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
} from '@/hooks/almacen';
import { useProveedores } from '@/hooks/inventario';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  DataTableActionButton,
  DataTableActions,
  Modal,
  StatCardGrid
} from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
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

  // Modales/Drawers centralizados
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    nuevoAcuerdo: { isOpen: false },
    detalleAcuerdo: { isOpen: false, data: null },
    recibirMercancia: { isOpen: false, data: null },
    devolverMercancia: { isOpen: false, data: null },
    nuevaLiquidacion: { isOpen: false },
    detalleLiquidacion: { isOpen: false, data: null },
    activar: { isOpen: false, data: null },
    pausar: { isOpen: false, data: null },
    terminar: { isOpen: false, data: null },
    confirmarLiq: { isOpen: false, data: null },
    cancelarLiq: { isOpen: false, data: null },
  });

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
  const handleActivar = (id) => openModal('activar', id);
  const handlePausar = (id) => openModal('pausar', id);
  const handleTerminar = (id) => openModal('terminar', id);
  const handleConfirmarLiq = (id) => openModal('confirmarLiq', id);
  const handleCancelarLiq = (id) => openModal('cancelarLiq', id);

  // Confirmaciones
  const doActivar = () => {
    activarMutation.mutate(getModalData('activar'), { onSettled: () => closeModal('activar') });
  };
  const doPausar = () => {
    pausarMutation.mutate(getModalData('pausar'), { onSettled: () => closeModal('pausar') });
  };
  const doTerminar = () => {
    terminarMutation.mutate(getModalData('terminar'), { onSettled: () => closeModal('terminar') });
  };
  const doConfirmarLiq = () => {
    confirmarLiqMutation.mutate(getModalData('confirmarLiq'), { onSettled: () => closeModal('confirmarLiq') });
  };
  const doCancelarLiq = () => {
    cancelarLiqMutation.mutate(getModalData('cancelarLiq'), { onSettled: () => closeModal('cancelarLiq') });
  };

  return (
    <InventarioPageLayout
      icon={Handshake}
      title="Consigna"
      subtitle="Inventario en consignación - stock de proveedores, pago al vender"
      actions={
        <Button variant="primary" onClick={() => openModal('nuevoAcuerdo')} icon={Plus}>
          <span className="hidden sm:inline">Nuevo Acuerdo</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      }
    >
      <div className="space-y-6">

      {/* Metricas */}
      <StatCardGrid
        columns={4}
        stats={[
          { icon: Handshake, label: 'Acuerdos Activos', value: loadingAcuerdos ? '...' : stats.acuerdosActivos, color: 'green' },
          { icon: Package, label: 'Unidades en Stock', value: loadingStock ? '...' : stats.totalStock, color: 'blue' },
          { icon: DollarSign, label: 'Valor en Consigna', value: loadingStock ? '...' : formatCurrency(stats.valorStock), color: 'primary' },
          { icon: AlertTriangle, label: 'Pend. Liquidar', value: stats.pendienteLiquidar, color: stats.pendienteLiquidar > 0 ? 'yellow' : undefined },
        ]}
      />

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
              openModal('nuevaLiquidacion');
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
              <DataTable
                columns={[
                  {
                    key: 'folio',
                    header: 'Folio',
                    render: (row) => (
                      <span className="font-medium text-gray-900 dark:text-gray-100">{row.folio}</span>
                    ),
                  },
                  {
                    key: 'proveedor',
                    header: 'Proveedor',
                    render: (row) => (
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {row.proveedor_nombre || row.proveedor_razon_social}
                      </span>
                    ),
                  },
                  {
                    key: 'comision',
                    header: 'Comisión',
                    hideOnMobile: true,
                    render: (row) => (
                      <span className="inline-flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                        <Percent className="h-3 w-3" />
                        {row.porcentaje_comision}%
                      </span>
                    ),
                  },
                  {
                    key: 'productos',
                    header: 'Productos',
                    hideOnMobile: true,
                    align: 'center',
                    render: (row) => (
                      <span className="text-sm text-gray-700 dark:text-gray-300">{row.total_productos || 0}</span>
                    ),
                  },
                  {
                    key: 'estado',
                    header: 'Estado',
                    render: (row) => {
                      const BADGE_VARIANT = { gray: 'default', green: 'success', amber: 'warning', red: 'error', blue: 'info' };
                      const info = ESTADOS_ACUERDO[row.estado] || { label: row.estado, color: 'gray' };
                      return <Badge variant={BADGE_VARIANT[info.color] || 'default'} size="sm">{info.label}</Badge>;
                    },
                  },
                  {
                    key: 'actions',
                    header: '',
                    align: 'right',
                    render: (row) => (
                      <DataTableActions>
                        <DataTableActionButton
                          icon={Eye}
                          label="Ver detalle"
                          onClick={() => openModal('detalleAcuerdo', row)}
                          variant="ghost"
                        />
                        {row.estado === 'activo' && (
                          <>
                            <DataTableActionButton
                              icon={PackagePlus}
                              label="Recibir mercancía"
                              onClick={() => openModal('recibirMercancia', row)}
                              variant="primary"
                            />
                            <DataTableActionButton
                              icon={PackageMinus}
                              label="Devolver mercancía"
                              onClick={() => openModal('devolverMercancia', row)}
                              variant="ghost"
                            />
                            <DataTableActionButton
                              icon={Pause}
                              label="Pausar"
                              onClick={() => handlePausar(row.id)}
                              variant="ghost"
                            />
                          </>
                        )}
                        {(row.estado === 'borrador' || row.estado === 'pausado') && (
                          <DataTableActionButton
                            icon={Play}
                            label="Activar"
                            onClick={() => handleActivar(row.id)}
                            variant="primary"
                          />
                        )}
                      </DataTableActions>
                    ),
                  },
                ]}
                data={acuerdos || []}
                isLoading={loadingAcuerdos}
                emptyState={{
                  icon: Handshake,
                  title: 'No hay acuerdos de consignación',
                  description: 'Crea un acuerdo para recibir productos en consignación',
                }}
                skeletonRows={5}
              />
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
              <DataTable
                columns={[
                  {
                    key: 'producto',
                    header: 'Producto',
                    width: 'xl',
                    render: (row) => (
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {row.producto_nombre}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {row.producto_sku}
                        </span>
                      </div>
                    ),
                  },
                  {
                    key: 'acuerdo',
                    header: 'Acuerdo',
                    hideOnMobile: true,
                    render: (row) => (
                      <span className="text-sm text-gray-700 dark:text-gray-300">{row.acuerdo_folio}</span>
                    ),
                  },
                  {
                    key: 'proveedor',
                    header: 'Proveedor',
                    hideOnMobile: true,
                    render: (row) => (
                      <span className="text-sm text-gray-700 dark:text-gray-300">{row.proveedor_nombre}</span>
                    ),
                  },
                  {
                    key: 'disponible',
                    header: 'Disponible',
                    align: 'right',
                    render: (row) => (
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {row.cantidad_disponible}
                      </span>
                    ),
                  },
                  {
                    key: 'reservado',
                    header: 'Reservado',
                    align: 'right',
                    hideOnMobile: true,
                    render: (row) => (
                      <span className="text-sm text-gray-500 dark:text-gray-400">{row.cantidad_reservada || 0}</span>
                    ),
                  },
                  {
                    key: 'precio',
                    header: 'Precio Consigna',
                    align: 'right',
                    hideOnMobile: true,
                    render: (row) => (
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {formatCurrency(parseFloat(row.precio_consigna || 0))}
                      </span>
                    ),
                  },
                  {
                    key: 'valor',
                    header: 'Valor',
                    align: 'right',
                    render: (row) => (
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(parseFloat(row.cantidad_disponible || 0) * parseFloat(row.precio_consigna || 0))}
                      </span>
                    ),
                  },
                ]}
                data={stockConsigna || []}
                isLoading={loadingStock}
                emptyState={{
                  icon: Warehouse,
                  title: 'No hay stock en consignación',
                  description: 'El stock aparecerá cuando recibas mercancía de un acuerdo activo',
                }}
                skeletonRows={5}
              />
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
                <Button variant="outline" onClick={() => openModal('nuevaLiquidacion')}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva Liquidacion
                </Button>
              </div>

              {/* Tabla de liquidaciones */}
              <DataTable
                columns={[
                  {
                    key: 'folio',
                    header: 'Folio',
                    render: (row) => (
                      <span className="font-medium text-gray-900 dark:text-gray-100">{row.folio}</span>
                    ),
                  },
                  {
                    key: 'acuerdo',
                    header: 'Acuerdo',
                    hideOnMobile: true,
                    render: (row) => (
                      <span className="text-sm text-gray-700 dark:text-gray-300">{row.acuerdo_folio}</span>
                    ),
                  },
                  {
                    key: 'proveedor',
                    header: 'Proveedor',
                    hideOnMobile: true,
                    render: (row) => (
                      <span className="text-sm text-gray-700 dark:text-gray-300">{row.proveedor_nombre}</span>
                    ),
                  },
                  {
                    key: 'periodo',
                    header: 'Periodo',
                    hideOnMobile: true,
                    render: (row) => (
                      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="h-3 w-3" />
                        {row.fecha_desde && format(new Date(row.fecha_desde), 'dd/MM', { locale: es })}
                        {' - '}
                        {row.fecha_hasta && format(new Date(row.fecha_hasta), 'dd/MM', { locale: es })}
                      </div>
                    ),
                  },
                  {
                    key: 'ventas',
                    header: 'Ventas',
                    align: 'right',
                    hideOnMobile: true,
                    render: (row) => (
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(parseFloat(row.subtotal_ventas || 0))}
                      </span>
                    ),
                  },
                  {
                    key: 'comision',
                    header: 'Comisión',
                    align: 'right',
                    hideOnMobile: true,
                    render: (row) => (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatCurrency(parseFloat(row.comision || 0))}
                      </span>
                    ),
                  },
                  {
                    key: 'total',
                    header: 'A Pagar',
                    align: 'right',
                    render: (row) => (
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(parseFloat(row.total_pagar_proveedor || 0))}
                      </span>
                    ),
                  },
                  {
                    key: 'estado',
                    header: 'Estado',
                    render: (row) => {
                      const BADGE_VARIANT = { gray: 'default', green: 'success', amber: 'warning', red: 'error', blue: 'info' };
                      const info = ESTADOS_LIQUIDACION[row.estado] || { label: row.estado, color: 'gray' };
                      return <Badge variant={BADGE_VARIANT[info.color] || 'default'} size="sm">{info.label}</Badge>;
                    },
                  },
                  {
                    key: 'actions',
                    header: '',
                    align: 'right',
                    render: (row) => (
                      <DataTableActions>
                        <DataTableActionButton
                          icon={Eye}
                          label="Ver detalle"
                          onClick={() => openModal('detalleLiquidacion', row)}
                          variant="ghost"
                        />
                        {row.estado === 'borrador' && (
                          <>
                            <DataTableActionButton
                              icon={CheckCircle}
                              label="Confirmar"
                              onClick={() => handleConfirmarLiq(row.id)}
                              variant="primary"
                            />
                            <DataTableActionButton
                              icon={XCircle}
                              label="Cancelar"
                              onClick={() => handleCancelarLiq(row.id)}
                              variant="danger"
                            />
                          </>
                        )}
                        {row.estado === 'confirmada' && (
                          <DataTableActionButton
                            icon={DollarSign}
                            label="Registrar pago"
                            onClick={() => openModal('detalleLiquidacion', row)}
                            variant="primary"
                          />
                        )}
                      </DataTableActions>
                    ),
                  },
                ]}
                data={liquidaciones || []}
                isLoading={loadingLiq}
                emptyState={{
                  icon: FileText,
                  title: 'No hay liquidaciones',
                  description: 'Las liquidaciones se generan para pagar al proveedor las ventas realizadas',
                }}
                skeletonRows={5}
              />
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Modales y Drawers */}
      <AcuerdoFormDrawer
        isOpen={isOpen('nuevoAcuerdo')}
        onClose={() => closeModal('nuevoAcuerdo')}
      />

      <AcuerdoDetalleModal
        acuerdo={getModalData('detalleAcuerdo')}
        isOpen={isOpen('detalleAcuerdo')}
        onClose={() => closeModal('detalleAcuerdo')}
        onRecibir={() => {
          const acuerdo = getModalData('detalleAcuerdo');
          closeModal('detalleAcuerdo');
          openModal('recibirMercancia', acuerdo);
        }}
        onDevolver={() => {
          const acuerdo = getModalData('detalleAcuerdo');
          closeModal('detalleAcuerdo');
          openModal('devolverMercancia', acuerdo);
        }}
        onActivar={() => handleActivar(getModalData('detalleAcuerdo')?.id)}
        onPausar={() => handlePausar(getModalData('detalleAcuerdo')?.id)}
        onTerminar={() => handleTerminar(getModalData('detalleAcuerdo')?.id)}
      />

      <RecibirMercanciaDrawer
        acuerdo={getModalData('recibirMercancia')}
        isOpen={isOpen('recibirMercancia')}
        onClose={() => closeModal('recibirMercancia')}
      />

      <DevolverMercanciaDrawer
        acuerdo={getModalData('devolverMercancia')}
        isOpen={isOpen('devolverMercancia')}
        onClose={() => closeModal('devolverMercancia')}
      />

      <LiquidacionFormModal
        isOpen={isOpen('nuevaLiquidacion')}
        onClose={() => closeModal('nuevaLiquidacion')}
        acuerdos={acuerdos?.filter((a) => a.estado === 'activo') || []}
      />

      <LiquidacionDetalleModal
        liquidacion={getModalData('detalleLiquidacion')}
        isOpen={isOpen('detalleLiquidacion')}
        onClose={() => closeModal('detalleLiquidacion')}
      />

      {/* ConfirmDialogs */}
      <ConfirmDialog
        isOpen={isOpen('activar')}
        onClose={() => closeModal('activar')}
        onConfirm={doActivar}
        title="Activar Acuerdo"
        message="Activar este acuerdo de consignacion? Podras recibir y vender productos."
        confirmText="Activar"
        isLoading={activarMutation.isPending}
      />
      <ConfirmDialog
        isOpen={isOpen('pausar')}
        onClose={() => closeModal('pausar')}
        onConfirm={doPausar}
        title="Pausar Acuerdo"
        message="Pausar este acuerdo? No se podran recibir ni vender productos."
        confirmText="Pausar"
        variant="warning"
        isLoading={pausarMutation.isPending}
      />
      <ConfirmDialog
        isOpen={isOpen('terminar')}
        onClose={() => closeModal('terminar')}
        onConfirm={doTerminar}
        title="Terminar Acuerdo"
        message="Terminar este acuerdo? Debe devolver todo el stock primero. Esta accion no se puede deshacer."
        confirmText="Terminar"
        variant="danger"
        isLoading={terminarMutation.isPending}
      />
      <ConfirmDialog
        isOpen={isOpen('confirmarLiq')}
        onClose={() => closeModal('confirmarLiq')}
        onConfirm={doConfirmarLiq}
        title="Confirmar Liquidacion"
        message="Confirmar esta liquidacion? Se marcara como lista para pago."
        confirmText="Confirmar"
        isLoading={confirmarLiqMutation.isPending}
      />
      <ConfirmDialog
        isOpen={isOpen('cancelarLiq')}
        onClose={() => closeModal('cancelarLiq')}
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

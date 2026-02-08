/**
 * Pagina de Consigna (Inventario en Consignacion)
 * Stock de proveedores en tu almacen, pago solo al vender
 *
 * Refactorizado Feb 2026: Columnas extraídas a ConsignaColumns
 * Reducción: 740 → ~340 LOC (-54%)
 */

import { useState, useMemo } from 'react';
import { Plus, Package, Handshake, Warehouse, FileText, DollarSign, AlertTriangle } from 'lucide-react';
import { useModalManager } from '@/hooks/utils';
import {
  useAcuerdosConsigna, useStockConsigna, useLiquidacionesConsigna,
  usePendienteLiquidar, useActivarAcuerdoConsigna, usePausarAcuerdoConsigna,
  useTerminarAcuerdoConsigna, useConfirmarLiquidacion, useCancelarLiquidacion,
} from '@/hooks/almacen';
import { useProveedores } from '@/hooks/inventario';
import { Button, ConfirmDialog, DataTable, StatCardGrid } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import AcuerdoFormDrawer from '@/components/inventario/consigna/AcuerdoFormDrawer';
import AcuerdoDetalleModal from '@/components/inventario/consigna/AcuerdoDetalleModal';
import RecibirMercanciaDrawer from '@/components/inventario/consigna/RecibirMercanciaDrawer';
import DevolverMercanciaDrawer from '@/components/inventario/consigna/DevolverMercanciaDrawer';
import LiquidacionFormModal from '@/components/inventario/consigna/LiquidacionFormModal';
import LiquidacionDetalleModal from '@/components/inventario/consigna/LiquidacionDetalleModal';
import {
  getAcuerdosColumns, getStockColumns, getLiquidacionesColumns,
  ESTADOS_ACUERDO, ESTADOS_LIQUIDACION,
} from './components/ConsignaColumns';

const TABS = [
  { id: 'acuerdos', label: 'Acuerdos', icon: Handshake },
  { id: 'stock', label: 'Stock', icon: Warehouse },
  { id: 'liquidaciones', label: 'Liquidaciones', icon: FileText },
];

export default function ConsignaPage() {
  const [activeTab, setActiveTab] = useState('acuerdos');
  const [filtroEstadoAcuerdo, setFiltroEstadoAcuerdo] = useState('');
  const [filtroEstadoLiq, setFiltroEstadoLiq] = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState('');

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
    proveedor_id: filtroProveedor || undefined, solo_disponible: true,
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

  // Stats
  const stats = useMemo(() => {
    const acuerdosActivos = acuerdos?.filter((a) => a.estado === 'activo').length || 0;
    const totalStock = stockConsigna?.reduce((sum, s) => sum + parseInt(s.cantidad_disponible || 0), 0) || 0;
    const valorStock = stockConsigna?.reduce((sum, s) => sum + parseFloat(s.cantidad_disponible || 0) * parseFloat(s.precio_consigna || 0), 0) || 0;
    const pendientes = pendienteLiquidar?.length || 0;
    return [
      { icon: Handshake, label: 'Acuerdos Activos', value: loadingAcuerdos ? '...' : acuerdosActivos, color: 'green' },
      { icon: Package, label: 'Unidades en Stock', value: loadingStock ? '...' : totalStock, color: 'blue' },
      { icon: DollarSign, label: 'Valor en Consigna', value: loadingStock ? '...' : formatCurrency(valorStock), color: 'primary' },
      { icon: AlertTriangle, label: 'Pend. Liquidar', value: pendientes, color: pendientes > 0 ? 'yellow' : undefined },
    ];
  }, [acuerdos, stockConsigna, pendienteLiquidar, loadingAcuerdos, loadingStock]);

  // Handlers
  const handleActivar = (id) => openModal('activar', id);
  const handlePausar = (id) => openModal('pausar', id);
  const handleConfirmarLiq = (id) => openModal('confirmarLiq', id);
  const handleCancelarLiq = (id) => openModal('cancelarLiq', id);

  const doMutation = (mutation, modalKey) => () => {
    mutation.mutate(getModalData(modalKey), { onSettled: () => closeModal(modalKey) });
  };

  // Columnas memoizadas
  const acuerdosColumns = useMemo(() => getAcuerdosColumns({ openModal, handleActivar, handlePausar }), [openModal]);
  const stockColumns = useMemo(() => getStockColumns(), []);
  const liquidacionesColumns = useMemo(() => getLiquidacionesColumns({ openModal, handleConfirmarLiq, handleCancelarLiq }), [openModal]);

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
        <StatCardGrid columns={4} stats={stats} />

        {/* Alerta pendientes */}
        {pendienteLiquidar?.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <span className="font-medium text-amber-800 dark:text-amber-200">
                Hay {pendienteLiquidar.length} acuerdo(s) con ventas pendientes de liquidar
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setActiveTab('liquidaciones'); openModal('nuevaLiquidacion'); }}>
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

          <div className="p-4">
            {activeTab === 'acuerdos' && (
              <div className="space-y-4">
                <FilterButtons value={filtroEstadoAcuerdo} onChange={setFiltroEstadoAcuerdo} options={ESTADOS_ACUERDO} allLabel="Todos" />
                <DataTable columns={acuerdosColumns} data={acuerdos || []} isLoading={loadingAcuerdos} emptyState={{ icon: Handshake, title: 'No hay acuerdos de consignación', description: 'Crea un acuerdo para recibir productos en consignación' }} skeletonRows={5} />
              </div>
            )}

            {activeTab === 'stock' && (
              <div className="space-y-4">
                <select value={filtroProveedor} onChange={(e) => setFiltroProveedor(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  <option value="">Todos los proveedores</option>
                  {proveedores?.map((p) => <option key={p.id} value={p.id}>{p.nombre || p.razon_social}</option>)}
                </select>
                <DataTable columns={stockColumns} data={stockConsigna || []} isLoading={loadingStock} emptyState={{ icon: Warehouse, title: 'No hay stock en consignación', description: 'El stock aparecerá cuando recibas mercancía de un acuerdo activo' }} skeletonRows={5} />
              </div>
            )}

            {activeTab === 'liquidaciones' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FilterButtons value={filtroEstadoLiq} onChange={setFiltroEstadoLiq} options={ESTADOS_LIQUIDACION} allLabel="Todas" />
                  <Button variant="outline" onClick={() => openModal('nuevaLiquidacion')}>
                    <Plus className="h-4 w-4 mr-1" /> Nueva Liquidacion
                  </Button>
                </div>
                <DataTable columns={liquidacionesColumns} data={liquidaciones || []} isLoading={loadingLiq} emptyState={{ icon: FileText, title: 'No hay liquidaciones', description: 'Las liquidaciones se generan para pagar al proveedor las ventas realizadas' }} skeletonRows={5} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modales y Drawers */}
      <AcuerdoFormDrawer isOpen={isOpen('nuevoAcuerdo')} onClose={() => closeModal('nuevoAcuerdo')} />
      <AcuerdoDetalleModal
        acuerdo={getModalData('detalleAcuerdo')} isOpen={isOpen('detalleAcuerdo')} onClose={() => closeModal('detalleAcuerdo')}
        onRecibir={() => { const a = getModalData('detalleAcuerdo'); closeModal('detalleAcuerdo'); openModal('recibirMercancia', a); }}
        onDevolver={() => { const a = getModalData('detalleAcuerdo'); closeModal('detalleAcuerdo'); openModal('devolverMercancia', a); }}
        onActivar={() => handleActivar(getModalData('detalleAcuerdo')?.id)}
        onPausar={() => handlePausar(getModalData('detalleAcuerdo')?.id)}
        onTerminar={() => openModal('terminar', getModalData('detalleAcuerdo')?.id)}
      />
      <RecibirMercanciaDrawer acuerdo={getModalData('recibirMercancia')} isOpen={isOpen('recibirMercancia')} onClose={() => closeModal('recibirMercancia')} />
      <DevolverMercanciaDrawer acuerdo={getModalData('devolverMercancia')} isOpen={isOpen('devolverMercancia')} onClose={() => closeModal('devolverMercancia')} />
      <LiquidacionFormModal isOpen={isOpen('nuevaLiquidacion')} onClose={() => closeModal('nuevaLiquidacion')} acuerdos={acuerdos?.filter((a) => a.estado === 'activo') || []} />
      <LiquidacionDetalleModal liquidacion={getModalData('detalleLiquidacion')} isOpen={isOpen('detalleLiquidacion')} onClose={() => closeModal('detalleLiquidacion')} />

      {/* ConfirmDialogs */}
      <ConfirmDialog isOpen={isOpen('activar')} onClose={() => closeModal('activar')} onConfirm={doMutation(activarMutation, 'activar')} title="Activar Acuerdo" message="Activar este acuerdo de consignacion? Podras recibir y vender productos." confirmText="Activar" isLoading={activarMutation.isPending} />
      <ConfirmDialog isOpen={isOpen('pausar')} onClose={() => closeModal('pausar')} onConfirm={doMutation(pausarMutation, 'pausar')} title="Pausar Acuerdo" message="Pausar este acuerdo? No se podran recibir ni vender productos." confirmText="Pausar" variant="warning" isLoading={pausarMutation.isPending} />
      <ConfirmDialog isOpen={isOpen('terminar')} onClose={() => closeModal('terminar')} onConfirm={doMutation(terminarMutation, 'terminar')} title="Terminar Acuerdo" message="Terminar este acuerdo? Debe devolver todo el stock primero. Esta accion no se puede deshacer." confirmText="Terminar" variant="danger" isLoading={terminarMutation.isPending} />
      <ConfirmDialog isOpen={isOpen('confirmarLiq')} onClose={() => closeModal('confirmarLiq')} onConfirm={doMutation(confirmarLiqMutation, 'confirmarLiq')} title="Confirmar Liquidacion" message="Confirmar esta liquidacion? Se marcara como lista para pago." confirmText="Confirmar" isLoading={confirmarLiqMutation.isPending} />
      <ConfirmDialog isOpen={isOpen('cancelarLiq')} onClose={() => closeModal('cancelarLiq')} onConfirm={doMutation(cancelarLiqMutation, 'cancelarLiq')} title="Cancelar Liquidacion" message="Cancelar esta liquidacion? Los movimientos quedaran disponibles para una nueva liquidacion." confirmText="Cancelar Liquidacion" variant="danger" isLoading={cancelarLiqMutation.isPending} />
    </InventarioPageLayout>
  );
}

/** Componente reutilizable para botones de filtro de estado */
function FilterButtons({ value, onChange, options, allLabel = 'Todos' }) {
  return (
    <div className="flex flex-wrap gap-2">
      {['', ...Object.keys(options)].map((estado) => (
        <button
          key={estado}
          onClick={() => onChange(estado)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            value === estado
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {estado === '' ? allLabel : options[estado]?.label || estado}
        </button>
      ))}
    </div>
  );
}

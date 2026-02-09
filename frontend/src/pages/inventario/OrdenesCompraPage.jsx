import { useState, useMemo } from 'react';
import { useFilters } from '@/hooks/utils';
import {
  ShoppingCart,
  Plus,
  Filter,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  FileText,
  Clock,
  CheckCircle,
  FileSpreadsheet,
  Edit,
  Zap,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Button,
  ConfirmDialog,
  DataTable,
  Modal,
  SmartButtons,
  Textarea
} from '@/components/ui';
import { useToast } from '@/hooks/utils';
import { useExportCSV } from '@/hooks/utils';
import { useModalManager } from '@/hooks/utils';
import InventarioPageLayout from '@/pages/inventario/components/InventarioPageLayout';
import {
  useOrdenesCompra,
  useEliminarOrdenCompra,
  useEnviarOrdenCompra,
  useCancelarOrdenCompra,
} from '@/hooks/inventario';
import { useProveedores } from '@/hooks/inventario';
import { useSugerenciasOC, useAutoGenerarOCs } from '@/hooks/inventario';
import OrdenCompraFormDrawer from '@/pages/inventario/components/ordenes-compra/OrdenCompraFormDrawer';
import OrdenCompraDetalleModal from '@/pages/inventario/components/ordenes-compra/OrdenCompraDetalleModal';
import RecibirMercanciaModal from '@/pages/inventario/components/ordenes-compra/RecibirMercanciaModal';
import RegistrarPagoModal from '@/pages/inventario/components/ordenes-compra/RegistrarPagoModal';

import {
  getOrdenesColumns,
  formatearEstado,
  formatearEstadoPago,
  OC_CSV_COLUMNS,
} from './components/OrdenesCompraColumns';
import OrdenesCompraFilters from './components/OrdenesCompraFilters';
import OrdenesCompraStatsGrid from './components/OrdenesCompraStatsGrid';

// Filtros iniciales (fuera del componente)
const INITIAL_FILTERS = {
  proveedor_id: '',
  estado: '',
  estado_pago: '',
  fecha_desde: '',
  fecha_hasta: '',
  folio: '',
  limit: 50,
  offset: 0,
};

/**
 * Página principal de Órdenes de Compra
 * Gestión completa del ciclo de compras a proveedores
 */
export default function OrdenesCompraPage() {
  const { success: showSuccess, error: showError, warning: showWarning, info: showInfo } = useToast();
  const { exportCSV } = useExportCSV();

  // Filtros con useFilters para persistencia y debounce
  const { filtros, filtrosQuery, setFiltro, setFiltros, limpiarFiltros } = useFilters(
    INITIAL_FILTERS,
    { moduloId: 'inventario.ordenes-compra', debounceFields: ['folio'] }
  );

  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');

  // Estado de modales unificado
  const { isOpen, getModalData, openModal, closeModal } = useModalManager();

  // Queries - usando filtrosQuery con debounce
  const { data: ordenesData, isLoading } = useOrdenesCompra(filtrosQuery);
  const ordenes = ordenesData?.ordenes || [];
  const totales = ordenesData?.totales || {};
  const total = totales.cantidad || 0;

  const { data: proveedoresData } = useProveedores({ activo: true, limit: 100 });
  const proveedores = proveedoresData?.proveedores || [];

  // Sugerencias de reabastecimiento
  const { data: sugerencias = [] } = useSugerenciasOC();

  // Mutations
  const eliminarMutation = useEliminarOrdenCompra();
  const autoGenerarMutation = useAutoGenerarOCs();
  const enviarMutation = useEnviarOrdenCompra();
  const cancelarMutation = useCancelarOrdenCompra();

  // Configuración de SmartButtons para filtros rápidos
  const smartButtonsConfig = useMemo(() => {
    // Contar órdenes por estado
    const conteoEstados = ordenes.reduce((acc, o) => {
      acc[o.estado] = (acc[o.estado] || 0) + 1;
      return acc;
    }, {});

    return [
      {
        id: 'todas',
        icon: FileText,
        value: totales.cantidad || 0,
        label: 'Total',
        color: filtros.estado === '' ? 'primary' : 'gray',
        onClick: () => setFiltros((prev) => ({ ...prev, estado: '', offset: 0 })),
      },
      {
        id: 'borradores',
        icon: Edit,
        value: conteoEstados.borrador || 0,
        label: 'Borradores',
        color: filtros.estado === 'borrador' ? 'yellow' : 'gray',
        onClick: () => setFiltros((prev) => ({ ...prev, estado: 'borrador', offset: 0 })),
      },
      {
        id: 'enviadas',
        icon: Clock,
        value: conteoEstados.enviada || 0,
        label: 'Enviadas',
        color: filtros.estado === 'enviada' ? 'blue' : 'gray',
        onClick: () => setFiltros((prev) => ({ ...prev, estado: 'enviada', offset: 0 })),
      },
      {
        id: 'recibidas',
        icon: CheckCircle,
        value: conteoEstados.recibida || 0,
        label: 'Recibidas',
        color: filtros.estado === 'recibida' ? 'green' : 'gray',
        onClick: () => setFiltros((prev) => ({ ...prev, estado: 'recibida', offset: 0 })),
      },
      {
        id: 'alertas',
        icon: AlertTriangle,
        value: sugerencias.length,
        label: 'Stock bajo',
        color: sugerencias.length > 0 ? 'red' : 'gray',
        onClick: () => setMostrarSugerencias(true),
        disabled: sugerencias.length === 0,
      },
    ];
  }, [totales.cantidad, ordenes, filtros.estado, sugerencias.length, setFiltros]);

  // Handlers de filtros
  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor, offset: 0 }));
  };

  const handleLimpiarFiltros = () => {
    limpiarFiltros();
  };

  // Handlers de acciones
  const handleNuevaOrden = () => {
    openModal('form', { orden: null, mode: 'create' });
  };

  const handleEditar = (orden) => {
    if (orden.estado !== 'borrador') {
      showWarning('Solo se pueden editar órdenes en estado borrador');
      return;
    }
    openModal('form', { orden, mode: 'edit' });
  };

  const handleVerDetalle = (ordenId) => {
    openModal('detalle', { ordenId });
  };

  const handleAbrirModalEliminar = (orden) => {
    if (orden.estado !== 'borrador') {
      showWarning('Solo se pueden eliminar órdenes en estado borrador');
      return;
    }
    openModal('eliminar', { orden });
  };

  const handleEliminar = () => {
    const { orden } = getModalData('eliminar');
    eliminarMutation.mutate(orden.id, {
      onSuccess: () => {
        showSuccess('Orden de compra eliminada correctamente');
        closeModal('eliminar');
      },
      onError: (error) => {
        showError(error.response?.data?.mensaje || 'Error al eliminar la orden');
      },
    });
  };

  const handleAbrirModalEnviar = (orden) => {
    if (orden.estado !== 'borrador') {
      showWarning('Solo se pueden enviar órdenes en estado borrador');
      return;
    }
    // Verificar items: puede venir como items_count (listado) o items array (detalle)
    const tieneItems = orden.items_count > 0 || orden.items?.length > 0;
    if (!tieneItems) {
      showWarning('La orden debe tener al menos un item para enviar');
      return;
    }
    openModal('enviar', { orden });
  };

  const handleEnviar = () => {
    const { orden } = getModalData('enviar');
    enviarMutation.mutate(orden.id, {
      onSuccess: () => {
        showSuccess('Orden enviada al proveedor correctamente');
        closeModal('enviar');
      },
      onError: (error) => {
        showError(error.response?.data?.mensaje || 'Error al enviar la orden');
      },
    });
  };

  const handleAbrirModalCancelar = (orden) => {
    if (!['borrador', 'enviada', 'parcial'].includes(orden.estado)) {
      showWarning('Esta orden no puede ser cancelada');
      return;
    }
    setMotivoCancelacion('');
    openModal('cancelar', { orden });
  };

  const handleCancelar = () => {
    const { orden } = getModalData('cancelar');
    cancelarMutation.mutate(
      { id: orden.id, motivo: motivoCancelacion || undefined },
      {
        onSuccess: () => {
          showSuccess('Orden cancelada correctamente');
          closeModal('cancelar');
          setMotivoCancelacion('');
        },
        onError: (error) => {
          showError(error.response?.data?.mensaje || 'Error al cancelar la orden');
        },
      }
    );
  };

  const handleRecibirMercancia = (orden) => {
    if (!['enviada', 'parcial'].includes(orden.estado)) {
      showWarning('Solo se puede recibir mercancía de órdenes enviadas o parciales');
      return;
    }
    openModal('recibir', { orden });
  };

  const handleRegistrarPago = (orden) => {
    if (orden.estado_pago === 'pagado') {
      showInfo('Esta orden ya está completamente pagada');
      return;
    }
    if (orden.estado === 'cancelada' || orden.estado === 'borrador') {
      showWarning('No se pueden registrar pagos en órdenes canceladas o en borrador');
      return;
    }
    openModal('pago', { orden });
  };

  // Handler para auto-generar OCs
  const handleAutoGenerar = () => {
    if (sugerencias.length === 0) {
      showInfo('No hay productos con stock bajo que requieran reabastecimiento');
      return;
    }
    openModal('autoGenerar');
  };

  const confirmarAutoGenerar = () => {
    autoGenerarMutation.mutate(undefined, {
      onSuccess: (data) => {
        showSuccess(`Se crearon ${data.ordenes_creadas || 0} orden(es) de compra automáticamente`);
        closeModal('autoGenerar');
        setMostrarSugerencias(false);
      },
      onError: (error) => {
        showError(error.response?.data?.mensaje || 'Error al generar órdenes automáticas');
      },
    });
  };

  // Exportar CSV usando hook centralizado
  const handleExportarCSV = () => {
    if (!ordenes || ordenes.length === 0) {
      showError('No hay datos para exportar');
      return;
    }

    const datosExportar = ordenes.map((oc) => ({
      folio: oc.folio || '',
      fecha: oc.fecha ? format(new Date(oc.fecha), 'dd/MM/yyyy') : '',
      proveedor: oc.proveedor_nombre || '',
      items: oc.total_items || 0,
      total: parseFloat(oc.total || 0).toFixed(2),
      estado: formatearEstado(oc.estado),
      estado_pago: formatearEstadoPago(oc.estado_pago),
      notas: oc.notas || '',
    }));

    exportCSV(datosExportar, OC_CSV_COLUMNS, `ordenes_compra_${format(new Date(), 'yyyyMMdd')}`);
  };

  // Columnas memoizadas con handlers
  const columns = useMemo(
    () =>
      getOrdenesColumns({
        onVerDetalle: handleVerDetalle,
        onEditar: handleEditar,
        onEnviar: handleAbrirModalEnviar,
        onRecibirMercancia: handleRecibirMercancia,
        onRegistrarPago: handleRegistrarPago,
        onCancelar: handleAbrirModalCancelar,
        onEliminar: handleAbrirModalEliminar,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <InventarioPageLayout
      icon={ShoppingCart}
      title="Órdenes de Compra"
      subtitle={`${total} orden${total !== 1 ? 'es' : ''} en total`}
      actions={
        <>
          <Button
            variant="secondary"
            onClick={handleExportarCSV}
            disabled={ordenes.length === 0}
            icon={FileSpreadsheet}
            className="flex-1 sm:flex-none text-sm"
          >
            <span className="hidden sm:inline">Exportar CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          <Button
            variant={mostrarFiltros ? 'secondary' : 'outline'}
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            icon={Filter}
            className="flex-1 sm:flex-none text-sm"
          >
            <span className="hidden sm:inline">{mostrarFiltros ? 'Ocultar' : 'Mostrar'} Filtros</span>
            <span className="sm:hidden">Filtros</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleAutoGenerar}
            icon={Zap}
            className="flex-1 sm:flex-none text-sm relative"
            title="Generar OCs automáticamente para productos con stock bajo"
          >
            <span className="hidden sm:inline">Auto-generar</span>
            <span className="sm:hidden">Auto</span>
            {sugerencias.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {sugerencias.length}
              </span>
            )}
          </Button>
          <Button variant="primary" onClick={handleNuevaOrden} icon={Plus} className="flex-1 sm:flex-none text-sm">
            <span className="hidden sm:inline">Nueva Orden</span>
            <span className="sm:hidden">Nueva</span>
          </Button>
        </>
      }
    >
      <div className="space-y-6">

        {/* SmartButtons - Filtros rápidos por estado */}
        <SmartButtons buttons={smartButtonsConfig} className="mb-2" />

        {/* Alerta de productos con stock bajo */}
      {sugerencias.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setMostrarSugerencias(!mostrarSugerencias)}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {sugerencias.length} producto(s) con stock bajo
                </h3>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Requieren reabastecimiento
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="warning"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAutoGenerar();
                }}
                icon={Zap}
              >
                Generar OCs
              </Button>
              {mostrarSugerencias ? (
                <ChevronUp className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              )}
            </div>
          </div>

          {/* Lista de sugerencias expandible */}
          {mostrarSugerencias && (
            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
              {sugerencias.map((item) => (
                <div
                  key={item.producto_id}
                  className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.producto_nombre}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        SKU: {item.sku} | Proveedor: {item.proveedor_nombre || 'Sin asignar'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                      Stock: {item.stock_actual} / Mín: {item.stock_minimo}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Sugerido: {item.cantidad_sugerida} unidades
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resumen de totales */}
      <OrdenesCompraStatsGrid totales={totales} />

      {/* Panel de filtros */}
      {mostrarFiltros && (
        <OrdenesCompraFilters
          filtros={filtros}
          proveedores={proveedores}
          onFiltroChange={handleFiltroChange}
          onLimpiar={handleLimpiarFiltros}
        />
      )}

      {/* Tabla de órdenes */}
      <DataTable
        columns={columns}
        data={ordenes}
        isLoading={isLoading}
        emptyState={{
          icon: ShoppingCart,
          title: 'No se encontraron órdenes de compra',
          description: 'Crea una nueva orden para comenzar',
          actionLabel: 'Nueva Orden',
          onAction: handleNuevaOrden,
        }}
        pagination={total > filtros.limit ? {
          page: Math.floor(filtros.offset / filtros.limit) + 1,
          limit: filtros.limit,
          total,
          totalPages: Math.ceil(total / filtros.limit),
          hasNext: filtros.offset + filtros.limit < total,
          hasPrev: filtros.offset > 0,
        } : undefined}
        onPageChange={(page) =>
          setFiltros((prev) => ({
            ...prev,
            offset: (page - 1) * prev.limit,
          }))
        }
      />
    </div>

      {/* Modales */}
      <OrdenCompraFormDrawer
        isOpen={isOpen('form')}
        onClose={() => closeModal('form')}
        orden={getModalData('form')?.orden}
        mode={getModalData('form')?.mode || 'create'}
      />

      <OrdenCompraDetalleModal
        isOpen={isOpen('detalle')}
        onClose={() => closeModal('detalle')}
        ordenId={getModalData('detalle')?.ordenId}
        onEditar={(orden) => {
          closeModal('detalle');
          handleEditar(orden);
        }}
        onEnviar={(orden) => {
          closeModal('detalle');
          handleAbrirModalEnviar(orden);
        }}
        onRecibir={(orden) => {
          closeModal('detalle');
          handleRecibirMercancia(orden);
        }}
        onPago={(orden) => {
          closeModal('detalle');
          handleRegistrarPago(orden);
        }}
        // Props para navegación entre registros
        allOrdenIds={ordenes.map(o => o.id)}
        currentIndex={ordenes.findIndex(o => o.id === getModalData('detalle')?.ordenId)}
        onNavigate={(ordenId) => openModal('detalle', { ordenId })}
      />

      <RecibirMercanciaModal
        isOpen={isOpen('recibir')}
        onClose={() => closeModal('recibir')}
        orden={getModalData('recibir')?.orden}
      />

      <RegistrarPagoModal
        isOpen={isOpen('pago')}
        onClose={() => closeModal('pago')}
        orden={getModalData('pago')?.orden}
      />

      {/* Confirmación de Eliminación */}
      <ConfirmDialog
        isOpen={isOpen('eliminar')}
        onClose={() => closeModal('eliminar')}
        onConfirm={handleEliminar}
        title="Eliminar Orden de Compra"
        message={`¿Estás seguro de que deseas eliminar la orden ${getModalData('eliminar')?.orden?.folio}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={eliminarMutation.isPending}
      />

      {/* Confirmación de Envío */}
      <ConfirmDialog
        isOpen={isOpen('enviar')}
        onClose={() => closeModal('enviar')}
        onConfirm={handleEnviar}
        title="Enviar Orden al Proveedor"
        message={`¿Confirmas que deseas enviar la orden ${getModalData('enviar')?.orden?.folio} al proveedor ${getModalData('enviar')?.orden?.proveedor_nombre}? Una vez enviada, no podrás modificar los items.`}
        confirmText="Confirmar Envío"
        variant="primary"
        isLoading={enviarMutation.isPending}
      />

      {/* Modal de Cancelación */}
      <ConfirmDialog
        isOpen={isOpen('cancelar')}
        onClose={() => closeModal('cancelar')}
        onConfirm={handleCancelar}
        title="Cancelar Orden de Compra"
        message={`¿Estás seguro de que deseas cancelar la orden ${getModalData('cancelar')?.orden?.folio}?`}
        confirmText="Cancelar Orden"
        variant="danger"
        isLoading={cancelarMutation.isPending}
        size="md"
      >
        <Textarea
          label="Motivo de cancelación (opcional)"
          value={motivoCancelacion}
          onChange={(e) => setMotivoCancelacion(e.target.value)}
          rows={3}
          placeholder="Indica el motivo de la cancelación..."
        />
      </ConfirmDialog>

      {/* Modal de Auto-generar OCs */}
      <Modal
        isOpen={isOpen('autoGenerar')}
        onClose={() => closeModal('autoGenerar')}
        title="Generar Órdenes de Compra Automáticamente"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Se generarán órdenes de compra para {sugerencias.length} producto(s)
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                Se crearán OCs en estado borrador agrupadas por proveedor
              </p>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2">
            {sugerencias.map((item) => (
              <div
                key={item.producto_id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <span className="text-sm text-gray-900 dark:text-gray-100">{item.producto_nombre}</span>
                <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                  +{item.cantidad_sugerida} uds
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="secondary" onClick={() => closeModal('autoGenerar')}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={confirmarAutoGenerar}
              isLoading={autoGenerarMutation.isPending}
              icon={Zap}
            >
              Generar Órdenes
            </Button>
          </div>
        </div>
      </Modal>
    </InventarioPageLayout>
  );
}

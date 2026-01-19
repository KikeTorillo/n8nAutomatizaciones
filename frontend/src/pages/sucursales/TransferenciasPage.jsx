import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  ArrowRightLeft,
  Building2,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { useModalManager } from '@/hooks/utils';
import {
  Button,
  ConfirmDialog,
  DataTable,
  DataTableActions,
  DataTableActionButton,
  Select,
} from '@/components/ui';
import TransferenciaFormDrawer from '@/components/sucursales/TransferenciaFormDrawer';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import {
  useTransferencias,
  useSucursales,
  useEnviarTransferencia,
  useCancelarTransferencia,
} from '@/hooks/sistema';
import { useToast } from '@/hooks/utils';

// Mapeo de estados a colores e iconos
const estadoConfig = {
  borrador: {
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    icon: Clock,
    label: 'Borrador',
  },
  enviado: {
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    icon: Send,
    label: 'Enviado',
  },
  recibido: {
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    icon: CheckCircle,
    label: 'Recibido',
  },
  cancelado: {
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    icon: XCircle,
    label: 'Cancelado',
  },
};

// Formatear fecha
const formatFecha = (fecha) => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Columnas para DataTable
const COLUMNS = [
  {
    key: 'codigo',
    header: 'Código',
    render: (row) => (
      <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
        {row.codigo}
      </span>
    ),
  },
  {
    key: 'origen',
    header: 'Origen',
    render: (row) => (
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-900 dark:text-white">
          {row.sucursal_origen_nombre}
        </span>
      </div>
    ),
  },
  {
    key: 'destino',
    header: 'Destino',
    render: (row) => (
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-900 dark:text-white">
          {row.sucursal_destino_nombre}
        </span>
      </div>
    ),
  },
  {
    key: 'items',
    header: 'Items',
    render: (row) => (
      <div className="flex items-center gap-2">
        <Package className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {row.total_items || 0} productos
        </span>
        <span className="text-xs text-gray-400">
          ({row.total_unidades || 0} uds)
        </span>
      </div>
    ),
  },
  {
    key: 'estado',
    header: 'Estado',
    render: (row) => {
      const config = estadoConfig[row.estado] || estadoConfig.borrador;
      const IconEstado = config.icon;
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
          <IconEstado className="w-3.5 h-3.5" />
          {config.label}
        </span>
      );
    },
  },
  {
    key: 'fecha',
    header: 'Fecha',
    hideOnMobile: true,
    render: (row) => (
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {formatFecha(row.creado_en)}
      </span>
    ),
  },
];

/**
 * Acciones por fila de transferencia
 */
function TransferenciaRowActions({ row, onVerDetalle, onEnviar, onCancelar, isEnviando }) {
  return (
    <DataTableActions>
      <DataTableActionButton
        icon={Eye}
        label="Ver detalle"
        onClick={() => onVerDetalle(row)}
        variant="primary"
      />
      {row.estado === 'borrador' && (
        <>
          <DataTableActionButton
            icon={Send}
            label="Enviar"
            onClick={() => onEnviar(row)}
            variant="ghost"
            disabled={isEnviando}
          />
          <DataTableActionButton
            icon={Trash2}
            label="Cancelar"
            onClick={() => onCancelar(row)}
            variant="danger"
          />
        </>
      )}
      {row.estado === 'enviado' && (
        <DataTableActionButton
          icon={XCircle}
          label="Cancelar"
          onClick={() => onCancelar(row)}
          variant="danger"
        />
      )}
    </DataTableActions>
  );
}

/**
 * Página de gestión de transferencias de stock entre sucursales
 */
function TransferenciasPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filtros
  const [filtros, setFiltros] = useState({
    estado: '',
    sucursal_origen_id: '',
    sucursal_destino_id: '',
  });

  // Modales centralizados
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    form: { isOpen: false },
    cancel: { isOpen: false, data: null },
  });

  // Fetch transferencias y sucursales
  const { data: transferencias, isLoading } = useTransferencias({
    estado: filtros.estado || undefined,
    sucursal_origen_id: filtros.sucursal_origen_id || undefined,
    sucursal_destino_id: filtros.sucursal_destino_id || undefined,
  });

  const { data: sucursales } = useSucursales({ activo: true });

  // Mutations
  const enviarMutation = useEnviarTransferencia();
  const cancelarMutation = useCancelarTransferencia();

  // Filtrar por búsqueda local (código)
  const transferenciasFiltradas = transferencias?.filter((t) => {
    if (!busqueda) return true;
    const searchLower = busqueda.toLowerCase();
    return (
      t.codigo?.toLowerCase().includes(searchLower) ||
      t.sucursal_origen_nombre?.toLowerCase().includes(searchLower) ||
      t.sucursal_destino_nombre?.toLowerCase().includes(searchLower)
    );
  });

  // Handler para limpiar filtros
  const handleLimpiarFiltros = () => {
    setFiltros({ estado: '', sucursal_origen_id: '', sucursal_destino_id: '' });
    setBusqueda('');
  };

  // Handlers para acciones
  const handleNuevaTransferencia = () => {
    openModal('form');
  };

  const handleVerDetalle = (transferencia) => {
    navigate(`/sucursales/transferencias/${transferencia.id}`);
  };

  const handleEnviar = async (transferencia) => {
    if (transferencia.estado !== 'borrador') {
      toast.error('Solo se pueden enviar transferencias en borrador');
      return;
    }

    try {
      await enviarMutation.mutateAsync(transferencia.id);
      toast.success('Transferencia enviada correctamente');
    } catch (err) {
      toast.error(err.message || 'Error al enviar transferencia');
    }
  };

  const handleCancelar = (transferencia) => {
    if (transferencia.estado === 'recibido' || transferencia.estado === 'cancelado') {
      toast.error('No se puede cancelar esta transferencia');
      return;
    }
    openModal('cancel', transferencia);
  };

  const confirmarCancelacion = async () => {
    const transferencia = getModalData('cancel');
    if (!transferencia) return;

    try {
      await cancelarMutation.mutateAsync(transferencia.id);
      toast.success('Transferencia cancelada');
      closeModal('cancel');
    } catch (err) {
      toast.error(err.message || 'Error al cancelar');
    }
  };

  // Opciones para selects
  const sucursalesOptions = [
    { value: '', label: 'Todas las sucursales' },
    ...(sucursales?.map((s) => ({ value: s.id.toString(), label: s.nombre })) || []),
  ];

  const estadosOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'borrador', label: 'Borrador' },
    { value: 'enviado', label: 'Enviado' },
    { value: 'recibido', label: 'Recibido' },
    { value: 'cancelado', label: 'Cancelado' },
  ];

  // Calcular filtros activos
  const filtrosActivos = [filtros.estado, filtros.sucursal_origen_id, filtros.sucursal_destino_id, busqueda].filter(Boolean).length;

  return (
    <InventarioPageLayout
      icon={ArrowRightLeft}
      title="Transferencias"
      subtitle={`${transferenciasFiltradas?.length || 0} transferencia${(transferenciasFiltradas?.length || 0) !== 1 ? 's' : ''}`}
      actions={
        <Button
          variant="primary"
          onClick={handleNuevaTransferencia}
          icon={Plus}
          className="flex-1 sm:flex-none text-sm"
        >
          <span className="hidden sm:inline">Nueva Transferencia</span>
          <span className="sm:hidden">Nueva</span>
        </Button>
      }
    >

        {/* Panel de Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Barra de búsqueda */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por código o sucursal..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Botones de acción */}
            <div className="flex items-center gap-2">
              {/* Botón Filtros */}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors min-h-[40px] ${
                  showFilters
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                } hover:bg-gray-200 dark:hover:bg-gray-600`}
                aria-expanded={showFilters}
              >
                <Filter className="h-4 w-4" />
                <span>Filtros</span>
                {filtrosActivos > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full bg-primary-600 text-white">
                    {filtrosActivos}
                  </span>
                )}
                {showFilters ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {/* Botón Limpiar */}
              {filtrosActivos > 0 && (
                <button
                  type="button"
                  onClick={handleLimpiarFiltros}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors min-h-[40px] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Limpiar todos los filtros"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Limpiar</span>
                </button>
              )}
            </div>
          </div>

          {/* Filtros expandidos */}
          {showFilters && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Estado"
                  value={filtros.estado}
                  onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                  options={estadosOptions}
                />
                <Select
                  label="Sucursal Origen"
                  value={filtros.sucursal_origen_id}
                  onChange={(e) => setFiltros({ ...filtros, sucursal_origen_id: e.target.value })}
                  options={sucursalesOptions}
                />
                <Select
                  label="Sucursal Destino"
                  value={filtros.sucursal_destino_id}
                  onChange={(e) => setFiltros({ ...filtros, sucursal_destino_id: e.target.value })}
                  options={sucursalesOptions}
                />
              </div>
            </div>
          )}
        </div>

        {/* Lista de transferencias */}
        <DataTable
          columns={[
            ...COLUMNS,
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (row) => (
                <TransferenciaRowActions
                  row={row}
                  onVerDetalle={handleVerDetalle}
                  onEnviar={handleEnviar}
                  onCancelar={handleCancelar}
                  isEnviando={enviarMutation.isPending}
                />
              ),
            },
          ]}
          data={transferenciasFiltradas || []}
          isLoading={isLoading}
          emptyState={{
            icon: ArrowRightLeft,
            title: 'No hay transferencias',
            description: busqueda || filtros.estado
              ? 'No se encontraron transferencias con los filtros aplicados'
              : 'Crea tu primera transferencia para mover stock entre sucursales',
            actionLabel: !busqueda && !filtros.estado ? 'Nueva Transferencia' : undefined,
            onAction: !busqueda && !filtros.estado ? handleNuevaTransferencia : undefined,
          }}
          skeletonRows={5}
        />

      {/* Modal crear transferencia */}
      <TransferenciaFormDrawer
        isOpen={isOpen('form')}
        onClose={() => closeModal('form')}
      />

      {/* Confirmar cancelación */}
      <ConfirmDialog
        isOpen={isOpen('cancel')}
        onClose={() => closeModal('cancel')}
        onConfirm={confirmarCancelacion}
        title="Cancelar Transferencia"
        message={
          getModalData('cancel')?.estado === 'enviado'
            ? `¿Estás seguro de cancelar la transferencia ${getModalData('cancel')?.codigo}? El stock será devuelto a la sucursal de origen.`
            : `¿Estás seguro de cancelar la transferencia ${getModalData('cancel')?.codigo}?`
        }
        confirmText="Sí, cancelar"
        cancelText="No, mantener"
        variant="danger"
        isLoading={cancelarMutation.isPending}
      />
    </InventarioPageLayout>
  );
}

export default TransferenciasPage;

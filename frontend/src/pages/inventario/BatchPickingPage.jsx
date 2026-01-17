import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Plus,
  Play,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  RefreshCw,
  Package,
  User,
  Clock,
  PackageCheck,
  ListChecks,
} from 'lucide-react';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  FilterPanel,
  Input,
  Modal,
  SkeletonCard,
  StatCardGrid
} from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { useModalManager } from '@/hooks/useModalManager';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import {
  useBatchPickings,
  useBatchesPendientes,
  useOperacionesDisponiblesParaBatch,
  useCrearBatch,
  useIniciarBatch,
  useCompletarBatch,
  useCancelarBatch,
  useEliminarBatch,
  ESTADOS_BATCH,
  LABELS_ESTADO_BATCH,
  COLORES_ESTADO_BATCH,
} from '@/hooks/useBatchPicking';
import useSucursalStore, { selectGetSucursalId } from '@/store/sucursalStore';

/**
 * Card de batch individual
 */
function BatchCard({ batch, onVerDetalle, onIniciar, onCompletar, onCancelar, onEliminar }) {
  const progreso = batch.total_items > 0
    ? Math.round((batch.total_items_procesados / batch.total_items) * 100)
    : 0;

  const colorEstado = {
    borrador: 'border-l-gray-400 bg-gray-50 dark:bg-gray-800',
    confirmado: 'border-l-primary-400 bg-primary-50/50 dark:bg-primary-900/20',
    en_proceso: 'border-l-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/20',
    completado: 'border-l-green-400 bg-green-50/50 dark:bg-green-900/20',
    cancelado: 'border-l-red-400 bg-red-50/50 dark:bg-red-900/20',
  }[batch.estado] || 'border-l-gray-400';

  const colorBadge = {
    borrador: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    confirmado: 'bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300',
    en_proceso: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    completado: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    cancelado: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  }[batch.estado] || 'bg-gray-100';

  return (
    <div className={`rounded-lg shadow-sm border-l-4 ${colorEstado} p-4 hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary-600" />
          <span className="font-medium text-gray-900 dark:text-white font-mono">
            {batch.folio}
          </span>
        </div>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorBadge}`}>
          {LABELS_ESTADO_BATCH[batch.estado]}
        </span>
      </div>

      {/* Info */}
      <div className="space-y-2 mb-4">
        {batch.nombre && (
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {batch.nombre}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <ListChecks className="h-3 w-3" />
            {batch.total_operaciones || 0} operaciones
          </span>
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            {batch.total_items || 0} items
          </span>
          <span className="flex items-center gap-1">
            <PackageCheck className="h-3 w-3" />
            {batch.total_productos_unicos || 0} productos únicos
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(batch.creado_en).toLocaleDateString()}
          </span>
        </div>
        {batch.asignado_nombre && (
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <User className="h-3 w-3" />
            {batch.asignado_nombre}
          </p>
        )}
      </div>

      {/* Progreso */}
      {batch.total_items > 0 && batch.estado !== 'borrador' && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Progreso</span>
            <span>{batch.total_items_procesados || 0}/{batch.total_items} ({progreso}%)</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onVerDetalle(batch.id)}
          className="flex-1"
        >
          <Eye className="h-4 w-4 mr-1" />
          Ver
        </Button>

        {batch.estado === 'borrador' && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onIniciar(batch)}
              className="flex-1 text-green-600 hover:text-green-700"
            >
              <Play className="h-4 w-4 mr-1" />
              Iniciar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEliminar(batch)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}

        {batch.estado === 'en_proceso' && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCompletar(batch)}
              className="flex-1 text-green-600 hover:text-green-700"
              disabled={batch.total_items_procesados < batch.total_items}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Completar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCancelar(batch)}
              className="text-red-600 hover:text-red-700"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Modal para crear nuevo batch
 */
function CrearBatchModal({ isOpen, onClose, operacionesDisponibles, onCrear, isCreating }) {
  const [nombre, setNombre] = useState('');
  const [operacionesSeleccionadas, setOperacionesSeleccionadas] = useState([]);

  const handleToggleOperacion = (operacionId) => {
    setOperacionesSeleccionadas((prev) =>
      prev.includes(operacionId)
        ? prev.filter((id) => id !== operacionId)
        : [...prev, operacionId]
    );
  };

  const handleSeleccionarTodas = () => {
    if (operacionesSeleccionadas.length === operacionesDisponibles.length) {
      setOperacionesSeleccionadas([]);
    } else {
      setOperacionesSeleccionadas(operacionesDisponibles.map((op) => op.id));
    }
  };

  const handleCrear = () => {
    if (operacionesSeleccionadas.length === 0) return;
    onCrear({ nombre, operacionIds: operacionesSeleccionadas });
  };

  const handleClose = () => {
    setNombre('');
    setOperacionesSeleccionadas([]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Crear Batch de Picking"
      size="lg"
    >
      <div className="p-4 space-y-4">
        <Input
          label="Nombre del batch (opcional)"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Wave mañana, Urgentes..."
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Operaciones de Picking Disponibles
            </label>
            {operacionesDisponibles.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSeleccionarTodas}
              >
                {operacionesSeleccionadas.length === operacionesDisponibles.length
                  ? 'Deseleccionar todas'
                  : 'Seleccionar todas'}
              </Button>
            )}
          </div>

          {operacionesDisponibles.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No hay operaciones de picking disponibles</p>
              <p className="text-xs mt-1">Las operaciones aparecerán cuando haya ventas pendientes de picking</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-700">
              {operacionesDisponibles.map((op) => (
                <label
                  key={op.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={operacionesSeleccionadas.includes(op.id)}
                    onChange={() => handleToggleOperacion(op.id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{op.folio}</span>
                      {op.origen_tipo && (
                        <span className="text-xs text-gray-500">
                          ({op.origen_tipo} #{op.origen_id})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {op.total_items} items • {new Date(op.creado_en).toLocaleDateString()}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {operacionesSeleccionadas.length > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {operacionesSeleccionadas.length} operación(es) seleccionada(s)
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleCrear}
            disabled={operacionesSeleccionadas.length === 0 || isCreating}
          >
            {isCreating ? 'Creando...' : `Crear Batch (${operacionesSeleccionadas.length})`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Página principal de Batch Picking
 */
export default function BatchPickingPage() {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError, warning: showWarning } = useToast();
  const getSucursalId = useSucursalStore(selectGetSucursalId);

  // Estado de filtros
  const [filtros, setFiltros] = useState({
    estado: '',
  });

  // Configuración de filtros para FilterPanel
  const filterConfig = [
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { value: '', label: 'Todos los estados' },
        { value: 'borrador', label: 'Borrador' },
        { value: 'en_proceso', label: 'En Proceso' },
        { value: 'completado', label: 'Completado' },
        { value: 'cancelado', label: 'Cancelado' },
      ],
    },
  ];

  // Estado de modales centralizado con useModalManager
  const { openModal, closeModal, isOpen, getModalData, getModalProps } = useModalManager({
    crear: { isOpen: false },
    confirmar: { isOpen: false, data: null, accion: '' },
  });

  // Queries
  const sucursalId = getSucursalId();
  const { data: batches = [], isLoading, refetch } = useBatchPickings({
    sucursal_id: sucursalId,
    ...filtros,
    limit: 50,
  });

  const { data: pendientes = [] } = useBatchesPendientes(sucursalId);
  const { data: operacionesDisponibles = [], refetch: refetchOperaciones } = useOperacionesDisponiblesParaBatch(sucursalId);

  // Mutations
  const crearMutation = useCrearBatch();
  const iniciarMutation = useIniciarBatch();
  const completarMutation = useCompletarBatch();
  const cancelarMutation = useCancelarBatch();
  const eliminarMutation = useEliminarBatch();

  // Agrupar por estado
  const batchesPorEstado = {
    borrador: batches.filter((b) => b.estado === ESTADOS_BATCH.BORRADOR),
    en_proceso: batches.filter((b) => b.estado === ESTADOS_BATCH.EN_PROCESO || b.estado === ESTADOS_BATCH.CONFIRMADO),
    completado: batches.filter((b) => b.estado === ESTADOS_BATCH.COMPLETADO).slice(0, 10),
  };

  // Handlers
  const handleVerDetalle = (id) => {
    navigate(`/inventario/batch-picking/${id}`);
  };

  const handleCrear = async ({ nombre, operacionIds }) => {
    try {
      const batch = await crearMutation.mutateAsync({
        sucursalId,
        operacionIds,
        nombre: nombre || undefined,
      });
      showSuccess(`Batch ${batch.folio} creado correctamente`);
      closeModal('crear');
      refetchOperaciones();
    } catch (err) {
      showError(err.message || 'Error al crear batch');
    }
  };

  const handleIniciar = (batch) => {
    openModal('confirmar', batch, { accion: 'iniciar' });
  };

  const handleCompletar = (batch) => {
    openModal('confirmar', batch, { accion: 'completar' });
  };

  const handleCancelar = (batch) => {
    openModal('confirmar', batch, { accion: 'cancelar' });
  };

  const handleEliminar = (batch) => {
    openModal('confirmar', batch, { accion: 'eliminar' });
  };

  const handleConfirmarAccion = async () => {
    const confirmProps = getModalProps('confirmar');
    const batch = confirmProps.data;
    const accion = confirmProps.accion;
    if (!batch) return;

    try {
      switch (accion) {
        case 'iniciar':
          await iniciarMutation.mutateAsync(batch.id);
          showSuccess(`Batch ${batch.folio} iniciado`);
          navigate(`/inventario/batch-picking/${batch.id}`);
          break;
        case 'completar':
          await completarMutation.mutateAsync(batch.id);
          showSuccess(`Batch ${batch.folio} completado`);
          break;
        case 'cancelar':
          await cancelarMutation.mutateAsync(batch.id);
          showSuccess(`Batch ${batch.folio} cancelado`);
          break;
        case 'eliminar':
          await eliminarMutation.mutateAsync(batch.id);
          showSuccess(`Batch ${batch.folio} eliminado`);
          break;
      }
      closeModal('confirmar');
    } catch (err) {
      showError(err.message || `Error al ${accion} batch`);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  return (
    <InventarioPageLayout
      icon={Layers}
      title="Wave Picking (Batch)"
      subtitle="Agrupar operaciones de picking para procesamiento consolidado"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => openModal('crear')}
            icon={Plus}
          >
            <span className="hidden sm:inline">Nuevo Batch</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            icon={RefreshCw}
            className={isLoading ? '[&_svg]:animate-spin' : ''}
          />
        </div>
      }
    >
      {/* Estadísticas */}
      <div className="mb-4">
        <StatCardGrid
          stats={[
            { icon: Layers, label: 'Borradores', value: batchesPorEstado.borrador.length },
            { icon: Play, label: 'En Proceso', value: batchesPorEstado.en_proceso.length, color: 'yellow' },
            { icon: CheckCircle, label: 'Completados', value: `${batchesPorEstado.completado.length}+`, color: 'green' },
            { icon: Package, label: 'Ops. Disponibles', value: operacionesDisponibles.length, color: 'primary' },
          ]}
        />
      </div>

      {/* Filtros */}
      <FilterPanel
        filters={filtros}
        onFilterChange={handleFiltroChange}
        onClearFilters={() => setFiltros({ estado: '' })}
        showSearch={false}
        filterConfig={filterConfig}
        defaultExpanded={false}
        className="mb-4"
      />

      {/* Lista de Batches */}
      <div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} className="h-48" />
            ))}
          </div>
        ) : batches.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No hay batches de picking"
            description="Crea un nuevo batch para agrupar operaciones de picking"
            action={
              <Button variant="primary" onClick={() => openModal('crear')}>
                <Plus className="h-4 w-4 mr-1" />
                Crear Primer Batch
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((batch) => (
              <BatchCard
                key={batch.id}
                batch={batch}
                onVerDetalle={handleVerDetalle}
                onIniciar={handleIniciar}
                onCompletar={handleCompletar}
                onCancelar={handleCancelar}
                onEliminar={handleEliminar}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear */}
      <CrearBatchModal
        isOpen={isOpen('crear')}
        onClose={() => closeModal('crear')}
        operacionesDisponibles={operacionesDisponibles}
        onCrear={handleCrear}
        isCreating={crearMutation.isPending}
      />

      {/* Modal Confirmar Acción */}
      <ConfirmDialog
        isOpen={isOpen('confirmar')}
        onClose={() => closeModal('confirmar')}
        onConfirm={handleConfirmarAccion}
        title={`Confirmar ${getModalProps('confirmar').accion || ''}`}
        message={`¿Estás seguro de que deseas ${getModalProps('confirmar').accion} el batch ${getModalData('confirmar')?.folio}?`}
        confirmText="Confirmar"
        variant={getModalProps('confirmar').accion === 'eliminar' || getModalProps('confirmar').accion === 'cancelar' ? 'danger' : 'info'}
        isLoading={iniciarMutation.isPending || completarMutation.isPending || cancelarMutation.isPending || eliminarMutation.isPending}
      />
    </InventarioPageLayout>
  );
}

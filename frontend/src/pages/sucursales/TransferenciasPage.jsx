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
import { useModalManager } from '@/hooks/useModalManager';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/SkeletonTable';
import TransferenciaFormDrawer from '@/components/sucursales/TransferenciaFormDrawer';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import {
  useTransferencias,
  useSucursales,
  useEnviarTransferencia,
  useCancelarTransferencia,
} from '@/hooks/useSucursales';
import { useToast } from '@/hooks/useToast';

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
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <SkeletonTable rows={5} columns={7} />
          ) : transferenciasFiltradas?.length === 0 ? (
            <EmptyState
              icon={ArrowRightLeft}
              title="No hay transferencias"
              description={
                busqueda || filtros.estado
                  ? 'No se encontraron transferencias con los filtros aplicados'
                  : 'Crea tu primera transferencia para mover stock entre sucursales'
              }
              action={
                !busqueda && !filtros.estado && (
                  <Button onClick={handleNuevaTransferencia} variant="primary" icon={Plus}>
                    Nueva Transferencia
                  </Button>
                )
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Origen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Destino
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {transferenciasFiltradas?.map((transferencia) => {
                    const config = estadoConfig[transferencia.estado] || estadoConfig.borrador;
                    const IconEstado = config.icon;

                    return (
                      <tr
                        key={transferencia.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                            {transferencia.codigo}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {transferencia.sucursal_origen_nombre}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {transferencia.sucursal_destino_nombre}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {transferencia.total_items || 0} productos
                            </span>
                            <span className="text-xs text-gray-400">
                              ({transferencia.total_unidades || 0} uds)
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}
                          >
                            <IconEstado className="w-3.5 h-3.5" />
                            {config.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatFecha(transferencia.creado_en)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVerDetalle(transferencia)}
                              title="Ver detalle"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            {transferencia.estado === 'borrador' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEnviar(transferencia)}
                                  title="Enviar"
                                  disabled={enviarMutation.isPending}
                                  className="text-primary-600 hover:text-primary-700"
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancelar(transferencia)}
                                  title="Cancelar"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}

                            {transferencia.estado === 'enviado' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelar(transferencia)}
                                title="Cancelar"
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {/* Modal crear transferencia */}
      <TransferenciaFormDrawer
        isOpen={isOpen('form')}
        onClose={() => closeModal('form')}
      />

      {/* Modal confirmar cancelación */}
      <Modal
        isOpen={isOpen('cancel')}
        onClose={() => closeModal('cancel')}
        title="Cancelar Transferencia"
      >
        <div className="p-4">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            ¿Estás seguro de cancelar la transferencia{' '}
            <strong>{getModalData('cancel')?.codigo}</strong>?
          </p>
          {getModalData('cancel')?.estado === 'enviado' && (
            <p className="text-yellow-600 dark:text-yellow-400 text-sm mb-4">
              El stock será devuelto a la sucursal de origen.
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => closeModal('cancel')}
            >
              No, mantener
            </Button>
            <Button
              variant="danger"
              onClick={confirmarCancelacion}
              disabled={cancelarMutation.isPending}
            >
              {cancelarMutation.isPending ? 'Cancelando...' : 'Sí, cancelar'}
            </Button>
          </div>
        </div>
      </Modal>
    </InventarioPageLayout>
  );
}

export default TransferenciasPage;

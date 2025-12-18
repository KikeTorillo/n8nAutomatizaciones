import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  X,
  ArrowRightLeft,
  Building2,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Eye,
  Trash2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import TransferenciaFormModal from '@/components/sucursales/TransferenciaFormModal';
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

  // Estados para modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [transferenciaSeleccionada, setTransferenciaSeleccionada] = useState(null);

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
    setIsFormModalOpen(true);
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
    } catch (error) {
      toast.error(error.message || 'Error al enviar transferencia');
    }
  };

  const handleCancelar = (transferencia) => {
    if (transferencia.estado === 'recibido' || transferencia.estado === 'cancelado') {
      toast.error('No se puede cancelar esta transferencia');
      return;
    }
    setTransferenciaSeleccionada(transferencia);
    setIsCancelModalOpen(true);
  };

  const confirmarCancelacion = async () => {
    if (!transferenciaSeleccionada) return;

    try {
      await cancelarMutation.mutateAsync(transferenciaSeleccionada.id);
      toast.success('Transferencia cancelada');
      setIsCancelModalOpen(false);
      setTransferenciaSeleccionada(null);
    } catch (error) {
      toast.error(error.message || 'Error al cancelar');
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <BackButton to="/sucursales" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <ArrowRightLeft className="w-7 h-7 text-primary-600" />
                  Transferencias de Stock
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Gestiona el movimiento de productos entre sucursales
                </p>
              </div>
            </div>

            <Button onClick={handleNuevaTransferencia} variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Transferencia
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Búsqueda */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar por código o sucursal..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Toggle filtros */}
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-primary-50 dark:bg-primary-900/30' : ''}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
            {(filtros.estado || filtros.sucursal_origen_id || filtros.sucursal_destino_id) && (
              <span className="ml-2 bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                {[filtros.estado, filtros.sucursal_origen_id, filtros.sucursal_destino_id].filter(Boolean).length}
              </span>
            )}
          </Button>

          {/* Limpiar filtros */}
          {(busqueda || filtros.estado || filtros.sucursal_origen_id || filtros.sucursal_destino_id) && (
            <Button variant="ghost" onClick={handleLimpiarFiltros} size="sm">
              <X className="w-4 h-4 mr-1" />
              Limpiar
            </Button>
          )}
        </div>

        {/* Panel de filtros expandible */}
        {showFilters && (
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
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
      <div className="max-w-7xl mx-auto px-4 pb-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : transferenciasFiltradas?.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <ArrowRightLeft className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay transferencias
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {busqueda || filtros.estado
                ? 'No se encontraron transferencias con los filtros aplicados'
                : 'Crea tu primera transferencia para mover stock entre sucursales'}
            </p>
            {!busqueda && !filtros.estado && (
              <Button onClick={handleNuevaTransferencia} variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Transferencia
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
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
          </div>
        )}
      </div>

      {/* Modal crear transferencia */}
      <TransferenciaFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
      />

      {/* Modal confirmar cancelación */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setTransferenciaSeleccionada(null);
        }}
        title="Cancelar Transferencia"
      >
        <div className="p-4">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            ¿Estás seguro de cancelar la transferencia{' '}
            <strong>{transferenciaSeleccionada?.codigo}</strong>?
          </p>
          {transferenciaSeleccionada?.estado === 'enviado' && (
            <p className="text-yellow-600 dark:text-yellow-400 text-sm mb-4">
              El stock será devuelto a la sucursal de origen.
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsCancelModalOpen(false);
                setTransferenciaSeleccionada(null);
              }}
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
    </div>
  );
}

export default TransferenciasPage;

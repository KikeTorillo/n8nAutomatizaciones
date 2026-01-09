import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  Package,
  Play,
  CheckCircle,
  XCircle,
  User,
  Filter,
  RefreshCw,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Search,
  Eye,
  Settings,
  Truck,
  PackageCheck,
  ClipboardCheck,
  PackageOpen,
  Send,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import StatCardGrid from '@/components/ui/StatCardGrid';
import { useToast } from '@/hooks/useToast';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import {
  useOperacionesAlmacen,
  useOperacionesKanban,
  useEstadisticasOperaciones,
  useAsignarOperacion,
  useIniciarOperacion,
  useCancelarOperacion,
  TIPOS_OPERACION,
  ESTADOS_OPERACION,
  LABELS_TIPO_OPERACION,
  LABELS_ESTADO_OPERACION,
  COLORES_ESTADO_OPERACION,
} from '@/hooks/useOperacionesAlmacen';
import useSucursalStore from '@/store/sucursalStore';
import useAuthStore from '@/store/authStore';

/**
 * Iconos por tipo de operación
 */
const ICONOS_TIPO = {
  [TIPOS_OPERACION.RECEPCION]: PackageOpen,
  [TIPOS_OPERACION.CONTROL_CALIDAD]: ClipboardCheck,
  [TIPOS_OPERACION.ALMACENAMIENTO]: Package,
  [TIPOS_OPERACION.PICKING]: PackageCheck,
  [TIPOS_OPERACION.EMPAQUE]: Boxes,
  [TIPOS_OPERACION.ENVIO]: Send,
  [TIPOS_OPERACION.TRANSFERENCIA_INTERNA]: Truck,
};

/**
 * Colores de badge por tipo de operación
 */
const COLORES_TIPO = {
  [TIPOS_OPERACION.RECEPCION]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  [TIPOS_OPERACION.CONTROL_CALIDAD]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  [TIPOS_OPERACION.ALMACENAMIENTO]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  [TIPOS_OPERACION.PICKING]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  [TIPOS_OPERACION.EMPAQUE]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  [TIPOS_OPERACION.ENVIO]: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  [TIPOS_OPERACION.TRANSFERENCIA_INTERNA]: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

/**
 * Card de operación individual
 */
function OperacionCard({ operacion, onVerDetalle, onAsignar, onIniciar, onCancelar }) {
  const IconoTipo = ICONOS_TIPO[operacion.tipo_operacion] || Package;

  const colorEstado = {
    borrador: 'border-l-gray-400',
    asignada: 'border-l-blue-400',
    en_proceso: 'border-l-yellow-400',
    parcial: 'border-l-orange-400',
    completada: 'border-l-green-400',
    cancelada: 'border-l-red-400',
  }[operacion.estado] || 'border-l-gray-400';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 ${colorEstado} p-4 hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${COLORES_TIPO[operacion.tipo_operacion]}`}>
            <IconoTipo className="h-3 w-3" />
            {LABELS_TIPO_OPERACION[operacion.tipo_operacion]}
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
          {operacion.folio}
        </span>
      </div>

      {/* Info principal */}
      <div className="space-y-2 mb-3">
        {operacion.origen_tipo && (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Origen:</span> {operacion.origen_tipo} #{operacion.origen_id}
          </p>
        )}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            {operacion.total_items || 0} items
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(operacion.creado_en).toLocaleDateString()}
          </span>
        </div>
        {operacion.asignado_nombre && (
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <User className="h-3 w-3" />
            {operacion.asignado_nombre}
          </p>
        )}
      </div>

      {/* Progreso */}
      {operacion.total_items > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Progreso</span>
            <span>{operacion.total_procesados || 0}/{operacion.total_items}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-primary-600 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.round(((operacion.total_procesados || 0) / operacion.total_items) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onVerDetalle(operacion.id)}
          className="flex-1"
        >
          <Eye className="h-4 w-4 mr-1" />
          Ver
        </Button>
        {operacion.estado === 'borrador' && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAsignar(operacion)}
              className="flex-1"
            >
              <User className="h-4 w-4 mr-1" />
              Asignar
            </Button>
          </>
        )}
        {(operacion.estado === 'asignada' || operacion.estado === 'borrador') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onIniciar(operacion)}
            className="flex-1 text-green-600 hover:text-green-700"
          >
            <Play className="h-4 w-4 mr-1" />
            Iniciar
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Columna Kanban
 */
function KanbanColumn({ titulo, operaciones, onVerDetalle, onAsignar, onIniciar, onCancelar, color = 'gray', icon: Icon = Package }) {
  const [expandida, setExpandida] = useState(true);

  const coloresHeader = {
    gray: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700',
  };

  return (
    <div className="flex flex-col min-w-[300px] max-w-[350px] bg-gray-50 dark:bg-gray-900/50 rounded-lg">
      {/* Header */}
      <button
        onClick={() => setExpandida(!expandida)}
        className={`flex items-center justify-between p-3 rounded-t-lg border-b ${coloresHeader[color]}`}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span className="font-medium text-sm">{titulo}</span>
          <span className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full text-xs font-medium">
            {operaciones?.length || 0}
          </span>
        </div>
        {expandida ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {/* Cards */}
      {expandida && (
        <div className="p-2 space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
          {operaciones?.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
              Sin operaciones
            </div>
          ) : (
            operaciones?.map((op) => (
              <OperacionCard
                key={op.id}
                operacion={op}
                onVerDetalle={onVerDetalle}
                onAsignar={onAsignar}
                onIniciar={onIniciar}
                onCancelar={onCancelar}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Página principal de Operaciones de Almacén
 */
export default function OperacionesAlmacenPage() {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError, warning: showWarning } = useToast();
  const { getSucursalId } = useSucursalStore();
  const { user } = useAuthStore();

  // Estado de filtros
  const [filtros, setFiltros] = useState({
    tipo_operacion: '',
    asignado_a: '',
    origen_tipo: '',
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [vistaLista, setVistaLista] = useState(false);

  // Modales
  const [modalAsignar, setModalAsignar] = useState({ isOpen: false, operacion: null });

  // Queries
  const sucursalId = getSucursalId();
  const { data: operaciones = [], isLoading, refetch } = useOperacionesAlmacen({
    sucursal_id: sucursalId,
    ...filtros,
    limit: 100,
  });

  const { data: estadisticas = {} } = useEstadisticasOperaciones(sucursalId);

  // Mutations
  const asignarMutation = useAsignarOperacion();
  const iniciarMutation = useIniciarOperacion();
  const cancelarMutation = useCancelarOperacion();

  // Agrupar por estado para Kanban
  const operacionesPorEstado = {
    borrador: operaciones.filter((o) => o.estado === ESTADOS_OPERACION.BORRADOR),
    asignada: operaciones.filter((o) => o.estado === ESTADOS_OPERACION.ASIGNADA),
    en_proceso: operaciones.filter((o) => o.estado === ESTADOS_OPERACION.EN_PROCESO || o.estado === ESTADOS_OPERACION.PARCIAL),
    completada: operaciones.filter((o) => o.estado === ESTADOS_OPERACION.COMPLETADA).slice(0, 10), // Solo últimas 10
  };

  // Handlers
  const handleVerDetalle = (id) => {
    navigate(`/inventario/operaciones/${id}`);
  };

  const handleAsignarClick = (operacion) => {
    setModalAsignar({ isOpen: true, operacion });
  };

  const handleAsignarConfirmar = () => {
    if (!modalAsignar.operacion) return;

    asignarMutation.mutate(
      { id: modalAsignar.operacion.id, usuarioId: user?.id },
      {
        onSuccess: () => {
          showSuccess('Operación asignada correctamente');
          setModalAsignar({ isOpen: false, operacion: null });
        },
        onError: (error) => {
          showError(error.message || 'Error al asignar operación');
        },
      }
    );
  };

  const handleIniciar = (operacion) => {
    iniciarMutation.mutate(operacion.id, {
      onSuccess: () => {
        showSuccess(`Operación ${operacion.folio} iniciada`);
        navigate(`/inventario/operaciones/${operacion.id}`);
      },
      onError: (error) => {
        showError(error.message || 'Error al iniciar operación');
      },
    });
  };

  const handleCancelar = (operacion) => {
    cancelarMutation.mutate(
      { id: operacion.id, motivo: 'Cancelada desde panel' },
      {
        onSuccess: () => {
          showSuccess(`Operación ${operacion.folio} cancelada`);
        },
        onError: (error) => {
          showError(error.message || 'Error al cancelar operación');
        },
      }
    );
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      tipo_operacion: '',
      asignado_a: '',
      origen_tipo: '',
    });
  };

  return (
    <InventarioPageLayout
      icon={Boxes}
      title="Operaciones de Almacén"
      subtitle="Gestión de operaciones: Recepción, QC, Picking, Empaque, Envío"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/inventario/configuracion-almacen')}
            icon={Settings}
          >
            <span className="hidden sm:inline">Configurar</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            icon={RefreshCw}
            className={isLoading ? '[&_svg]:animate-spin' : ''}
          />
          <Button
            variant={mostrarFiltros ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            icon={Filter}
          />
        </div>
      }
    >
      {/* Estadísticas */}
      <div className="mb-4">
        <StatCardGrid
          columns={4}
          className="lg:grid-cols-5"
          stats={[
            {
              icon: Package,
              label: 'Borradores',
              value: operacionesPorEstado.borrador.length,
            },
            {
              icon: User,
              label: 'Asignadas',
              value: operacionesPorEstado.asignada.length,
              color: 'blue',
            },
            {
              icon: Play,
              label: 'En Proceso',
              value: operacionesPorEstado.en_proceso.length,
              color: 'yellow',
            },
            {
              icon: CheckCircle,
              label: 'Completadas',
              value: `${operacionesPorEstado.completada.length}+`,
              color: 'green',
            },
            {
              icon: Boxes,
              label: 'Total Operaciones',
              value: operaciones.length,
              color: 'primary',
            },
          ]}
        />
      </div>

      {/* Filtros */}
      {mostrarFiltros && (
        <div className="mb-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Tipo Operación"
                value={filtros.tipo_operacion}
                onChange={(e) => handleFiltroChange('tipo_operacion', e.target.value)}
              >
                <option value="">Todos los tipos</option>
                {Object.entries(LABELS_TIPO_OPERACION).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Select>
              <Select
                label="Origen"
                value={filtros.origen_tipo}
                onChange={(e) => handleFiltroChange('origen_tipo', e.target.value)}
              >
                <option value="">Todos los orígenes</option>
                <option value="orden_compra">Orden de Compra</option>
                <option value="venta_pos">Venta POS</option>
                <option value="solicitud_transferencia">Transferencia</option>
              </Select>
              <div className="flex items-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleLimpiarFiltros}
                  className="flex-1"
                >
                  Limpiar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            <KanbanColumn
              titulo="Borrador"
              operaciones={operacionesPorEstado.borrador}
              onVerDetalle={handleVerDetalle}
              onAsignar={handleAsignarClick}
              onIniciar={handleIniciar}
              onCancelar={handleCancelar}
              color="gray"
              icon={Package}
            />
            <KanbanColumn
              titulo="Asignadas"
              operaciones={operacionesPorEstado.asignada}
              onVerDetalle={handleVerDetalle}
              onAsignar={handleAsignarClick}
              onIniciar={handleIniciar}
              onCancelar={handleCancelar}
              color="blue"
              icon={User}
            />
            <KanbanColumn
              titulo="En Proceso"
              operaciones={operacionesPorEstado.en_proceso}
              onVerDetalle={handleVerDetalle}
              onAsignar={handleAsignarClick}
              onIniciar={handleIniciar}
              onCancelar={handleCancelar}
              color="yellow"
              icon={Play}
            />
            <KanbanColumn
              titulo="Completadas"
              operaciones={operacionesPorEstado.completada}
              onVerDetalle={handleVerDetalle}
              onAsignar={handleAsignarClick}
              onIniciar={handleIniciar}
              onCancelar={handleCancelar}
              color="green"
              icon={CheckCircle}
            />
          </div>
        )}
      </div>

      {/* Modal Asignar */}
      <Modal
        isOpen={modalAsignar.isOpen}
        onClose={() => setModalAsignar({ isOpen: false, operacion: null })}
        title="Asignar Operación"
      >
        <div className="p-4">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            ¿Deseas asignarte la operación <strong>{modalAsignar.operacion?.folio}</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setModalAsignar({ isOpen: false, operacion: null })}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleAsignarConfirmar}
              disabled={asignarMutation.isPending}
            >
              {asignarMutation.isPending ? 'Asignando...' : 'Asignarme'}
            </Button>
          </div>
        </div>
      </Modal>
    </InventarioPageLayout>
  );
}

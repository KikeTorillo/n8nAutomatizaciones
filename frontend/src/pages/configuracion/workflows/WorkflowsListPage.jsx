/**
 * Workflows List Page
 * Lista de workflows de aprobación con acciones CRUD
 * Refactorizada con componentes genéricos de configuración
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch,
  Plus,
  Play,
  Pause,
  Copy,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  MoreVertical,
} from 'lucide-react';

import { Button, ConfirmDialog } from '@/components/ui';
import { ConfigPageHeader, ConfigSearchBar, ConfigEmptyState } from '@/components/configuracion';
import { useToast } from '@/hooks/useToast';
import { useModalManager } from '@/hooks/useModalManager';
import {
  useWorkflowDefiniciones,
  useEliminarWorkflow,
  useDuplicarWorkflow,
  usePublicarWorkflow,
} from '@/hooks/useWorkflowDesigner';

// Constantes
const ENTIDADES_TIPO = [
  { value: 'orden_compra', label: 'Orden de Compra' },
  { value: 'venta_pos', label: 'Venta POS' },
  { value: 'descuento_pos', label: 'Descuento POS' },
  { value: 'cita', label: 'Cita' },
  { value: 'gasto', label: 'Gasto' },
  { value: 'requisicion', label: 'Requisicion' },
];

const FILTROS_ESTADO = [
  { value: 'true', label: 'Publicados' },
  { value: 'false', label: 'Borradores' },
];

const ENTIDAD_LABELS = {
  orden_compra: 'Orden de Compra',
  venta_pos: 'Venta POS',
  descuento_pos: 'Descuento POS',
  cita: 'Cita',
  gasto: 'Gasto',
  requisicion: 'Requisicion',
};

const ENTIDAD_COLORS = {
  orden_compra: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  venta_pos: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  descuento_pos: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  cita: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  gasto: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  requisicion: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
};

function WorkflowsListPage() {
  const navigate = useNavigate();
  const toast = useToast();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEntidad, setFiltroEntidad] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [menuAbierto, setMenuAbierto] = useState(null);

  // Modales
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    delete: { isOpen: false, data: null },
  });

  // Query params
  const queryParams = useMemo(() => ({
    entidad_tipo: filtroEntidad || undefined,
    activo: filtroEstado === '' ? undefined : filtroEstado === 'true',
  }), [filtroEntidad, filtroEstado]);

  // Queries
  const { data: workflows = [], isLoading } = useWorkflowDefiniciones(queryParams);

  // Mutations
  const eliminarMutation = useEliminarWorkflow();
  const duplicarMutation = useDuplicarWorkflow();
  const publicarMutation = usePublicarWorkflow();

  // Filtrar por búsqueda local
  const workflowsFiltrados = useMemo(() => {
    if (!searchTerm) return workflows;
    const term = searchTerm.toLowerCase();
    return workflows.filter(
      (w) => w.nombre.toLowerCase().includes(term) || w.codigo.toLowerCase().includes(term)
    );
  }, [workflows, searchTerm]);

  // Handlers
  const handleNuevo = () => navigate('/configuracion/workflows/nuevo');
  const handleEditar = (workflow) => navigate(`/configuracion/workflows/${workflow.id}`);

  const handleDuplicar = async (workflow) => {
    try {
      await duplicarMutation.mutateAsync({ id: workflow.id });
      toast.success('Workflow duplicado exitosamente');
      setMenuAbierto(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al duplicar workflow');
    }
  };

  const handlePublicar = async (workflow) => {
    const nuevoEstado = !workflow.activo;
    try {
      await publicarMutation.mutateAsync({ id: workflow.id, activo: nuevoEstado });
      toast.success(nuevoEstado ? 'Workflow publicado' : 'Workflow despublicado');
      setMenuAbierto(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cambiar estado');
    }
  };

  const handleEliminar = (workflow) => {
    openModal('delete', workflow);
    setMenuAbierto(null);
  };

  const confirmarAccion = async () => {
    const workflow = getModalData('delete');
    if (!workflow) return;
    try {
      await eliminarMutation.mutateAsync(workflow.id);
      toast.success('Workflow eliminado');
      closeModal('delete');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleClickOutside = () => {
    if (menuAbierto) setMenuAbierto(null);
  };

  const isFiltered = !!(searchTerm || filtroEntidad || filtroEstado);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" onClick={handleClickOutside}>
      <ConfigPageHeader
        title="Workflows de Aprobación"
        subtitle={`${workflows.length} workflow${workflows.length !== 1 ? 's' : ''} configurados`}
        icon={GitBranch}
        maxWidth="max-w-7xl"
        actions={
          <Button onClick={handleNuevo}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Workflow
          </Button>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ConfigSearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por nombre o código..."
          filters={[
            { name: 'entidad', value: filtroEntidad, onChange: setFiltroEntidad, options: ENTIDADES_TIPO, placeholder: 'Todas las entidades' },
            { name: 'estado', value: filtroEstado, onChange: setFiltroEstado, options: FILTROS_ESTADO, placeholder: 'Todos' },
          ]}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : workflowsFiltrados.length === 0 ? (
          <ConfigEmptyState
            icon={GitBranch}
            title="No hay workflows"
            description="Crea tu primer workflow de aprobación"
            actionLabel="Crear Workflow"
            onAction={handleNuevo}
            isFiltered={isFiltered}
          />
        ) : (
          <div className="grid gap-4">
            {workflowsFiltrados.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onEditar={handleEditar}
                onDuplicar={handleDuplicar}
                onPublicar={handlePublicar}
                onEliminar={handleEliminar}
                menuAbierto={menuAbierto === workflow.id}
                setMenuAbierto={setMenuAbierto}
              />
            ))}
          </div>
        )}
      </main>

      <ConfirmDialog
        isOpen={isOpen('delete')}
        onClose={() => closeModal('delete')}
        onConfirm={confirmarAccion}
        title="Eliminar workflow"
        message={`¿Eliminar "${getModalData('delete')?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={eliminarMutation.isPending}
      />
    </div>
  );
}

/**
 * Card de workflow individual
 */
function WorkflowCard({
  workflow,
  onEditar,
  onDuplicar,
  onPublicar,
  onEliminar,
  menuAbierto,
  setMenuAbierto,
}) {
  const tieneInstanciasActivas = parseInt(workflow.instancias_activas || 0) > 0;

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-primary-300 dark:hover:border-primary-600 transition-colors cursor-pointer"
      onClick={() => onEditar(workflow)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              workflow.activo
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {workflow.activo ? (
                <><CheckCircle className="w-3 h-3" />Publicado</>
              ) : (
                <><Clock className="w-3 h-3" />Borrador</>
              )}
            </span>

            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              ENTIDAD_COLORS[workflow.entidad_tipo] || 'bg-gray-100 text-gray-600'
            }`}>
              {ENTIDAD_LABELS[workflow.entidad_tipo] || workflow.entidad_tipo}
            </span>

            {tieneInstanciasActivas && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                <AlertCircle className="w-3 h-3" />
                {workflow.instancias_activas} en progreso
              </span>
            )}
          </div>

          <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
            {workflow.nombre}
          </h3>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">
              {workflow.codigo}
            </code>
            {workflow.descripcion && <span className="ml-2">{workflow.descripcion}</span>}
          </p>

          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
            <span>{workflow.total_pasos || 0} pasos</span>
            <span>{workflow.total_transiciones || 0} transiciones</span>
            <span>Prioridad: {workflow.prioridad || 0}</span>
          </div>
        </div>

        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuAbierto(menuAbierto ? null : workflow.id);
            }}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {menuAbierto && (
            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
              <button
                onClick={() => onEditar(workflow)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>

              <button
                onClick={() => onDuplicar(workflow)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Duplicar
              </button>

              <button
                onClick={() => onPublicar(workflow)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                {workflow.activo ? <><Pause className="w-4 h-4" />Despublicar</> : <><Play className="w-4 h-4" />Publicar</>}
              </button>

              <hr className="my-1 border-gray-200 dark:border-gray-700" />

              <button
                onClick={() => onEliminar(workflow)}
                disabled={tieneInstanciasActivas}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
                {tieneInstanciasActivas && <span className="text-xs text-gray-400 ml-auto">En uso</span>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkflowsListPage;

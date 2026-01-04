/**
 * ====================================================================
 * WORKFLOWS LIST PAGE
 * ====================================================================
 *
 * Lista de workflows de aprobación con acciones CRUD.
 * Fase 1 del Editor Visual de Workflows.
 *
 * Enero 2026
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch,
  Plus,
  Search,
  Filter,
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
  Eye,
} from 'lucide-react';

import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import {
  useWorkflowDefiniciones,
  useEliminarWorkflow,
  useDuplicarWorkflow,
  usePublicarWorkflow,
} from '@/hooks/useWorkflowDesigner';

// ====================================================================
// CONSTANTES
// ====================================================================

const ENTIDADES_TIPO = [
  { value: '', label: 'Todas las entidades' },
  { value: 'orden_compra', label: 'Orden de Compra' },
  { value: 'venta_pos', label: 'Venta POS' },
  { value: 'descuento_pos', label: 'Descuento POS' },
  { value: 'cita', label: 'Cita' },
  { value: 'gasto', label: 'Gasto' },
  { value: 'requisicion', label: 'Requisicion' },
];

const FILTROS_ESTADO = [
  { value: '', label: 'Todos' },
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

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================

function WorkflowsListPage() {
  const navigate = useNavigate();
  const toast = useToast();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEntidad, setFiltroEntidad] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(null);

  // Query params
  const queryParams = useMemo(() => ({
    entidad_tipo: filtroEntidad || undefined,
    activo: filtroEstado === '' ? undefined : filtroEstado === 'true',
  }), [filtroEntidad, filtroEstado]);

  // Queries
  const { data: workflows = [], isLoading, refetch } = useWorkflowDefiniciones(queryParams);

  // Mutations
  const eliminarMutation = useEliminarWorkflow();
  const duplicarMutation = useDuplicarWorkflow();
  const publicarMutation = usePublicarWorkflow();

  // Filtrar por búsqueda local
  const workflowsFiltrados = useMemo(() => {
    if (!searchTerm) return workflows;
    const term = searchTerm.toLowerCase();
    return workflows.filter(
      (w) =>
        w.nombre.toLowerCase().includes(term) ||
        w.codigo.toLowerCase().includes(term)
    );
  }, [workflows, searchTerm]);

  // Handlers
  const handleNuevo = () => {
    navigate('/configuracion/workflows/nuevo');
  };

  const handleEditar = (workflow) => {
    navigate(`/configuracion/workflows/${workflow.id}`);
  };

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
    setConfirmAction({
      type: 'eliminar',
      workflow,
      title: 'Eliminar workflow',
      message: `¿Eliminar "${workflow.nombre}"? Esta accion no se puede deshacer.`,
    });
    setMenuAbierto(null);
  };

  const confirmarAccion = async () => {
    if (!confirmAction) return;

    try {
      if (confirmAction.type === 'eliminar') {
        await eliminarMutation.mutateAsync(confirmAction.workflow.id);
        toast.success('Workflow eliminado');
      }
      setConfirmAction(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    }
  };

  // Cerrar menu al hacer click fuera
  const handleClickOutside = () => {
    if (menuAbierto) setMenuAbierto(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" onClick={handleClickOutside}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <BackButton to="/configuracion" />

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <GitBranch className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Workflows de Aprobacion
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {workflows.length} workflow{workflows.length !== 1 ? 's' : ''} configurados
                  </p>
                </div>
              </div>

              <Button onClick={handleNuevo} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Workflow
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Busqueda */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o codigo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filtro entidad */}
          <select
            value={filtroEntidad}
            onChange={(e) => setFiltroEntidad(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          >
            {ENTIDADES_TIPO.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Filtro estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          >
            {FILTROS_ESTADO.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : workflowsFiltrados.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay workflows
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm || filtroEntidad || filtroEstado
                ? 'No se encontraron workflows con los filtros seleccionados'
                : 'Crea tu primer workflow de aprobacion'}
            </p>
            {!searchTerm && !filtroEntidad && !filtroEstado && (
              <Button onClick={handleNuevo}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Workflow
              </Button>
            )}
          </div>
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
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={confirmarAccion}
        title={confirmAction?.title}
        message={confirmAction?.message}
        confirmText="Eliminar"
        confirmVariant="danger"
        isLoading={eliminarMutation.isPending}
      />
    </div>
  );
}

// ====================================================================
// WORKFLOW CARD
// ====================================================================

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
        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {/* Estado */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                workflow.activo
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {workflow.activo ? (
                <>
                  <CheckCircle className="w-3 h-3" />
                  Publicado
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3" />
                  Borrador
                </>
              )}
            </span>

            {/* Tipo entidad */}
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                ENTIDAD_COLORS[workflow.entidad_tipo] || 'bg-gray-100 text-gray-600'
              }`}
            >
              {ENTIDAD_LABELS[workflow.entidad_tipo] || workflow.entidad_tipo}
            </span>

            {/* Instancias activas */}
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
            {workflow.descripcion && (
              <span className="ml-2">{workflow.descripcion}</span>
            )}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
            <span>{workflow.total_pasos || 0} pasos</span>
            <span>{workflow.total_transiciones || 0} transiciones</span>
            <span>Prioridad: {workflow.prioridad || 0}</span>
          </div>
        </div>

        {/* Acciones */}
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

          {/* Menu desplegable */}
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
                {workflow.activo ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Despublicar
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Publicar
                  </>
                )}
              </button>

              <hr className="my-1 border-gray-200 dark:border-gray-700" />

              <button
                onClick={() => onEliminar(workflow)}
                disabled={tieneInstanciasActivas}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
                {tieneInstanciasActivas && (
                  <span className="text-xs text-gray-400 ml-auto">En uso</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkflowsListPage;

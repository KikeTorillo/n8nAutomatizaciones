import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  Building,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  Users,
  Loader2,
  Search,
  FolderTree,
} from 'lucide-react';

import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Drawer from '@/components/ui/Drawer';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { useModalManager } from '@/hooks/useModalManager';
import {
  useDepartamentos,
  useArbolDepartamentos,
  useCrearDepartamento,
  useActualizarDepartamento,
  useEliminarDepartamento,
} from '@/hooks/useDepartamentos';

/**
 * Página de configuración de Departamentos
 * CRUD completo con vista de árbol jerárquico
 */
function DepartamentosPage() {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  // Modal manager para form y delete
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    form: { isOpen: false, data: null },
    delete: { isOpen: false, data: null },
  });

  // Queries
  const { data: departamentos = [], isLoading } = useDepartamentos();
  const { data: arbol = [] } = useArbolDepartamentos();

  // Mutations
  const crearMutation = useCrearDepartamento();
  const actualizarMutation = useActualizarDepartamento();
  const eliminarMutation = useEliminarDepartamento();

  // Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nombre: '',
      codigo: '',
      descripcion: '',
      parent_id: '',
      activo: true,
    },
  });

  // Filtrar departamentos para búsqueda
  const departamentosFiltrados = useMemo(() => {
    if (!searchTerm) return departamentos;
    const term = searchTerm.toLowerCase();
    return departamentos.filter(
      d => d.nombre?.toLowerCase().includes(term) || d.codigo?.toLowerCase().includes(term)
    );
  }, [departamentos, searchTerm]);

  // Toggle expandir nodo
  const toggleNode = (id) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Abrir drawer para crear
  const handleNuevo = () => {
    reset({
      nombre: '',
      codigo: '',
      descripcion: '',
      parent_id: '',
      activo: true,
    });
    openModal('form', null);
  };

  // Abrir drawer para editar
  const handleEditar = (departamento) => {
    reset({
      nombre: departamento.nombre || '',
      codigo: departamento.codigo || '',
      descripcion: departamento.descripcion || '',
      parent_id: departamento.parent_id?.toString() || '',
      activo: departamento.activo ?? true,
    });
    openModal('form', departamento);
  };

  // Confirmar eliminación
  const handleEliminar = (departamento) => {
    openModal('delete', departamento);
  };

  // Submit form
  const onSubmit = async (data) => {
    const editingDepartamento = getModalData('form');
    try {
      const payload = {
        nombre: data.nombre.trim(),
        codigo: data.codigo?.trim() || undefined,
        descripcion: data.descripcion?.trim() || undefined,
        parent_id: data.parent_id ? parseInt(data.parent_id) : null,
        activo: data.activo,
      };

      if (editingDepartamento) {
        await actualizarMutation.mutateAsync({
          id: editingDepartamento.id,
          data: payload,
        });
        toast.success('Departamento actualizado');
      } else {
        await crearMutation.mutateAsync(payload);
        toast.success('Departamento creado');
      }

      closeModal('form');
      reset();
    } catch (err) {
      toast.error(err.message || 'Error al guardar');
    }
  };

  // Confirmar delete
  const confirmarEliminar = async () => {
    const deleteData = getModalData('delete');
    try {
      await eliminarMutation.mutateAsync(deleteData.id);
      toast.success('Departamento eliminado');
      closeModal('delete');
    } catch (err) {
      toast.error(err.message || 'Error al eliminar');
    }
  };

  // Componente de nodo del árbol
  const TreeNode = ({ node, level = 0 }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    return (
      <div>
        <div
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg
            hover:bg-gray-50 dark:hover:bg-gray-700/50
            ${level > 0 ? 'ml-6' : ''}
          `}
        >
          {/* Expand/Collapse button */}
          <button
            onClick={() => hasChildren && toggleNode(node.id)}
            className={`p-1 rounded ${hasChildren ? 'hover:bg-gray-200 dark:hover:bg-gray-600' : 'invisible'}`}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {/* Icon */}
          <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
            <Building className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {node.nombre}
              </span>
              {node.codigo && (
                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                  {node.codigo}
                </span>
              )}
              {!node.activo && (
                <span className="text-xs text-red-500 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded">
                  Inactivo
                </span>
              )}
            </div>
            {node.descripcion && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {node.descripcion}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleEditar(node)}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleEliminar(node)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="border-l-2 border-gray-200 dark:border-gray-700 ml-5">
            {node.children.map(child => (
              <TreeNode key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <BackButton to="/configuracion" label="Configuración" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Departamentos
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Estructura organizacional de tu empresa
                </p>
              </div>
            </div>
            <Button onClick={handleNuevo} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
                <FolderTree className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {departamentos.length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Departamentos</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {departamentos.filter(d => d.activo).length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Activos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tree View */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : searchTerm ? (
            // Lista plana cuando hay búsqueda
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {departamentosFiltrados.length === 0 ? (
                <div className="text-center py-12">
                  <Building className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No se encontraron departamentos</p>
                </div>
              ) : (
                departamentosFiltrados.map(dep => (
                  <TreeNode key={dep.id} node={dep} />
                ))
              )}
            </div>
          ) : (
            // Vista de árbol cuando no hay búsqueda
            <div className="p-4">
              {arbol.length === 0 ? (
                <div className="text-center py-12">
                  <Building className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No hay departamentos configurados</p>
                  <Button onClick={handleNuevo} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear primer departamento
                  </Button>
                </div>
              ) : (
                arbol.map(node => <TreeNode key={node.id} node={node} />)
              )}
            </div>
          )}
        </div>
      </main>

      {/* Drawer Form */}
      <Drawer
        isOpen={isOpen('form')}
        onClose={() => closeModal('form')}
        title={getModalData('form') ? 'Editar Departamento' : 'Nuevo Departamento'}
        subtitle={getModalData('form') ? 'Modifica los datos del departamento' : 'Crea un nuevo departamento'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Ej: Recursos Humanos"
            error={errors.nombre?.message}
            {...register('nombre', { required: 'El nombre es requerido' })}
          />

          <Input
            label="Código (Opcional)"
            placeholder="Ej: RRHH"
            {...register('codigo')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Departamento Padre (Opcional)
            </label>
            <select
              {...register('parent_id')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Sin departamento padre</option>
              {departamentos
                .filter(d => d.id !== getModalData('form')?.id)
                .map(d => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción (Opcional)
            </label>
            <textarea
              {...register('descripcion')}
              rows={3}
              placeholder="Descripción del departamento..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activo"
              {...register('activo')}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="activo" className="text-sm text-gray-700 dark:text-gray-300">
              Departamento activo
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => closeModal('form')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={crearMutation.isPending || actualizarMutation.isPending}
            >
              {getModalData('form') ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isOpen('delete')}
        onClose={() => closeModal('delete')}
        title="Eliminar departamento"
        message={`¿Estás seguro de eliminar "${getModalData('delete')?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        onConfirm={confirmarEliminar}
        isLoading={eliminarMutation.isPending}
      />
    </div>
  );
}

export default DepartamentosPage;

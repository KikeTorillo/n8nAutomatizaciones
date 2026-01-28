import { useState, useMemo } from 'react';
import {
  Building,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  Users,
  Loader2,
  FolderTree,
} from 'lucide-react';

import {
  Button,
  ConfirmDialog,
  FormGroup,
  Input,
  StatCardGrid
} from '@/components/ui';
import {
  ConfiguracionPageLayout,
  ConfigSearchBar,
  ConfigEmptyState,
  ConfigCrudDrawer,
} from '@/components/configuracion';
import { useConfigCrud } from '@/hooks/utils';
import {
  useDepartamentos,
  useArbolDepartamentos,
  useCrearDepartamento,
  useActualizarDepartamento,
  useEliminarDepartamento,
} from '@/hooks/personas';

/**
 * Página de configuración de Departamentos
 * Refactorizada con componentes genéricos (mantiene TreeNode específico)
 */
function DepartamentosPage() {
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  // Queries
  const { data: departamentos = [], isLoading } = useDepartamentos();
  const { data: arbol = [] } = useArbolDepartamentos();

  // Mutations
  const crearMutation = useCrearDepartamento();
  const actualizarMutation = useActualizarDepartamento();
  const eliminarMutation = useEliminarDepartamento();

  // CRUD hook centralizado
  const {
    searchTerm,
    setSearchTerm,
    filteredItems,
    isOpen,
    closeModal,
    getModalData,
    handleNew,
    handleEdit,
    handleDelete,
    confirmDelete,
    form,
    handleSubmit,
    isSubmitting,
    isEditing,
  } = useConfigCrud({
    items: departamentos,
    defaultValues: {
      nombre: '',
      codigo: '',
      descripcion: '',
      parent_id: '',
      activo: true,
    },
    createMutation: crearMutation,
    updateMutation: actualizarMutation,
    deleteMutation: eliminarMutation,
    toastMessages: {
      created: 'Departamento creado',
      updated: 'Departamento actualizado',
      deleted: 'Departamento eliminado',
    },
    filterFn: (item, { searchTerm }) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return item.nombre?.toLowerCase().includes(term) ||
             item.codigo?.toLowerCase().includes(term);
    },
    preparePayload: (data) => ({
      nombre: data.nombre.trim(),
      codigo: data.codigo?.trim() || null,
      descripcion: data.descripcion?.trim() || null,
      parent_id: data.parent_id ? parseInt(data.parent_id) : null,
      activo: Boolean(data.activo),
    }),
    prepareEditValues: (item) => ({
      nombre: item.nombre || '',
      codigo: item.codigo || '',
      descripcion: item.descripcion || '',
      parent_id: item.parent_id?.toString() || '',
      activo: item.activo ?? true,
    }),
  });

  const { register, formState: { errors } } = form;

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

  // Stats
  const stats = useMemo(() => [
    {
      label: 'Departamentos',
      value: departamentos.length,
      icon: FolderTree,
      color: 'primary',
    },
    {
      label: 'Activos',
      value: departamentos.filter(d => d.activo).length,
      icon: Users,
      color: 'green',
    },
  ], [departamentos]);

  // Componente de nodo del árbol (específico de esta página)
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

          <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
            <Building className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>

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

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleEdit(node)}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(node)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

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
    <ConfiguracionPageLayout
      icon={Building}
      title="Departamentos"
      subtitle="Estructura organizacional de tu empresa"
      actions={
        <Button onClick={handleNew} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto">
        <ConfigSearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar departamento..."
        />

        <StatCardGrid stats={stats} columns={2} className="mb-6" />

        {/* Vista de árbol o lista filtrada */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : searchTerm ? (
            // Lista plana cuando hay búsqueda
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredItems.length === 0 ? (
                <ConfigEmptyState
                  icon={Building}
                  title="No hay departamentos configurados"
                  isFiltered={true}
                />
              ) : (
                <div className="p-4">
                  {filteredItems.map(dep => (
                    <TreeNode key={dep.id} node={dep} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Vista de árbol cuando no hay búsqueda
            <div className="p-4">
              {arbol.length === 0 ? (
                <ConfigEmptyState
                  icon={Building}
                  title="No hay departamentos configurados"
                  description="Crea tu primer departamento para definir la estructura de tu empresa"
                  actionLabel="Crear primer departamento"
                  onAction={handleNew}
                />
              ) : (
                arbol.map(node => <TreeNode key={node.id} node={node} />)
              )}
            </div>
          )}
        </div>
      </div>

      {/* Drawer Form */}
      <ConfigCrudDrawer
        isOpen={isOpen('form')}
        onClose={() => closeModal('form')}
        title={isEditing ? 'Editar Departamento' : 'Nuevo Departamento'}
        subtitle={isEditing ? 'Modifica los datos del departamento' : 'Crea un nuevo departamento'}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        isEditing={isEditing}
      >
        <FormGroup label="Nombre" error={errors.nombre?.message} required>
          <Input
            placeholder="Ej: Recursos Humanos"
            hasError={!!errors.nombre}
            {...register('nombre', { required: 'El nombre es requerido' })}
          />
        </FormGroup>

        <FormGroup label="Codigo (Opcional)">
          <Input
            placeholder="Ej: RRHH"
            {...register('codigo')}
          />
        </FormGroup>

        <FormGroup label="Departamento Padre (Opcional)">
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
        </FormGroup>

        <FormGroup label="Descripcion (Opcional)">
          <textarea
            {...register('descripcion')}
            rows={3}
            placeholder="Descripcion del departamento..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
          />
        </FormGroup>

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
      </ConfigCrudDrawer>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isOpen('delete')}
        onClose={() => closeModal('delete')}
        title="Eliminar departamento"
        message={`¿Estás seguro de eliminar "${getModalData('delete')?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        onConfirm={confirmDelete}
        isLoading={eliminarMutation.isPending}
      />
    </ConfiguracionPageLayout>
  );
}

export default DepartamentosPage;

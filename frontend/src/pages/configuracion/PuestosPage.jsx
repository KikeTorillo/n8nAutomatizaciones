import { useMemo } from 'react';
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Building,
  Loader2,
  DollarSign,
} from 'lucide-react';

import {
  Button,
  ConfirmDialog,
  FormDrawer,
  FormGroup,
  Input,
  StatCardGrid
} from '@/components/ui';
import {
  ConfiguracionPageLayout,
  ConfigSearchBar,
  ConfigEmptyState,
} from '@/components/configuracion';
import { useConfigCrud } from '@/hooks/utils';
import {
  usePuestos,
  useCrearPuesto,
  useActualizarPuesto,
  useEliminarPuesto,
} from '@/hooks/personas';
import { useDepartamentos } from '@/hooks/personas';

/**
 * Página de configuración de Puestos
 * Refactorizada con componentes genéricos
 */
function PuestosPage() {
  // Queries
  const { data: puestos = [], isLoading } = usePuestos();
  const { data: departamentos = [] } = useDepartamentos();

  // Mutations
  const crearMutation = useCrearPuesto();
  const actualizarMutation = useActualizarPuesto();
  const eliminarMutation = useEliminarPuesto();

  // Opciones de filtro por departamento
  const departamentoOptions = departamentos.map(d => ({
    value: d.id.toString(),
    label: d.nombre,
  }));

  // CRUD hook centralizado
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
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
    items: puestos,
    defaultValues: {
      nombre: '',
      codigo: '',
      descripcion: '',
      departamento_id: '',
      salario_minimo: '',
      salario_maximo: '',
      activo: true,
    },
    createMutation: crearMutation,
    updateMutation: actualizarMutation,
    deleteMutation: eliminarMutation,
    filterFn: (item, { searchTerm, filters }) => {
      // Filtrar por búsqueda
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!item.nombre?.toLowerCase().includes(term) &&
            !item.codigo?.toLowerCase().includes(term)) {
          return false;
        }
      }
      // Filtrar por departamento
      if (filters.departamento_id) {
        if (item.departamento_id !== parseInt(filters.departamento_id)) {
          return false;
        }
      }
      return true;
    },
    toastMessages: {
      created: 'Puesto creado',
      updated: 'Puesto actualizado',
      deleted: 'Puesto eliminado',
    },
    preparePayload: (data) => ({
      nombre: data.nombre.trim(),
      codigo: data.codigo?.trim() || undefined,
      descripcion: data.descripcion?.trim() || undefined,
      departamento_id: data.departamento_id ? parseInt(data.departamento_id) : null,
      salario_minimo: data.salario_minimo ? parseFloat(data.salario_minimo) : null,
      salario_maximo: data.salario_maximo ? parseFloat(data.salario_maximo) : null,
      activo: data.activo,
    }),
    prepareEditValues: (item) => ({
      nombre: item.nombre || '',
      codigo: item.codigo || '',
      descripcion: item.descripcion || '',
      departamento_id: item.departamento_id?.toString() || '',
      salario_minimo: item.salario_minimo?.toString() || '',
      salario_maximo: item.salario_maximo?.toString() || '',
      activo: item.activo ?? true,
    }),
  });

  const { register, formState: { errors } } = form;
  const filterDepartamento = filters.departamento_id || '';

  // Obtener nombre del departamento
  const getDepartamentoNombre = (departamentoId) => {
    const dep = departamentos.find(d => d.id === departamentoId);
    return dep?.nombre || 'Sin departamento';
  };

  // Formatear moneda
  const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);
  };

  // Stats
  const stats = useMemo(() => [
    {
      label: 'Puestos',
      value: puestos.length,
      icon: Briefcase,
      color: 'primary',
    },
    {
      label: 'Con rango salarial',
      value: puestos.filter(p => p.salario_minimo || p.salario_maximo).length,
      icon: DollarSign,
      color: 'green',
    },
  ], [puestos]);

  const isFiltered = !!(searchTerm || filterDepartamento);

  return (
    <ConfiguracionPageLayout
      icon={Briefcase}
      title="Puestos"
      subtitle="Catálogo de puestos de trabajo"
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
          placeholder="Buscar puesto..."
          filters={[
            {
              name: 'departamento_id',
              value: filterDepartamento,
              onChange: (v) => setFilter('departamento_id', v),
              options: departamentoOptions,
              placeholder: 'Todos los departamentos',
            },
          ]}
        />

        <StatCardGrid stats={stats} columns={2} className="mb-6" />

        {/* Lista */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : filteredItems.length === 0 ? (
            <ConfigEmptyState
              icon={Briefcase}
              title="No hay puestos configurados"
              description="Crea tu primer puesto para organizar la estructura de tu empresa"
              actionLabel="Crear primer puesto"
              onAction={handleNew}
              isFiltered={isFiltered}
            />
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredItems.map(puesto => (
                <PuestoRow
                  key={puesto.id}
                  puesto={puesto}
                  departamentoNombre={getDepartamentoNombre(puesto.departamento_id)}
                  formatCurrency={formatCurrency}
                  onEdit={() => handleEdit(puesto)}
                  onDelete={() => handleDelete(puesto)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Drawer Form */}
      <FormDrawer
        isOpen={isOpen('form')}
        onClose={() => closeModal('form')}
        entityName="Puesto"
        mode={isEditing ? 'edit' : 'create'}
        subtitle={isEditing ? 'Modifica los datos del puesto' : 'Crea un nuevo puesto de trabajo'}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      >
        <FormGroup label="Nombre" error={errors.nombre?.message} required>
          <Input
            placeholder="Ej: Gerente de Ventas"
            hasError={!!errors.nombre}
            {...register('nombre', { required: 'El nombre es requerido' })}
          />
        </FormGroup>

        <FormGroup label="Codigo (Opcional)">
          <Input
            placeholder="Ej: GER-VEN"
            {...register('codigo')}
          />
        </FormGroup>

        <FormGroup label="Departamento">
          <select
            {...register('departamento_id')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Selecciona un departamento</option>
            {departamentos.map(d => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        </FormGroup>

        <FormGroup label="Descripcion (Opcional)">
          <textarea
            {...register('descripcion')}
            rows={3}
            placeholder="Responsabilidades y funciones del puesto..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
          />
        </FormGroup>

        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Salario Minimo">
            <Input
              type="number"
              placeholder="0.00"
              {...register('salario_minimo')}
            />
          </FormGroup>
          <FormGroup label="Salario Maximo">
            <Input
              type="number"
              placeholder="0.00"
              {...register('salario_maximo')}
            />
          </FormGroup>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="activo"
            {...register('activo')}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <label htmlFor="activo" className="text-sm text-gray-700 dark:text-gray-300">
            Puesto activo
          </label>
        </div>
      </FormDrawer>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isOpen('delete')}
        onClose={() => closeModal('delete')}
        title="Eliminar puesto"
        message={`¿Estás seguro de eliminar "${getModalData('delete')?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        onConfirm={confirmDelete}
        isLoading={eliminarMutation.isPending}
      />
    </ConfiguracionPageLayout>
  );
}

/**
 * Fila de puesto individual
 */
function PuestoRow({ puesto, departamentoNombre, formatCurrency, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
        <Briefcase className="w-5 h-5 text-primary-600 dark:text-primary-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {puesto.nombre}
          </span>
          {puesto.codigo && (
            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
              {puesto.codigo}
            </span>
          )}
          {!puesto.activo && (
            <span className="text-xs text-red-500 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded">
              Inactivo
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Building className="w-3 h-3" />
            {departamentoNombre}
          </span>
          {(puesto.salario_minimo || puesto.salario_maximo) && (
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {formatCurrency(puesto.salario_minimo)} - {formatCurrency(puesto.salario_maximo)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          title="Editar"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default PuestosPage;

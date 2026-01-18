import { useMemo } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Award,
  Star,
  Layers,
  GraduationCap,
} from 'lucide-react';

import { Button, ConfirmDialog, FormGroup, Input } from '@/components/ui';
import {
  ConfigPageHeader,
  ConfigSearchBar,
  ConfigEmptyState,
  ConfigCrudDrawer,
} from '@/components/configuracion';
import { useConfigCrud } from '@/hooks/utils';
import {
  useCategoriasProfesional,
  useCategoriasAgrupadas,
  useCrearCategoriaProfesional,
  useActualizarCategoriaProfesional,
  useEliminarCategoriaProfesional,
  TIPOS_CATEGORIA,
} from '@/hooks/personas';

// Iconos por tipo de categoría
const TIPO_ICONS = {
  especialidad: Star,
  nivel: Layers,
  area: Tag,
  certificacion: GraduationCap,
  general: Award,
};

// Opciones de filtro para el select
const TIPO_OPTIONS = Object.entries(TIPOS_CATEGORIA).map(([key, value]) => ({
  value: key,
  label: value.label,
}));

/**
 * Página de configuración de Categorías de Profesional
 * Refactorizada con componentes genéricos
 */
function CategoriasPage() {
  // Queries
  const { data: categorias = [], isLoading } = useCategoriasProfesional();
  const { data: categoriasAgrupadas = {} } = useCategoriasAgrupadas();

  // Mutations
  const crearMutation = useCrearCategoriaProfesional();
  const actualizarMutation = useActualizarCategoriaProfesional();
  const eliminarMutation = useEliminarCategoriaProfesional();

  // CRUD hook centralizado
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
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
    items: categorias,
    defaultValues: {
      nombre: '',
      tipo_categoria: 'especialidad',
      descripcion: '',
      color: '#753572',
      icono: '',
      orden: '',
      activo: true,
    },
    createMutation: crearMutation,
    updateMutation: actualizarMutation,
    deleteMutation: eliminarMutation,
    toastMessages: {
      created: 'Categoría creada',
      updated: 'Categoría actualizada',
      deleted: 'Categoría eliminada',
    },
    preparePayload: (data) => ({
      nombre: data.nombre.trim(),
      tipo_categoria: data.tipo_categoria,
      descripcion: data.descripcion?.trim() || undefined,
      color: data.color || undefined,
      icono: data.icono?.trim() || undefined,
      orden: data.orden ? parseInt(data.orden) : undefined,
      activo: data.activo,
    }),
    prepareEditValues: (item) => ({
      nombre: item.nombre || '',
      tipo_categoria: item.tipo_categoria || 'general',
      descripcion: item.descripcion || '',
      color: item.color || '#753572',
      icono: item.icono || '',
      orden: item.orden?.toString() || '',
      activo: item.activo ?? true,
    }),
  });

  const { register, watch, formState: { errors } } = form;
  const colorSeleccionado = watch('color');
  const filterTipo = filters.tipo_categoria || '';

  // Filtrar categorías
  const categoriasFiltradas = useMemo(() => {
    let filtered = categorias;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => c.nombre?.toLowerCase().includes(term));
    }

    if (filterTipo) {
      filtered = filtered.filter(c => c.tipo_categoria === filterTipo);
    }

    return filtered;
  }, [categorias, searchTerm, filterTipo]);

  // Agrupar categorías filtradas por tipo
  const categoriasAgrupadasFiltradas = useMemo(() => {
    if (filterTipo) {
      return { [filterTipo]: categoriasFiltradas };
    }

    return categoriasFiltradas.reduce((acc, cat) => {
      const tipo = cat.tipo_categoria || 'general';
      if (!acc[tipo]) acc[tipo] = [];
      acc[tipo].push(cat);
      return acc;
    }, {});
  }, [categoriasFiltradas, filterTipo]);

  // Handler especial para crear con tipo preseleccionado
  const handleNuevoConTipo = (tipo = 'especialidad') => {
    const colorMap = {
      especialidad: '#753572',
      nivel: '#3B82F6',
      area: '#10B981',
      certificacion: '#F59E0B',
      general: '#6B7280',
    };
    handleNew({
      tipo_categoria: tipo,
      color: colorMap[tipo] || '#753572',
    });
  };

  // Componente de grupo (específico de esta página)
  const GrupoCategoria = ({ tipo, items }) => {
    const TipoIcon = TIPO_ICONS[tipo] || Tag;
    const tipoInfo = TIPOS_CATEGORIA[tipo] || { label: tipo, color: 'gray' };

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TipoIcon className="w-5 h-5 text-gray-500" />
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {tipoInfo.label}
            </h3>
            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => handleNuevoConTipo(tipo)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map(categoria => (
            <CategoriaCard
              key={categoria.id}
              categoria={categoria}
              onEdit={() => handleEdit(categoria)}
              onDelete={() => handleDelete(categoria)}
            />
          ))}
        </div>
      </div>
    );
  };

  const isFiltered = !!(searchTerm || filterTipo);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ConfigPageHeader
        title="Categorías de Profesional"
        subtitle="Especialidades, niveles, áreas y certificaciones"
        icon={Tag}
        actions={
          <Button onClick={() => handleNuevoConTipo()} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nueva
          </Button>
        }
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ConfigSearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar categoría..."
          filters={[
            {
              name: 'tipo_categoria',
              value: filterTipo,
              onChange: (v) => setFilter('tipo_categoria', v),
              options: TIPO_OPTIONS,
              placeholder: 'Todos los tipos',
            },
          ]}
        />

        {/* Stats por tipo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {Object.entries(TIPOS_CATEGORIA).slice(0, 4).map(([tipo, info]) => {
            const TipoIcon = TIPO_ICONS[tipo] || Tag;
            const count = categoriasAgrupadas[tipo]?.length || 0;

            return (
              <div
                key={tipo}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${info.color}-100 dark:bg-${info.color}-900/40`}>
                    <TipoIcon className={`w-5 h-5 text-${info.color}-600 dark:text-${info.color}-400`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{count}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{info.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Lista agrupada */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : Object.keys(categoriasAgrupadasFiltradas).length === 0 ? (
            <ConfigEmptyState
              icon={Tag}
              title="No hay categorías configuradas"
              description="Crea tu primera categoría para organizar a tus profesionales"
              actionLabel="Crear primera categoría"
              onAction={() => handleNuevoConTipo()}
              isFiltered={isFiltered}
            />
          ) : (
            Object.entries(categoriasAgrupadasFiltradas).map(([tipo, items]) => (
              items.length > 0 && <GrupoCategoria key={tipo} tipo={tipo} items={items} />
            ))
          )}
        </div>
      </main>

      {/* Drawer Form */}
      <ConfigCrudDrawer
        isOpen={isOpen('form')}
        onClose={() => closeModal('form')}
        title={isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
        subtitle={isEditing ? 'Modifica los datos de la categoría' : 'Crea una nueva categoría de profesional'}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        isEditing={isEditing}
      >
        <FormGroup label="Nombre" error={errors.nombre?.message} required>
          <Input
            placeholder="Ej: Corte Clasico"
            hasError={!!errors.nombre}
            {...register('nombre', { required: 'El nombre es requerido' })}
          />
        </FormGroup>

        <FormGroup label="Tipo de Categoria">
          <select
            {...register('tipo_categoria')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
          >
            {TIPO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FormGroup>

        <FormGroup label="Descripcion (Opcional)">
          <textarea
            {...register('descripcion')}
            rows={3}
            placeholder="Descripcion de la categoria..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
          />
        </FormGroup>

        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                {...register('color')}
                className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <span className="text-sm text-gray-500">{colorSeleccionado}</span>
            </div>
          </FormGroup>
          <FormGroup label="Orden">
            <Input
              type="number"
              placeholder="0"
              {...register('orden')}
            />
          </FormGroup>
        </div>

        <FormGroup label="Icono (Opcional)">
          <Input
            placeholder="Nombre del icono Lucide"
            {...register('icono')}
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
            Categoría activa
          </label>
        </div>
      </ConfigCrudDrawer>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isOpen('delete')}
        onClose={() => closeModal('delete')}
        title="Eliminar categoría"
        message={`¿Estás seguro de eliminar "${getModalData('delete')?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        onConfirm={confirmDelete}
        isLoading={eliminarMutation.isPending}
      />
    </div>
  );
}

/**
 * Card de categoría individual
 */
function CategoriaCard({ categoria, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: categoria.color || '#753572' }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {categoria.nombre}
          </span>
          {!categoria.activo && (
            <span className="text-xs text-red-500 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded">
              Inactivo
            </span>
          )}
        </div>
        {categoria.descripcion && (
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {categoria.descripcion}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onEdit}
          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Editar"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default CategoriasPage;

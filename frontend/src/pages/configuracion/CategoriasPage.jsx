import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Search,
  Award,
  Star,
  Layers,
  GraduationCap,
} from 'lucide-react';

import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Drawer from '@/components/ui/Drawer';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import {
  useCategoriasProfesional,
  useCategoriasAgrupadas,
  useCrearCategoriaProfesional,
  useActualizarCategoriaProfesional,
  useEliminarCategoriaProfesional,
  TIPOS_CATEGORIA,
} from '@/hooks/useCategoriasProfesional';

// Iconos por tipo de categoría
const TIPO_ICONS = {
  especialidad: Star,
  nivel: Layers,
  area: Tag,
  certificacion: GraduationCap,
  general: Award,
};

/**
 * Página de configuración de Categorías de Profesional
 * CRUD completo agrupado por tipo
 */
function CategoriasPage() {
  const toast = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');

  // Queries
  const { data: categorias = [], isLoading } = useCategoriasProfesional();
  const { data: categoriasAgrupadas = {} } = useCategoriasAgrupadas();

  // Mutations
  const crearMutation = useCrearCategoriaProfesional();
  const actualizarMutation = useActualizarCategoriaProfesional();
  const eliminarMutation = useEliminarCategoriaProfesional();

  // Form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nombre: '',
      tipo_categoria: 'especialidad',
      descripcion: '',
      color: '#753572',
      icono: '',
      orden: '',
      activo: true,
    },
  });

  const tipoSeleccionado = watch('tipo_categoria');
  const colorSeleccionado = watch('color');

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

  // Abrir drawer para crear
  const handleNuevo = (tipo = 'especialidad') => {
    setEditingCategoria(null);
    reset({
      nombre: '',
      tipo_categoria: tipo,
      descripcion: '',
      color: TIPOS_CATEGORIA[tipo]?.color === 'purple' ? '#753572' :
             TIPOS_CATEGORIA[tipo]?.color === 'blue' ? '#3B82F6' :
             TIPOS_CATEGORIA[tipo]?.color === 'green' ? '#10B981' :
             TIPOS_CATEGORIA[tipo]?.color === 'yellow' ? '#F59E0B' : '#6B7280',
      icono: '',
      orden: '',
      activo: true,
    });
    setDrawerOpen(true);
  };

  // Abrir drawer para editar
  const handleEditar = (categoria) => {
    setEditingCategoria(categoria);
    reset({
      nombre: categoria.nombre || '',
      tipo_categoria: categoria.tipo_categoria || 'general',
      descripcion: categoria.descripcion || '',
      color: categoria.color || '#753572',
      icono: categoria.icono || '',
      orden: categoria.orden?.toString() || '',
      activo: categoria.activo ?? true,
    });
    setDrawerOpen(true);
  };

  // Confirmar eliminación
  const handleEliminar = (categoria) => {
    setDeleteConfirm(categoria);
  };

  // Submit form
  const onSubmit = async (data) => {
    try {
      const payload = {
        nombre: data.nombre.trim(),
        tipo_categoria: data.tipo_categoria,
        descripcion: data.descripcion?.trim() || undefined,
        color: data.color || undefined,
        icono: data.icono?.trim() || undefined,
        orden: data.orden ? parseInt(data.orden) : undefined,
        activo: data.activo,
      };

      if (editingCategoria) {
        await actualizarMutation.mutateAsync({
          id: editingCategoria.id,
          data: payload,
        });
        toast.success('Categoría actualizada');
      } else {
        await crearMutation.mutateAsync(payload);
        toast.success('Categoría creada');
      }

      setDrawerOpen(false);
      reset();
    } catch (error) {
      toast.error(error.message || 'Error al guardar');
    }
  };

  // Confirmar delete
  const confirmarEliminar = async () => {
    try {
      await eliminarMutation.mutateAsync(deleteConfirm.id);
      toast.success('Categoría eliminada');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(error.message || 'Error al eliminar');
    }
  };

  // Componente de grupo
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNuevo(tipo)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map(categoria => (
            <div
              key={categoria.id}
              className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
            >
              {/* Color indicator */}
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: categoria.color || '#753572' }}
              />

              {/* Info */}
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

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleEditar(categoria)}
                  className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEliminar(categoria)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
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
                  Categorías de Profesional
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Especialidades, niveles, áreas y certificaciones
                </p>
              </div>
            </div>
            <Button onClick={() => handleNuevo()} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nueva
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos los tipos</option>
            {Object.entries(TIPOS_CATEGORIA).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>
        </div>

        {/* Stats */}
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

        {/* Grouped List */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : Object.keys(categoriasAgrupadasFiltradas).length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
              <Tag className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm || filterTipo ? 'No se encontraron categorías' : 'No hay categorías configuradas'}
              </p>
              {!searchTerm && !filterTipo && (
                <Button onClick={() => handleNuevo()} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear primera categoría
                </Button>
              )}
            </div>
          ) : (
            Object.entries(categoriasAgrupadasFiltradas).map(([tipo, items]) => (
              items.length > 0 && <GrupoCategoria key={tipo} tipo={tipo} items={items} />
            ))
          )}
        </div>
      </main>

      {/* Drawer Form */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
        subtitle={editingCategoria ? 'Modifica los datos de la categoría' : 'Crea una nueva categoría de profesional'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Ej: Corte Clásico"
            error={errors.nombre?.message}
            {...register('nombre', { required: 'El nombre es requerido' })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Categoría
            </label>
            <select
              {...register('tipo_categoria')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
            >
              {Object.entries(TIPOS_CATEGORIA).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
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
              placeholder="Descripción de la categoría..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  {...register('color')}
                  className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <span className="text-sm text-gray-500">{colorSeleccionado}</span>
              </div>
            </div>
            <Input
              label="Orden"
              type="number"
              placeholder="0"
              {...register('orden')}
            />
          </div>

          <Input
            label="Icono (Opcional)"
            placeholder="Nombre del icono Lucide"
            {...register('icono')}
          />

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

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setDrawerOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={crearMutation.isPending || actualizarMutation.isPending}
            >
              {editingCategoria ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Eliminar categoría"
        message={`¿Estás seguro de eliminar "${deleteConfirm?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        onConfirm={confirmarEliminar}
        isLoading={eliminarMutation.isPending}
      />
    </div>
  );
}

export default CategoriasPage;

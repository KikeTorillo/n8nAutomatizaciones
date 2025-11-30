import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FolderTree, Tag, Palette } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import FieldWrapper from '@/components/forms/FieldWrapper';
import { useCrearCategoria, useActualizarCategoria, useCategorias } from '@/hooks/useCategorias';
import { useToast } from '@/hooks/useToast';

/**
 * Schema de validación Zod para categorías
 */
const categoriaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional(),
  categoria_padre_id: z.string().optional(),
  icono: z.string().max(50, 'Máximo 50 caracteres').optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Formato inválido (debe ser #RRGGBB)')
    .optional()
    .or(z.literal('')),
  orden: z.coerce.number().min(0, 'El orden no puede ser negativo').default(0),
  activo: z.boolean().default(true),
});

/**
 * Colores predefinidos para categorías
 */
const COLORES_PREDEFINIDOS = [
  '#EF4444', // red-500
  '#F59E0B', // amber-500
  '#10B981', // green-500
  '#3B82F6', // blue-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#6366F1', // indigo-500
  '#14B8A6', // teal-500
];

/**
 * Modal para crear/editar categorías
 */
function CategoriaFormModal({ isOpen, onClose, categoria = null, mode = 'create' }) {
  const { success: showSuccess, error: showError } = useToast();
  const esEdicion = mode === 'edit' && categoria;

  // Queries
  const { data: categoriasData } = useCategorias({ activo: true });
  const categorias = categoriasData?.categorias || [];

  // Mutations
  const crearMutation = useCrearCategoria();
  const actualizarMutation = useActualizarCategoria();
  const mutation = esEdicion ? actualizarMutation : crearMutation;

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      categoria_padre_id: '',
      icono: '',
      color: '#3B82F6',
      orden: 0,
      activo: true,
    },
  });

  const colorSeleccionado = watch('color');

  // Cargar datos al editar
  useEffect(() => {
    if (esEdicion && categoria) {
      reset({
        nombre: categoria.nombre || '',
        descripcion: categoria.descripcion || '',
        categoria_padre_id: categoria.categoria_padre_id?.toString() || '',
        icono: categoria.icono || '',
        color: categoria.color || '#3B82F6',
        orden: categoria.orden || 0,
        activo: categoria.activo ?? true,
      });
    } else {
      reset({
        nombre: '',
        descripcion: '',
        categoria_padre_id: '',
        icono: '',
        color: '#3B82F6',
        orden: 0,
        activo: true,
      });
    }
  }, [esEdicion, categoria, reset]);

  // Submit handler
  const onSubmit = (data) => {
    // Sanitizar datos
    const payload = {
      nombre: data.nombre,
      descripcion: data.descripcion || undefined,
      categoria_padre_id: data.categoria_padre_id ? parseInt(data.categoria_padre_id) : undefined,
      icono: data.icono || undefined,
      color: data.color || undefined,
      orden: data.orden,
      activo: data.activo,
    };

    if (esEdicion) {
      mutation.mutate(
        { id: categoria.id, data: payload },
        {
          onSuccess: () => {
            showSuccess('Categoría actualizada correctamente');
            reset();
            onClose();
          },
          onError: (err) => {
            showError(err.message || 'Error al actualizar categoría');
          },
        }
      );
    } else {
      mutation.mutate(payload, {
        onSuccess: () => {
          showSuccess('Categoría creada correctamente');
          reset();
          onClose();
        },
        onError: (err) => {
          showError(err.message || 'Error al crear categoría');
        },
      });
    }
  };

  // Filtrar categorías para selector de padre (excluir la actual y sus hijos)
  const categoriasDisponibles = categorias.filter((cat) => {
    if (!esEdicion) return true;
    return cat.id !== categoria?.id; // No puede ser su propio padre
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? 'Editar Categoría' : 'Nueva Categoría'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Nombre */}
        <FieldWrapper label="Nombre" error={errors.nombre?.message} required>
          <input
            type="text"
            {...register('nombre')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Ej: Cuidado Capilar, Productos de Limpieza"
          />
        </FieldWrapper>

        {/* Descripción */}
        <FieldWrapper label="Descripción" error={errors.descripcion?.message}>
          <textarea
            {...register('descripcion')}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Descripción opcional de la categoría"
          />
        </FieldWrapper>

        {/* Categoría Padre */}
        <FieldWrapper
          label="Categoría Padre"
          error={errors.categoria_padre_id?.message}
          helperText="Opcional - Permite crear subcategorías"
        >
          <Select {...register('categoria_padre_id')}>
            <option value="">Sin categoría padre (categoría raíz)</option>
            {categoriasDisponibles.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </Select>
        </FieldWrapper>

        <div className="grid grid-cols-2 gap-4">
          {/* Icono */}
          <FieldWrapper
            label="Icono"
            error={errors.icono?.message}
            helperText="Nombre del icono Lucide"
          >
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                {...register('icono')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ej: Scissors, Bottle"
              />
            </div>
          </FieldWrapper>

          {/* Orden */}
          <FieldWrapper
            label="Orden"
            error={errors.orden?.message}
            helperText="Orden de visualización"
          >
            <input
              type="number"
              min="0"
              {...register('orden')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </FieldWrapper>
        </div>

        {/* Color */}
        <FieldWrapper label="Color" error={errors.color?.message}>
          <div className="space-y-3">
            {/* Colores Predefinidos */}
            <div className="flex items-center space-x-2">
              {COLORES_PREDEFINIDOS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    colorSeleccionado === color
                      ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            {/* Input Color Personalizado */}
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <Palette className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  {...register('color')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                  placeholder="#RRGGBB"
                />
              </div>
              <input
                type="color"
                value={colorSeleccionado || '#3B82F6'}
                onChange={(e) => setValue('color', e.target.value.toUpperCase())}
                className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </FieldWrapper>

        {/* Activo */}
        <FieldWrapper>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('activo')}
              className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Categoría activa
            </span>
          </label>
        </FieldWrapper>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={mutation.isPending}
          >
            {esEdicion ? 'Actualizar' : 'Crear'} Categoría
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CategoriaFormModal;

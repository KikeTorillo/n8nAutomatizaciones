import { useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Palette } from 'lucide-react';
import {
  Checkbox,
  FormDrawer,
  FormGroup,
  IconPicker,
  Input,
  Select,
  Textarea
} from '@/components/ui';
import { useCrearCategoria, useActualizarCategoria, useCategorias } from '@/hooks/inventario';
import { useToast } from '@/hooks/utils';

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

const COLORES_PREDEFINIDOS = [
  '#EF4444', '#F59E0B', '#10B981', '#753572',
  '#8B5CF6', '#EC4899', '#753572', '#14B8A6',
];

const DEFAULT_VALUES = {
  nombre: '',
  descripcion: '',
  categoria_padre_id: '',
  icono: '',
  color: '#3B82F6',
  orden: 0,
  activo: true,
};

function entityToFormValues(categoria) {
  return {
    nombre: categoria.nombre || '',
    descripcion: categoria.descripcion || '',
    categoria_padre_id: categoria.categoria_padre_id?.toString() || '',
    icono: categoria.icono || '',
    color: categoria.color || '#3B82F6',
    orden: categoria.orden || 0,
    activo: categoria.activo ?? true,
  };
}

function CategoriaFormDrawer({ isOpen, onClose, categoria = null, mode = 'create' }) {
  const { success: showSuccess, error: showError } = useToast();
  const esEdicion = mode === 'edit' && categoria;

  const { data: categoriasData } = useCategorias({ activo: true });
  const categorias = categoriasData?.categorias || [];

  const crearMutation = useCrearCategoria();
  const actualizarMutation = useActualizarCategoria();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(categoriaSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const colorSeleccionado = watch('color');
  const iconoSeleccionado = watch('icono');

  useEffect(() => {
    if (isOpen) {
      reset(esEdicion && categoria ? entityToFormValues(categoria) : DEFAULT_VALUES);
    }
  }, [isOpen, esEdicion, categoria, reset]);

  const onSubmit = useCallback(async (data) => {
    const payload = {
      nombre: data.nombre,
      descripcion: data.descripcion || undefined,
      categoria_padre_id: data.categoria_padre_id ? parseInt(data.categoria_padre_id) : undefined,
      icono: data.icono || undefined,
      color: data.color || undefined,
      orden: data.orden,
      activo: data.activo,
    };

    try {
      if (esEdicion) {
        await actualizarMutation.mutateAsync({ id: categoria.id, data: payload });
        showSuccess('Categoría actualizada correctamente');
      } else {
        await crearMutation.mutateAsync(payload);
        showSuccess('Categoría creada correctamente');
      }
      onClose();
    } catch (err) {
      showError(err.message || `Error al ${esEdicion ? 'actualizar' : 'crear'} categoría`);
    }
  }, [esEdicion, categoria, actualizarMutation, crearMutation, showSuccess, showError, onClose]);

  const categoriasDisponibles = categorias.filter((cat) => {
    if (!esEdicion) return true;
    return cat.id !== categoria?.id;
  });

  const isSubmitting = crearMutation.isPending || actualizarMutation.isPending;

  return (
    <FormDrawer
      isOpen={isOpen}
      onClose={onClose}
      entityName="Categoría"
      mode={esEdicion ? 'edit' : 'create'}
      subtitle={esEdicion ? 'Modifica los datos de la categoría' : 'Completa la información de la categoría'}
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
    >
      <FormGroup label="Nombre" error={errors.nombre?.message} required>
        <Input
          {...register('nombre')}
          hasError={!!errors.nombre}
          placeholder="Ej: Cuidado Capilar, Productos de Limpieza"
        />
      </FormGroup>

      <FormGroup label="Descripción" error={errors.descripcion?.message}>
        <Textarea
          {...register('descripcion')}
          rows={3}
          hasError={!!errors.descripcion}
          placeholder="Descripción opcional de la categoría"
        />
      </FormGroup>

      <FormGroup
        label="Categoría Padre"
        error={errors.categoria_padre_id?.message}
        helper="Opcional - Permite crear subcategorías"
      >
        <Select
          {...register('categoria_padre_id')}
          hasError={!!errors.categoria_padre_id}
          placeholder="Sin categoría padre (categoría raíz)"
          options={categoriasDisponibles.map((cat) => ({
            value: cat.id.toString(),
            label: cat.nombre,
          }))}
        />
      </FormGroup>

      <FormGroup label="Icono" error={errors.icono?.message}>
        <IconPicker
          value={iconoSeleccionado}
          onChange={(icono) => setValue('icono', icono)}
          hasError={!!errors.icono}
        />
      </FormGroup>

      <FormGroup label="Orden de visualización" error={errors.orden?.message}>
        <Input
          type="number"
          min="0"
          {...register('orden')}
          hasError={!!errors.orden}
          placeholder="0"
        />
      </FormGroup>

      <FormGroup label="Color" error={errors.color?.message}>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            {COLORES_PREDEFINIDOS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setValue('color', color)}
                className={`w-10 h-10 rounded-lg transition-all ${
                  colorSeleccionado === color
                    ? 'ring-2 ring-offset-2 ring-primary-500 scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative flex-1">
              <Palette className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                {...register('color')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="#RRGGBB"
              />
            </div>
            <input
              type="color"
              value={colorSeleccionado || '#3B82F6'}
              onChange={(e) => setValue('color', e.target.value.toUpperCase())}
              className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </FormGroup>

      <Checkbox
        label="Categoría activa"
        {...register('activo')}
      />
    </FormDrawer>
  );
}

export default CategoriaFormDrawer;

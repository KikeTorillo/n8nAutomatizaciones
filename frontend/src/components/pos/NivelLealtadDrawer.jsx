import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Award, Star, Crown, Gem } from 'lucide-react';

import { Button, Drawer, Input } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { useCrearNivelLealtad, useActualizarNivelLealtad } from '@/hooks/useLealtad';

// Colores predefinidos para niveles
const COLORES_NIVEL = [
  { value: '#CD7F32', label: 'Bronce', bg: 'bg-amber-600' },
  { value: '#C0C0C0', label: 'Plata', bg: 'bg-gray-400' },
  { value: '#FFD700', label: 'Oro', bg: 'bg-yellow-500' },
  { value: '#E5E4E2', label: 'Platino', bg: 'bg-gray-300' },
  { value: '#753572', label: 'Primario', bg: 'bg-primary-600' },
  { value: '#10B981', label: 'Esmeralda', bg: 'bg-emerald-500' },
  { value: '#3B82F6', label: 'Azul', bg: 'bg-primary-500' },
  { value: '#8B5CF6', label: 'Violeta', bg: 'bg-primary-500' },
];

// Iconos disponibles
const ICONOS_NIVEL = [
  { value: 'star', label: 'Estrella', icon: Star },
  { value: 'award', label: 'Medalla', icon: Award },
  { value: 'crown', label: 'Corona', icon: Crown },
  { value: 'gem', label: 'Gema', icon: Gem },
];

/**
 * Drawer para crear/editar niveles de lealtad
 */
export default function NivelLealtadDrawer({ isOpen, onClose, nivel, onSuccess }) {
  const toast = useToast();
  const crearMutation = useCrearNivelLealtad();
  const actualizarMutation = useActualizarNivelLealtad();

  const esEdicion = !!nivel;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: esEdicion && nivel
      ? {
          nombre: nivel.nombre || '',
          codigo: nivel.codigo || '',
          color: nivel.color || '#CD7F32',
          icono: nivel.icono || 'star',
          puntos_minimos: nivel.puntos_minimos?.toString() || '0',
          puntos_maximos: nivel.puntos_maximos?.toString() || '',
          multiplicador_puntos: nivel.multiplicador_puntos?.toString() || '1',
          orden: nivel.orden?.toString() || '0',
          activo: nivel.activo ?? true
        }
      : {
          nombre: '',
          codigo: '',
          color: '#CD7F32',
          icono: 'star',
          puntos_minimos: '0',
          puntos_maximos: '',
          multiplicador_puntos: '1',
          orden: '0',
          activo: true
        }
  });

  const colorSeleccionado = watch('color');
  const iconoSeleccionado = watch('icono');

  // Reset cuando cambia el nivel
  useEffect(() => {
    if (esEdicion && nivel) {
      reset({
        nombre: nivel.nombre || '',
        codigo: nivel.codigo || '',
        color: nivel.color || '#CD7F32',
        icono: nivel.icono || 'star',
        puntos_minimos: nivel.puntos_minimos?.toString() || '0',
        puntos_maximos: nivel.puntos_maximos?.toString() || '',
        multiplicador_puntos: nivel.multiplicador_puntos?.toString() || '1',
        orden: nivel.orden?.toString() || '0',
        activo: nivel.activo ?? true
      });
    } else {
      reset({
        nombre: '',
        codigo: '',
        color: '#CD7F32',
        icono: 'star',
        puntos_minimos: '0',
        puntos_maximos: '',
        multiplicador_puntos: '1',
        orden: '0',
        activo: true
      });
    }
  }, [nivel, esEdicion, reset]);

  // Auto-generar código desde nombre
  const handleNombreChange = (e) => {
    const nombre = e.target.value;
    if (!esEdicion) {
      const codigo = nombre
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9]/g, '_')
        .substring(0, 20);
      setValue('codigo', codigo);
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        nombre: data.nombre.trim(),
        codigo: data.codigo.trim().toUpperCase(),
        color: data.color,
        icono: data.icono || null,
        puntos_minimos: parseInt(data.puntos_minimos) || 0,
        puntos_maximos: data.puntos_maximos ? parseInt(data.puntos_maximos) : null,
        multiplicador_puntos: parseFloat(data.multiplicador_puntos) || 1,
        orden: parseInt(data.orden) || 0,
        activo: data.activo
      };

      // Validar que puntos_maximos >= puntos_minimos si está definido
      if (payload.puntos_maximos !== null && payload.puntos_maximos < payload.puntos_minimos) {
        toast.error('Puntos máximos debe ser mayor o igual a puntos mínimos');
        return;
      }

      if (esEdicion) {
        await actualizarMutation.mutateAsync({
          id: nivel.id,
          data: payload
        });
        toast.success('Nivel actualizado');
      } else {
        await crearMutation.mutateAsync(payload);
        toast.success('Nivel creado');
      }

      onSuccess?.();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Error al guardar');
    }
  };

  const isSubmitting = crearMutation.isPending || actualizarMutation.isPending;

  // Obtener icono seleccionado
  const IconoActual = ICONOS_NIVEL.find(i => i.value === iconoSeleccionado)?.icon || Star;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? 'Editar Nivel' : 'Nuevo Nivel de Lealtad'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
        {/* Preview del nivel */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: colorSeleccionado }}
          >
            <IconoActual className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {watch('nombre') || 'Nombre del nivel'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {watch('codigo') || 'CODIGO'} • x{watch('multiplicador_puntos') || '1'} puntos
            </p>
          </div>
        </div>

        {/* Nombre y código */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nombre"
            placeholder="Ej: Bronce"
            {...register('nombre', {
              required: 'Nombre requerido',
              onChange: handleNombreChange
            })}
            error={errors.nombre?.message}
          />
          <Input
            label="Código"
            placeholder="Ej: BRONCE"
            {...register('codigo', { required: 'Código requerido' })}
            error={errors.codigo?.message}
            className="uppercase"
          />
        </div>

        {/* Selector de color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Color del nivel
          </label>
          <div className="grid grid-cols-4 gap-2">
            {COLORES_NIVEL.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setValue('color', color.value)}
                className={`flex items-center gap-2 p-2 border rounded-lg transition-all ${
                  colorSeleccionado === color.value
                    ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: color.value }}
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">{color.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selector de icono */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Icono
          </label>
          <div className="grid grid-cols-4 gap-2">
            {ICONOS_NIVEL.map((icono) => {
              const IconComponent = icono.icon;
              return (
                <button
                  key={icono.value}
                  type="button"
                  onClick={() => setValue('icono', icono.value)}
                  className={`flex flex-col items-center gap-1 p-3 border rounded-lg transition-all ${
                    iconoSeleccionado === icono.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{icono.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Puntos */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Puntos mínimos"
            type="number"
            min="0"
            placeholder="0"
            {...register('puntos_minimos', { required: 'Requerido' })}
            error={errors.puntos_minimos?.message}
          />
          <Input
            label="Puntos máximos (opcional)"
            type="number"
            min="0"
            placeholder="Sin límite"
            {...register('puntos_maximos')}
          />
        </div>

        {/* Multiplicador y orden */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Multiplicador de puntos"
            type="number"
            step="0.1"
            min="1"
            max="10"
            placeholder="1.0"
            {...register('multiplicador_puntos')}
            suffix="x"
          />
          <Input
            label="Orden"
            type="number"
            min="0"
            placeholder="0"
            {...register('orden')}
          />
        </div>

        {/* Explicación del multiplicador */}
        <div className="p-3 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700 rounded-lg">
          <p className="text-sm text-primary-800 dark:text-primary-300">
            <strong>Multiplicador:</strong> Los clientes en este nivel ganaran puntos multiplicados.
            Por ejemplo, con multiplicador 1.5, una compra de $100 otorgara 150 puntos en lugar de 100.
          </p>
        </div>

        {/* Estado activo */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('activo')}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Nivel activo
            </span>
          </label>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {esEdicion ? 'Guardar cambios' : 'Crear nivel'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

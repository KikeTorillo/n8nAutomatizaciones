import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Percent, DollarSign } from 'lucide-react';

import { Button, Drawer, FormGroup, Input, Textarea } from '@/components/ui';
import { useToast } from '@/hooks/utils';
import { useCrearCupon, useActualizarCupon } from '@/hooks/pos';

// Tipos de descuento disponibles
const TIPOS_DESCUENTO = {
  porcentaje: { label: 'Porcentaje', icon: Percent },
  monto_fijo: { label: 'Monto fijo', icon: DollarSign }
};

/**
 * Drawer para crear/editar cupones
 * Se remonta automáticamente al cambiar la prop `cupon` gracias a la key en el padre
 * Sigue el patrón de ServiciosPage.jsx para evitar bugs de formulario
 */
export default function CuponFormDrawer({ isOpen, onClose, cupon, onSuccess }) {
  const toast = useToast();
  const crearMutation = useCrearCupon();
  const actualizarMutation = useActualizarCupon();

  const esEdicion = !!cupon;

  // Inicializar formulario con valores dinámicos basados en prop `cupon`
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: esEdicion && cupon
      ? {
          codigo: cupon.codigo || '',
          nombre: cupon.nombre || '',
          descripcion: cupon.descripcion || '',
          tipo_descuento: cupon.tipo_descuento || 'porcentaje',
          valor: cupon.valor?.toString() || '',
          fecha_inicio: cupon.fecha_inicio?.split('T')[0] || '',
          fecha_fin: cupon.fecha_fin?.split('T')[0] || '',
          uso_maximo: cupon.uso_maximo?.toString() || '',
          uso_por_cliente: cupon.uso_por_cliente?.toString() || '',
          monto_minimo: cupon.monto_minimo?.toString() || '',
          activo: cupon.activo ?? true
        }
      : {
          codigo: '',
          nombre: '',
          descripcion: '',
          tipo_descuento: 'porcentaje',
          valor: '',
          fecha_inicio: new Date().toISOString().split('T')[0],
          fecha_fin: '',
          uso_maximo: '',
          uso_por_cliente: '',
          monto_minimo: '',
          activo: true
        }
  });

  const tipoSeleccionado = watch('tipo_descuento');

  // Reset cuando cambia el cupon (por si el componente no se remonta)
  useEffect(() => {
    if (esEdicion && cupon) {
      reset({
        codigo: cupon.codigo || '',
        nombre: cupon.nombre || '',
        descripcion: cupon.descripcion || '',
        tipo_descuento: cupon.tipo_descuento || 'porcentaje',
        valor: cupon.valor?.toString() || '',
        fecha_inicio: cupon.fecha_inicio?.split('T')[0] || '',
        fecha_fin: cupon.fecha_fin?.split('T')[0] || '',
        uso_maximo: cupon.uso_maximo?.toString() || '',
        uso_por_cliente: cupon.uso_por_cliente?.toString() || '',
        monto_minimo: cupon.monto_minimo?.toString() || '',
        activo: cupon.activo ?? true
      });
    } else {
      reset({
        codigo: '',
        nombre: '',
        descripcion: '',
        tipo_descuento: 'porcentaje',
        valor: '',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin: '',
        uso_maximo: '',
        uso_por_cliente: '',
        monto_minimo: '',
        activo: true
      });
    }
  }, [cupon, esEdicion, reset]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        codigo: data.codigo.trim().toUpperCase(),
        nombre: data.nombre.trim(),
        descripcion: data.descripcion?.trim() || undefined,
        tipo_descuento: data.tipo_descuento,
        valor: parseFloat(data.valor),
        fecha_inicio: data.fecha_inicio || undefined,
        fecha_fin: data.fecha_fin || undefined,
        uso_maximo: data.uso_maximo ? parseInt(data.uso_maximo) : undefined,
        uso_por_cliente: data.uso_por_cliente ? parseInt(data.uso_por_cliente) : undefined,
        monto_minimo: data.monto_minimo ? parseFloat(data.monto_minimo) : undefined,
        activo: data.activo
      };

      if (esEdicion) {
        await actualizarMutation.mutateAsync({
          id: cupon.id,
          data: payload
        });
        toast.success('Cupon actualizado');
      } else {
        await crearMutation.mutateAsync(payload);
        toast.success('Cupon creado');
      }

      onSuccess?.();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Error al guardar');
    }
  };

  const isSubmitting = crearMutation.isPending || actualizarMutation.isPending;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? 'Editar Cupon' : 'Nuevo Cupon'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
        {/* Codigo y nombre */}
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Código" error={errors.codigo?.message} required>
            <Input
              placeholder="Ej: VERANO2026"
              {...register('codigo', { required: 'Código requerido' })}
              hasError={!!errors.codigo}
              className="uppercase"
            />
          </FormGroup>
          <FormGroup label="Nombre" error={errors.nombre?.message} required>
            <Input
              placeholder="Ej: Descuento de verano"
              {...register('nombre', { required: 'Nombre requerido' })}
              hasError={!!errors.nombre}
            />
          </FormGroup>
        </div>

        {/* Descripcion */}
        <FormGroup label="Descripción (opcional)">
          <Textarea
            {...register('descripcion')}
            rows={2}
            placeholder="Descripción del cupón..."
          />
        </FormGroup>

        {/* Tipo de descuento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo de descuento
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(TIPOS_DESCUENTO).map(([key, value]) => {
              const IconComponent = value.icon;
              return (
                <label
                  key={key}
                  className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                    tipoSeleccionado === key
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    value={key}
                    {...register('tipo_descuento')}
                    className="sr-only"
                  />
                  <IconComponent className="h-4 w-4" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {value.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Valor del descuento */}
        <FormGroup
          label={tipoSeleccionado === 'porcentaje' ? 'Porcentaje de descuento' : 'Monto de descuento'}
          error={errors.valor?.message}
          required
        >
          <Input
            type="number"
            step={tipoSeleccionado === 'porcentaje' ? '1' : '0.01'}
            placeholder={tipoSeleccionado === 'porcentaje' ? '20' : '50.00'}
            {...register('valor', { required: 'Valor requerido' })}
            hasError={!!errors.valor}
            suffix={tipoSeleccionado === 'porcentaje' ? '%' : '$'}
          />
        </FormGroup>

        {/* Monto minimo */}
        <FormGroup label="Monto mínimo de compra (opcional)">
          <Input
            type="number"
            step="0.01"
            placeholder="100.00"
            {...register('monto_minimo')}
          />
        </FormGroup>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Fecha inicio (opcional)">
            <Input type="date" {...register('fecha_inicio')} />
          </FormGroup>
          <FormGroup label="Fecha fin (opcional)">
            <Input type="date" {...register('fecha_fin')} />
          </FormGroup>
        </div>

        {/* Limites de uso */}
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Uso máximo total (opcional)">
            <Input
              type="number"
              placeholder="Sin límite"
              {...register('uso_maximo')}
            />
          </FormGroup>
          <FormGroup label="Uso máximo por cliente (opcional)">
            <Input
              type="number"
              placeholder="Sin límite"
              {...register('uso_por_cliente')}
            />
          </FormGroup>
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
              Cupon activo
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
            {esEdicion ? 'Guardar cambios' : 'Crear cupon'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

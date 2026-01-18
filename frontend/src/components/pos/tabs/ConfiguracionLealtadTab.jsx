import { useForm } from 'react-hook-form';
import {
  Loader2,
  Sparkles,
  TrendingUp,
  Gift
} from 'lucide-react';
import { Button, Input, FormGroup } from '@/components/ui';
import { useToast } from '@/hooks/utils';

/**
 * Tab de Configuración del Programa de Lealtad
 * Permite configurar puntos por peso, canje, expiración, etc.
 */
export default function ConfiguracionLealtadTab({ config, isLoading, onGuardar }) {
  const toast = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      puntos_por_peso: config?.puntos_por_peso?.toString() || '1',
      puntos_por_peso_descuento: config?.puntos_por_peso_descuento?.toString() || '1',
      minimo_puntos_canje: config?.minimo_puntos_canje?.toString() || '100',
      maximo_descuento_porcentaje: config?.maximo_descuento_porcentaje?.toString() || '50',
      meses_expiracion: config?.meses_expiracion?.toString() || '12',
      puntos_expiran: config?.puntos_expiran ?? true,
      aplica_con_cupones: config?.aplica_con_cupones ?? false,
      activo: config?.activo ?? true
    },
    values: config ? {
      puntos_por_peso: config.puntos_por_peso?.toString() || '1',
      puntos_por_peso_descuento: config.puntos_por_peso_descuento?.toString() || '1',
      minimo_puntos_canje: config.minimo_puntos_canje?.toString() || '100',
      maximo_descuento_porcentaje: config.maximo_descuento_porcentaje?.toString() || '50',
      meses_expiracion: config.meses_expiracion?.toString() || '12',
      puntos_expiran: config.puntos_expiran ?? true,
      aplica_con_cupones: config.aplica_con_cupones ?? false,
      activo: config.activo ?? true
    } : undefined
  });

  const puntosExpiran = watch('puntos_expiran');
  const programaActivo = watch('activo');

  const onSubmit = async (data) => {
    try {
      await onGuardar.mutateAsync({
        puntos_por_peso: parseFloat(data.puntos_por_peso) || 1,
        puntos_por_peso_descuento: parseInt(data.puntos_por_peso_descuento) || 1,
        minimo_puntos_canje: parseInt(data.minimo_puntos_canje) || 100,
        maximo_descuento_porcentaje: parseInt(data.maximo_descuento_porcentaje) || 50,
        meses_expiracion: parseInt(data.meses_expiracion) || 12,
        puntos_expiran: data.puntos_expiran,
        aplica_con_cupones: data.aplica_con_cupones,
        activo: data.activo
      });
      toast.success('Configuración guardada');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const puntosGanados = parseFloat(watch('puntos_por_peso')) || 1;
  const puntosDescuento = parseInt(watch('puntos_por_peso_descuento')) || 1;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-6">
      {/* Estado del programa */}
      <div className={`p-4 rounded-lg border-2 ${
        programaActivo
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}>
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              programaActivo
                ? 'bg-emerald-100 dark:bg-emerald-900/40'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}>
              <Sparkles className={`h-5 w-5 ${
                programaActivo
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`} />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                Programa de Lealtad
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {programaActivo ? 'Activo - Los clientes acumulan puntos' : 'Inactivo'}
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            {...register('activo')}
            className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
        </label>
      </div>

      {/* Acumulación de puntos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary-500" />
          Acumulación de Puntos
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormGroup label="Puntos por cada $1 gastado" error={errors.puntos_por_peso?.message}>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              {...register('puntos_por_peso', { required: 'Requerido' })}
              hasError={!!errors.puntos_por_peso}
            />
          </FormGroup>
          <div className="flex items-end">
            <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg text-sm text-primary-800 dark:text-primary-300 flex-1">
              Compra de $100 = <strong>{(100 * puntosGanados).toFixed(0)} puntos</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Canje de puntos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary-500" />
          Canje de Puntos
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormGroup label="Puntos necesarios para $1 de descuento" error={errors.puntos_por_peso_descuento?.message}>
            <Input
              type="number"
              min="1"
              {...register('puntos_por_peso_descuento', { required: 'Requerido' })}
              hasError={!!errors.puntos_por_peso_descuento}
            />
          </FormGroup>
          <FormGroup label="Mínimo de puntos para canjear">
            <Input
              type="number"
              min="0"
              {...register('minimo_puntos_canje')}
            />
          </FormGroup>
          <FormGroup label="Máximo % del total como descuento">
            <Input
              type="number"
              min="1"
              max="100"
              {...register('maximo_descuento_porcentaje')}
              suffix="%"
            />
          </FormGroup>
          <div className="flex items-end">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-sm text-emerald-800 dark:text-emerald-300 flex-1">
              {puntosDescuento} puntos = <strong>$1 de descuento</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Expiración */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
          Expiración de Puntos
        </h3>
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('puntos_expiran')}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Los puntos expiran después de un tiempo
            </span>
          </label>
          {puntosExpiran && (
            <FormGroup label="Meses de vigencia" className="max-w-xs">
              <Input
                type="number"
                min="1"
                max="60"
                {...register('meses_expiracion')}
              />
            </FormGroup>
          )}
        </div>
      </div>

      {/* Opciones adicionales */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
          Opciones Adicionales
        </h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register('aplica_con_cupones')}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Acumular puntos incluso cuando se usa un cupón de descuento
          </span>
        </label>
      </div>

      {/* Botón guardar */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={onGuardar.isPending}
          className="min-w-[150px]"
        >
          {onGuardar.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Guardar configuración
        </Button>
      </div>
    </form>
  );
}

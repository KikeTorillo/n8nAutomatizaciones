import { Input } from '@/components/ui';

/**
 * Tab de información general de la promoción
 * Código, nombre, descripción, prioridad
 */
export default function PromocionFormGeneralTab({ register, errors }) {
  return (
    <div className="space-y-4">
      {/* Código y nombre */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Código"
          placeholder="PROMO2X1"
          {...register('codigo', { required: 'Código requerido' })}
          error={errors.codigo?.message}
          className="uppercase"
        />
        <Input
          label="Nombre"
          placeholder="2x1 en bebidas"
          {...register('nombre', { required: 'Nombre requerido' })}
          error={errors.nombre?.message}
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Descripción (opcional)
        </label>
        <textarea
          {...register('descripcion')}
          rows={2}
          placeholder="Descripción de la promoción para el equipo..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Prioridad */}
      <Input
        label="Prioridad"
        type="number"
        placeholder="0"
        {...register('prioridad')}
        helpText="Mayor número = mayor prioridad. Las promociones exclusivas de mayor prioridad se aplican primero."
      />
    </div>
  );
}

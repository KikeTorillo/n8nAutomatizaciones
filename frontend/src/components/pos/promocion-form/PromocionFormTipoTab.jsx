import { Package, Percent, DollarSign, Gift, Tag } from 'lucide-react';
import Input from '@/components/ui/Input';
import { TIPOS_PROMOCION } from './schemas';

/**
 * Mapeo de iconos por tipo de promoción
 */
const TIPO_ICONS = {
  porcentaje: Percent,
  monto_fijo: DollarSign,
  cantidad: Package,
  regalo: Gift,
  precio_especial: Tag,
};

/**
 * Tab de tipo y valor de la promoción
 * Tipo, valor descuento, reglas para tipo cantidad
 */
export default function PromocionFormTipoTab({ register, watch, errors }) {
  const tipoSeleccionado = watch('tipo');

  return (
    <div className="space-y-4">
      {/* Tipo de promoción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tipo de promoción
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(TIPOS_PROMOCION).map(([key, value]) => {
            const Icon = TIPO_ICONS[key] || Package;
            return (
              <label
                key={key}
                className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                  tipoSeleccionado === key
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-500'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  value={key}
                  {...register('tipo')}
                  className="sr-only"
                />
                <Icon className={`h-4 w-4 ${
                  tipoSeleccionado === key
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-500'
                }`} />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {value.label}
                </span>
              </label>
            );
          })}
        </div>
        {TIPOS_PROMOCION[tipoSeleccionado] && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {TIPOS_PROMOCION[tipoSeleccionado].description}
          </p>
        )}
      </div>

      {/* Campos según tipo */}
      {tipoSeleccionado === 'cantidad' && (
        <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Input
            label="Cantidad requerida"
            type="number"
            placeholder="2"
            {...register('reglas.cantidad_requerida')}
            error={errors.reglas?.cantidad_requerida?.message}
            helpText="Ej: Compra 2"
          />
          <Input
            label="Cantidad gratis"
            type="number"
            placeholder="1"
            {...register('reglas.cantidad_gratis')}
            error={errors.reglas?.cantidad_gratis?.message}
            helpText="Ej: Lleva 1 gratis"
          />
        </div>
      )}

      {(tipoSeleccionado === 'porcentaje' || tipoSeleccionado === 'monto_fijo') && (
        <Input
          label={tipoSeleccionado === 'porcentaje' ? 'Porcentaje de descuento' : 'Monto de descuento'}
          type="number"
          step={tipoSeleccionado === 'porcentaje' ? '1' : '0.01'}
          placeholder={tipoSeleccionado === 'porcentaje' ? '10' : '50.00'}
          {...register('valor_descuento', {
            required: 'Valor requerido'
          })}
          error={errors.valor_descuento?.message}
          suffix={tipoSeleccionado === 'porcentaje' ? '%' : '$'}
        />
      )}

      {tipoSeleccionado === 'precio_especial' && (
        <Input
          label="Precio especial"
          type="number"
          step="0.01"
          placeholder="99.00"
          {...register('valor_descuento', {
            required: 'Precio especial requerido'
          })}
          error={errors.valor_descuento?.message}
          prefix="$"
          helpText="Precio fijo que se aplicará al producto"
        />
      )}

      {/* Monto mínimo de compra - aplica a todos */}
      <Input
        label="Monto mínimo de compra (opcional)"
        type="number"
        step="0.01"
        placeholder="100.00"
        {...register('reglas.monto_minimo')}
        prefix="$"
        helpText="La promoción solo aplica si el subtotal es mayor a este monto"
      />
    </div>
  );
}

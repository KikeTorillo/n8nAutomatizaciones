import { TrendingUp } from 'lucide-react';
import { Input, Select } from '@/components/ui';

/**
 * Tab Inventario del formulario de producto
 * Solo visible al CREAR producto
 */
function ProductoFormInventarioTab({ register, errors }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
        <TrendingUp className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
        Inventario
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Input
          type="number"
          label="Stock Actual"
          {...register('stock_actual')}
          placeholder="0"
          error={errors.stock_actual?.message}
        />

        <Input
          type="number"
          label="Stock Mínimo"
          {...register('stock_minimo')}
          placeholder="5"
          error={errors.stock_minimo?.message}
        />

        <Input
          type="number"
          label="Stock Máximo"
          {...register('stock_maximo')}
          placeholder="100"
          error={errors.stock_maximo?.message}
        />

        <Select
          label="Unidad de Medida"
          {...register('unidad_medida')}
          options={[
            { value: 'unidad', label: 'Unidad' },
            { value: 'caja', label: 'Caja' },
            { value: 'paquete', label: 'Paquete' },
            { value: 'pieza', label: 'Pieza' },
            { value: 'litro', label: 'Litro' },
            { value: 'kilogramo', label: 'Kilogramo' },
            { value: 'metro', label: 'Metro' },
          ]}
          error={errors.unidad_medida?.message}
        />
      </div>
    </div>
  );
}

export default ProductoFormInventarioTab;

import { TrendingUp } from 'lucide-react';
import { FormGroup, Input, Select } from '@/components/ui';

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
        <FormGroup label="Stock Actual" error={errors.stock_actual?.message}>
          <Input
            type="number"
            {...register('stock_actual')}
            placeholder="0"
            hasError={!!errors.stock_actual}
          />
        </FormGroup>

        <FormGroup label="Stock Mínimo" error={errors.stock_minimo?.message}>
          <Input
            type="number"
            {...register('stock_minimo')}
            placeholder="5"
            hasError={!!errors.stock_minimo}
          />
        </FormGroup>

        <FormGroup label="Stock Máximo" error={errors.stock_maximo?.message}>
          <Input
            type="number"
            {...register('stock_maximo')}
            placeholder="100"
            hasError={!!errors.stock_maximo}
          />
        </FormGroup>

        <FormGroup label="Unidad de Medida" error={errors.unidad_medida?.message}>
          <Select
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
            hasError={!!errors.unidad_medida}
          />
        </FormGroup>
      </div>
    </div>
  );
}

export default ProductoFormInventarioTab;

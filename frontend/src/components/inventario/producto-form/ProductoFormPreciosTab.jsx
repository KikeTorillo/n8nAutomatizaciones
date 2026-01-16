import { DollarSign, Globe, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

/**
 * Tab Precios del formulario de producto
 * Contiene: Precios base + Precios multi-moneda
 */
function ProductoFormPreciosTab({
  register,
  errors,
  preciosMoneda,
  mostrarPreciosMoneda,
  monedasDisponibles,
  onTogglePreciosMoneda,
  onAgregarPrecioMoneda,
  onEliminarPrecioMoneda,
  onActualizarPrecioMoneda,
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
        <DollarSign className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
        Precios
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          type="number"
          label="Precio de Compra"
          {...register('precio_compra')}
          step="0.01"
          placeholder="0.00"
          prefix="$"
          error={errors.precio_compra?.message}
        />

        <Input
          type="number"
          label="Precio de Venta"
          {...register('precio_venta')}
          step="0.01"
          placeholder="0.00"
          prefix="$"
          error={errors.precio_venta?.message}
          required
        />
      </div>

      {/* Precios en otras monedas - Colapsable */}
      {monedasDisponibles.length > 0 && (
        <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={onTogglePreciosMoneda}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
          >
            <span className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <Globe className="h-4 w-4 mr-2 text-primary-600 dark:text-primary-400" />
              Precios en otras monedas
              {preciosMoneda.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full">
                  {preciosMoneda.length}
                </span>
              )}
            </span>
            {mostrarPreciosMoneda ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {mostrarPreciosMoneda && (
            <div className="p-4 space-y-4">
              {preciosMoneda.map((precio, index) => {
                const monedaInfo = monedasDisponibles.find(m => m.codigo === precio.moneda);
                const monedasUsadas = preciosMoneda.map(p => p.moneda);
                const opcionesMoneda = monedasDisponibles.filter(
                  m => m.codigo === precio.moneda || !monedasUsadas.includes(m.codigo)
                );

                return (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <Select
                        value={precio.moneda}
                        onChange={(e) => onActualizarPrecioMoneda(index, 'moneda', e.target.value)}
                        options={opcionesMoneda.map(m => ({
                          value: m.codigo,
                          label: `${m.codigo} - ${m.nombre}`
                        }))}
                        className="w-48"
                      />
                      <button
                        type="button"
                        onClick={() => onEliminarPrecioMoneda(index)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="number"
                        label="P. Compra"
                        value={precio.precio_compra}
                        onChange={(e) => onActualizarPrecioMoneda(index, 'precio_compra', e.target.value)}
                        step="0.01"
                        placeholder="0.00"
                        prefix={monedaInfo?.simbolo || '$'}
                      />
                      <Input
                        type="number"
                        label="P. Venta"
                        value={precio.precio_venta}
                        onChange={(e) => onActualizarPrecioMoneda(index, 'precio_venta', e.target.value)}
                        step="0.01"
                        placeholder="0.00"
                        prefix={monedaInfo?.simbolo || '$'}
                        required
                      />
                    </div>
                  </div>
                );
              })}

              {preciosMoneda.length < monedasDisponibles.length && (
                <button
                  type="button"
                  onClick={onAgregarPrecioMoneda}
                  className="flex items-center justify-center w-full py-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 border border-dashed border-primary-300 dark:border-primary-700 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar precio en otra moneda
                </button>
              )}

              {preciosMoneda.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                  No hay precios en otras monedas configurados.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProductoFormPreciosTab;

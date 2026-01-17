import { Tag, Layers, Truck, Plus } from 'lucide-react';
import {
  Checkbox,
  Input,
  Select,
  Textarea
} from '@/components/ui';
import { VariantesGrid } from '../variantes';

/**
 * Tab Configuración del formulario de producto
 * Contiene: Configuración avanzada, NS, Variantes, Auto-OC, Dropship
 */
function ProductoFormConfigTab({
  register,
  errors,
  esPerecedero,
  autoGenerarOC,
  tieneVariantes,
  esEdicion,
  producto,
  onMostrarModalVariantes,
}) {
  return (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
          <Tag className="h-5 w-5 mr-2 text-secondary-600 dark:text-secondary-400" />
          Configuración
        </h3>

        <div className="space-y-3">
          <Checkbox
            label="Alertar cuando llegue al stock mínimo"
            {...register('alerta_stock_minimo')}
          />

          <Checkbox
            label="Es perecedero"
            {...register('es_perecedero')}
          />

          {esPerecedero && (
            <Input
              type="number"
              label="Días de Vida Útil"
              {...register('dias_vida_util')}
              placeholder="Ej: 30"
              error={errors.dias_vida_util?.message}
            />
          )}

          <Checkbox
            label="Permitir venta directa en POS"
            {...register('permite_venta')}
          />

          <Checkbox
            label="Permitir uso en servicios"
            {...register('permite_uso_servicio')}
          />

          <Checkbox
            label="Producto activo"
            {...register('activo')}
          />

          {/* Números de serie (Dic 2025 - Fase 3 Gaps) */}
          <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
            <Checkbox
              label="Requiere número de serie / lote"
              {...register('requiere_numero_serie')}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 mt-1">
              Al recibir mercancía de este producto, se solicitarán los números de serie
            </p>
          </div>

          {/* Variantes de producto (Dic 2025) */}
          <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
            <Checkbox
              label="Este producto tiene variantes"
              {...register('tiene_variantes')}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 mt-1">
              Permite crear combinaciones (ej: Camiseta Roja M, Camiseta Azul L) con stock independiente
            </p>

            {/* Sección de gestión de variantes (solo en edición y si tiene_variantes) */}
            {esEdicion && tieneVariantes && (
              <div className="mt-4 ml-0 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                    <Layers className="h-4 w-4 mr-2 text-primary-600 dark:text-primary-400" />
                    Variantes del Producto
                  </h4>
                  <button
                    type="button"
                    onClick={onMostrarModalVariantes}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Generar Variantes
                  </button>
                </div>
                <VariantesGrid
                  productoId={producto?.id}
                  onGenerarVariantes={onMostrarModalVariantes}
                />
              </div>
            )}
          </div>

          {/* Auto-generación de OC (Dic 2025 - Fase 2 Gaps) */}
          <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
            <Checkbox
              label="Auto-generar OC cuando llegue a stock mínimo"
              {...register('auto_generar_oc')}
            />
            {autoGenerarOC && (
              <div className="mt-2 ml-6">
                <Input
                  type="number"
                  label="Cantidad sugerida para OC"
                  {...register('cantidad_oc_sugerida')}
                  placeholder="50"
                  error={errors.cantidad_oc_sugerida?.message}
                  className="max-w-xs"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Cantidad que se agregará automáticamente al crear la OC
                </p>
              </div>
            )}
          </div>

          {/* Dropshipping (Dic 2025 - Fase 1 Gaps) */}
          <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Ruta de Abastecimiento
              </span>
            </div>
            <Select
              {...register('ruta_preferida')}
              options={[
                { value: 'normal', label: 'Normal - Stock en almacén' },
                { value: 'dropship', label: 'Dropship - Proveedor envía directo al cliente' },
                { value: 'fabricar', label: 'Fabricar bajo pedido' },
              ]}
              error={errors.ruta_preferida?.message}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Dropship: Al vender este producto, se genera automáticamente una OC para que el proveedor envíe directamente al cliente final
            </p>
          </div>
        </div>

        <Textarea
          label="Notas"
          {...register('notas')}
          rows={3}
          placeholder="Notas adicionales sobre el producto"
          error={errors.notas?.message}
        />
      </div>
    </>
  );
}

export default ProductoFormConfigTab;

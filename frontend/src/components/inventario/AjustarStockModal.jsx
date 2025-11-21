import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import FieldWrapper from '@/components/forms/FieldWrapper';
import { useAjustarStock } from '@/hooks/useProductos';
import { useToast } from '@/hooks/useToast';

/**
 * Schema de validación Zod para ajuste de stock
 */
const ajustarStockSchema = z.object({
  tipo_movimiento: z.enum(['entrada_ajuste', 'salida_ajuste'], {
    required_error: 'Debes seleccionar el tipo de ajuste',
  }),
  cantidad_ajuste: z.coerce
    .number()
    .min(1, 'La cantidad debe ser mayor a 0')
    .max(10000, 'Cantidad máxima: 10,000'),
  motivo: z
    .string()
    .min(5, 'El motivo debe tener al menos 5 caracteres')
    .max(500, 'Máximo 500 caracteres'),
});

/**
 * Modal para ajustar stock manualmente
 */
function AjustarStockModal({ isOpen, onClose, producto }) {
  const { success: showSuccess, error: showError } = useToast();
  const [stockProyectado, setStockProyectado] = useState(producto?.stock_actual || 0);

  // Mutation
  const ajustarMutation = useAjustarStock();

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(ajustarStockSchema),
    defaultValues: {
      tipo_movimiento: 'entrada_ajuste',
      cantidad_ajuste: 0,
      motivo: '',
    },
  });

  // Watch para calcular stock proyectado
  const tipoMovimiento = watch('tipo_movimiento');
  const cantidadAjuste = watch('cantidad_ajuste');

  // Calcular stock proyectado
  const calcularStockProyectado = (tipo, cantidad) => {
    const cantidadNum = parseFloat(cantidad) || 0;
    if (tipo === 'entrada_ajuste') {
      return (producto?.stock_actual || 0) + cantidadNum;
    } else {
      return Math.max(0, (producto?.stock_actual || 0) - cantidadNum);
    }
  };

  // Actualizar stock proyectado cuando cambien los valores
  const stockCalculado = calcularStockProyectado(tipoMovimiento, cantidadAjuste);

  // Submit handler
  const onSubmit = (data) => {
    ajustarMutation.mutate(
      {
        id: producto.id,
        tipo_movimiento: data.tipo_movimiento,
        cantidad_ajuste: data.cantidad_ajuste,
        motivo: data.motivo,
      },
      {
        onSuccess: () => {
          showSuccess('Stock ajustado correctamente');
          reset();
          onClose();
        },
        onError: (error) => {
          showError(
            error.response?.data?.mensaje || 'Error al ajustar stock'
          );
        },
      }
    );
  };

  if (!producto) return null;

  // Determinar si el stock proyectado está en rango crítico
  const esStockCritico = stockCalculado <= producto.stock_minimo;
  const esStockAlto = stockCalculado >= producto.stock_maximo;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajustar Stock Manualmente"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información del Producto */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Producto</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Nombre:</span>
              <span className="text-sm font-medium text-gray-900">{producto.nombre}</span>
            </div>
            {producto.sku && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">SKU:</span>
                <span className="text-sm font-medium text-gray-900">{producto.sku}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Stock Actual:</span>
              <span className="text-sm font-bold text-indigo-600">
                {producto.stock_actual} {producto.unidad_medida || 'unid'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Rango:</span>
              <span className="text-sm text-gray-900">
                Min: {producto.stock_minimo} | Max: {producto.stock_maximo}
              </span>
            </div>
          </div>
        </div>

        {/* Tipo de Movimiento */}
        <FieldWrapper
          label="Tipo de Ajuste"
          error={errors.tipo_movimiento?.message}
          required
        >
          <div className="grid grid-cols-2 gap-4">
            <label
              className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                tipoMovimiento === 'entrada_ajuste'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                value="entrada_ajuste"
                {...register('tipo_movimiento')}
                className="sr-only"
              />
              <TrendingUp
                className={`h-8 w-8 mb-2 ${
                  tipoMovimiento === 'entrada_ajuste' ? 'text-green-600' : 'text-gray-400'
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  tipoMovimiento === 'entrada_ajuste' ? 'text-green-900' : 'text-gray-700'
                }`}
              >
                Entrada
              </span>
              <span className="text-xs text-gray-500 mt-1">Aumentar stock</span>
            </label>

            <label
              className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                tipoMovimiento === 'salida_ajuste'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                value="salida_ajuste"
                {...register('tipo_movimiento')}
                className="sr-only"
              />
              <TrendingDown
                className={`h-8 w-8 mb-2 ${
                  tipoMovimiento === 'salida_ajuste' ? 'text-red-600' : 'text-gray-400'
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  tipoMovimiento === 'salida_ajuste' ? 'text-red-900' : 'text-gray-700'
                }`}
              >
                Salida
              </span>
              <span className="text-xs text-gray-500 mt-1">Reducir stock</span>
            </label>
          </div>
        </FieldWrapper>

        {/* Cantidad a Ajustar */}
        <FieldWrapper
          label="Cantidad a Ajustar"
          error={errors.cantidad_ajuste?.message}
          required
          helperText={`${tipoMovimiento === 'entrada_ajuste' ? '+' : '-'}${cantidadAjuste || 0} ${
            producto.unidad_medida || 'unid'
          }`}
        >
          <input
            type="number"
            min="1"
            step="1"
            {...register('cantidad_ajuste')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Ej: 10"
          />
        </FieldWrapper>

        {/* Stock Proyectado */}
        <div
          className={`rounded-lg p-4 border-2 ${
            esStockCritico
              ? 'bg-red-50 border-red-200'
              : esStockAlto
              ? 'bg-blue-50 border-blue-200'
              : 'bg-green-50 border-green-200'
          }`}
        >
          <div className="flex items-start">
            <AlertCircle
              className={`h-5 w-5 mt-0.5 mr-3 ${
                esStockCritico
                  ? 'text-red-500'
                  : esStockAlto
                  ? 'text-blue-500'
                  : 'text-green-500'
              }`}
            />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                Stock Proyectado
              </h4>
              <div className="flex items-baseline space-x-2">
                <span className="text-sm text-gray-600">
                  {producto.stock_actual} {producto.unidad_medida || 'unid'}
                </span>
                <span
                  className={`text-lg font-bold ${
                    tipoMovimiento === 'entrada_ajuste'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {tipoMovimiento === 'entrada_ajuste' ? '+' : '-'}
                  {cantidadAjuste || 0}
                </span>
                <span className="text-sm text-gray-600">→</span>
                <span
                  className={`text-2xl font-bold ${
                    esStockCritico
                      ? 'text-red-700'
                      : esStockAlto
                      ? 'text-blue-700'
                      : 'text-green-700'
                  }`}
                >
                  {stockCalculado} {producto.unidad_medida || 'unid'}
                </span>
              </div>
              {esStockCritico && (
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ El stock quedará por debajo del mínimo ({producto.stock_minimo})
                </p>
              )}
              {esStockAlto && (
                <p className="text-sm text-blue-600 mt-2">
                  ℹ️ El stock quedará por encima del máximo ({producto.stock_maximo})
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Motivo del Ajuste */}
        <FieldWrapper
          label="Motivo del Ajuste"
          error={errors.motivo?.message}
          required
          helperText="Describe la razón de este ajuste (conteo físico, corrección, merma, etc.)"
        >
          <textarea
            {...register('motivo')}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Ej: Conteo físico de inventario mensual - diferencia encontrada en almacén"
          />
        </FieldWrapper>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={ajustarMutation.isPending}
          >
            Ajustar Stock
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default AjustarStockModal;

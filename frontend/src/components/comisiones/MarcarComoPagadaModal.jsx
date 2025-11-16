import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useMarcarComoPagada } from '@/hooks/useComisiones';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

/**
 * Schema de validación para marcar comisión como pagada
 */
const pagarComisionSchema = z.object({
  fecha_pago: z.string()
    .min(1, 'Fecha de pago es requerida')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),

  metodo_pago: z.string()
    .min(1, 'Método de pago es requerido')
    .max(50, 'Máximo 50 caracteres'),

  referencia_pago: z.string()
    .max(100, 'Máximo 100 caracteres')
    .optional(),

  notas_pago: z.string()
    .max(500, 'Máximo 500 caracteres')
    .optional(),
});

/**
 * Modal para marcar comisión como pagada
 *
 * @param {boolean} isOpen - Estado del modal
 * @param {function} onClose - Función para cerrar el modal
 * @param {object} comision - Comisión a marcar como pagada
 */
function MarcarComoPagadaModal({ isOpen, onClose, comision }) {
  const toast = useToast();
  const marcarPagadaMutation = useMarcarComoPagada();

  // React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(pagarComisionSchema),
    defaultValues: {
      fecha_pago: format(new Date(), 'yyyy-MM-dd'),
      metodo_pago: '',
      referencia_pago: '',
      notas_pago: '',
    },
  });

  // Handler de submit
  const onSubmit = async (data) => {
    try {
      await marcarPagadaMutation.mutateAsync({
        id: comision.id,
        ...data,
      });

      onClose();
      reset();
    } catch (error) {
      // El hook ya maneja el error con toast
      console.error('Error al marcar comisión como pagada:', error);
    }
  };

  // Handler de cierre
  const handleClose = () => {
    reset();
    onClose();
  };

  if (!comision) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Marcar Comisión como Pagada"
      icon={CheckCircle}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Info de la comisión */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Profesional:</p>
              <p className="font-medium text-gray-900">
                {comision.profesional_nombre} {comision.profesional_apellidos}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Cita:</p>
              <p className="font-medium text-gray-900 font-mono">{comision.codigo_cita}</p>
            </div>
            <div>
              <p className="text-gray-500">Monto Comisión:</p>
              <p className="font-semibold text-green-600 text-lg">
                {formatCurrency(parseFloat(comision.monto_comision))}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Tipo:</p>
              <p className="font-medium text-gray-900">
                {comision.tipo_comision === 'porcentaje'
                  ? `${parseFloat(comision.valor_comision)}%`
                  : 'Monto Fijo'}
              </p>
            </div>
          </div>
        </div>

        {/* Fecha de Pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Pago <span className="text-red-500">*</span>
          </label>
          <Controller
            name="fecha_pago"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="date"
                max={format(new Date(), 'yyyy-MM-dd')}
                className={errors.fecha_pago ? 'border-red-500' : ''}
              />
            )}
          />
          {errors.fecha_pago && (
            <p className="mt-1 text-sm text-red-600">{errors.fecha_pago.message}</p>
          )}
        </div>

        {/* Método de Pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Método de Pago <span className="text-red-500">*</span>
          </label>
          <Controller
            name="metodo_pago"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                className={errors.metodo_pago ? 'border-red-500' : ''}
              >
                <option value="">Selecciona un método de pago</option>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="cheque">Cheque</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="otro">Otro</option>
              </Select>
            )}
          />
          {errors.metodo_pago && (
            <p className="mt-1 text-sm text-red-600">{errors.metodo_pago.message}</p>
          )}
        </div>

        {/* Referencia de Pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Referencia de Pago
          </label>
          <p className="text-xs text-gray-500 mb-2">Opcional - Número de transacción, cheque, etc.</p>
          <Controller
            name="referencia_pago"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="text"
                placeholder="Ej: TRX-123456, Cheque #789"
                maxLength={100}
                className={errors.referencia_pago ? 'border-red-500' : ''}
              />
            )}
          />
          {errors.referencia_pago && (
            <p className="mt-1 text-sm text-red-600">{errors.referencia_pago.message}</p>
          )}
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas
          </label>
          <p className="text-xs text-gray-500 mb-2">Opcional - Máximo 500 caracteres</p>
          <Controller
            name="notas_pago"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                rows={3}
                maxLength={500}
                placeholder="Notas adicionales sobre el pago..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.notas_pago ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            )}
          />
          {errors.notas_pago && (
            <p className="mt-1 text-sm text-red-600">{errors.notas_pago.message}</p>
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Marcar como Pagada
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default MarcarComoPagadaModal;

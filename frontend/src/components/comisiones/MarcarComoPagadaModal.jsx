import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle } from 'lucide-react';
import {
  Button,
  FormGroup,
  Input,
  Modal,
  Select,
  Textarea
} from '@/components/ui';
import { useMarcarComoPagada } from '@/hooks/otros';
import { useToast } from '@/hooks/utils';
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
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Profesional:</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {comision.profesional_nombre} {comision.profesional_apellidos}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Cita:</p>
              <p className="font-medium text-gray-900 dark:text-gray-100 font-mono">{comision.codigo_cita}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Monto Comisión:</p>
              <p className="font-semibold text-green-600 dark:text-green-400 text-lg">
                {formatCurrency(parseFloat(comision.monto_comision))}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Tipo:</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {comision.tipo_comision === 'porcentaje'
                  ? `${parseFloat(comision.valor_comision)}%`
                  : 'Monto Fijo'}
              </p>
            </div>
          </div>
        </div>

        {/* Fecha de Pago */}
        <Controller
          name="fecha_pago"
          control={control}
          render={({ field }) => (
            <FormGroup label="Fecha de Pago" error={errors.fecha_pago?.message} required>
              <Input
                {...field}
                type="date"
                max={format(new Date(), 'yyyy-MM-dd')}
                hasError={!!errors.fecha_pago}
              />
            </FormGroup>
          )}
        />

        {/* Método de Pago */}
        <Controller
          name="metodo_pago"
          control={control}
          render={({ field }) => (
            <FormGroup label="Metodo de Pago" error={errors.metodo_pago?.message} required>
              <Select
                {...field}
                placeholder="Selecciona un metodo de pago"
                options={[
                  { value: 'efectivo', label: 'Efectivo' },
                  { value: 'transferencia', label: 'Transferencia' },
                  { value: 'cheque', label: 'Cheque' },
                  { value: 'tarjeta', label: 'Tarjeta' },
                  { value: 'otro', label: 'Otro' },
                ]}
                hasError={!!errors.metodo_pago}
              />
            </FormGroup>
          )}
        />

        {/* Referencia de Pago */}
        <Controller
          name="referencia_pago"
          control={control}
          render={({ field }) => (
            <FormGroup
              label="Referencia de Pago"
              error={errors.referencia_pago?.message}
              helper="Opcional - Numero de transaccion, cheque, etc."
            >
              <Input
                {...field}
                type="text"
                placeholder="Ej: TRX-123456, Cheque #789"
                maxLength={100}
                hasError={!!errors.referencia_pago}
              />
            </FormGroup>
          )}
        />

        {/* Notas */}
        <Controller
          name="notas_pago"
          control={control}
          render={({ field }) => (
            <FormGroup
              label="Notas"
              error={errors.notas_pago?.message}
              helper="Opcional - Maximo 500 caracteres"
            >
              <Textarea
                {...field}
                rows={3}
                maxLength={500}
                placeholder="Notas adicionales sobre el pago..."
                hasError={!!errors.notas_pago}
              />
            </FormGroup>
          )}
        />

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

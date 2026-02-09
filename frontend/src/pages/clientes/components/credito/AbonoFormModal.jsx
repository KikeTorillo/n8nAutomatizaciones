/**
 * ====================================================================
 * ABONO FORM MODAL - Modal para Registrar Abonos
 * ====================================================================
 *
 * Modal simple para registrar abonos a la cuenta de crédito del cliente.
 * Campos: monto, descripción
 *
 * Enero 2026
 * ====================================================================
 */

import { memo } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DollarSign, Loader2 } from 'lucide-react';
import { Modal, Button, FormGroup, Input, Textarea } from '@/components/ui';

// Schema de validación
const abonoSchema = z.object({
  monto: z
    .string()
    .min(1, 'El monto es requerido')
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val > 0, 'El monto debe ser mayor a 0')
    .refine((val) => val <= 9999999.99, 'El monto máximo es $9,999,999.99'),
  descripcion: z
    .string()
    .max(500, 'Máximo 500 caracteres')
    .optional()
    .or(z.literal(''))
    .transform((val) => val?.trim() || undefined),
});

/**
 * Modal para registrar abonos a cuenta del cliente
 */
const AbonoFormModal = memo(function AbonoFormModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  saldoPendiente = 0,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(abonoSchema),
    defaultValues: {
      monto: '',
      descripcion: '',
    },
  });

  const handleFormSubmit = async (data) => {
    await onSubmit(data);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Formatear saldo pendiente
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Registrar Abono"
      subtitle="Registra un pago a la cuenta del cliente"
      disableClose={isLoading}
      size="sm"
      footer={
        <>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit(handleFormSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4 mr-2" />
                Registrar Abono
              </>
            )}
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        {/* Info de saldo pendiente */}
        {saldoPendiente > 0 && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Saldo pendiente: <strong>{formatCurrency(saldoPendiente)}</strong>
            </p>
          </div>
        )}

        {/* Monto */}
        <FormGroup
          label="Monto del Abono"
          error={errors.monto?.message}
          required
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
              $
            </span>
            <Input
              {...register('monto')}
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              hasError={!!errors.monto}
              className="pl-7"
            />
          </div>
        </FormGroup>

        {/* Descripción */}
        <FormGroup
          label="Descripción"
          error={errors.descripcion?.message}
          helper="Opcional. Ej: Pago en efectivo, Transferencia, etc."
        >
          <Textarea
            {...register('descripcion')}
            rows={3}
            placeholder="Descripción del abono..."
            hasError={!!errors.descripcion}
          />
        </FormGroup>
      </form>
    </Modal>
  );
});

AbonoFormModal.displayName = 'AbonoFormModal';

AbonoFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  saldoPendiente: PropTypes.number,
};

export default AbonoFormModal;

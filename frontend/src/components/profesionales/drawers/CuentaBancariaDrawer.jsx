/**
 * ====================================================================
 * CuentaBancariaDrawer - Drawer para crear/editar cuenta bancaria
 * ====================================================================
 *
 * Migrado a React Hook Form + Zod - Enero 2026
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Drawer,
  Input,
  Select
} from '@/components/ui';
import { Loader2, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
  useCrearCuentaBancaria,
  useActualizarCuentaBancaria,
  TIPOS_CUENTA_BANCARIA,
  USOS_CUENTA_BANCARIA,
  MONEDAS_CUENTA,
} from '@/hooks/useCuentasBancarias';
import { cuentaBancariaSchema } from '@/schemas/profesionales.schemas';

// ====================================================================
// DEFAULT VALUES
// ====================================================================

const DEFAULT_VALUES = {
  banco: '',
  numero_cuenta: '',
  clabe: '',
  tipo_cuenta: 'debito',
  moneda: 'MXN',
  titular_nombre: '',
  titular_documento: '',
  es_principal: false,
  uso: 'nomina',
};

// ====================================================================
// COMPONENTE
// ====================================================================

export default function CuentaBancariaDrawer({
  isOpen,
  onClose,
  profesionalId,
  cuenta = null,
  onSuccess,
}) {
  const toast = useToast();
  const isEditing = !!cuenta;

  // Mutations
  const crearMutation = useCrearCuentaBancaria();
  const actualizarMutation = useActualizarCuentaBancaria();
  const isLoading = crearMutation.isPending || actualizarMutation.isPending;

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(cuentaBancariaSchema),
    defaultValues: DEFAULT_VALUES,
  });

  // Reset form cuando cambia isOpen o cuenta
  useEffect(() => {
    if (isOpen) {
      if (isEditing && cuenta) {
        reset({
          banco: cuenta.banco || '',
          numero_cuenta: cuenta.numero_cuenta || '',
          clabe: cuenta.clabe || '',
          tipo_cuenta: cuenta.tipo_cuenta || 'debito',
          moneda: cuenta.moneda || 'MXN',
          titular_nombre: cuenta.titular_nombre || '',
          titular_documento: cuenta.titular_documento || '',
          es_principal: cuenta.es_principal || false,
          uso: cuenta.uso || 'nomina',
        });
      } else {
        reset(DEFAULT_VALUES);
      }
    }
  }, [isOpen, isEditing, cuenta, reset]);

  // Submit handler
  const onSubmit = async (data) => {
    // Preparar datos (los transforms de Zod ya limpian los valores)
    const dataToSend = {
      banco: data.banco,
      numero_cuenta: data.numero_cuenta,
      clabe: data.clabe || null,
      tipo_cuenta: data.tipo_cuenta,
      moneda: data.moneda,
      titular_nombre: data.titular_nombre || null,
      titular_documento: data.titular_documento || null,
      es_principal: data.es_principal,
      uso: data.uso,
    };

    try {
      if (isEditing) {
        await actualizarMutation.mutateAsync({
          profesionalId,
          cuentaId: cuenta.id,
          data: dataToSend,
        });
        toast.success('Cuenta bancaria actualizada');
      } else {
        await crearMutation.mutateAsync({
          profesionalId,
          data: dataToSend,
        });
        toast.success('Cuenta bancaria creada');
      }

      onSuccess?.();
      handleClose();
    } catch (err) {
      toast.error(err.message || 'Error al guardar cuenta bancaria');
    }
  };

  const handleClose = () => {
    reset(DEFAULT_VALUES);
    onClose();
  };

  // Opciones para selects
  const tipoOptions = Object.values(TIPOS_CUENTA_BANCARIA);
  const usoOptions = Object.values(USOS_CUENTA_BANCARIA);
  const monedaOptions = Object.values(MONEDAS_CUENTA);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
      subtitle="Informacion para depositos y pagos"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Banco y Numero de cuenta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Banco *"
            placeholder="Ej: BBVA, Santander..."
            error={errors.banco?.message}
            {...register('banco')}
          />
          <Input
            label="Numero de Cuenta *"
            placeholder="Numero de cuenta"
            error={errors.numero_cuenta?.message}
            {...register('numero_cuenta')}
          />
        </div>

        {/* CLABE */}
        <Input
          label="CLABE Interbancaria"
          placeholder="18 digitos"
          maxLength={18}
          helperText="Requerida para transferencias SPEI"
          error={errors.clabe?.message}
          {...register('clabe', {
            onChange: (e) => {
              // Auto-limpiar caracteres no numericos
              const cleaned = e.target.value.replace(/\D/g, '').slice(0, 18);
              setValue('clabe', cleaned, { shouldValidate: false });
            },
          })}
        />

        {/* Tipo, Uso, Moneda */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Tipo de Cuenta"
            options={tipoOptions}
            error={errors.tipo_cuenta?.message}
            {...register('tipo_cuenta')}
          />
          <Select
            label="Uso"
            options={usoOptions}
            error={errors.uso?.message}
            {...register('uso')}
          />
          <Select
            label="Moneda"
            options={monedaOptions}
            error={errors.moneda?.message}
            {...register('moneda')}
          />
        </div>

        {/* Titular */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre del Titular"
            placeholder="Si difiere del empleado"
            error={errors.titular_nombre?.message}
            {...register('titular_nombre')}
          />
          <Input
            label="Documento del Titular"
            placeholder="INE, CURP..."
            error={errors.titular_documento?.message}
            {...register('titular_documento')}
          />
        </div>

        {/* Checkbox cuenta principal */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            {...register('es_principal')}
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Establecer como cuenta principal para nomina
          </span>
        </label>

        {/* Footer con botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                {isEditing ? 'Actualizar' : 'Guardar'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

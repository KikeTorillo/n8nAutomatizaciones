/**
 * CuentaBancariaModal - Modal para crear/editar cuenta bancaria
 * Fase 1 del Plan de Empleados Competitivo - Enero 2026
 */
import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Loader2, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
  useCrearCuentaBancaria,
  useActualizarCuentaBancaria,
  TIPOS_CUENTA_BANCARIA,
  USOS_CUENTA_BANCARIA,
  MONEDAS_CUENTA
} from '@/hooks/useCuentasBancarias';

const INITIAL_FORM_DATA = {
  banco: '',
  numero_cuenta: '',
  clabe: '',
  tipo_cuenta: 'debito',
  moneda: 'MXN',
  titular_nombre: '',
  titular_documento: '',
  es_principal: false,
  uso: 'nomina'
};

export default function CuentaBancariaModal({
  isOpen,
  onClose,
  profesionalId,
  cuenta = null,
  onSuccess
}) {
  const toast = useToast();
  const isEditing = !!cuenta;

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});

  const crearMutation = useCrearCuentaBancaria();
  const actualizarMutation = useActualizarCuentaBancaria();

  const isLoading = crearMutation.isPending || actualizarMutation.isPending;

  // Cargar datos de cuenta al editar
  useEffect(() => {
    if (isOpen && cuenta) {
      setFormData({
        banco: cuenta.banco || '',
        numero_cuenta: cuenta.numero_cuenta || '',
        clabe: cuenta.clabe || '',
        tipo_cuenta: cuenta.tipo_cuenta || 'debito',
        moneda: cuenta.moneda || 'MXN',
        titular_nombre: cuenta.titular_nombre || '',
        titular_documento: cuenta.titular_documento || '',
        es_principal: cuenta.es_principal || false,
        uso: cuenta.uso || 'nomina'
      });
    } else if (isOpen && !cuenta) {
      setFormData(INITIAL_FORM_DATA);
    }
  }, [isOpen, cuenta]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.banco?.trim()) {
      newErrors.banco = 'El nombre del banco es requerido';
    } else if (formData.banco.trim().length < 2) {
      newErrors.banco = 'El nombre del banco debe tener al menos 2 caracteres';
    }

    if (!formData.numero_cuenta?.trim()) {
      newErrors.numero_cuenta = 'El número de cuenta es requerido';
    }

    if (formData.clabe && formData.clabe.length !== 18) {
      newErrors.clabe = 'La CLABE debe tener exactamente 18 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const dataToSend = {
      banco: formData.banco.trim(),
      numero_cuenta: formData.numero_cuenta.trim(),
      clabe: formData.clabe?.trim() || null,
      tipo_cuenta: formData.tipo_cuenta,
      moneda: formData.moneda,
      titular_nombre: formData.titular_nombre?.trim() || null,
      titular_documento: formData.titular_documento?.trim() || null,
      es_principal: formData.es_principal,
      uso: formData.uso
    };

    try {
      if (isEditing) {
        await actualizarMutation.mutateAsync({
          profesionalId,
          cuentaId: cuenta.id,
          data: dataToSend
        });
        toast.success('Cuenta bancaria actualizada');
      } else {
        await crearMutation.mutateAsync({
          profesionalId,
          data: dataToSend
        });
        toast.success('Cuenta bancaria creada');
      }

      resetForm();
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error al guardar cuenta bancaria');
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const tipoOptions = Object.values(TIPOS_CUENTA_BANCARIA);
  const usoOptions = Object.values(USOS_CUENTA_BANCARIA);
  const monedaOptions = Object.values(MONEDAS_CUENTA);

  const footer = (
    <div className="flex justify-end gap-3">
      <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button onClick={handleSubmit} disabled={isLoading}>
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
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
      size="md"
      footer={footer}
      disableClose={isLoading}
    >
      <div className="space-y-4">
        {/* Banco y Número de cuenta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Banco *"
            value={formData.banco}
            onChange={(e) => handleInputChange('banco', e.target.value)}
            placeholder="Ej: BBVA, Santander..."
            error={errors.banco}
          />
          <Input
            label="Número de Cuenta *"
            value={formData.numero_cuenta}
            onChange={(e) => handleInputChange('numero_cuenta', e.target.value)}
            placeholder="Número de cuenta"
            error={errors.numero_cuenta}
          />
        </div>

        {/* CLABE */}
        <Input
          label="CLABE Interbancaria"
          value={formData.clabe}
          onChange={(e) => handleInputChange('clabe', e.target.value.replace(/\D/g, '').slice(0, 18))}
          placeholder="18 dígitos"
          maxLength={18}
          helperText="Requerida para transferencias SPEI"
          error={errors.clabe}
        />

        {/* Tipo, Uso, Moneda */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Tipo de Cuenta"
            value={formData.tipo_cuenta}
            onChange={(e) => handleInputChange('tipo_cuenta', e.target.value)}
            options={tipoOptions}
          />
          <Select
            label="Uso"
            value={formData.uso}
            onChange={(e) => handleInputChange('uso', e.target.value)}
            options={usoOptions}
          />
          <Select
            label="Moneda"
            value={formData.moneda}
            onChange={(e) => handleInputChange('moneda', e.target.value)}
            options={monedaOptions}
          />
        </div>

        {/* Titular */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre del Titular"
            value={formData.titular_nombre}
            onChange={(e) => handleInputChange('titular_nombre', e.target.value)}
            placeholder="Si difiere del empleado"
          />
          <Input
            label="Documento del Titular"
            value={formData.titular_documento}
            onChange={(e) => handleInputChange('titular_documento', e.target.value)}
            placeholder="INE, CURP..."
          />
        </div>

        {/* Checkbox cuenta principal */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.es_principal}
            onChange={(e) => handleInputChange('es_principal', e.target.checked)}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Establecer como cuenta principal para nómina
          </span>
        </label>
      </div>
    </Modal>
  );
}

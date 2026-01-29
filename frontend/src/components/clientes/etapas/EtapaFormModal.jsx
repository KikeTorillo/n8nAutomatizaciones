/**
 * ====================================================================
 * ETAPA FORM MODAL - Modal para Crear/Editar Etapas
 * ====================================================================
 *
 * Modal para crear o editar etapas del pipeline:
 * - nombre (string, requerido)
 * - descripcion (string, opcional)
 * - color (color picker con presets)
 * - probabilidad_default (0-100)
 * - es_ganada (checkbox, exclusivo con es_perdida)
 * - es_perdida (checkbox, exclusivo con es_ganada)
 *
 * Enero 2026
 * ====================================================================
 */

import { memo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save, Trophy, XCircle } from 'lucide-react';
import { Modal, Button, FormGroup, Input, Textarea, Checkbox } from '@/components/ui';

// Colores predefinidos para las etapas
const PRESET_COLORS = [
  { value: '#3B82F6', label: 'Azul' },
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Amarillo' },
  { value: '#EF4444', label: 'Rojo' },
  { value: '#8B5CF6', label: 'Violeta' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#F97316', label: 'Naranja' },
  { value: '#6B7280', label: 'Gris' },
  { value: '#753572', label: 'Primario' },
];

// Schema de validación
const etapaSchema = z
  .object({
    nombre: z
      .string()
      .min(1, 'El nombre es requerido')
      .max(100, 'Máximo 100 caracteres'),
    descripcion: z
      .string()
      .max(500, 'Máximo 500 caracteres')
      .optional()
      .or(z.literal(''))
      .transform((val) => val?.trim() || undefined),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido')
      .default('#6B7280'),
    probabilidad_default: z
      .string()
      .transform((val) => (val ? parseInt(val, 10) : 0))
      .refine((val) => val >= 0 && val <= 100, 'Debe ser entre 0 y 100'),
    es_ganada: z.boolean().default(false),
    es_perdida: z.boolean().default(false),
  })
  .refine((data) => !(data.es_ganada && data.es_perdida), {
    message: 'Una etapa no puede ser "Ganada" y "Perdida" al mismo tiempo',
    path: ['es_ganada'],
  });

/**
 * Modal para crear/editar etapa del pipeline
 */
const EtapaFormModal = memo(function EtapaFormModal({
  isOpen,
  onClose,
  onSubmit,
  etapa = null,
  isLoading = false,
}) {
  const isEditing = !!etapa;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(etapaSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      color: '#6B7280',
      probabilidad_default: '50',
      es_ganada: false,
      es_perdida: false,
    },
  });

  // Watch para checkboxes exclusivos
  const esGanada = watch('es_ganada');
  const esPerdida = watch('es_perdida');
  const colorActual = watch('color');

  // Reset form cuando cambia la etapa
  useEffect(() => {
    if (isOpen) {
      if (etapa) {
        reset({
          nombre: etapa.nombre || '',
          descripcion: etapa.descripcion || '',
          color: etapa.color || '#6B7280',
          probabilidad_default: (etapa.probabilidad_default ?? 50).toString(),
          es_ganada: etapa.es_ganada || false,
          es_perdida: etapa.es_perdida || false,
        });
      } else {
        reset({
          nombre: '',
          descripcion: '',
          color: '#6B7280',
          probabilidad_default: '50',
          es_ganada: false,
          es_perdida: false,
        });
      }
    }
  }, [isOpen, etapa, reset]);

  // Manejar exclusividad de checkboxes
  const handleEsGanadaChange = (checked) => {
    setValue('es_ganada', checked);
    if (checked) {
      setValue('es_perdida', false);
      setValue('probabilidad_default', '100');
    }
  };

  const handleEsPerdidaChange = (checked) => {
    setValue('es_perdida', checked);
    if (checked) {
      setValue('es_ganada', false);
      setValue('probabilidad_default', '0');
    }
  };

  const handleFormSubmit = async (data) => {
    await onSubmit({
      ...data,
      probabilidad_default: parseInt(data.probabilidad_default, 10),
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Etapa' : 'Nueva Etapa'}
      subtitle="Configura los detalles de la etapa del pipeline"
      disableClose={isLoading}
      size="md"
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
                {isEditing ? 'Guardando...' : 'Creando...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Guardar Cambios' : 'Crear Etapa'}
              </>
            )}
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        {/* Nombre */}
        <FormGroup
          label="Nombre de la Etapa"
          error={errors.nombre?.message}
          required
        >
          <Input
            {...register('nombre')}
            placeholder="Ej: Prospecto, Negociación, Cierre..."
            hasError={!!errors.nombre}
          />
        </FormGroup>

        {/* Descripción */}
        <FormGroup
          label="Descripción"
          error={errors.descripcion?.message}
          helper="Opcional. Describe qué significa esta etapa."
        >
          <Textarea
            {...register('descripcion')}
            rows={2}
            placeholder="Descripción de la etapa..."
            hasError={!!errors.descripcion}
          />
        </FormGroup>

        {/* Color */}
        <FormGroup
          label="Color"
          error={errors.color?.message}
        >
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setValue('color', preset.value)}
                className={`
                  w-8 h-8 rounded-full border-2 transition-all
                  ${colorActual === preset.value
                    ? 'border-gray-900 dark:border-white scale-110 ring-2 ring-offset-2 ring-primary-500'
                    : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                  }
                `}
                style={{ backgroundColor: preset.value }}
                title={preset.label}
              />
            ))}
            {/* Input de color personalizado */}
            <label className="relative w-8 h-8">
              <input
                type="color"
                {...register('color')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className="w-8 h-8 rounded-full border-2 border-dashed border-gray-400 dark:border-gray-500 flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs"
                style={{
                  background: !PRESET_COLORS.find((p) => p.value === colorActual)
                    ? colorActual
                    : undefined,
                }}
                title="Color personalizado"
              >
                {PRESET_COLORS.find((p) => p.value === colorActual) ? '+' : ''}
              </div>
            </label>
          </div>
        </FormGroup>

        {/* Probabilidad */}
        <FormGroup
          label="Probabilidad por Defecto"
          error={errors.probabilidad_default?.message}
          helper="Probabilidad de cierre cuando una oportunidad entra a esta etapa (0-100%)"
        >
          <div className="flex items-center gap-3">
            <Input
              {...register('probabilidad_default')}
              type="number"
              min="0"
              max="100"
              className="w-24"
              hasError={!!errors.probabilidad_default}
            />
            <span className="text-gray-500 dark:text-gray-400">%</span>
          </div>
        </FormGroup>

        {/* Etapa especial: Ganada / Perdida */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Tipo de Etapa Final
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Marca si esta etapa representa el cierre exitoso o fallido del pipeline.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Controller
              name="es_ganada"
              control={control}
              render={({ field }) => (
                <label
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                    ${field.value
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }
                  `}
                >
                  <Checkbox
                    checked={field.value}
                    onChange={(e) => handleEsGanadaChange(e.target.checked)}
                  />
                  <Trophy className={`w-5 h-5 ${field.value ? 'text-green-500' : 'text-gray-400'}`} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Etapa Ganada
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Oportunidad cerrada exitosamente
                    </p>
                  </div>
                </label>
              )}
            />

            <Controller
              name="es_perdida"
              control={control}
              render={({ field }) => (
                <label
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                    ${field.value
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }
                  `}
                >
                  <Checkbox
                    checked={field.value}
                    onChange={(e) => handleEsPerdidaChange(e.target.checked)}
                  />
                  <XCircle className={`w-5 h-5 ${field.value ? 'text-red-500' : 'text-gray-400'}`} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Etapa Perdida
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Oportunidad descartada
                    </p>
                  </div>
                </label>
              )}
            />
          </div>

          {errors.es_ganada && (
            <p className="text-sm text-red-500">{errors.es_ganada.message}</p>
          )}
        </div>
      </form>
    </Modal>
  );
});

EtapaFormModal.displayName = 'EtapaFormModal';

EtapaFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  etapa: PropTypes.shape({
    id: PropTypes.number,
    nombre: PropTypes.string,
    descripcion: PropTypes.string,
    color: PropTypes.string,
    probabilidad_default: PropTypes.number,
    es_ganada: PropTypes.bool,
    es_perdida: PropTypes.bool,
  }),
  isLoading: PropTypes.bool,
};

export default EtapaFormModal;

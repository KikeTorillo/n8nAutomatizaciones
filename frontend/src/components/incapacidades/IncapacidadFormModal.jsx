/**
 * IncapacidadFormModal - Modal para registrar incapacidades
 * Módulo de Profesionales - Enero 2026
 */
import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  HeartPulse,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Upload,
  Info,
} from 'lucide-react';
import {
  Button,
  FormGroup,
  Input,
  Modal,
  Select
} from '@/components/ui';
import { useProfesionales } from '@/hooks/personas';
import {
  useCrearIncapacidad,
  TIPOS_INCAPACIDAD_CONFIG,
} from '@/hooks/personas';

// Schema de validación
const incapacidadSchema = z.object({
  profesional_id: z.string().min(1, 'El profesional es requerido'),
  tipo_incapacidad: z.string().min(1, 'El tipo de incapacidad es requerido'),
  folio_imss: z.string()
    .min(1, 'El folio IMSS es requerido')
    .max(50, 'El folio no puede exceder 50 caracteres'),
  fecha_inicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fecha_fin: z.string().min(1, 'La fecha de fin es requerida'),
  dias_autorizados: z.coerce.number()
    .min(1, 'Debe ser al menos 1 día')
    .max(365, 'No puede exceder 365 días'),
  diagnostico: z.string().max(500, 'El diagnóstico no puede exceder 500 caracteres').optional(),
  notas: z.string().max(1000, 'Las notas no pueden exceder 1000 caracteres').optional(),
}).refine((data) => {
  const inicio = new Date(data.fecha_inicio);
  const fin = new Date(data.fecha_fin);
  return inicio <= fin;
}, {
  message: 'La fecha de fin debe ser igual o posterior a la fecha de inicio',
  path: ['fecha_fin'],
});

/**
 * Info card para tipo de incapacidad
 */
function TipoIncapacidadInfo({ tipo }) {
  const config = TIPOS_INCAPACIDAD_CONFIG[tipo];
  if (!config) return null;

  return (
    <div className={`rounded-lg p-4 ${config.bgColor}`}>
      <h4 className={`font-medium ${config.textColor} mb-2`}>
        {config.label}
      </h4>
      <p className={`text-sm ${config.textColor} opacity-80 mb-2`}>
        {config.descripcion}
      </p>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className={config.textColor}>
          <span className="opacity-70">Pago IMSS:</span>{' '}
          <strong>{config.porcentajePago}%</strong>
        </div>
        <div className={config.textColor}>
          <span className="opacity-70">Inicia día:</span>{' '}
          <strong>{config.diaInicioPago}</strong>
        </div>
        {config.maxSemanas && (
          <div className={config.textColor}>
            <span className="opacity-70">Máximo:</span>{' '}
            <strong>{config.maxSemanas} semanas</strong>
          </div>
        )}
        {config.diasFijos && (
          <div className={config.textColor}>
            <span className="opacity-70">Duración fija:</span>{' '}
            <strong>{config.diasFijos} días</strong>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Modal para registrar una nueva incapacidad
 */
function IncapacidadFormModal({ isOpen, onClose, profesionalInicial = null }) {
  const crearMutation = useCrearIncapacidad();
  const [diasCalculados, setDiasCalculados] = useState(0);

  // Obtener profesionales activos
  const { data: profesionalesData, isLoading: isLoadingProfesionales } = useProfesionales({
    activo: true,
  });
  const profesionales = profesionalesData?.profesionales || [];

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(incapacidadSchema),
    defaultValues: {
      profesional_id: profesionalInicial?.toString() || '',
      tipo_incapacidad: '',
      folio_imss: '',
      fecha_inicio: '',
      fecha_fin: '',
      dias_autorizados: '',
      diagnostico: '',
      notas: '',
    },
  });

  const fechaInicio = watch('fecha_inicio');
  const fechaFin = watch('fecha_fin');
  const tipoIncapacidad = watch('tipo_incapacidad');

  // Calcular días automáticamente
  useEffect(() => {
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      const diffTime = fin.getTime() - inicio.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 0) {
        setDiasCalculados(diffDays);
        setValue('dias_autorizados', diffDays);
      }
    }
  }, [fechaInicio, fechaFin, setValue]);

  // Auto-ajustar días para maternidad
  useEffect(() => {
    if (tipoIncapacidad === 'maternidad' && fechaInicio) {
      const config = TIPOS_INCAPACIDAD_CONFIG.maternidad;
      const inicio = new Date(fechaInicio);
      const fin = new Date(inicio);
      fin.setDate(fin.getDate() + config.diasFijos - 1);
      setValue('fecha_fin', fin.toISOString().split('T')[0]);
      setValue('dias_autorizados', config.diasFijos);
    }
  }, [tipoIncapacidad, fechaInicio, setValue]);

  // Reset al cerrar o abrir
  useEffect(() => {
    if (isOpen) {
      reset({
        profesional_id: profesionalInicial?.toString() || '',
        tipo_incapacidad: '',
        folio_imss: '',
        fecha_inicio: '',
        fecha_fin: '',
        dias_autorizados: '',
        diagnostico: '',
        notas: '',
      });
      setDiasCalculados(0);
    }
  }, [isOpen, profesionalInicial, reset]);

  const onSubmit = async (data) => {
    try {
      await crearMutation.mutateAsync({
        profesional_id: parseInt(data.profesional_id),
        tipo_incapacidad: data.tipo_incapacidad,
        folio_imss: data.folio_imss,
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        dias_autorizados: data.dias_autorizados,
        diagnostico: data.diagnostico || undefined,
        notas: data.notas || undefined,
      });
      onClose();
    } catch (error) {
      // Error manejado por el hook
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Opciones de profesionales
  const opcionesProfesionales = useMemo(() => {
    return profesionales.map((prof) => ({
      value: prof.id.toString(),
      label: prof.nombre_completo || `${prof.nombres} ${prof.apellidos}`,
    }));
  }, [profesionales]);

  // Opciones de tipos
  const opcionesTipos = Object.entries(TIPOS_INCAPACIDAD_CONFIG).map(([key, config]) => ({
    value: key,
    label: config.label,
  }));

  // Fecha de hoy
  const hoy = new Date().toISOString().split('T')[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Registrar Incapacidad"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información importante */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">Incapacidades IMSS</p>
              <p className="text-amber-700 dark:text-amber-300">
                Las incapacidades generan un bloqueo automático en el calendario del profesional.
                El estado del profesional cambiará a &quot;Incapacidad&quot; mientras esté vigente.
              </p>
            </div>
          </div>
        </div>

        {/* Profesional */}
        <FormGroup
          label="Profesional"
          required
          error={errors.profesional_id?.message}
        >
          <Controller
            name="profesional_id"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={opcionesProfesionales}
                placeholder="Selecciona un profesional"
                disabled={isLoadingProfesionales || !!profesionalInicial}
                hasError={!!errors.profesional_id}
              />
            )}
          />
        </FormGroup>

        {/* Tipo de incapacidad */}
        <div className="space-y-3">
          <FormGroup
            label="Tipo de Incapacidad"
            required
            error={errors.tipo_incapacidad?.message}
          >
            <Controller
              name="tipo_incapacidad"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={opcionesTipos}
                  placeholder="Selecciona el tipo"
                  hasError={!!errors.tipo_incapacidad}
                />
              )}
            />
          </FormGroup>

          {/* Info del tipo seleccionado */}
          {tipoIncapacidad && (
            <TipoIncapacidadInfo tipo={tipoIncapacidad} />
          )}
        </div>

        {/* Folio IMSS */}
        <FormGroup
          label="Folio IMSS"
          required
          error={errors.folio_imss?.message}
          helper="Numero de folio asignado por el IMSS"
        >
          <Input
            {...register('folio_imss')}
            placeholder="Ej: ABC123456"
            hasError={!!errors.folio_imss}
          />
        </FormGroup>

        {/* Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormGroup
            label="Fecha de inicio"
            required
            error={errors.fecha_inicio?.message}
          >
            <Input
              type="date"
              {...register('fecha_inicio')}
              hasError={!!errors.fecha_inicio}
            />
          </FormGroup>

          <FormGroup
            label="Fecha de fin"
            required
            error={errors.fecha_fin?.message}
            helper={tipoIncapacidad === 'maternidad' ? 'Calculada automaticamente (84 dias)' : undefined}
          >
            <Input
              type="date"
              {...register('fecha_fin')}
              min={fechaInicio || undefined}
              disabled={tipoIncapacidad === 'maternidad'}
              hasError={!!errors.fecha_fin}
            />
          </FormGroup>
        </div>

        {/* Días autorizados */}
        <FormGroup
          label="Dias autorizados"
          required
          error={errors.dias_autorizados?.message}
          helper={diasCalculados > 0 ? `Calculado: ${diasCalculados} dias segun las fechas` : undefined}
        >
          <Input
            type="number"
            {...register('dias_autorizados')}
            min={1}
            max={365}
            hasError={!!errors.dias_autorizados}
          />
        </FormGroup>

        {/* Diagnóstico */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Diagnóstico (opcional)
          </label>
          <textarea
            {...register('diagnostico')}
            rows={2}
            placeholder="Descripción del diagnóstico médico..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                     placeholder-gray-400 dark:placeholder-gray-500"
          />
          {errors.diagnostico && (
            <p className="mt-1 text-sm text-red-500">{errors.diagnostico.message}</p>
          )}
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notas internas (opcional)
          </label>
          <textarea
            {...register('notas')}
            rows={2}
            placeholder="Observaciones adicionales..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                     placeholder-gray-400 dark:placeholder-gray-500"
          />
          {errors.notas && (
            <p className="mt-1 text-sm text-red-500">{errors.notas.message}</p>
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || crearMutation.isPending}
            loading={isSubmitting || crearMutation.isPending}
          >
            <HeartPulse className="h-4 w-4 mr-2" />
            Registrar Incapacidad
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default IncapacidadFormModal;

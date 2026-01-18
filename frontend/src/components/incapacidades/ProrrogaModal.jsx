/**
 * ProrrogaModal - Modal para crear prórroga de incapacidad
 * Módulo de Profesionales - Enero 2026
 */
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowUpRight,
  Calendar,
  FileText,
  Info,
} from 'lucide-react';
import { Button, Drawer, FormGroup, Input } from '@/components/ui';
import {
  useCrearProrroga,
  getTipoIncapacidadConfig,
} from '@/hooks/personas';

// Schema de validación para prórroga
const prorrogaSchema = z.object({
  folio_imss: z.string()
    .min(1, 'El folio IMSS es requerido')
    .max(50, 'El folio no puede exceder 50 caracteres'),
  fecha_inicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fecha_fin: z.string().min(1, 'La fecha de fin es requerida'),
  dias_autorizados: z.coerce.number()
    .min(1, 'Debe ser al menos 1 día')
    .max(365, 'No puede exceder 365 días'),
  diagnostico: z.string().max(500).optional(),
  notas: z.string().max(1000).optional(),
}).refine((data) => {
  const inicio = new Date(data.fecha_inicio);
  const fin = new Date(data.fecha_fin);
  return inicio <= fin;
}, {
  message: 'La fecha de fin debe ser igual o posterior a la fecha de inicio',
  path: ['fecha_fin'],
});

/**
 * Formatea fecha
 */
function formatFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Modal para crear prórroga de una incapacidad existente
 */
function ProrrogaModal({ isOpen, onClose, incapacidadOrigen }) {
  const crearProrrogaMutation = useCrearProrroga();
  const [diasCalculados, setDiasCalculados] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(prorrogaSchema),
    defaultValues: {
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

  // Reset y pre-llenar al abrir
  useEffect(() => {
    if (isOpen && incapacidadOrigen) {
      // La prórroga inicia el día después de que termine la incapacidad original
      const fechaFinOrigen = new Date(incapacidadOrigen.fecha_fin);
      const nuevaFechaInicio = new Date(fechaFinOrigen);
      nuevaFechaInicio.setDate(nuevaFechaInicio.getDate() + 1);

      reset({
        folio_imss: '',
        fecha_inicio: nuevaFechaInicio.toISOString().split('T')[0],
        fecha_fin: '',
        dias_autorizados: '',
        diagnostico: incapacidadOrigen.diagnostico || '',
        notas: '',
      });
      setDiasCalculados(0);
    }
  }, [isOpen, incapacidadOrigen, reset]);

  const onSubmit = async (data) => {
    if (!incapacidadOrigen) return;

    try {
      await crearProrrogaMutation.mutateAsync({
        id: incapacidadOrigen.id,
        data: {
          folio_imss: data.folio_imss,
          fecha_inicio: data.fecha_inicio,
          fecha_fin: data.fecha_fin,
          dias_autorizados: data.dias_autorizados,
          diagnostico: data.diagnostico || undefined,
          notas: data.notas || undefined,
        },
      });
      onClose();
    } catch (error) {
      // Error manejado por hook
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!incapacidadOrigen) return null;

  const tipoConfig = getTipoIncapacidadConfig(incapacidadOrigen.tipo_incapacidad);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title="Crear Prórroga"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Info de la incapacidad origen */}
        <div className={`rounded-lg p-4 ${tipoConfig.bgColor}`}>
          <div className="flex items-start gap-3">
            <ArrowUpRight className={`h-5 w-5 ${tipoConfig.textColor} flex-shrink-0 mt-0.5`} />
            <div className={tipoConfig.textColor}>
              <p className="font-medium mb-1">Prórroga de incapacidad</p>
              <p className="text-sm opacity-80">
                <strong>{incapacidadOrigen.codigo}</strong> - {tipoConfig.label}
              </p>
              <p className="text-sm opacity-80 mt-1">
                Período original: {formatFecha(incapacidadOrigen.fecha_inicio)} - {formatFecha(incapacidadOrigen.fecha_fin)}
              </p>
            </div>
          </div>
        </div>

        {/* Info importante */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p>
                La prórroga extenderá el bloqueo del profesional.
                Se requiere un nuevo folio IMSS.
              </p>
            </div>
          </div>
        </div>

        {/* Folio IMSS */}
        <FormGroup
          label="Folio IMSS de la prórroga"
          required
          error={errors.folio_imss?.message}
        >
          <Input
            {...register('folio_imss')}
            placeholder="Nuevo folio IMSS"
            hasError={!!errors.folio_imss}
          />
        </FormGroup>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-4">
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
          >
            <Input
              type="date"
              {...register('fecha_fin')}
              min={fechaInicio || undefined}
              hasError={!!errors.fecha_fin}
            />
          </FormGroup>
        </div>

        {/* Días autorizados */}
        <FormGroup
          label="Días autorizados"
          required
          error={errors.dias_autorizados?.message}
          helper={diasCalculados > 0 ? `Calculado: ${diasCalculados} días según las fechas` : undefined}
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
            placeholder="Actualización del diagnóstico médico..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                     placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notas (opcional)
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
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || crearProrrogaMutation.isPending}
            loading={isSubmitting || crearProrrogaMutation.isPending}
          >
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Crear Prórroga
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

export default ProrrogaModal;

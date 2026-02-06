/**
 * SolicitudVacacionesModal - Modal para crear solicitud de vacaciones
 * Fase 3 del Plan de Empleados Competitivo - Enero 2026
 */
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Calendar, Clock, Send, AlertCircle } from 'lucide-react';
import { Alert, Button, Drawer } from '@/components/ui';
import { useCrearSolicitudVacaciones, TURNOS_MEDIO_DIA } from '@/hooks/personas';

// Schema de validación
const solicitudSchema = z.object({
  fecha_inicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fecha_fin: z.string().min(1, 'La fecha de fin es requerida'),
  es_medio_dia: z.boolean().default(false),
  turno_medio_dia: z.string().optional(),
  motivo_solicitud: z.string().max(500, 'El motivo no puede exceder 500 caracteres').optional(),
}).refine((data) => {
  if (data.es_medio_dia && !data.turno_medio_dia) {
    return false;
  }
  return true;
}, {
  message: 'Debe seleccionar el turno para medio día',
  path: ['turno_medio_dia'],
}).refine((data) => {
  const inicio = new Date(data.fecha_inicio);
  const fin = new Date(data.fecha_fin);
  return inicio <= fin;
}, {
  message: 'La fecha de fin debe ser igual o posterior a la fecha de inicio',
  path: ['fecha_fin'],
});

/**
 * Modal para crear una solicitud de vacaciones
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {Function} onClose - Callback al cerrar
 * @param {number} diasDisponibles - Días de vacaciones disponibles
 * @param {number} diasAnticipacionMinimos - Días mínimos de anticipación
 */
function SolicitudVacacionesModal({
  isOpen,
  onClose,
  diasDisponibles = 0,
  diasAnticipacionMinimos = 7,
}) {
  const crearSolicitudMutation = useCrearSolicitudVacaciones();
  const [diasCalculados, setDiasCalculados] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(solicitudSchema),
    defaultValues: {
      fecha_inicio: '',
      fecha_fin: '',
      es_medio_dia: false,
      turno_medio_dia: '',
      motivo_solicitud: '',
    },
  });

  const fechaInicio = watch('fecha_inicio');
  const fechaFin = watch('fecha_fin');
  const esMedioDia = watch('es_medio_dia');

  // Calcular días hábiles (simplificado, excluyendo fines de semana)
  useEffect(() => {
    if (esMedioDia) {
      setDiasCalculados(0.5);
      return;
    }

    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      let dias = 0;

      const fecha = new Date(inicio);
      while (fecha <= fin) {
        const diaSemana = fecha.getDay();
        if (diaSemana !== 0 && diaSemana !== 6) {
          dias++;
        }
        fecha.setDate(fecha.getDate() + 1);
      }

      setDiasCalculados(dias);
    } else {
      setDiasCalculados(0);
    }
  }, [fechaInicio, fechaFin, esMedioDia]);

  // Fecha mínima (hoy + días anticipación)
  const fechaMinima = new Date();
  fechaMinima.setDate(fechaMinima.getDate() + diasAnticipacionMinimos);
  const fechaMinimaStr = fechaMinima.toISOString().split('T')[0];

  const onSubmit = async (data) => {
    try {
      await crearSolicitudMutation.mutateAsync({
        ...data,
        turno_medio_dia: data.es_medio_dia ? data.turno_medio_dia : undefined,
      });
      reset();
      onClose();
    } catch (error) {
      // El error ya se maneja en el hook con toast
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const saldoInsuficiente = diasCalculados > diasDisponibles;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title="Solicitar Vacaciones"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Alerta de saldo */}
        {saldoInsuficiente && diasCalculados > 0 && (
          <Alert variant="danger" icon={AlertCircle} title="Saldo insuficiente">
            Estás solicitando {diasCalculados} días pero solo tienes {diasDisponibles} disponibles.
          </Alert>
        )}

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de inicio
            </label>
            <input
              type="date"
              {...register('fecha_inicio')}
              min={fechaMinimaStr}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            {errors.fecha_inicio && (
              <p className="mt-1 text-sm text-red-500">{errors.fecha_inicio.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de fin
            </label>
            <input
              type="date"
              {...register('fecha_fin')}
              min={fechaInicio || fechaMinimaStr}
              disabled={esMedioDia}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                       disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {errors.fecha_fin && (
              <p className="mt-1 text-sm text-red-500">{errors.fecha_fin.message}</p>
            )}
          </div>
        </div>

        {/* Medio día */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('es_medio_dia')}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded
                       focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Solo medio día
            </span>
          </label>

          {esMedioDia && (
            <div className="ml-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Turno
              </label>
              <div className="flex gap-4">
                {Object.values(TURNOS_MEDIO_DIA).map((turno) => (
                  <label key={turno.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      {...register('turno_medio_dia')}
                      value={turno.value}
                      className="w-4 h-4 text-primary-600 border-gray-300
                               focus:ring-primary-500 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {turno.label}
                    </span>
                  </label>
                ))}
              </div>
              {errors.turno_medio_dia && (
                <p className="mt-1 text-sm text-red-500">{errors.turno_medio_dia.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Resumen de días */}
        {diasCalculados > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Días hábiles solicitados:
              </span>
              <span className={`text-lg font-semibold ${saldoInsuficiente ? 'text-red-600' : 'text-primary-600 dark:text-primary-400'}`}>
                {diasCalculados} {diasCalculados === 1 ? 'día' : 'días'}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-gray-500 dark:text-gray-500">
                Saldo disponible después:
              </span>
              <span className={`text-sm ${saldoInsuficiente ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>
                {(diasDisponibles - diasCalculados).toFixed(1)} días
              </span>
            </div>
          </div>
        )}

        {/* Motivo (opcional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Motivo (opcional)
          </label>
          <textarea
            {...register('motivo_solicitud')}
            rows={3}
            placeholder="Describe brevemente el motivo de tus vacaciones..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                     placeholder-gray-400 dark:placeholder-gray-500"
          />
          {errors.motivo_solicitud && (
            <p className="mt-1 text-sm text-red-500">{errors.motivo_solicitud.message}</p>
          )}
        </div>

        {/* Nota de anticipación */}
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Las solicitudes deben hacerse con al menos {diasAnticipacionMinimos} días de anticipación.
        </p>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || crearSolicitudMutation.isPending || saldoInsuficiente}
            loading={isSubmitting || crearSolicitudMutation.isPending}
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar Solicitud
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

export default SolicitudVacacionesModal;

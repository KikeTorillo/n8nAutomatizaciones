import PropTypes from 'prop-types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { AlertCircle, Calendar, Clock, User, Building, Info } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import FormField from '@/components/forms/FormField';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useProfesionales } from '@/hooks/useProfesionales';
import { useCrearBloqueo, useActualizarBloqueo } from '@/hooks/useBloqueos';
import { useTiposBloqueo } from '@/hooks/useTiposBloqueo';
import {
  bloqueoFormSchema,
  bloqueoFormDefaults,
  sanitizarDatosBloqueo,
  prepararDatosParaEdicion,
} from '@/utils/bloqueoValidators';
import {
  LABELS_TIPO_BLOQUEO,
  COLORES_TIPO_BLOQUEO,
  ICONOS_TIPO_BLOQUEO,
  calcularDiasBloqueo
} from '@/utils/bloqueoHelpers';
import { format } from 'date-fns';

/**
 * BloqueoFormModal - Modal con formulario para crear/editar bloqueos
 */
function BloqueoFormModal({ isOpen, onClose, bloqueo, modo = 'crear' }) {

  // Queries
  const { data: profesionales = [], isLoading: isLoadingProfesionales } = useProfesionales({
    activo: true,
  });

  const { data: tiposData, isLoading: isLoadingTipos } = useTiposBloqueo();

  // Mutations
  const crearMutation = useCrearBloqueo();
  const actualizarMutation = useActualizarBloqueo();

  // React Hook Form
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(bloqueoFormSchema),
    defaultValues: bloqueoFormDefaults,
    mode: 'onChange',
  });

  // Watch para cambios en el formulario
  const tipoBloqueoId = watch('tipo_bloqueo_id');
  const profesionalId = watch('profesional_id');
  const fechaInicio = watch('fecha_inicio');
  const fechaFin = watch('fecha_fin');

  // Encontrar el tipo seleccionado para determinar si es organizacional
  const tipoSeleccionado = useMemo(() => {
    if (!tipoBloqueoId || !tiposData?.tipos) return null;
    return tiposData.tipos.find(t => t.id === tipoBloqueoId);
  }, [tipoBloqueoId, tiposData]);

  // Determinar si es organizacional basado en el código del tipo
  const esOrganizacional = useMemo(() => {
    if (!tipoSeleccionado) return false;
    const codigosOrganizacionales = ['organizacional', 'feriado', 'mantenimiento'];
    return codigosOrganizacionales.includes(tipoSeleccionado.codigo);
  }, [tipoSeleccionado]);

  // Auto-limpiar profesional_id si es organizacional
  useEffect(() => {
    if (esOrganizacional && profesionalId) {
      setValue('profesional_id', null);
    }
  }, [esOrganizacional, profesionalId, setValue]);

  // Calcular preview de días
  const diasBloqueo = useMemo(() => {
    if (fechaInicio && fechaFin) {
      return calcularDiasBloqueo(fechaInicio, fechaFin);
    }
    return 0;
  }, [fechaInicio, fechaFin]);

  // Cargar datos en modo edición
  useEffect(() => {
    if (isOpen && modo === 'editar' && bloqueo) {
      const datosEdicion = prepararDatosParaEdicion(bloqueo);
      reset(datosEdicion);
    } else if (isOpen && modo === 'crear') {
      reset(bloqueoFormDefaults);
    }
  }, [isOpen, modo, bloqueo, reset]);

  // Reset al cerrar
  const handleClose = () => {
    reset(bloqueoFormDefaults);
    onClose();
  };

  // Submit del formulario
  const onSubmit = async (data) => {
    try {
      const datosLimpios = sanitizarDatosBloqueo(data);

      if (modo === 'crear') {
        await crearMutation.mutateAsync(datosLimpios);
      } else {
        await actualizarMutation.mutateAsync({
          id: bloqueo.id,
          data: datosLimpios,
        });
      }

      handleClose();
    } catch (error) {
      console.error('Error al guardar bloqueo:', error);
    }
  };

  // Opciones de tipos de bloqueo (dinámicas desde API)
  const opcionesTipos = useMemo(() => {
    if (!tiposData?.tipos) return [];

    return tiposData.tipos.map(tipo => ({
      value: tipo.id,
      label: tipo.nombre,
      // Metadata adicional para UI (opcional)
      codigo: tipo.codigo,
      esSystema: tipo.es_sistema,
    }));
  }, [tiposData]);

  // Opciones de profesionales
  // NOTA: No incluimos opción placeholder vacía porque el componente Select ya la agrega automáticamente
  const opcionesProfesionales = (profesionales || []).map((prof) => ({
    value: prof.id.toString(),
    label: prof.nombre_completo || `${prof.nombres} ${prof.apellidos}`,
  }));

  // Fecha de hoy para min en inputs
  const hoy = format(new Date(), 'yyyy-MM-dd');

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modo === 'crear' ? 'Nuevo Bloqueo de Horario' : 'Editar Bloqueo'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información del bloqueo */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Info className="h-4 w-4 text-primary-600" />
            Información del Bloqueo
          </h3>

          {/* Título */}
          <FormField
            name="titulo"
            control={control}
            label="Título"
            placeholder="Ej: Vacaciones de verano, Feriado nacional, Mantenimiento..."
            required
          />

          {/* Tipo de bloqueo */}
          <Controller
            name="tipo_bloqueo_id"
            control={control}
            render={({ field: { value, onChange, ...field }, fieldState: { error } }) => (
              <div>
                <label htmlFor="tipo_bloqueo_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de bloqueo <span className="text-red-500">*</span>
                </label>
                <Select
                  {...field}
                  id="tipo_bloqueo_id"
                  value={value?.toString() || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    onChange(val ? parseInt(val) : null);
                  }}
                  options={opcionesTipos}
                  placeholder="Selecciona un tipo de bloqueo"
                  disabled={isLoadingTipos}
                  error={error?.message}
                />
                {isLoadingTipos && (
                  <p className="text-xs text-gray-500 mt-1">Cargando tipos de bloqueo...</p>
                )}
                {error && (
                  <p className="mt-1 text-sm text-red-600">{error.message}</p>
                )}
              </div>
            )}
          />

          {/* Descripción */}
          <Controller
            name="descripcion"
            control={control}
            render={({ field }) => (
              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  {...field}
                  id="descripcion"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Descripción detallada del bloqueo (opcional)"
                />
                {errors.descripcion && (
                  <p className="mt-1 text-sm text-red-600">{errors.descripcion.message}</p>
                )}
              </div>
            )}
          />
        </div>

        {/* Alcance del bloqueo */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            {esOrganizacional ? (
              <Building className="h-4 w-4 text-gray-600" />
            ) : (
              <User className="h-4 w-4 text-primary-600" />
            )}
            {esOrganizacional ? 'Bloqueo Organizacional' : 'Profesional'}
          </h3>

          {esOrganizacional ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                Este tipo de bloqueo se aplicará a <strong>toda la organización</strong> y afectará a
                todos los profesionales.
              </p>
            </div>
          ) : (
            <Controller
              name="profesional_id"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <div>
                  <label htmlFor="profesional_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Profesional <span className="text-red-500">*</span>
                  </label>
                  <Select
                    {...field}
                    id="profesional_id"
                    value={value?.toString() || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      onChange(val ? parseInt(val) : null);
                    }}
                    options={opcionesProfesionales}
                    placeholder="Selecciona un profesional"
                    disabled={isLoadingProfesionales}
                    error={!!errors.profesional_id}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Selecciona el profesional al que se aplicará este bloqueo
                  </p>
                  {errors.profesional_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.profesional_id.message}</p>
                  )}
                </div>
              )}
            />
          )}
        </div>

        {/* Fechas y horarios */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary-600" />
            Fechas y Horarios
          </h3>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="fecha_inicio"
              control={control}
              label="Fecha de inicio"
              type="date"
              min={hoy}
              required
            />

            <FormField
              name="fecha_fin"
              control={control}
              label="Fecha de fin"
              type="date"
              min={fechaInicio || hoy}
              required
            />
          </div>

          {/* Preview de días */}
          {diasBloqueo > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <strong>Duración:</strong> {diasBloqueo} {diasBloqueo === 1 ? 'día' : 'días'}
              </p>
            </div>
          )}

          {/* Horarios (opcional) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Horario específico (opcional)</span>
            </div>
            <p className="text-xs text-gray-500">
              Deja estos campos vacíos para bloquear días completos. Especifica horas solo si deseas
              bloquear un horario parcial.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="hora_inicio"
                control={control}
                label="Hora de inicio"
                type="time"
              />

              <FormField
                name="hora_fin"
                control={control}
                label="Hora de fin"
                type="time"
              />
            </div>
          </div>
        </div>

        {/* Advertencias de impacto */}
        {bloqueo?.citas_afectadas > 0 && modo === 'editar' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">⚠️ Atención: Citas afectadas</p>
                <p>
                  Este bloqueo actualmente afecta <strong>{bloqueo.citas_afectadas} citas</strong>.
                  Modificar las fechas puede tener impacto en estas reservas.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Estado activo */}
        {modo === 'editar' && (
          <div className="pt-4 border-t border-gray-200">
            <Controller
              name="activo"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <div className="flex items-center gap-2">
                  <input
                    {...field}
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onChange(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="text-sm text-gray-700">
                    <span className="font-medium">Bloqueo activo</span>
                    <span className="text-gray-500 ml-1">
                      (Desactívalo si ya no aplica pero deseas mantener el registro)
                    </span>
                  </label>
                </div>
              )}
            />
          </div>
        )}

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || crearMutation.isPending || actualizarMutation.isPending}
          >
            {isSubmitting
              ? 'Guardando...'
              : modo === 'crear'
                ? 'Crear Bloqueo'
                : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

BloqueoFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  bloqueo: PropTypes.object,
  modo: PropTypes.oneOf(['crear', 'editar']),
};

BloqueoFormModal.defaultProps = {
  bloqueo: null,
  modo: 'crear',
};

export default BloqueoFormModal;

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PartyPopper, Save } from 'lucide-react';
import {
  BackButton,
  Button,
  CheckboxField,
  FormGroup,
  Input,
  LoadingSpinner
} from '@/components/ui';
import { useToast } from '@/hooks/utils';
import {
  useEvento,
  usePlantillasPorTipo,
  useCrearEvento,
  useActualizarEvento
} from '@/hooks/otros';
import {
  eventoSchema,
  eventoDefaults,
  eventoToFormData,
  formDataToApi as eventoFormDataToApi,
  TIPOS_EVENTO
} from '@/schemas/evento.schema';

/**
 * Página de formulario para crear/editar evento digital
 * Migrado a React Hook Form + Zod - Feb 2026
 */
function EventoFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const isEditing = !!id;

  // React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(eventoSchema),
    defaultValues: eventoDefaults,
  });

  // Watch para valores reactivos
  const tipo = watch('tipo');
  const plantilla_id = watch('plantilla_id');

  // Queries
  const { data: evento, isLoading: loadingEvento } = useEvento(isEditing ? id : null);
  const { data: plantillas } = usePlantillasPorTipo(tipo);

  // Mutations
  const crearEvento = useCrearEvento();
  const actualizarEvento = useActualizarEvento();

  // Cargar datos si es edición
  useEffect(() => {
    if (evento) {
      reset(eventoToFormData(evento));
    }
  }, [evento, reset]);

  // Submit handler
  const onSubmit = async (data) => {
    try {
      const apiData = eventoFormDataToApi(data);

      if (isEditing) {
        await actualizarEvento.mutateAsync({ id, data: apiData });
        toast.success('Evento actualizado correctamente');
        navigate(`/eventos-digitales/${id}`);
      } else {
        const nuevoEvento = await crearEvento.mutateAsync(apiData);
        toast.success('Evento creado correctamente');
        navigate(`/eventos-digitales/${nuevoEvento.id}`);
      }
    } catch (error) {
      toast.error(error.message || 'Error al guardar evento');
    }
  };

  if (isEditing && loadingEvento) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const isLoading = crearEvento.isPending || actualizarEvento.isPending || isSubmitting;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <BackButton
          to={isEditing ? `/eventos-digitales/${id}` : '/eventos-digitales'}
          className="mb-3"
        />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-100 dark:bg-pink-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
            <PartyPopper className="h-6 w-6 sm:h-7 sm:w-7 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isEditing ? 'Editar Evento' : 'Nuevo Evento'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
              {isEditing ? 'Modifica los datos de tu evento' : 'Crea una invitación digital para tu evento'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Información Básica */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Información Básica</h2>

            <div className="space-y-4">
              {/* Nombre */}
              <Controller
                name="nombre"
                control={control}
                render={({ field }) => (
                  <FormGroup label="Nombre del Evento" required error={errors.nombre?.message}>
                    <Input
                      placeholder="Ej: Boda de Juan y María"
                      hasError={!!errors.nombre}
                      {...field}
                    />
                  </FormGroup>
                )}
              />

              {/* Tipo de Evento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Evento *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {TIPOS_EVENTO.map((tipoEvento) => (
                    <button
                      key={tipoEvento.value}
                      type="button"
                      onClick={() => {
                        setValue('tipo', tipoEvento.value);
                        setValue('plantilla_id', '');
                      }}
                      className={`
                        p-3 rounded-lg border-2 text-center transition-all
                        ${tipo === tipoEvento.value
                          ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-900 dark:text-gray-100'
                        }
                      `}
                    >
                      <p className="text-sm font-medium mt-1">{tipoEvento.label}</p>
                    </button>
                  ))}
                </div>
                {errors.tipo && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tipo.message}</p>
                )}
              </div>

              {/* Descripción */}
              <Controller
                name="descripcion"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                    <textarea
                      {...field}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="Cuéntale a tus invitados sobre tu evento..."
                    />
                    {errors.descripcion && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.descripcion.message}</p>
                    )}
                  </div>
                )}
              />
            </div>
          </div>

          {/* Fechas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Fechas</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="fecha_evento"
                control={control}
                render={({ field }) => (
                  <FormGroup label="Fecha del Evento" required error={errors.fecha_evento?.message}>
                    <Input
                      type="date"
                      hasError={!!errors.fecha_evento}
                      {...field}
                    />
                  </FormGroup>
                )}
              />

              <Controller
                name="hora_evento"
                control={control}
                render={({ field }) => (
                  <FormGroup label="Hora del Evento" error={errors.hora_evento?.message}>
                    <Input
                      type="time"
                      hasError={!!errors.hora_evento}
                      {...field}
                    />
                  </FormGroup>
                )}
              />

              <Controller
                name="fecha_limite_rsvp"
                control={control}
                render={({ field }) => (
                  <FormGroup label="Fecha Límite RSVP" error={errors.fecha_limite_rsvp?.message} className="sm:col-span-2">
                    <Input
                      type="date"
                      hasError={!!errors.fecha_limite_rsvp}
                      {...field}
                    />
                  </FormGroup>
                )}
              />
            </div>
          </div>

          {/* Plantilla */}
          {plantillas && plantillas.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Plantilla de Diseño</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Selecciona un estilo visual para tu invitación</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {plantillas.map((plantilla) => {
                  const tema = plantilla.tema || {
                    color_primario: '#ec4899',
                    color_secundario: '#fce7f3',
                    color_fondo: '#fdf2f8',
                    color_texto: '#1f2937',
                  };

                  return (
                    <button
                      key={plantilla.id}
                      type="button"
                      onClick={() => setValue('plantilla_id', plantilla.id)}
                      className={`
                        relative rounded-lg border-2 overflow-hidden transition-all
                        ${plantilla_id == plantilla.id
                          ? 'ring-2 ring-offset-2'
                          : 'hover:border-gray-300'
                        }
                      `}
                      style={{
                        borderColor: plantilla_id == plantilla.id ? tema.color_primario : undefined,
                        '--tw-ring-color': tema.color_primario,
                      }}
                    >
                      <div
                        className="aspect-[3/4] flex flex-col items-center justify-center p-3"
                        style={{ backgroundColor: tema.color_fondo }}
                      >
                        {plantilla.preview_url ? (
                          <img src={plantilla.preview_url} alt={plantilla.nombre} className="w-full h-full object-cover rounded" />
                        ) : (
                          <>
                            <div className="flex gap-1 mb-2">
                              <div
                                className="w-4 h-4 rounded-full border border-white/50"
                                style={{ backgroundColor: tema.color_primario }}
                                title="Color primario"
                              />
                              <div
                                className="w-4 h-4 rounded-full border border-white/50"
                                style={{ backgroundColor: tema.color_secundario }}
                                title="Color secundario"
                              />
                            </div>
                            <div
                              className="w-full rounded-lg p-2 text-center"
                              style={{ backgroundColor: tema.color_secundario }}
                            >
                              <div
                                className="text-[10px] font-bold mb-1"
                                style={{ color: tema.color_texto }}
                              >
                                Evento
                              </div>
                              <div
                                className="w-full h-1 rounded mb-1"
                                style={{ backgroundColor: tema.color_primario }}
                              />
                              <div className="flex justify-center gap-1">
                                {[1, 2, 3].map(i => (
                                  <div
                                    key={i}
                                    className="w-3 h-3 rounded"
                                    style={{ backgroundColor: tema.color_fondo, border: `1px solid ${tema.color_primario}` }}
                                  />
                                ))}
                              </div>
                            </div>
                            <PartyPopper className="w-8 h-8 mt-2" style={{ color: tema.color_primario }} />
                          </>
                        )}
                      </div>

                      <div className="p-2 bg-white dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{plantilla.nombre}</p>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex gap-0.5">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tema.color_primario }}
                            />
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tema.color_secundario }}
                            />
                            <div
                              className="w-3 h-3 rounded-full border"
                              style={{ backgroundColor: tema.color_fondo }}
                            />
                          </div>
                          {plantilla.es_premium && (
                            <span className="text-xs text-yellow-600 font-medium">Premium</span>
                          )}
                        </div>
                      </div>

                      {plantilla_id == plantilla.id && (
                        <div
                          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: tema.color_primario }}
                        >
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Configuración */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Configuración</h2>

            <div className="space-y-4">
              <Controller
                name="configuracion.mostrar_mesa_regalos"
                control={control}
                render={({ field }) => (
                  <CheckboxField
                    checked={field.value}
                    onChange={field.onChange}
                    label="Mostrar mesa de regalos"
                  />
                )}
              />

              <Controller
                name="configuracion.permitir_felicitaciones"
                control={control}
                render={({ field }) => (
                  <CheckboxField
                    checked={field.value}
                    onChange={field.onChange}
                    label="Permitir felicitaciones públicas"
                  />
                )}
              />

              <Controller
                name="configuracion.mostrar_ubicaciones"
                control={control}
                render={({ field }) => (
                  <CheckboxField
                    checked={field.value}
                    onChange={field.onChange}
                    label="Mostrar ubicaciones con mapa"
                  />
                )}
              />

              <Controller
                name="configuracion.mostrar_contador"
                control={control}
                render={({ field }) => (
                  <CheckboxField
                    checked={field.value}
                    onChange={field.onChange}
                    label="Mostrar contador regresivo"
                  />
                )}
              />

              <Controller
                name="configuracion.mostrar_qr_invitado"
                control={control}
                render={({ field }) => (
                  <CheckboxField
                    checked={field.value}
                    onChange={field.onChange}
                    label="Mostrar QR de entrada al invitado"
                    description="Muestra un código QR cuando el invitado confirma asistencia"
                  />
                )}
              />

              <Controller
                name="configuracion.habilitar_seating_chart"
                control={control}
                render={({ field }) => (
                  <CheckboxField
                    checked={field.value}
                    onChange={field.onChange}
                    label="Habilitar asignación de mesas"
                    description="Permite asignar invitados a mesas y mostrar su ubicación"
                  />
                )}
              />

              <Controller
                name="configuracion.mensaje_confirmacion"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mensaje de Confirmación</label>
                    <textarea
                      {...field}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="Mensaje que verán después de confirmar asistencia"
                    />
                    {errors.configuracion?.mensaje_confirmacion && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.configuracion.mensaje_confirmacion.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(isEditing ? `/eventos-digitales/${id}` : '/eventos-digitales')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventoFormPage;

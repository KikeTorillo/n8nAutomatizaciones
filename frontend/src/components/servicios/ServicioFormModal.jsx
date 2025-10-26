import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Scissors } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import FormField from '@/components/forms/FormField';
import { profesionalesApi } from '@/services/api/endpoints';
import { useCrearServicio, useActualizarServicio, useServicio } from '@/hooks/useServicios';
import { useToast } from '@/hooks/useToast';

/**
 * Schema de validación Zod para CREAR servicio
 * Todos los campos son requeridos excepto descripcion
 */
const servicioCreateSchema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres').max(100, 'Máximo 100 caracteres'),
  descripcion: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
  categoria: z.string().min(1, 'Categoría requerida').max(50, 'Máximo 50 caracteres'),
  duracion_minutos: z.number().int('Debe ser un número entero').min(1, 'Mínimo 1 minuto').max(480, 'Máximo 8 horas'),
  precio: z
    .union([z.number(), z.string()])
    .transform((val) => {
      // Convertir string vacío a 0, y strings numéricos a números
      if (val === '' || val === null || val === undefined) return 0;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? 0 : num;
    })
    .pipe(
      z.number()
        .min(0, 'El precio no puede ser negativo')
        .max(10000000, 'Precio máximo excedido')
    ),
  profesionales_ids: z.array(z.number()).optional().default([]), // Profesionales opcionales - asignar desde Profesional
  activo: z.boolean().default(true),
});

/**
 * Schema de validación Zod para EDITAR servicio
 * Todos los campos son opcionales pero al menos uno debe estar presente
 * NO incluye profesionales_ids (gestión separada en Fase 4)
 */
const servicioEditSchema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres').max(100, 'Máximo 100 caracteres').optional(),
  descripcion: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
  categoria: z.string().min(1, 'Categoría requerida').max(50, 'Máximo 50 caracteres').optional(),
  duracion_minutos: z.number().int('Debe ser un número entero').min(1, 'Mínimo 1 minuto').max(480, 'Máximo 8 horas').optional(),
  precio: z
    .union([z.number(), z.string()])
    .transform((val) => {
      // Convertir string vacío a 0, y strings numéricos a números
      if (val === '' || val === null || val === undefined) return 0;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? 0 : num;
    })
    .pipe(
      z.number()
        .min(0, 'El precio no puede ser negativo')
        .max(10000000, 'Precio máximo excedido')
    )
    .optional(),
  activo: z.boolean().optional(),
}).refine((data) => {
  return Object.keys(data).some(key => data[key] !== undefined);
}, {
  message: 'Debes modificar al menos un campo',
});

/**
 * Modal de formulario para crear y editar servicios
 * @param {string} mode - 'create' o 'edit'
 * @param {object|null} servicio - Datos del servicio a editar (solo en modo edit)
 */
function ServicioFormModal({ isOpen, onClose, mode = 'create', servicio = null }) {
  const toast = useToast();
  const [selectedProfessionals, setSelectedProfessionals] = useState([]);

  const isEditMode = mode === 'edit';
  const servicioId = servicio?.id;

  // Fetch datos del servicio en modo edición
  const { data: servicioData, isLoading: loadingServicio } = useServicio(servicioId, {
    enabled: isOpen && isEditMode && !!servicioId,
  });

  // Fetch profesionales para el multi-select (solo en modo create)
  const { data: profesionales, isLoading: loadingProfesionales } = useQuery({
    queryKey: ['profesionales'],
    queryFn: async () => {
      const response = await profesionalesApi.listar();
      return response.data.data.profesionales || [];
    },
    enabled: isOpen && !isEditMode, // Solo fetch en modo create cuando modal está abierto
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Hooks de mutación
  const crearMutation = useCrearServicio();
  const actualizarMutation = useActualizarServicio();

  // React Hook Form con validación Zod
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEditMode ? servicioEditSchema : servicioCreateSchema),
    defaultValues: isEditMode
      ? {} // En modo edit, los valores se cargan dinámicamente
      : {
          nombre: '',
          descripcion: '',
          categoria: '',
          duracion_minutos: 30,
          precio: '',
          profesionales_ids: [],
          activo: true,
        },
  });

  // Pre-cargar datos del servicio en modo edición
  useEffect(() => {
    if (isEditMode && servicioData && isOpen) {
      reset({
        nombre: servicioData.nombre || '',
        descripcion: servicioData.descripcion || '',
        categoria: servicioData.categoria || '',
        duracion_minutos: servicioData.duracion_minutos || 30,
        precio: parseFloat(servicioData.precio) || 0,
        activo: servicioData.activo !== undefined ? servicioData.activo : true,
      });
    }
  }, [isEditMode, servicioData, isOpen, reset]);

  // Reset form cuando cierra el modal
  useEffect(() => {
    if (!isOpen) {
      reset();
      setSelectedProfessionals([]);
    }
  }, [isOpen, reset]);

  // Handler para toggle de profesionales
  const toggleProfessional = (profId) => {
    const newSelected = selectedProfessionals.includes(profId)
      ? selectedProfessionals.filter((id) => id !== profId)
      : [...selectedProfessionals, profId];

    setSelectedProfessionals(newSelected);
    setValue('profesionales_ids', newSelected);
  };

  // Handler de submit
  const onSubmit = async (data) => {
    try {
      // Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        descripcion: data.descripcion?.trim() || undefined,
      };

      if (isEditMode) {
        // Modo edición
        await actualizarMutation.mutateAsync({ id: servicioId, data: sanitized });
        toast.success('Servicio actualizado exitosamente');
      } else {
        // Modo creación
        await crearMutation.mutateAsync(sanitized);
        toast.success('Servicio creado exitosamente');
      }

      onClose();
      reset();
      setSelectedProfessionals([]);
    } catch (error) {
      toast.error(error.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} servicio`);
    }
  };

  // Loading state durante fetch de datos
  const isLoadingData = isEditMode && loadingServicio;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Servicio' : 'Nuevo Servicio'}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header con icono */}
        <div className="flex items-center gap-3 pb-4 border-b">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
            <Scissors className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditMode ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
            </h3>
            <p className="text-sm text-gray-600">
              {isEditMode
                ? 'Modifica los datos del servicio (profesionales se gestionan por separado)'
                : 'Completa la información del servicio'}
            </p>
          </div>
        </div>

        {/* Loading state durante fetch de datos en modo edición */}
        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="text-sm text-gray-600">Cargando datos del servicio...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Campos del formulario */}
            <div className="space-y-4">
              {/* Nombre */}
              <FormField
                name="nombre"
                control={control}
                label="Nombre del Servicio"
                placeholder="Ej: Corte de Cabello"
                required={!isEditMode}
              />

              {/* Descripción */}
              <FormField
                name="descripcion"
                control={control}
                label="Descripción (Opcional)"
                placeholder="Breve descripción del servicio"
              />

              {/* Categoría */}
              <FormField
                name="categoria"
                control={control}
                label="Categoría"
                placeholder="Ej: Cortes, Tratamientos, etc."
                required={!isEditMode}
              />

              {/* Duración - Horas y Minutos con Presets */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Duración {!isEditMode && <span className="text-red-500">*</span>}
                </label>

                {/* Botones preset */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {[
                    { label: '15 min', minutos: 15 },
                    { label: '30 min', minutos: 30 },
                    { label: '45 min', minutos: 45 },
                    { label: '1 hora', minutos: 60 },
                    { label: '1h 30m', minutos: 90 },
                    { label: '2 horas', minutos: 120 },
                  ].map((preset) => (
                    <Controller
                      key={preset.minutos}
                      name="duracion_minutos"
                      control={control}
                      render={({ field }) => (
                        <button
                          type="button"
                          onClick={() => field.onChange(preset.minutos)}
                          className={`
                            px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all
                            ${field.value === preset.minutos
                              ? 'border-primary-600 bg-primary-50 text-primary-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300'
                            }
                          `}
                        >
                          {preset.label}
                        </button>
                      )}
                    />
                  ))}
                </div>

                {/* Inputs personalizados - Horas y Minutos */}
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="duracion_minutos"
                    control={control}
                    render={({ field }) => {
                      const horas = Math.floor(field.value / 60);
                      const minutos = field.value % 60;

                      return (
                        <Input
                          type="number"
                          label="Horas"
                          placeholder="0"
                          min="0"
                          max="8"
                          value={horas === 0 ? '' : horas}
                          onKeyDown={(e) => {
                            if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            const value = e.target.value;
                            const newHoras = value === '' ? 0 : Math.min(Math.max(parseInt(value), 0), 8);
                            field.onChange(newHoras * 60 + minutos);
                          }}
                        />
                      );
                    }}
                  />

                  <Controller
                    name="duracion_minutos"
                    control={control}
                    render={({ field }) => {
                      const horas = Math.floor(field.value / 60);
                      const minutos = field.value % 60;

                      return (
                        <Input
                          type="number"
                          label="Minutos"
                          placeholder="0"
                          min="0"
                          max="59"
                          value={minutos === 0 ? '' : minutos}
                          onKeyDown={(e) => {
                            if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            const value = e.target.value;
                            const newMinutos = value === '' ? 0 : Math.min(Math.max(parseInt(value), 0), 59);
                            field.onChange(horas * 60 + newMinutos);
                          }}
                          error={errors.duracion_minutos?.message}
                        />
                      );
                    }}
                  />
                </div>

                {/* Mostrar total */}
                <Controller
                  name="duracion_minutos"
                  control={control}
                  render={({ field }) => (
                    <p className="text-sm text-gray-600">
                      Total: <span className="font-semibold text-gray-900">{field.value} minutos</span>
                    </p>
                  )}
                />
              </div>

              {/* Precio */}
              <div>

                <Controller
                  name="precio"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="number"
                      label="Precio"
                      placeholder="Ej: 50000"
                      required={!isEditMode}
                      min="0"
                      step="1"
                      onKeyDown={(e) => {
                        // Prevenir entrada de caracteres no permitidos en números positivos
                        if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Si está vacío, mantener vacío para que se vea el placeholder
                        // Si tiene valor, convertir a número entero y asegurar que sea positivo
                        if (value === '') {
                          field.onChange('');
                        } else {
                          const num = parseInt(value) || 0;
                          field.onChange(Math.abs(num)); // Math.abs asegura valor positivo
                        }
                      }}
                      error={errors.precio?.message}
                    />
                  )}
                />
              </div>

              {/* Multi-select de Profesionales - Solo en modo create */}
              {!isEditMode && (
                <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profesionales que ofrecen este servicio{' '}
              <span className="text-gray-500">(Opcional)</span>
            </label>

            {loadingProfesionales ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : profesionales && profesionales.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                {profesionales.map((prof) => (
                  <div
                    key={prof.id}
                    onClick={() => toggleProfessional(prof.id)}
                    className={`
                      flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all
                      ${
                        selectedProfessionals.includes(prof.id)
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProfessionals.includes(prof.id)}
                      onChange={() => {}}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                    />
                    <div
                      className="w-8 h-8 rounded-full flex-shrink-0"
                      style={{ backgroundColor: prof.color_calendario || '#3B82F6' }}
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {prof.nombre_completo}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                💡 No hay profesionales disponibles. Puedes crear el servicio ahora y asignar profesionales después desde la página de <strong>Profesionales → Servicios</strong>.
              </div>
            )}

            {errors.profesionales_ids && (
              <p className="mt-1 text-sm text-red-600">
                {errors.profesionales_ids.message}
              </p>
            )}

                  {selectedProfessionals.length > 0 && (
                    <p className="mt-2 text-sm text-gray-600">
                      {selectedProfessionals.length} profesional(es) seleccionado(s)
                    </p>
                  )}
                </div>
              )}

              {/* Estado Activo */}
              <Controller
                name="activo"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="activo"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                    />
                    <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                      Servicio activo
                    </label>
                  </div>
                )}
              />
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={crearMutation.isPending || actualizarMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={crearMutation.isPending || actualizarMutation.isPending}
                disabled={
                  crearMutation.isPending ||
                  actualizarMutation.isPending ||
                  (!isEditMode && selectedProfessionals.length === 0)
                }
              >
                {isEditMode
                  ? actualizarMutation.isPending
                    ? 'Actualizando...'
                    : 'Actualizar Servicio'
                  : crearMutation.isPending
                    ? 'Creando...'
                    : 'Crear Servicio'}
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}

export default ServicioFormModal;

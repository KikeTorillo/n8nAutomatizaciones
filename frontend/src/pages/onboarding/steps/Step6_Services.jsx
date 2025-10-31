import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { serviceSchema } from '@/lib/validations';
import { serviciosApi, profesionalesApi } from '@/services/api/endpoints';
import useOnboardingStore from '@/store/onboardingStore';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/lib/utils';
import FormField from '@/components/forms/FormField';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Scissors, X, Plus } from 'lucide-react';

/**
 * Paso 5: Crear Servicios
 */
function Step5_Services() {
  const { formData, addService, removeService, nextStep } = useOnboardingStore();
  const toast = useToast();

  // Fetch profesionales
  const { isLoading, error: queryError } = useQuery({
    queryKey: ['profesionales'],
    queryFn: async () => {
      console.log('🔍 Step5: Obteniendo profesionales del backend...');
      const response = await profesionalesApi.listar();
      console.log('✅ Step5: Respuesta completa:', response.data.data);
      // El backend retorna { profesionales: [...], filtros_aplicados: {...}, total: N }
      return response.data.data.profesionales || [];
    },
    staleTime: 0,  // Siempre refrescar al montar el componente
    refetchOnMount: 'always',  // Forzar refetch al montar
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      categoria: '',
      duracion_minutos: 30,
      precio: '',
      profesionales: [],
      permite_walk_in: true,
      activo: true,
    },
  });

  // Mutación NUEVA para crear servicios en bulk (transaccional)
  const createServicesMutation = useMutation({
    mutationFn: async (services) => {
      console.log('📦 Creando servicios en bulk (transaccional):', services);

      // Preparar servicios para bulk-create
      const serviciosParaBulk = services.map(service => ({
        nombre: service.nombre.trim(),
        descripcion: service.descripcion?.trim() || undefined,
        categoria: service.categoria?.trim() || undefined,
        duracion_minutos: service.duracion_minutos,
        precio: service.precio,
        profesionales_asignados: service.profesionales || [], // IDs de profesionales a asignar
        activo: service.activo !== undefined ? service.activo : true,
      }));

      console.log('📤 Enviando creación bulk:', serviciosParaBulk);

      // Crear en bulk (transaccional - TODO o NADA)
      const response = await serviciosApi.crearBulk(serviciosParaBulk);

      console.log('✅ Servicios creados exitosamente:', response.data.data);
      return response.data.data;
    },
    onSuccess: (data) => {
      const totalCreados = data.total_creados || data.servicios.length;
      toast.success(`${totalCreados} servicios creados exitosamente`);

      // Avanzar al siguiente paso
      setTimeout(() => {
        nextStep();
      }, 300);
    },
    onError: (error) => {
      console.error('❌ Error en creación bulk:', error);

      const errorMessage = error.response?.data?.message || error.message;
      const isLimitError = error.response?.status === 403 &&
                          errorMessage.includes('límite');

      if (isLimitError) {
        toast.error(errorMessage);
      } else if (error.response?.status === 409) {
        toast.error(errorMessage); // Nombres duplicados
      } else if (error.response?.status === 400) {
        toast.error(errorMessage); // Validación fallida
      } else {
        toast.error(`Error al crear servicios: ${errorMessage}`);
      }
    },
  });

  const onSubmit = (data) => {
    // Permitir servicios SIN profesionales - se pueden asignar después
    addService(data);
    reset();
  };

  const handleContinue = () => {
    // Permitir continuar SIN servicios - es opcional
    if (formData.services.length > 0) {
      // Crear todos los servicios en el backend
      createServicesMutation.mutate(formData.services);
    } else {
      // Continuar sin servicios
      nextStep();
    }
  };

  const handleSkip = () => {
    if (formData.services.length > 0) {
      createServicesMutation.mutate(formData.services);
    } else {
      nextStep();
    }
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" text="Cargando profesionales..." />
      </div>
    );
  }

  if (queryError) {
    console.error('❌ Step5: Error cargando profesionales:', queryError);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
          <Scissors className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Crea tus Servicios
        </h2>
        <p className="text-gray-600">
          Define los servicios que ofreces (puedes agregar más después)
        </p>
      </div>

      {/* Lista de servicios agregados */}
      {formData.services.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">
            Servicios agregados ({formData.services.length})
          </h3>
          <div className="space-y-2">
            {formData.services.map((service, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white p-3 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{service.nombre}</p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(service.precio)} • {service.duracion_minutos} min
                  </p>
                </div>
                <button
                  onClick={() => removeService(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario para agregar servicio */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border-t pt-6">
        <h3 className="font-semibold text-gray-900">Agregar Nuevo Servicio</h3>

        <FormField
          name="nombre"
          control={control}
          label="Nombre del Servicio"
          placeholder="Ej: Corte de Cabello"
          required
        />

        <FormField
          name="descripcion"
          control={control}
          label="Descripción (Opcional)"
          placeholder="Breve descripción del servicio"
        />

        <FormField
          name="categoria"
          control={control}
          label="Categoría"
          placeholder="Ej: Cortes, Tratamientos, etc."
          required
        />

        {/* Duración - Horas y Minutos */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Duración <span className="text-red-500">*</span>
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

        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">

          <Controller
            name="precio"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="number"
                label="Precio"
                placeholder="Ej: 50000"
                required
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

        <Button
          type="submit"
          variant="outline"
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Servicio
        </Button>
      </form>

      {/* Botones de navegación */}
      <div className="flex justify-end pt-4 border-t">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            disabled={createServicesMutation.isPending}
          >
            Saltar
          </Button>
          <Button
            type="button"
            onClick={handleContinue}
            isLoading={createServicesMutation.isPending}
            disabled={createServicesMutation.isPending}
          >
            {createServicesMutation.isPending ? 'Guardando...' : 'Continuar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Step5_Services;

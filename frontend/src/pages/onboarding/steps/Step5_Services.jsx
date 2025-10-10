import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { serviceSchema } from '@/lib/validations';
import { serviciosApi, profesionalesApi } from '@/services/api/endpoints';
import useOnboardingStore from '@/store/onboardingStore';
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
  const { formData, addService, removeService, nextStep, prevStep } = useOnboardingStore();
  const [selectedProfessionals, setSelectedProfessionals] = useState([]);

  // Fetch profesionales
  const { data: profesionales, isLoading, error: queryError } = useQuery({
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
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      categoria: '',
      duracion_minutos: 30,
      precio: 0,
      profesionales: [],
      permite_walk_in: true,
      activo: true,
    },
  });

  // Mutación para crear servicios en batch
  const createServicesMutation = useMutation({
    mutationFn: async (services) => {
      const promises = services.map((service) => {
        // Convertir profesionales[] a profesionales_ids[] para el backend
        const serviceData = {
          ...service,
          profesionales_ids: service.profesionales,
        };
        delete serviceData.profesionales; // Remover el campo antiguo
        return serviciosApi.crear(serviceData);
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      nextStep();
    },
    onError: (error) => {
      alert(`Error al crear servicios: ${error.message}`);
    },
  });

  const toggleProfessional = (profId) => {
    const newSelected = selectedProfessionals.includes(profId)
      ? selectedProfessionals.filter((id) => id !== profId)
      : [...selectedProfessionals, profId];

    setSelectedProfessionals(newSelected);
    setValue('profesionales', newSelected);
  };

  const onSubmit = (data) => {
    if (data.profesionales.length === 0) {
      alert('Debes seleccionar al menos un profesional');
      return;
    }

    addService(data);
    reset();
    setSelectedProfessionals([]);
  };

  const handleContinue = () => {
    if (formData.services.length === 0) {
      alert('Debes agregar al menos un servicio');
      return;
    }

    // Crear todos los servicios en el backend
    createServicesMutation.mutate(formData.services);
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="duracion_minutos"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="number"
                label="Duración (minutos)"
                placeholder="30"
                required
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                error={errors.duracion_minutos?.message}
              />
            )}
          />

          <Controller
            name="precio"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="number"
                label="Precio"
                placeholder="50000"
                required
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                error={errors.precio?.message}
              />
            )}
          />
        </div>

        {/* Selección de Profesionales */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profesionales que ofrecen este servicio <span className="text-red-500">*</span>
          </label>
          {profesionales && profesionales.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {profesionales.map((prof) => (
                <div
                  key={prof.id}
                  onClick={() => toggleProfessional(prof.id)}
                  className={`
                    flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all
                    ${selectedProfessionals.includes(prof.id)
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
                    style={{ backgroundColor: prof.color_calendario }}
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {prof.nombre_completo}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              No hay profesionales disponibles. Debes agregar profesionales primero.
            </p>
          )}
          {errors.profesionales && (
            <p className="mt-1 text-sm text-red-600">{errors.profesionales.message}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="outline"
          className="w-full"
          disabled={!profesionales || profesionales.length === 0}
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Servicio
        </Button>
      </form>

      {/* Botones de navegación */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={createServicesMutation.isPending}
        >
          Anterior
        </Button>
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
            disabled={createServicesMutation.isPending || formData.services.length === 0}
          >
            {createServicesMutation.isPending ? 'Guardando...' : 'Continuar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Step5_Services;

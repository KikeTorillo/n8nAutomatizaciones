import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { professionalSchema } from '@/lib/validations';
import { TIPOS_PROFESIONAL } from '@/lib/constants';
import { profesionalesApi } from '@/services/api/endpoints';
import useOnboardingStore from '@/store/onboardingStore';
import FormField from '@/components/forms/FormField';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { Users, X, Plus } from 'lucide-react';

/**
 * Paso 4: Agregar Profesionales
 */
function Step4_Professionals() {
  const queryClient = useQueryClient();
  const { formData, addProfessional, removeProfessional, nextStep, prevStep } = useOnboardingStore();
  const [especialidadInput, setEspecialidadInput] = useState('');
  const [currentEspecialidades, setCurrentEspecialidades] = useState([]);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      nombre_completo: '',
      tipo_profesional: '',
      especialidades: [],
      telefono: '',
      email: '',
      color_calendario: '#3B82F6',
      permite_walk_in: true,
    },
  });

  // Mutación para crear profesionales en batch
  const createProfessionalsMutation = useMutation({
    mutationFn: async (professionals) => {
      console.log('📤 Creando profesionales:', professionals);
      // Sanitizar campos opcionales vacíos (convertir "" a undefined para omitir del payload)
      const promises = professionals.map((prof) => {
        const sanitizedProf = {
          ...prof,
          telefono: prof.telefono?.trim() || undefined,
          email: prof.email?.trim() || undefined,
        };
        return profesionalesApi.crear(sanitizedProf);
      });
      const results = await Promise.all(promises);
      console.log('✅ Profesionales creados:', results);
      return results;
    },
    onSuccess: () => {
      // ✅ Invalidar cache para que Step 5 obtenga datos frescos
      console.log('🔄 Invalidando cache de profesionales');
      queryClient.invalidateQueries({ queryKey: ['profesionales'] });
      nextStep();
    },
    onError: (error) => {
      console.error('❌ Error creando profesionales:', error);
      alert(`Error al crear profesionales: ${error.message}`);
    },
  });

  const handleAddEspecialidad = () => {
    if (especialidadInput.trim() && !currentEspecialidades.includes(especialidadInput.trim())) {
      const newEspecialidades = [...currentEspecialidades, especialidadInput.trim()];
      setCurrentEspecialidades(newEspecialidades);
      setValue('especialidades', newEspecialidades);
      setEspecialidadInput('');
    }
  };

  const handleRemoveEspecialidad = (index) => {
    const newEspecialidades = currentEspecialidades.filter((_, i) => i !== index);
    setCurrentEspecialidades(newEspecialidades);
    setValue('especialidades', newEspecialidades);
  };

  const onSubmit = (data) => {
    addProfessional(data);
    reset();
    setCurrentEspecialidades([]);
  };

  const handleContinue = () => {
    if (formData.professionals.length === 0) {
      alert('Debes agregar al menos un profesional');
      return;
    }

    // Crear todos los profesionales en el backend
    createProfessionalsMutation.mutate(formData.professionals);
  };

  const handleSkip = () => {
    if (formData.professionals.length > 0) {
      createProfessionalsMutation.mutate(formData.professionals);
    } else {
      nextStep();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Agrega Profesionales
        </h2>
        <p className="text-gray-600">
          Configura tu equipo de trabajo (puedes agregar más después)
        </p>
      </div>

      {/* Lista de profesionales agregados */}
      {formData.professionals.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">
            Profesionales agregados ({formData.professionals.length})
          </h3>
          <div className="space-y-2">
            {formData.professionals.map((prof, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white p-3 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full"
                    style={{ backgroundColor: prof.color_calendario }}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{prof.nombre_completo}</p>
                    <p className="text-sm text-gray-600">
                      {TIPOS_PROFESIONAL.find(t => t.value === prof.tipo_profesional)?.label}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeProfessional(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario para agregar profesional */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border-t pt-6">
        <h3 className="font-semibold text-gray-900">Agregar Nuevo Profesional</h3>

        <FormField
          name="nombre_completo"
          control={control}
          label="Nombre Completo"
          placeholder="Ej: María García"
          required
        />

        <FormField
          name="tipo_profesional"
          control={control}
          label="Tipo de Profesional"
          placeholder="Selecciona el tipo"
          options={TIPOS_PROFESIONAL}
          required
        />

        {/* Especialidades */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Especialidades <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <Input
              value={especialidadInput}
              onChange={(e) => setEspecialidadInput(e.target.value)}
              placeholder="Ej: Corte de cabello"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddEspecialidad();
                }
              }}
            />
            <Button type="button" onClick={handleAddEspecialidad} variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {currentEspecialidades.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {currentEspecialidades.map((esp, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm"
                >
                  {esp}
                  <button
                    type="button"
                    onClick={() => handleRemoveEspecialidad(index)}
                    className="hover:text-primary-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {errors.especialidades && (
            <p className="mt-1 text-sm text-red-600">{errors.especialidades.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="telefono"
            control={control}
            type="tel"
            label="Teléfono (Opcional)"
            placeholder="+573001234567"
          />

          <FormField
            name="email"
            control={control}
            type="email"
            label="Email (Opcional)"
            placeholder="profesional@email.com"
          />
        </div>

        <FormField
          name="color_calendario"
          control={control}
          type="color"
          label="Color en el Calendario"
          required
        />

        <Button type="submit" variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Profesional
        </Button>
      </form>

      {/* Botones de navegación */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={createProfessionalsMutation.isPending}
        >
          Anterior
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            disabled={createProfessionalsMutation.isPending}
          >
            Saltar
          </Button>
          <Button
            type="button"
            onClick={handleContinue}
            isLoading={createProfessionalsMutation.isPending}
            disabled={createProfessionalsMutation.isPending || formData.professionals.length === 0}
          >
            {createProfessionalsMutation.isPending ? 'Guardando...' : 'Continuar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Step4_Professionals;

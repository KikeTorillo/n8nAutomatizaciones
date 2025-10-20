import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { professionalSchema } from '@/lib/validations';
import { TIPOS_PROFESIONAL } from '@/lib/constants';
import { profesionalesApi, serviciosApi } from '@/services/api/endpoints';
import useOnboardingStore from '@/store/onboardingStore';
import { useToast } from '@/hooks/useToast';
import FormField from '@/components/forms/FormField';
import Button from '@/components/ui/Button';
import { Users, X, Palette, Plus, Scissors } from 'lucide-react';

/**
 * Colores predefinidos para el calendario
 */
const COLORES_CALENDARIO = [
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#14b8a6', // teal-500
  '#a855f7', // purple-500
  '#6366f1', // indigo-500
  '#84cc16', // lime-500
];

/**
 * Paso 5: Agregar Profesionales (ahora después de Servicios)
 */
function Step4_Professionals() {
  const queryClient = useQueryClient();
  const { formData, addProfessional, removeProfessional, nextStep } = useOnboardingStore();
  const toast = useToast();
  const [selectedColor, setSelectedColor] = useState(COLORES_CALENDARIO[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]); // Servicios a asignar al profesional

  // Obtener servicios del store (agregados en paso anterior)
  const serviciosDisponibles = formData.services || [];

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

      const results = [];

      // Crear profesionales y asignar servicios uno por uno
      for (const prof of professionals) {
        // Sanitizar campos opcionales vacíos
        const sanitizedProf = {
          nombre_completo: prof.nombre_completo,
          tipo_profesional: prof.tipo_profesional,
          color_calendario: prof.color_calendario,
          permite_walk_in: prof.permite_walk_in,
          telefono: prof.telefono?.trim() || undefined,
          email: prof.email?.trim() || undefined,
        };

        // 1. Crear el profesional
        const profResponse = await profesionalesApi.crear(sanitizedProf);
        const profesionalCreado = profResponse.data.data;
        console.log('✅ Profesional creado:', profesionalCreado);

        // 2. Asignar servicios si hay seleccionados
        if (prof.servicios_asignados && prof.servicios_asignados.length > 0) {
          console.log(`📎 Asignando ${prof.servicios_asignados.length} servicios al profesional ${profesionalCreado.id}`);

          // ✅ FIX: Obtener servicios del backend para mapear nombres → IDs
          let servicioNombreToId = {};
          try {
            const serviciosResponse = await serviciosApi.listar({ limite: 100 });
            const serviciosCreados = serviciosResponse.data.data.servicios;

            // Crear mapa de nombre → ID
            serviciosCreados.forEach(s => {
              servicioNombreToId[s.nombre] = s.id;
            });
            console.log('🗺️ Mapa de servicios creado:', servicioNombreToId);
          } catch (error) {
            console.error('❌ Error obteniendo servicios para mapeo:', error);
            // Continuar sin asignaciones si falla el mapeo
            servicioNombreToId = {};
          }

          for (const servicioNombreOId of prof.servicios_asignados) {
            try {
              // ✅ FIX: Usar ID numérico si es nombre, o usar directamente si ya es ID
              const servicioId = servicioNombreToId[servicioNombreOId] || servicioNombreOId;

              if (!servicioId || typeof servicioId !== 'number') {
                console.warn(`⚠️ Servicio "${servicioNombreOId}" no encontrado en BD o ID inválido`);
                continue;
              }

              await serviciosApi.asignarProfesional(servicioId, {
                profesional_id: profesionalCreado.id,
              });
              console.log(`✅ Servicio "${servicioNombreOId}" (ID: ${servicioId}) asignado al profesional ${profesionalCreado.id}`);
            } catch (error) {
              console.error(`❌ Error asignando servicio "${servicioNombreOId}":`, error);
              // Continuar con los demás servicios aunque uno falle
            }
          }
        }

        results.push(profResponse);
      }

      console.log('✅ Todos los profesionales y asignaciones creados');
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
      toast.error(`Error al crear profesionales: ${error.message}`);
    },
  });

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    setValue('color_calendario', color);
    setShowColorPicker(false);
  };

  const onSubmit = (data) => {
    // Guardar profesional con servicios seleccionados
    addProfessional({
      ...data,
      servicios_asignados: selectedServices, // IDs de servicios a asignar
    });
    reset();
    setSelectedColor(COLORES_CALENDARIO[0]);
    setShowColorPicker(false);
    setSelectedServices([]); // Limpiar servicios seleccionados
  };

  // Handler para toggle de servicios
  const handleToggleService = (servicioId) => {
    setSelectedServices(prev =>
      prev.includes(servicioId)
        ? prev.filter(id => id !== servicioId)
        : [...prev, servicioId]
    );
  };

  const handleContinue = () => {
    if (formData.professionals.length === 0) {
      toast.warning('Debes agregar al menos un profesional');
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
          {serviciosDisponibles.length > 0
            ? 'Configura tu equipo y asígnales los servicios que pueden realizar'
            : 'Configura tu equipo de trabajo (puedes agregar más después)'}
        </p>
        {serviciosDisponibles.length > 0 && (
          <p className="text-sm text-primary-600 mt-1">
            💡 {serviciosDisponibles.length} servicio{serviciosDisponibles.length !== 1 ? 's' : ''} disponible{serviciosDisponibles.length !== 1 ? 's' : ''} para asignar
          </p>
        )}
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
                className="bg-white p-3 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
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
                {/* Mostrar servicios asignados */}
                {prof.servicios_asignados && prof.servicios_asignados.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-gray-500 mb-1">Servicios asignados:</p>
                    <div className="flex flex-wrap gap-1">
                      {prof.servicios_asignados.map((servicioId) => {
                        const servicio = serviciosDisponibles.find(s => (s.id || s.nombre) === servicioId);
                        return servicio ? (
                          <span
                            key={servicioId}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-800 rounded-full text-xs"
                          >
                            <Scissors className="w-3 h-3" />
                            {servicio.nombre}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="telefono"
            control={control}
            type="tel"
            label="Teléfono (Opcional)"
            placeholder="5512345678"
            maxLength={10}
          />

          <FormField
            name="email"
            control={control}
            type="email"
            label="Email (Opcional)"
            placeholder="profesional@email.com"
          />
        </div>

        {/* Selector de Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color para Calendario <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-12 h-12 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center"
              style={{ backgroundColor: selectedColor }}
            >
              <Palette className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                Color seleccionado: <span className="font-mono font-medium">{selectedColor}</span>
              </p>
            </div>
          </div>

          {/* Paleta de colores */}
          {showColorPicker && (
            <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-6 gap-2">
                {COLORES_CALENDARIO.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                      selectedColor === color
                        ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selector de Servicios (Opcional) */}
        {serviciosDisponibles.length > 0 && (
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Servicios que puede realizar (Opcional)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              💡 Puedes seleccionar los servicios ahora o asignarlos más tarde desde la página de Servicios
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
              <div className="space-y-2">
                {serviciosDisponibles.map((servicio) => (
                  <label
                    key={servicio.id || servicio.nombre}
                    className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(servicio.id || servicio.nombre)}
                      onChange={() => handleToggleService(servicio.id || servicio.nombre)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <Scissors className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{servicio.nombre}</p>
                        {servicio.precio && (
                          <p className="text-xs text-gray-500">
                            ${servicio.precio?.toLocaleString('es-CO')} - {servicio.duracion_minutos}min
                          </p>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            {selectedServices.length > 0 && (
              <p className="text-xs text-green-600 mt-2">
                ✅ {selectedServices.length} servicio{selectedServices.length !== 1 ? 's' : ''} seleccionado{selectedServices.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        <Button type="submit" variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Profesional
        </Button>
      </form>

      {/* Botones de navegación */}
      <div className="flex justify-end pt-4 border-t">
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

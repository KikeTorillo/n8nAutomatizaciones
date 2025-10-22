import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { horariosApi, profesionalesApi } from '@/services/api/endpoints';
import useOnboardingStore from '@/store/onboardingStore';
import { useToast } from '@/hooks/useToast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Paso 5: Configuración de Horarios
 * Permite configurar horarios semanales para los profesionales creados
 */
function Step5_Schedules() {
  const { nextStep } = useOnboardingStore();
  const toast = useToast();
  const [profesionalesConHorarios, setProfesionalesConHorarios] = useState([]);
  const [errorProfesionales, setErrorProfesionales] = useState([]);

  // Fetch profesionales desde el backend
  const { data: profesionales, isLoading, error: queryError } = useQuery({
    queryKey: ['profesionales'],
    queryFn: async () => {
      console.log('🔍 Step5: Obteniendo profesionales del backend...');
      const response = await profesionalesApi.listar();
      console.log('✅ Step5: Respuesta completa:', response.data.data);
      return response.data.data.profesionales || [];
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      dias: [1, 2, 3, 4, 5], // Lun-Vie por defecto
      hora_inicio: '09:00',
      hora_fin: '18:00',
      tipo_horario: 'regular',
      nombre_horario: 'Horario Laboral',
    },
  });

  // Mutación para crear horarios (uno por profesional)
  const createSchedulesMutation = useMutation({
    mutationFn: async ({ profesionalId, scheduleData }) => {
      console.log(`📤 Creando horarios para profesional ${profesionalId}:`, scheduleData);

      const payload = {
        profesional_id: profesionalId,
        dias: scheduleData.dias,
        hora_inicio: scheduleData.hora_inicio,
        hora_fin: scheduleData.hora_fin,
        tipo_horario: scheduleData.tipo_horario,
        nombre_horario: scheduleData.nombre_horario,
      };

      const response = await horariosApi.crearSemanalesEstandar(payload);
      console.log(`✅ Horarios creados para profesional ${profesionalId}:`, response.data.data);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      setProfesionalesConHorarios((prev) => [...prev, variables.profesionalId]);
    },
    onError: (error, variables) => {
      console.error(`❌ Error creando horarios para profesional ${variables.profesionalId}:`, error);
      setErrorProfesionales((prev) => [...prev, variables.profesionalId]);
    },
  });

  // Crear horarios para todos los profesionales
  const handleCreateSchedules = async (scheduleData) => {
    if (!profesionales || profesionales.length === 0) {
      toast.warning('No hay profesionales disponibles');
      return;
    }

    // Resetear estados
    setProfesionalesConHorarios([]);
    setErrorProfesionales([]);

    // Crear horarios para cada profesional secuencialmente
    for (const prof of profesionales) {
      await createSchedulesMutation.mutateAsync({
        profesionalId: prof.id,
        scheduleData,
      });
    }

    // Esperar un poco y avanzar al siguiente paso
    setTimeout(() => {
      nextStep();
    }, 500);
  };

  const handleSkip = () => {
    console.log('⏭️ Saltando configuración de horarios');
    nextStep();
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

  const totalProfesionales = profesionales?.length || 0;
  const procesados = profesionalesConHorarios.length + errorProfesionales.length;
  const progreso = totalProfesionales > 0 ? Math.round((procesados / totalProfesionales) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Configurar Horarios
        </h2>
        <p className="text-gray-600">
          Define el horario de trabajo para tus profesionales (puedes ajustarlo después)
        </p>
      </div>

      {/* Lista de profesionales */}
      {profesionales && profesionales.length > 0 ? (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">
            Profesionales ({totalProfesionales})
          </h3>
          <div className="space-y-2">
            {profesionales.map((prof) => {
              const tieneHorarios = profesionalesConHorarios.includes(prof.id);
              const tieneError = errorProfesionales.includes(prof.id);

              return (
                <div
                  key={prof.id}
                  className="flex items-center justify-between bg-white p-3 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full"
                      style={{ backgroundColor: prof.color_calendario }}
                    />
                    <div>
                      <p className="font-medium text-gray-900">{prof.nombre_completo}</p>
                      <p className="text-sm text-gray-600">{prof.tipo_nombre || 'Profesional'}</p>
                    </div>
                  </div>
                  {tieneHorarios && (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                  {tieneError && (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            No hay profesionales configurados. Puedes saltar este paso y configurar horarios después.
          </p>
        </div>
      )}

      {/* Formulario de configuración */}
      <form onSubmit={handleSubmit(handleCreateSchedules)} className="space-y-4 border-t pt-6">
        <h3 className="font-semibold text-gray-900">Configuración de Horario</h3>

        {/* Días de la semana */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Días de Trabajo <span className="text-red-500">*</span>
          </label>
          <Controller
            name="dias"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: 1, label: 'Lunes' },
                  { value: 2, label: 'Martes' },
                  { value: 3, label: 'Miércoles' },
                  { value: 4, label: 'Jueves' },
                  { value: 5, label: 'Viernes' },
                  { value: 6, label: 'Sábado' },
                  { value: 0, label: 'Domingo' },
                ].map((dia) => (
                  <label
                    key={dia.value}
                    className={`
                      flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all
                      ${field.value.includes(dia.value)
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      value={dia.value}
                      checked={field.value.includes(dia.value)}
                      onChange={(e) => {
                        const newValue = e.target.checked
                          ? [...field.value, dia.value]
                          : field.value.filter((v) => v !== dia.value);
                        field.onChange(newValue);
                      }}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-900">{dia.label}</span>
                  </label>
                ))}
              </div>
            )}
          />
          {errors.dias && (
            <p className="mt-1 text-sm text-red-600">{errors.dias.message}</p>
          )}
        </div>

        {/* Horarios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="hora_inicio"
            control={control}
            rules={{ required: 'La hora de inicio es requerida' }}
            render={({ field }) => (
              <Input
                {...field}
                type="time"
                label="Hora de Inicio"
                required
                error={errors.hora_inicio?.message}
              />
            )}
          />

          <Controller
            name="hora_fin"
            control={control}
            rules={{ required: 'La hora de fin es requerida' }}
            render={({ field }) => (
              <Input
                {...field}
                type="time"
                label="Hora de Fin"
                required
                error={errors.hora_fin?.message}
              />
            )}
          />
        </div>

        {/* Progreso */}
        {createSchedulesMutation.isPending && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">
                Creando horarios... ({procesados}/{totalProfesionales})
              </span>
              <span className="text-sm font-medium text-blue-900">{progreso}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>
        )}

        {/* Resultados */}
        {!createSchedulesMutation.isPending && procesados > 0 && (
          <div className="space-y-2">
            {profesionalesConHorarios.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  ✅ {profesionalesConHorarios.length} profesional(es) con horarios configurados
                </p>
              </div>
            )}
            {errorProfesionales.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  ⚠️ {errorProfesionales.length} profesional(es) con errores (puedes configurarlos después)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Botones de navegación */}
        <div className="flex justify-end pt-4 border-t">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={createSchedulesMutation.isPending}
            >
              Saltar
            </Button>
            <Button
              type="submit"
              isLoading={createSchedulesMutation.isPending}
              disabled={createSchedulesMutation.isPending || !profesionales || profesionales.length === 0}
            >
              {createSchedulesMutation.isPending ? 'Configurando...' : 'Configurar Horarios'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Step5_Schedules;

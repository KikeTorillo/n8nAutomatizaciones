import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { organizacionesApi } from '@/services/api/endpoints';
import useAuthStore, { selectUser } from '@/store/authStore';
import { Button } from '@/components/ui';
import {
  Rocket,
  Users,
  Clock,
  Briefcase,
  Link2,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from 'lucide-react';

/**
 * Checklist de Configuración Inicial
 * Guía al usuario para completar setup básico de la plataforma
 */
function SetupChecklist() {
  const navigate = useNavigate();
  const user = useAuthStore(selectUser);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Obtener progreso del setup
  const { data: setupProgress, isLoading } = useQuery({
    queryKey: ['setup-progress', user?.organizacion_id],
    queryFn: () => organizacionesApi.getSetupProgress(user?.organizacion_id),
    select: (response) => response.data.data,
    enabled: !!user?.organizacion_id,
    staleTime: 60 * 1000, // Cache de 1 minuto
  });

  // No mostrar si ya completó todo o si está cargando
  if (isLoading || !setupProgress || setupProgress.completed) {
    return null;
  }

  // Definir pasos del checklist
  const steps = [
    {
      id: 'profesionales',
      title: 'Crear primer profesional',
      description: 'Agrega al menos un miembro de tu equipo',
      completed: setupProgress.profesionales > 0,
      action: () => navigate('/profesionales'),
      icon: Users,
    },
    {
      id: 'horarios',
      title: 'Configurar horarios de trabajo',
      description: 'Define la disponibilidad de tus profesionales',
      completed: setupProgress.horarios_configurados,
      action: () => navigate('/profesionales'),
      icon: Clock,
    },
    {
      id: 'servicios',
      title: 'Crear primer servicio',
      description: 'Define los servicios que ofreces',
      completed: setupProgress.servicios > 0,
      action: () => navigate('/servicios'),
      icon: Briefcase,
    },
    {
      id: 'asignaciones',
      title: 'Asignar servicio a profesional',
      description: 'Conecta tus servicios con quienes los ofrecen',
      completed: setupProgress.asignaciones > 0,
      action: () => navigate('/servicios'),
      icon: Link2,
    },
  ];

  const { completed_steps, total_steps, percentage } = setupProgress.progress;

  return (
    <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-5 mb-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center flex-shrink-0">
            <Rocket className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
              Configura tu cuenta
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {completed_steps} de {total_steps} pasos completados
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1"
          aria-label={isCollapsed ? 'Expandir' : 'Colapsar'}
        >
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronUp className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-primary-500 dark:bg-primary-400 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Steps List */}
      {!isCollapsed && (
        <div className="space-y-2">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={step.action}
              disabled={step.completed}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                step.completed
                  ? 'bg-white dark:bg-gray-800 cursor-default'
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-sm cursor-pointer'
              }`}
            >
              {/* Icon/Checkbox */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step.completed ? 'bg-green-100 dark:bg-green-900/40' : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                {step.completed ? (
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <step.icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 text-left">
                <p
                  className={`text-sm font-medium ${
                    step.completed
                      ? 'text-gray-500 dark:text-gray-400 line-through'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {step.title}
                </p>
                {!step.completed && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>

              {/* Arrow */}
              {!step.completed && (
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Footer Message */}
      {!isCollapsed && completed_steps > 0 && completed_steps < total_steps && (
        <div className="mt-4 pt-4 border-t border-primary-200 dark:border-primary-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            ¡Vas muy bien! Completa los pasos restantes para aprovechar al máximo
            la plataforma
          </p>
        </div>
      )}
    </div>
  );
}

export default SetupChecklist;

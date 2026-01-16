import { useNavigate } from 'react-router-dom';
import { useModulos } from '@/hooks/useModulos';
import { Button } from '@/components/ui';
import {
  Sparkles,
  Calendar,
  Package,
  ShoppingCart,
  ArrowRight,
  Crown
} from 'lucide-react';

/**
 * Apps disponibles con iconos
 */
const APPS_INFO = {
  agendamiento: {
    nombre: 'Agendamiento',
    icon: Calendar,
    color: 'text-primary-600',
    bg: 'bg-primary-100'
  },
  inventario: {
    nombre: 'Inventario',
    icon: Package,
    color: 'text-green-600',
    bg: 'bg-green-100'
  },
  pos: {
    nombre: 'Punto de Venta',
    icon: ShoppingCart,
    color: 'text-purple-600',
    bg: 'bg-purple-100'
  }
};

/**
 * Banner de estado del plan (Modelo Free/Pro - Nov 2025)
 * Muestra información del plan actual y opción de upgrade
 */
function PlanStatusBanner() {
  const navigate = useNavigate();
  const {
    plan,
    esPlanFree,
    esPlanPro,
    esPlanTrial,
    appSeleccionada,
    isLoading
  } = useModulos();

  // No mostrar mientras carga
  if (isLoading || !plan) {
    return null;
  }

  // Banner para Plan Free
  if (esPlanFree && appSeleccionada) {
    const appInfo = APPS_INFO[appSeleccionada];
    const Icon = appInfo?.icon || Sparkles;

    // Apps que NO tiene (las otras dos)
    const appsNoDisponibles = Object.entries(APPS_INFO)
      .filter(([key]) => key !== appSeleccionada)
      .map(([key, info]) => ({ key, ...info }));

    return (
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {/* Plan actual */}
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                Plan Free
              </span>
              <div className={`flex items-center gap-1.5 ${appInfo?.color || 'text-gray-600 dark:text-gray-400'}`}>
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{appInfo?.nombre || appSeleccionada}</span>
              </div>
            </div>

            {/* Mensaje */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Estás usando el Plan Free con acceso a <strong>{appInfo?.nombre}</strong>.
              Actualiza a Pro para desbloquear todas las apps.
            </p>

            {/* Apps no disponibles */}
            <div className="flex flex-wrap gap-2 mb-3">
              {appsNoDisponibles.map(({ key, nombre, icon: AppIcon, color, bg }) => (
                <div
                  key={key}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                >
                  <AppIcon className="w-3.5 h-3.5" />
                  <span className="text-xs">{nombre}</span>
                  <span className="text-xs opacity-60">(Bloqueado)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Botón upgrade */}
          <Button
            size="sm"
            onClick={() => navigate('/suscripcion')}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <Crown className="w-4 h-4" />
            Actualizar a Pro
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Trial se maneja en TrialStatusWidget (más detallado)
  if (esPlanTrial) {
    return null;
  }

  // Banner para Plan Pro (mostrar que tiene todo)
  if (esPlanPro) {
    return (
      <div className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/30 dark:to-purple-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary-600 dark:bg-primary-500 text-white rounded-full p-1.5">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-medium text-primary-900 dark:text-primary-100">Plan Pro</span>
            <span className="text-sm text-primary-700 dark:text-primary-300 ml-2">
              Todas las apps incluidas
            </span>
          </div>
        </div>
      </div>
    );
  }

  // No mostrar nada para otros casos
  return null;
}

export default PlanStatusBanner;

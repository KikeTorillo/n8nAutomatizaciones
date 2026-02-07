import { useQuery } from '@tanstack/react-query';
import { useAuthStore, selectUser } from '@/features/auth';
import { organizacionesApi } from '@/services/api/modules/organizaciones.api';
import { queryKeys } from '@/hooks/config';

/**
 * Hook para obtener el estado de suscripción de la organización actual
 * Usado para mostrar el TrialBanner en el Home y verificar límites del plan
 *
 * IMPORTANTE: Este hook retorna TODOS los datos de suscripción.
 * Para acceder a campos específicos, usar directamente:
 *   const { data } = useEstadoSuscripcion();
 *   const modulosHabilitados = data?.modulos_habilitados ?? [];
 *   const planActual = { codigo: data?.plan_actual, nombre: data?.plan_nombre };
 *
 * Feb 2026: Eliminados hooks wrapper duplicados (useModulosHabilitadosPlan, usePlanActual)
 *           para evitar múltiples queries y mantener una única fuente de verdad.
 *
 * @param {Object} options - Opciones del hook
 * @param {boolean} options.enabled - Si debe ejecutar la query (default: true)
 * @returns {Object} { data, isLoading, isError, ... }
 *
 * data contiene:
 *   - plan_actual: código del plan ('trial', 'basico', 'pro', etc.)
 *   - plan_nombre: nombre legible del plan
 *   - es_trial: boolean
 *   - dias_restantes_trial: número
 *   - fecha_fin_trial: string ISO date
 *   - trial_expirado: boolean
 *   - modulos_activos: { core: true, agendamiento: true, ... }
 *   - modulos_habilitados: ['agendamiento', 'inventario', ...] - módulos permitidos por el plan
 *   - estado_suscripcion: 'activa', 'trial', 'pendiente_pago', etc.
 *   - fecha_proximo_cobro: string ISO date (si aplica)
 */
export function useEstadoSuscripcion({ enabled = true } = {}) {
  const user = useAuthStore(selectUser);
  const organizacionId = user?.organizacion_id;

  return useQuery({
    queryKey: queryKeys.sistema.suscripcion.estado(organizacionId),
    queryFn: async () => {
      const response = await organizacionesApi.getEstadoSuscripcion(organizacionId);
      return response.data?.data || response.data;
    },
    enabled: enabled && !!organizacionId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });
}

/**
 * Selector para verificar si la org está en trial
 */
export function useEsTrial() {
  const { data } = useEstadoSuscripcion();
  return data?.es_trial ?? false;
}

/**
 * Selector para obtener días restantes del trial
 */
export function useDiasRestantesTrial() {
  const { data } = useEstadoSuscripcion();
  return data?.dias_restantes_trial ?? 0;
}

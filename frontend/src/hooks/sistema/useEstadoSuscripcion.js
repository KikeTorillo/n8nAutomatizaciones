import { useQuery } from '@tanstack/react-query';
import useAuthStore, { selectUser } from '@/store/authStore';
import { organizacionesApi } from '@/services/api/modules/organizaciones.api';

/**
 * Hook para obtener el estado de suscripción de la organización actual
 * Usado para mostrar el TrialBanner en el Home
 *
 * @param {Object} options - Opciones del hook
 * @param {boolean} options.enabled - Si debe ejecutar la query (default: true)
 * @returns {Object} { data, isLoading, isError, ... }
 */
export function useEstadoSuscripcion({ enabled = true } = {}) {
  const user = useAuthStore(selectUser);
  const organizacionId = user?.organizacion_id;

  return useQuery({
    queryKey: ['estado-suscripcion', organizacionId],
    queryFn: async () => {
      const response = await organizacionesApi.getEstadoSuscripcion(organizacionId);
      return response.data?.data || response.data;
    },
    enabled: enabled && !!organizacionId, // FIX RBAC Ene 2026
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

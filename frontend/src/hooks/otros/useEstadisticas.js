import { useQuery } from '@tanstack/react-query';
import { organizacionesApi, serviciosApi, bloqueosApi } from '@/services/api/endpoints';
import useAuthStore from '@/store/authStore';
import { aFormatoISO } from '@/utils/dateHelpers';

/**
 * Hooks para obtener estadísticas y datos agregados del dashboard
 *
 * Este archivo contiene hooks especializados para el dashboard:
 * - useEstadisticasOrganizacion: Métricas generales de la organización
 * - useServiciosDashboard: Lista de servicios (versión simplificada para dashboard)
 * - useBloqueosDashboard: Bloqueos en los próximos 30 días
 */

/**
 * Hook para obtener estadísticas de la organización
 * Incluye: uso del plan, métricas de citas, profesionales, servicios
 *
 * @returns {Object} { data, isLoading, error }
 */
export function useEstadisticasOrganizacion() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['estadisticas', user?.organizacion_id],
    queryFn: async () => {
      const response = await organizacionesApi.obtenerEstadisticas(user.organizacion_id);
      return response.data.data;
    },
    enabled: !!user?.organizacion_id,
    staleTime: 1000 * 60, // 1 minuto de cache
  });
}

/**
 * Hook para obtener servicios (Dashboard)
 * Versión simplificada sin filtros para uso en dashboard
 *
 * @returns {Object} { data, isLoading, error }
 * @note Renombrado para evitar conflicto con useServicios de hooks/useServicios.js
 */
export function useServiciosDashboard() {
  return useQuery({
    queryKey: ['servicios-dashboard'],
    queryFn: async () => {
      const response = await serviciosApi.listar();
      // Backend retorna: { data: { servicios: [...], ... } }
      return response.data.data.servicios || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutos de cache
  });
}

/**
 * Hook para obtener bloqueos activos en los próximos 30 días
 * Usado en dashboard para mostrar alertas de bloqueos próximos
 *
 * @returns {Object} { data, isLoading, error }
 */
export function useBloqueosDashboard() {
  // ✅ FIX: Usar fecha LOCAL en vez de UTC
  const hoy = aFormatoISO(new Date());
  const treintaDiasAdelante = aFormatoISO(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );

  return useQuery({
    queryKey: ['bloqueos-dashboard', hoy, treintaDiasAdelante],
    queryFn: async () => {
      const response = await bloqueosApi.listar({
        fecha_inicio: hoy,
        fecha_fin: treintaDiasAdelante,
      });
      // Backend retorna: { data: { bloqueos: [...], paginacion: {...} } }
      return response.data.data?.bloqueos || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

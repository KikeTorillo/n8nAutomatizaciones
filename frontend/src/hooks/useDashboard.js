import { useQuery } from '@tanstack/react-query';
import { organizacionesApi, citasApi, profesionalesApi, serviciosApi, clientesApi } from '@/services/api/endpoints';
import useAuthStore from '@/store/authStore';

/**
 * Hook para obtener estadísticas de la organización
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
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para obtener citas del día
 */
export function useCitasDelDia() {
  const hoy = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['citas-del-dia', hoy],
    queryFn: async () => {
      const response = await citasApi.listar({
        fecha_desde: hoy,
        fecha_hasta: hoy,
      });
      // Backend retorna: { data: { citas: [...], meta: {...} } }
      return response.data.data.citas || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
    refetchInterval: 1000 * 60 * 5, // Refetch cada 5 minutos
  });
}

/**
 * Hook para obtener profesionales
 */
export function useProfesionales() {
  return useQuery({
    queryKey: ['profesionales'],
    queryFn: async () => {
      const response = await profesionalesApi.listar();
      // Backend retorna: { data: { profesionales: [...], filtros_aplicados: {...}, total: N } }
      return response.data.data.profesionales || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Hook para obtener servicios
 */
export function useServicios() {
  return useQuery({
    queryKey: ['servicios'],
    queryFn: async () => {
      const response = await serviciosApi.listar();
      // Backend retorna: { data: { servicios: [...], ... } }
      return response.data.data.servicios || [];
    },
    staleTime: 0, // Sin cache - siempre fresco
    refetchOnMount: 'always', // Refetch al montar componente
  });
}

/**
 * Hook para obtener clientes
 */
export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const response = await clientesApi.listar();
      // Backend retorna: { data: [...] } (array directo)
      const data = response.data.data;
      // Si data es array, retornarlo, sino buscar en data.clientes
      return Array.isArray(data) ? data : (data.clientes || []);
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

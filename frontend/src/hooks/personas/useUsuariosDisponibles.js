/**
 * Hook para obtener usuarios disponibles para vincular a profesionales
 * (usuarios activos sin profesional asignado)
 */

import { useQuery } from '@tanstack/react-query';
import { profesionalesApi } from '@/services/api/endpoints';
import { STALE_TIMES } from '@/app/queryClient';

/**
 * Hook para obtener usuarios que pueden ser vinculados a profesionales
 * @param {Object} options
 * @param {string} options.busqueda - Término de búsqueda para filtrar por email/nombre
 * @param {boolean} options.enabled - Si debe ejecutar la query (default: true)
 * @returns {Object} Query result con usuarios disponibles
 */
export function useUsuariosDisponibles({ busqueda = '', enabled = true } = {}) {
  return useQuery({
    queryKey: ['usuarios-disponibles', busqueda],
    queryFn: async () => {
      const response = await profesionalesApi.usuariosDisponibles();
      const usuarios = response.data?.data?.usuarios || [];

      // Filtrar en frontend si hay búsqueda (el backend no soporta filtro)
      if (busqueda && busqueda.length >= 2) {
        const termino = busqueda.toLowerCase();
        return usuarios.filter(
          (u) =>
            u.email?.toLowerCase().includes(termino) ||
            u.nombre?.toLowerCase().includes(termino)
        );
      }

      return usuarios;
    },
    enabled,
    staleTime: STALE_TIMES.REAL_TIME, // 30 segundos - puede cambiar frecuentemente
  });
}

export default useUsuariosDisponibles;

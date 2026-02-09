/**
 * Hook para gestionar ubicaciones de trabajo
 * Soporte para trabajo híbrido
 * Feb 2026 - Migrado a createCRUDHooks
 */
import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { ubicacionesTrabajoApi } from '@/services/api/endpoints';
import { createCRUDHooks } from '@/hooks/factories';
import { queryKeys } from '@/hooks/config';

// =========================================================================
// HOOKS CRUD VIA FACTORY
// =========================================================================

const hooks = createCRUDHooks({
  name: 'ubicacionTrabajo',
  namePlural: 'ubicacionesTrabajo',
  api: ubicacionesTrabajoApi,
  baseKey: 'ubicaciones-trabajo',
  apiMethods: {
    list: 'listar',
    get: 'obtener',
    create: 'crear',
    update: 'actualizar',
    delete: 'eliminar',
  },
  staleTime: STALE_TIMES.SEMI_STATIC,
});

// Exportar hooks CRUD
export const useUbicacionesTrabajo = hooks.useList;
export const useUbicacionTrabajo = hooks.useDetail;
export const useCrearUbicacionTrabajo = hooks.useCreate;
export const useActualizarUbicacionTrabajo = hooks.useUpdate;
export const useEliminarUbicacionTrabajo = hooks.useDelete;

// =========================================================================
// HOOKS ESPECIALIZADOS
// =========================================================================

/**
 * Hook para obtener estadísticas de uso por día de la semana
 */
export const useUbicacionesTrabajoEstadisticas = () => {
  return useQuery({
    queryKey: [...queryKeys.catalogos.ubicacionesTrabajo, 'estadisticas'],
    queryFn: async () => {
      const response = await ubicacionesTrabajoApi.estadisticas();
      return response.data.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
};

/**
 * Hook para obtener opciones de ubicación para select
 * Devuelve las ubicaciones activas formateadas para usar en un Select
 */
export const useUbicacionesTrabajoOptions = () => {
  const query = useUbicacionesTrabajo({ activas: true });

  const options = (query.data?.ubicaciones || []).map((ubicacion) => ({
    value: ubicacion.id,
    label: ubicacion.nombre,
    color: ubicacion.color,
    esRemoto: ubicacion.es_remoto,
    esOficinaPrincipal: ubicacion.es_oficina_principal,
    icono: ubicacion.icono,
  }));

  return {
    ...query,
    options,
  };
};

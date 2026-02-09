/**
 * Hook para gestionar motivos de salida
 * Catálogo dinámico de razones de terminación
 * Feb 2026 - Migrado a createCRUDHooks
 */
import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { motivosSalidaApi } from '@/services/api/endpoints';
import { createCRUDHooks } from '@/hooks/factories';
import { queryKeys } from '@/hooks/config';

// =========================================================================
// HOOKS CRUD VIA FACTORY
// =========================================================================

const hooks = createCRUDHooks({
  name: 'motivoSalida',
  namePlural: 'motivosSalida',
  api: motivosSalidaApi,
  baseKey: 'motivos-salida',
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
export const useMotivosSalida = hooks.useList;
export const useMotivoSalida = hooks.useDetail;
export const useCrearMotivoSalida = hooks.useCreate;
export const useActualizarMotivoSalida = hooks.useUpdate;
export const useEliminarMotivoSalida = hooks.useDelete;

// =========================================================================
// HOOKS ESPECIALIZADOS
// =========================================================================

/**
 * Hook para obtener estadísticas de uso de motivos
 */
export const useMotivosSalidaEstadisticas = () => {
  return useQuery({
    queryKey: [...queryKeys.catalogos.motivosSalida, 'estadisticas'],
    queryFn: async () => {
      const response = await motivosSalidaApi.estadisticas();
      return response.data.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
};

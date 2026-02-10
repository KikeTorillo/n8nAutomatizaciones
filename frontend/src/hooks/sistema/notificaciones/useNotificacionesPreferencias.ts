/**
 * Preferencias de Notificaciones
 * Extraído de useNotificaciones.ts — Feb 2026
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { notificacionesApi } from '@/services/api/endpoints';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';
import type { ActualizarPreferenciasData } from './notificacionesConstants';

export function useNotificacionesPreferencias() {
  return useQuery({
    queryKey: queryKeys.sistema.notificaciones.preferencias,
    queryFn: async () => {
      const response = await notificacionesApi.obtenerPreferencias();
      return (response as any).data.data || {};
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

export function useActualizarNotificacionesPreferencias() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferencias: ActualizarPreferenciasData) => {
      const response = await notificacionesApi.actualizarPreferencias({ preferencias } as any);
      return (response as any).data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.notificaciones.preferencias, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Preferencias'),
  });
}

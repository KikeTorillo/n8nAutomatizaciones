/**
 * Plantillas de Notificaciones (Admin)
 * Extraído de useNotificaciones.ts — Feb 2026
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { notificacionesApi } from '@/services/api/endpoints';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';
import type { CrearPlantillaData, ActualizarPlantillaParams } from './notificacionesConstants';

export function useNotificacionesPlantillas() {
  return useQuery({
    queryKey: queryKeys.sistema.notificaciones.plantillas,
    queryFn: async () => {
      const response = await notificacionesApi.listarPlantillas();
      return (response as any).data.data || [];
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

export function useCrearNotificacionPlantilla() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CrearPlantillaData) => {
      const sanitized = Object.entries(data).reduce<Record<string, unknown>>((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await notificacionesApi.crearPlantilla(sanitized);
      return (response as any).data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.notificaciones.plantillas, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Plantilla'),
  });
}

export function useActualizarNotificacionPlantilla() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: ActualizarPlantillaParams) => {
      const sanitized = Object.entries(data).reduce<Record<string, unknown>>((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value === '' ? null : value;
        }
        return acc;
      }, {});

      const response = await notificacionesApi.actualizarPlantilla(id, sanitized);
      return (response as any).data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.notificaciones.plantillas, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Plantilla'),
  });
}

export function useEliminarNotificacionPlantilla() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await notificacionesApi.eliminarPlantilla(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.notificaciones.plantillas, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('delete', 'Plantilla'),
  });
}

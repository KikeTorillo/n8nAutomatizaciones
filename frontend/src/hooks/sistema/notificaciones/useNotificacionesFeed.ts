/**
 * Feed de Notificaciones — queries y mutations del feed
 * Extraído de useNotificaciones.ts — Feb 2026
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { notificacionesApi } from '@/services/api/endpoints';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';
import type { NotificacionListParams, CrearNotificacionData } from './notificacionesConstants';

export function useNotificaciones(params: NotificacionListParams = {}) {
  return useQuery({
    queryKey: queryKeys.sistema.notificaciones.list(params),
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce<Record<string, unknown>>((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await notificacionesApi.listar(sanitizedParams);
      return (response as any).data.data || [];
    },
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

export function useNotificacionesCount() {
  return useQuery({
    queryKey: queryKeys.sistema.notificaciones.count,
    queryFn: async () => {
      const response = await notificacionesApi.contarNoLeidas();
      return (response as any).data.data?.no_leidas || 0;
    },
    staleTime: STALE_TIMES.REAL_TIME,
    refetchInterval: 1000 * 60,
  });
}

export function useNotificacionesTipos() {
  return useQuery({
    queryKey: queryKeys.sistema.notificaciones.tipos,
    queryFn: async () => {
      const response = await notificacionesApi.obtenerTipos();
      return (response as any).data.data || {};
    },
    staleTime: STALE_TIMES.STATIC_DATA,
  });
}

export function useMarcarNotificacionLeida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await notificacionesApi.marcarLeida(id);
      return (response as any).data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.notificaciones.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.notificaciones.count, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Notificacion'),
  });
}

export function useMarcarTodasNotificacionesLeidas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await notificacionesApi.marcarTodasLeidas();
      return (response as any).data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.notificaciones.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.notificaciones.count, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Notificaciones'),
  });
}

export function useArchivarNotificacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await notificacionesApi.archivar(id);
      return (response as any).data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.notificaciones.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.notificaciones.count, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Notificacion'),
  });
}

export function useEliminarNotificacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await notificacionesApi.eliminar(id);
      return (response as any).data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.notificaciones.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.notificaciones.count, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('delete', 'Notificacion'),
  });
}

export function useCrearNotificacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CrearNotificacionData) => {
      const sanitized = Object.entries(data).reduce<Record<string, unknown>>((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await notificacionesApi.crear(sanitized);
      return (response as any).data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.notificaciones.all, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Notificacion'),
  });
}

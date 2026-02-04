/**
 * Hooks para gestión de invitados
 *
 * Ene 2026: Extraído de useEventosDigitales.js para mejor mantenibilidad
 * Feb 2026: Migrado a EVENTO_QUERY_KEYS centralizados
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { eventosDigitalesApi } from '@/services/api/endpoints';
import { sanitizeParams } from '@/lib/params';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { EVENTO_QUERY_KEYS, invalidateInvitadosDependencies } from './helpers';

// ==================== QUERIES INVITADOS ====================

/**
 * Hook para listar invitados de un evento
 * @param {number} eventoId - ID del evento
 * @param {Object} params - { estado_rsvp?, busqueda?, pagina?, limite? }
 * @returns {Object} { data: { invitados, paginacion }, isLoading, error }
 */
export function useInvitados(eventoId, params = {}) {
  return useQuery({
    queryKey: [...EVENTO_QUERY_KEYS.invitados(eventoId), params],
    queryFn: async () => {
      const response = await eventosDigitalesApi.listarInvitados(eventoId, sanitizeParams(params));
      const data = response.data.data;
      return {
        invitados: data.invitados || [],
        paginacion: data.paginacion || null,
        total: data.paginacion?.total || data.invitados?.length || 0,
      };
    },
    enabled: !!eventoId,
    staleTime: STALE_TIMES.FREQUENT,
    keepPreviousData: true,
  });
}

// ==================== MUTATIONS INVITADOS ====================

/**
 * Hook para crear invitado
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useCrearInvitado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventoId, data }) => {
      const sanitized = {
        ...data,
        email: data.email?.trim() || undefined,
        telefono: data.telefono?.trim() || undefined,
        grupo_familiar: data.grupo_familiar?.trim() || undefined,
        notas: data.notas?.trim() || undefined,
      };
      const response = await eventosDigitalesApi.crearInvitado(eventoId, sanitized);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      invalidateInvitadosDependencies(queryClient, variables.eventoId);
    },
    onError: createCRUDErrorHandler('create', 'Invitado', {
      409: 'Ya existe un invitado con ese email o telefono',
      429: 'Has alcanzado el limite de invitados de tu plan',
    }),
  });
}

/**
 * Hook para actualizar invitado
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useActualizarInvitado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventoId, data }) => {
      const sanitized = {
        ...data,
        email: data.email?.trim() || undefined,
        telefono: data.telefono?.trim() || undefined,
        grupo_familiar: data.grupo_familiar?.trim() || undefined,
        notas: data.notas?.trim() || undefined,
      };
      const response = await eventosDigitalesApi.actualizarInvitado(id, sanitized);
      return { ...response.data.data, eventoId };
    },
    onSuccess: (data) => {
      invalidateInvitadosDependencies(queryClient, data.eventoId);
    },
    onError: createCRUDErrorHandler('update', 'Invitado'),
  });
}

/**
 * Hook para eliminar invitado
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useEliminarInvitado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventoId }) => {
      const response = await eventosDigitalesApi.eliminarInvitado(id);
      return { ...response.data, eventoId };
    },
    onSuccess: (data) => {
      invalidateInvitadosDependencies(queryClient, data.eventoId);
    },
    onError: createCRUDErrorHandler('delete', 'Invitado'),
  });
}

/**
 * Hook para importar invitados desde CSV
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useImportarInvitados() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventoId, formData }) => {
      const response = await eventosDigitalesApi.importarInvitados(eventoId, formData);
      return { ...response.data.data, eventoId };
    },
    onSuccess: (data) => {
      invalidateInvitadosDependencies(queryClient, data.eventoId);
    },
    onError: createCRUDErrorHandler('create', 'Invitados'),
  });
}

/**
 * Hook para exportar invitados a CSV
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useExportarInvitados() {
  return useMutation({
    mutationFn: async (eventoId) => {
      const response = await eventosDigitalesApi.exportarInvitados(eventoId);
      return response.data;
    },
    onError: createCRUDErrorHandler('fetch', 'Invitados'),
  });
}

// ==================== QUERIES UBICACIONES ====================

/**
 * Hook para listar ubicaciones de un evento
 * @param {number} eventoId - ID del evento
 * @returns {Object} { data: ubicaciones[], isLoading, error }
 */
export function useUbicacionesEvento(eventoId) {
  return useQuery({
    queryKey: EVENTO_QUERY_KEYS.ubicaciones(eventoId),
    queryFn: async () => {
      const response = await eventosDigitalesApi.listarUbicaciones(eventoId);
      return response.data.data.ubicaciones || [];
    },
    enabled: !!eventoId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

// ==================== MUTATIONS UBICACIONES ====================

/**
 * Hook para crear ubicación
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useCrearUbicacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventoId, data }) => {
      const sanitized = {
        ...data,
        descripcion: data.descripcion?.trim() || undefined,
        direccion: data.direccion?.trim() || undefined,
        google_maps_url: data.google_maps_url?.trim() || undefined,
        waze_url: data.waze_url?.trim() || undefined,
        notas: data.notas?.trim() || undefined,
      };
      const response = await eventosDigitalesApi.crearUbicacion(eventoId, sanitized);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: EVENTO_QUERY_KEYS.ubicaciones(variables.eventoId),
        refetchType: 'active'
      });
    },
    onError: createCRUDErrorHandler('create', 'Ubicacion'),
  });
}

/**
 * Hook para actualizar ubicación
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useActualizarUbicacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventoId, data }) => {
      const sanitized = {
        ...data,
        descripcion: data.descripcion?.trim() || undefined,
        direccion: data.direccion?.trim() || undefined,
        google_maps_url: data.google_maps_url?.trim() || undefined,
        waze_url: data.waze_url?.trim() || undefined,
        notas: data.notas?.trim() || undefined,
      };
      const response = await eventosDigitalesApi.actualizarUbicacion(id, sanitized);
      return { ...response.data.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: EVENTO_QUERY_KEYS.ubicaciones(data.eventoId),
        refetchType: 'active'
      });
    },
    onError: createCRUDErrorHandler('update', 'Ubicacion'),
  });
}

/**
 * Hook para eliminar ubicación
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useEliminarUbicacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventoId }) => {
      const response = await eventosDigitalesApi.eliminarUbicacion(id);
      return { ...response.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: EVENTO_QUERY_KEYS.ubicaciones(data.eventoId),
        refetchType: 'active'
      });
    },
    onError: createCRUDErrorHandler('delete', 'Ubicacion'),
  });
}

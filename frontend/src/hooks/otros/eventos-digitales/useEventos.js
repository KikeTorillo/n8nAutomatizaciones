/**
 * Hooks para CRUD de eventos y plantillas
 *
 * Ene 2026: Extraído de useEventosDigitales.js para mejor mantenibilidad
 * Feb 2026: Migrado a EVENTO_QUERY_KEYS centralizados
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { eventosDigitalesApi } from '@/services/api/endpoints';
import { sanitizeParams } from '@/lib/params';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { EVENTO_QUERY_KEYS, invalidateEventosList } from './helpers';

// ==================== QUERIES EVENTOS ====================

/**
 * Hook para listar eventos de la organización
 * @param {Object} params - { estado?, tipo?, busqueda?, pagina?, limite? }
 * @returns {Object} { data: { eventos, paginacion }, isLoading, error }
 */
export function useEventos(params = {}) {
  return useQuery({
    queryKey: [...EVENTO_QUERY_KEYS.eventos(), params],
    queryFn: async () => {
      const response = await eventosDigitalesApi.listarEventos(sanitizeParams(params));
      return {
        eventos: response.data.data.eventos || [],
        paginacion: response.data.data.paginacion || null,
        total: response.data.data.total || 0,
      };
    },
    staleTime: STALE_TIMES.FREQUENT,
    keepPreviousData: true,
  });
}

/**
 * Hook para obtener evento por ID
 * @param {number} id - ID del evento
 * @returns {Object} { data: evento, isLoading, error }
 */
export function useEvento(id) {
  return useQuery({
    queryKey: EVENTO_QUERY_KEYS.evento(id),
    queryFn: async () => {
      const response = await eventosDigitalesApi.obtenerEvento(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener estadísticas RSVP del evento
 * @param {number} eventoId - ID del evento
 * @returns {Object} { data: estadisticas, isLoading, error }
 */
export function useEventoEstadisticas(eventoId) {
  return useQuery({
    queryKey: EVENTO_QUERY_KEYS.eventoEstadisticas(eventoId),
    queryFn: async () => {
      const response = await eventosDigitalesApi.obtenerEstadisticasEvento(eventoId);
      return response.data.data;
    },
    enabled: !!eventoId,
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

// ==================== MUTATIONS EVENTOS ====================

/**
 * Hook para crear evento
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useCrearEvento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = {
        ...data,
        descripcion: data.descripcion?.trim() || undefined,
        hora_evento: data.hora_evento || undefined,
        fecha_limite_rsvp: data.fecha_limite_rsvp || undefined,
      };
      const response = await eventosDigitalesApi.crearEvento(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      invalidateEventosList(queryClient);
    },
    onError: createCRUDErrorHandler('create', 'Evento', {
      409: 'Ya existe un evento con ese nombre',
      429: 'Has alcanzado el limite de eventos de tu plan',
    }),
  });
}

/**
 * Hook para actualizar evento
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useActualizarEvento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const sanitized = {
        ...data,
        descripcion: data.descripcion?.trim() || undefined,
        hora_evento: data.hora_evento || undefined,
        fecha_limite_rsvp: data.fecha_limite_rsvp || undefined,
      };
      const response = await eventosDigitalesApi.actualizarEvento(id, sanitized);
      return response.data.data;
    },
    onSuccess: (data) => {
      invalidateEventosList(queryClient);
      queryClient.invalidateQueries({
        queryKey: EVENTO_QUERY_KEYS.evento(data.id),
        refetchType: 'active'
      });
      if (data.slug) {
        queryClient.invalidateQueries({
          queryKey: ['evento-publico', data.slug],
          refetchType: 'active'
        });
      }
    },
    onError: createCRUDErrorHandler('update', 'Evento'),
  });
}

/**
 * Hook para eliminar evento
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useEliminarEvento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await eventosDigitalesApi.eliminarEvento(id);
      return response.data;
    },
    onSuccess: () => {
      invalidateEventosList(queryClient);
    },
    onError: createCRUDErrorHandler('delete', 'Evento'),
  });
}

/**
 * Hook para publicar evento
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function usePublicarEvento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await eventosDigitalesApi.publicarEvento(id);
      return response.data.data;
    },
    onSuccess: (data) => {
      invalidateEventosList(queryClient);
      queryClient.invalidateQueries({
        queryKey: EVENTO_QUERY_KEYS.evento(data.id),
        refetchType: 'active'
      });
    },
    onError: createCRUDErrorHandler('update', 'Evento', {
      400: 'El evento ya esta publicado',
    }),
  });
}

// ==================== QUERIES PLANTILLAS ====================

/**
 * Hook para listar plantillas disponibles
 * @param {Object} params - { tipo_evento?, es_premium? }
 * @returns {Object} { data: plantillas[], isLoading, error }
 */
export function usePlantillas(params = {}) {
  return useQuery({
    queryKey: [...EVENTO_QUERY_KEYS.plantillas(), params],
    queryFn: async () => {
      const response = await eventosDigitalesApi.listarPlantillas(sanitizeParams(params));
      return response.data.data.plantillas || [];
    },
    staleTime: STALE_TIMES.STATIC_DATA,
  });
}

/**
 * Hook para obtener plantilla por ID
 * @param {number} id - ID de la plantilla
 * @returns {Object} { data: plantilla, isLoading, error }
 */
export function usePlantilla(id) {
  return useQuery({
    queryKey: EVENTO_QUERY_KEYS.plantilla(id),
    queryFn: async () => {
      const response = await eventosDigitalesApi.obtenerPlantilla(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.STATIC_DATA,
  });
}

/**
 * Hook para listar plantillas por tipo de evento
 * @param {string} tipoEvento - boda, xv_anos, bautizo, cumpleanos, corporativo, otro
 * @returns {Object} { data: plantillas[], isLoading, error }
 */
export function usePlantillasPorTipo(tipoEvento) {
  return useQuery({
    queryKey: ['plantillas-tipo', tipoEvento],
    queryFn: async () => {
      const response = await eventosDigitalesApi.listarPlantillasPorTipo(tipoEvento);
      return response.data.data.plantillas || [];
    },
    enabled: !!tipoEvento,
    staleTime: STALE_TIMES.STATIC_DATA,
  });
}

// ==================== MUTATIONS PLANTILLAS (super_admin) ====================

/**
 * Hook para crear plantilla (solo super_admin)
 * @returns {Object} Mutation object
 */
export function useCrearPlantilla() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await eventosDigitalesApi.crearPlantilla(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: EVENTO_QUERY_KEYS.plantillas(),
        refetchType: 'active'
      });
      queryClient.invalidateQueries({
        queryKey: ['plantillas-tipo'],
        refetchType: 'active'
      });
    },
  });
}

/**
 * Hook para actualizar plantilla (solo super_admin)
 * @returns {Object} Mutation object
 */
export function useActualizarPlantilla() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await eventosDigitalesApi.actualizarPlantilla(id, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: EVENTO_QUERY_KEYS.plantillas(),
        refetchType: 'active'
      });
      queryClient.invalidateQueries({
        queryKey: ['plantillas-tipo'],
        refetchType: 'active'
      });
      queryClient.invalidateQueries({
        queryKey: EVENTO_QUERY_KEYS.plantilla(variables.id),
        refetchType: 'active'
      });
    },
  });
}

/**
 * Hook para eliminar plantilla (solo super_admin)
 * @returns {Object} Mutation object
 */
export function useEliminarPlantilla() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await eventosDigitalesApi.eliminarPlantilla(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: EVENTO_QUERY_KEYS.plantillas(),
        refetchType: 'active'
      });
      queryClient.invalidateQueries({
        queryKey: ['plantillas-tipo'],
        refetchType: 'active'
      });
    },
  });
}

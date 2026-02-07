/**
 * Hooks para CRUD de eventos y plantillas
 *
 * Ene 2026: Extraído de useEventosDigitales.js para mejor mantenibilidad
 * Feb 2026: Migrado hooks raíz a createCRUDHooks factory
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { eventosDigitalesApi } from '@/services/api/endpoints';
import { sanitizeParams } from '@/lib/params';
import { createCRUDHooks, createSanitizer } from '@/hooks/factories/createCRUDHooks';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';
import { EVENTO_QUERY_KEYS, invalidateEventosList } from './helpers';

// ==================== FACTORY: EVENTOS ====================

const sanitizeEvento = createSanitizer([
  'descripcion',
  'hora_evento',
  'fecha_limite_rsvp',
]);

const eventoHooks = createCRUDHooks({
  name: 'evento-digital',
  namePlural: 'eventos-digitales',
  api: eventosDigitalesApi,
  baseKey: 'eventos-digitales',
  apiMethods: {
    list: 'listarEventos',
    get: 'obtenerEvento',
    create: 'crearEvento',
    update: 'actualizarEvento',
    delete: 'eliminarEvento',
  },
  sanitize: sanitizeEvento,
  responseKey: 'eventos',
  staleTime: STALE_TIMES.FREQUENT,
  errorMessages: {
    create: {
      409: 'Ya existe un evento con ese nombre',
      429: 'Has alcanzado el limite de eventos de tu plan',
    },
  },
});

// ==================== QUERIES EVENTOS ====================

export const useEventos = eventoHooks.useList;
export const useEvento = eventoHooks.useDetail;
export const useCrearEvento = eventoHooks.useCreate;
export const useEliminarEvento = eventoHooks.useDelete;

/**
 * Hook para actualizar evento
 * Wrapper sobre factory para lógica custom: actualizar slug público
 */
export function useActualizarEvento() {
  const mutation = eventoHooks.useUpdate();
  const queryClient = useQueryClient();

  const originalMutateAsync = mutation.mutateAsync;

  return {
    ...mutation,
    mutateAsync: async (...args) => {
      const result = await originalMutateAsync(...args);
      // Actualizar cache con String(id) por useParams
      if (result?.id) {
        queryClient.setQueryData(EVENTO_QUERY_KEYS.evento(String(result.id)), result);
      }
      if (result?.slug) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.eventosDigitales.publico.evento(result.slug),
          refetchType: 'all',
        });
      }
      return result;
    },
  };
}

/**
 * Hook para obtener estadísticas RSVP del evento
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

/**
 * Hook para publicar evento
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
        refetchType: 'active',
      });
    },
    onError: createCRUDErrorHandler('update', 'Evento', {
      400: 'El evento ya esta publicado',
    }),
  });
}

// ==================== FACTORY: PLANTILLAS ====================

const plantillaHooks = createCRUDHooks({
  name: 'plantilla',
  namePlural: 'plantillas',
  api: eventosDigitalesApi,
  baseKey: 'plantillas-eventos',
  apiMethods: {
    list: 'listarPlantillas',
    get: 'obtenerPlantilla',
    create: 'crearPlantilla',
    update: 'actualizarPlantilla',
    delete: 'eliminarPlantilla',
  },
  responseKey: 'plantillas',
  staleTime: STALE_TIMES.STATIC_DATA,
  invalidateOnCreate: ['plantillas-eventos', 'plantillas-tipo'],
  invalidateOnUpdate: ['plantillas-eventos', 'plantillas-tipo'],
  invalidateOnDelete: ['plantillas-eventos', 'plantillas-tipo'],
});

export const usePlantillas = plantillaHooks.useList;
export const usePlantilla = plantillaHooks.useDetail;
export const useCrearPlantilla = plantillaHooks.useCreate;
export const useActualizarPlantilla = plantillaHooks.useUpdate;
export const useEliminarPlantilla = plantillaHooks.useDelete;

// ==================== HOOKS MANUALES (endpoints especializados) ====================

/**
 * Hook para listar plantillas por tipo de evento
 */
export function usePlantillasPorTipo(tipoEvento) {
  return useQuery({
    queryKey: queryKeys.eventosDigitales.plantillas.porTipo(tipoEvento),
    queryFn: async () => {
      const response = await eventosDigitalesApi.listarPlantillasPorTipo(tipoEvento);
      return response.data.data.plantillas || [];
    },
    enabled: !!tipoEvento,
    staleTime: STALE_TIMES.STATIC_DATA,
  });
}

/**
 * Hook para obtener bloques de una plantilla
 */
export function usePlantillaBloques(id) {
  return useQuery({
    queryKey: EVENTO_QUERY_KEYS.plantillaBloques(id),
    queryFn: async () => {
      const response = await eventosDigitalesApi.obtenerBloquesPlantilla(id);
      return response.data.data.bloques || [];
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para guardar bloques de una plantilla (super_admin)
 */
export function useGuardarBloquesPlantilla() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, bloques }) => {
      const response = await eventosDigitalesApi.guardarBloquesPlantilla(id, bloques);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: EVENTO_QUERY_KEYS.plantillaBloques(variables.id),
        refetchType: 'active',
      });
    },
  });
}

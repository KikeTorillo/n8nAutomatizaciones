/**
 * Hooks para CRUD de eventos y plantillas
 *
 * Ene 2026: Extraído de useEventosDigitales.js para mejor mantenibilidad
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventosDigitalesApi } from '@/services/api/endpoints';
import { sanitizeParams } from '@/lib/params';

// ==================== QUERIES EVENTOS ====================

/**
 * Hook para listar eventos de la organización
 * @param {Object} params - { estado?, tipo?, busqueda?, pagina?, limite? }
 * @returns {Object} { data: { eventos, paginacion }, isLoading, error }
 */
export function useEventos(params = {}) {
  return useQuery({
    queryKey: ['eventos-digitales', params],
    queryFn: async () => {
      const response = await eventosDigitalesApi.listarEventos(sanitizeParams(params));
      return {
        eventos: response.data.data.eventos || [],
        paginacion: response.data.data.paginacion || null,
        total: response.data.data.total || 0,
      };
    },
    staleTime: 1000 * 60,
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
    queryKey: ['evento-digital', id],
    queryFn: async () => {
      const response = await eventosDigitalesApi.obtenerEvento(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para obtener estadísticas RSVP del evento
 * @param {number} eventoId - ID del evento
 * @returns {Object} { data: estadisticas, isLoading, error }
 */
export function useEventoEstadisticas(eventoId) {
  return useQuery({
    queryKey: ['evento-digital-estadisticas', eventoId],
    queryFn: async () => {
      const response = await eventosDigitalesApi.obtenerEstadisticasEvento(eventoId);
      return response.data.data;
    },
    enabled: !!eventoId,
    staleTime: 1000 * 30,
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
      queryClient.invalidateQueries({ queryKey: ['eventos-digitales'] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);

      const errorMessages = {
        400: 'Datos inválidos. Revisa los campos',
        403: 'No tienes permisos para crear eventos',
        409: 'Ya existe un evento con ese nombre',
        429: 'Has alcanzado el límite de eventos de tu plan',
      };

      const statusCode = error.response?.status;
      throw new Error(errorMessages[statusCode] || 'Error al crear evento');
    },
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
      queryClient.invalidateQueries({ queryKey: ['eventos-digitales'] });
      queryClient.invalidateQueries({ queryKey: ['evento-digital', data.id] });
      if (data.slug) {
        queryClient.invalidateQueries({ queryKey: ['evento-publico', data.slug] });
      }
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);

      const errorMessages = {
        404: 'Evento no encontrado',
        400: 'Datos inválidos',
        403: 'No tienes permisos',
      };

      const statusCode = error.response?.status;
      throw new Error(errorMessages[statusCode] || 'Error al actualizar evento');
    },
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
      queryClient.invalidateQueries({ queryKey: ['eventos-digitales'] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);

      const errorMessages = {
        404: 'Evento no encontrado',
        403: 'No tienes permisos',
      };

      const statusCode = error.response?.status;
      throw new Error(errorMessages[statusCode] || 'Error al eliminar evento');
    },
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
      queryClient.invalidateQueries({ queryKey: ['eventos-digitales'] });
      queryClient.invalidateQueries({ queryKey: ['evento-digital', data.id] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);

      const errorMessages = {
        404: 'Evento no encontrado',
        400: 'El evento ya está publicado',
        403: 'No tienes permisos',
      };

      const statusCode = error.response?.status;
      throw new Error(errorMessages[statusCode] || 'Error al publicar evento');
    },
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
    queryKey: ['plantillas-eventos', params],
    queryFn: async () => {
      const response = await eventosDigitalesApi.listarPlantillas(sanitizeParams(params));
      return response.data.data.plantillas || [];
    },
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Hook para obtener plantilla por ID
 * @param {number} id - ID de la plantilla
 * @returns {Object} { data: plantilla, isLoading, error }
 */
export function usePlantilla(id) {
  return useQuery({
    queryKey: ['plantilla-evento', id],
    queryFn: async () => {
      const response = await eventosDigitalesApi.obtenerPlantilla(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
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
    staleTime: 1000 * 60 * 10,
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
      queryClient.invalidateQueries(['plantillas-eventos']);
      queryClient.invalidateQueries(['plantillas-tipo']);
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
      queryClient.invalidateQueries(['plantillas-eventos']);
      queryClient.invalidateQueries(['plantillas-tipo']);
      queryClient.invalidateQueries(['plantilla-evento', variables.id]);
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
      queryClient.invalidateQueries(['plantillas-eventos']);
      queryClient.invalidateQueries(['plantillas-tipo']);
    },
  });
}

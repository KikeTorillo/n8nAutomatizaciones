/**
 * Hooks para vista pública y mesas (seating chart)
 *
 * Ene 2026: Extraído de useEventosDigitales.js para mejor mantenibilidad
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventosDigitalesApi } from '@/services/api/endpoints';

// ==================== QUERIES PÚBLICOS ====================

/**
 * Hook para obtener evento público por slug (sin auth)
 * @param {string} slug - Slug del evento
 * @returns {Object} { data: evento, isLoading, error }
 */
export function useEventoPublico(slug) {
  return useQuery({
    queryKey: ['evento-publico', slug],
    queryFn: async () => {
      const response = await eventosDigitalesApi.obtenerEventoPublico(slug);
      return response.data.data;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para obtener invitación personalizada por token (sin auth)
 * @param {string} slug - Slug del evento
 * @param {string} token - Token del invitado
 * @returns {Object} { data: { evento, invitado }, isLoading, error }
 */
export function useInvitacionPublica(slug, token) {
  return useQuery({
    queryKey: ['invitacion-publica', slug, token],
    queryFn: async () => {
      const response = await eventosDigitalesApi.obtenerInvitacion(slug, token);
      return response.data.data;
    },
    enabled: !!slug && !!token,
    staleTime: 1000 * 60 * 5,
  });
}

// ==================== MUTATIONS PÚBLICOS ====================

/**
 * Hook para confirmar RSVP (público, sin auth)
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useConfirmarRSVP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, token, data }) => {
      const sanitized = {
        asistira: data.asistira,
        num_asistentes: data.num_asistentes || undefined,
        mensaje_rsvp: data.mensaje_rsvp?.trim() || undefined,
        restricciones_dieteticas: data.restricciones_dieteticas?.trim() || undefined,
      };
      const response = await eventosDigitalesApi.confirmarRSVP(slug, token, sanitized);
      return { ...response.data.data, slug, token };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invitacion-publica', data.slug, data.token] });
      queryClient.invalidateQueries({ queryKey: ['evento-publico', data.slug] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);

      const errorMessages = {
        400: 'Datos inválidos',
        404: 'Invitación no encontrada',
        410: 'La fecha límite para confirmar ha pasado',
      };

      const statusCode = error.response?.status;
      throw new Error(errorMessages[statusCode] || 'Error al confirmar asistencia');
    },
  });
}

// ==================== QUERIES MESAS (Seating Chart) ====================

/**
 * Hook para listar mesas de un evento con sus invitados asignados
 * @param {number} eventoId - ID del evento
 * @returns {Object} { data: mesas[], isLoading, error }
 */
export function useMesas(eventoId) {
  return useQuery({
    queryKey: ['mesas-evento', eventoId],
    queryFn: async () => {
      const response = await eventosDigitalesApi.listarMesas(eventoId);
      return response.data.data || [];
    },
    enabled: !!eventoId,
    staleTime: 1000 * 30,
  });
}

/**
 * Hook para obtener estadísticas de ocupación de mesas
 * @param {number} eventoId - ID del evento
 * @returns {Object} { data: estadisticas, isLoading, error }
 */
export function useEstadisticasMesas(eventoId) {
  return useQuery({
    queryKey: ['mesas-estadisticas', eventoId],
    queryFn: async () => {
      const response = await eventosDigitalesApi.obtenerEstadisticasMesas(eventoId);
      return response.data.data;
    },
    enabled: !!eventoId,
    staleTime: 1000 * 30,
  });
}

// ==================== MUTATIONS MESAS ====================

/**
 * Hook para crear mesa
 */
export function useCrearMesa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventoId, data }) => {
      const sanitized = {
        nombre: data.nombre?.trim(),
        numero: data.numero || undefined,
        tipo: data.tipo || 'redonda',
        posicion_x: data.posicion_x ?? 50,
        posicion_y: data.posicion_y ?? 50,
        rotacion: data.rotacion ?? 0,
        capacidad: data.capacidad ?? 8,
      };
      const response = await eventosDigitalesApi.crearMesa(eventoId, sanitized);
      return { ...response.data.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mesas-evento', data.eventoId] });
      queryClient.invalidateQueries({ queryKey: ['mesas-estadisticas', data.eventoId] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al crear mesa');
    },
  });
}

/**
 * Hook para actualizar mesa
 */
export function useActualizarMesa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventoId, mesaId, data }) => {
      const sanitized = {
        nombre: data.nombre?.trim() || undefined,
        numero: data.numero || undefined,
        tipo: data.tipo || undefined,
        posicion_x: data.posicion_x,
        posicion_y: data.posicion_y,
        rotacion: data.rotacion,
        capacidad: data.capacidad,
      };
      Object.keys(sanitized).forEach(key =>
        sanitized[key] === undefined && delete sanitized[key]
      );
      const response = await eventosDigitalesApi.actualizarMesa(eventoId, mesaId, sanitized);
      return { ...response.data.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mesas-evento', data.eventoId] });
      queryClient.invalidateQueries({ queryKey: ['mesas-estadisticas', data.eventoId] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al actualizar mesa');
    },
  });
}

/**
 * Hook para eliminar mesa
 */
export function useEliminarMesa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mesaId, eventoId }) => {
      const response = await eventosDigitalesApi.eliminarMesa(mesaId);
      return { ...response.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mesas-evento', data.eventoId] });
      queryClient.invalidateQueries({ queryKey: ['mesas-estadisticas', data.eventoId] });
      queryClient.invalidateQueries({ queryKey: ['invitados-evento', data.eventoId] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al eliminar mesa');
    },
  });
}

/**
 * Hook para actualizar posiciones de múltiples mesas (batch)
 */
export function useActualizarPosicionesMesas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventoId, posiciones }) => {
      const response = await eventosDigitalesApi.actualizarPosicionesMesas(eventoId, posiciones);
      return { ...response.data.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mesas-evento', data.eventoId] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al actualizar posiciones');
    },
  });
}

/**
 * Hook para asignar invitado a mesa
 */
export function useAsignarInvitadoAMesa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventoId, mesaId, invitadoId }) => {
      const response = await eventosDigitalesApi.asignarInvitadoAMesa(eventoId, mesaId, invitadoId);
      return { ...response.data.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mesas-evento', data.eventoId] });
      queryClient.invalidateQueries({ queryKey: ['mesas-estadisticas', data.eventoId] });
      queryClient.invalidateQueries({ queryKey: ['invitados-evento', data.eventoId] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);

      const errorMessages = {
        400: 'La mesa está llena o el invitado ya tiene mesa asignada',
        404: 'Mesa o invitado no encontrado',
      };

      const statusCode = error.response?.status;
      throw new Error(errorMessages[statusCode] || 'Error al asignar invitado');
    },
  });
}

/**
 * Hook para desasignar invitado de mesa
 */
export function useDesasignarInvitadoDeMesa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invitadoId, eventoId }) => {
      const response = await eventosDigitalesApi.desasignarInvitado(invitadoId);
      return { ...response.data.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mesas-evento', data.eventoId] });
      queryClient.invalidateQueries({ queryKey: ['mesas-estadisticas', data.eventoId] });
      queryClient.invalidateQueries({ queryKey: ['invitados-evento', data.eventoId] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al desasignar invitado');
    },
  });
}

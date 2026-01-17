import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventosDigitalesApi } from '@/services/api/endpoints';
import { sanitizeParams } from '@/lib/params';

/**
 * Hooks para el módulo de Eventos Digitales (invitaciones de bodas, XV años, etc.)
 * Sigue el patrón establecido en useMarketplace.js
 */

// ==================== QUERIES ADMIN (10) ====================

/**
 * Hook para listar eventos de la organización
 * @param {Object} params - { estado?, tipo?, busqueda?, pagina?, limite? }
 * @returns {Object} { data: { eventos, paginacion }, isLoading, error }
 *
 * @example
 * const { data, isLoading } = useEventos({ estado: 'publicado', tipo: 'boda' });
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
    staleTime: 1000 * 60, // 1 minuto
    keepPreviousData: true,
  });
}

/**
 * Hook para obtener evento por ID
 * @param {number} id - ID del evento
 * @returns {Object} { data: evento, isLoading, error }
 *
 * @example
 * const { data: evento, isLoading } = useEvento(1);
 */
export function useEvento(id) {
  return useQuery({
    queryKey: ['evento-digital', id],
    queryFn: async () => {
      const response = await eventosDigitalesApi.obtenerEvento(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para obtener estadísticas RSVP del evento
 * @param {number} eventoId - ID del evento
 * @returns {Object} { data: estadisticas, isLoading, error }
 *
 * @example
 * const { data: stats } = useEventoEstadisticas(1);
 */
export function useEventoEstadisticas(eventoId) {
  return useQuery({
    queryKey: ['evento-digital-estadisticas', eventoId],
    queryFn: async () => {
      const response = await eventosDigitalesApi.obtenerEstadisticasEvento(eventoId);
      return response.data.data;
    },
    enabled: !!eventoId,
    staleTime: 1000 * 30, // 30 segundos
  });
}

/**
 * Hook para listar invitados de un evento
 * @param {number} eventoId - ID del evento
 * @param {Object} params - { estado_rsvp?, busqueda?, pagina?, limite? }
 * @returns {Object} { data: { invitados, paginacion }, isLoading, error }
 *
 * @example
 * const { data } = useInvitados(1, { estado_rsvp: 'confirmado' });
 */
export function useInvitados(eventoId, params = {}) {
  return useQuery({
    queryKey: ['invitados-evento', eventoId, params],
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
    staleTime: 1000 * 60, // 1 minuto
    keepPreviousData: true,
  });
}

/**
 * Hook para listar ubicaciones de un evento
 * @param {number} eventoId - ID del evento
 * @returns {Object} { data: ubicaciones[], isLoading, error }
 *
 * @example
 * const { data: ubicaciones } = useUbicacionesEvento(1);
 */
export function useUbicacionesEvento(eventoId) {
  return useQuery({
    queryKey: ['ubicaciones-evento', eventoId],
    queryFn: async () => {
      const response = await eventosDigitalesApi.listarUbicaciones(eventoId);
      return response.data.data.ubicaciones || [];
    },
    enabled: !!eventoId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para listar mesa de regalos de un evento
 * @param {number} eventoId - ID del evento
 * @param {Object} params - { disponibles? }
 * @returns {Object} { data: regalos[], isLoading, error }
 *
 * @example
 * const { data: regalos } = useMesaRegalos(1, { disponibles: true });
 */
export function useMesaRegalos(eventoId, params = {}) {
  return useQuery({
    queryKey: ['mesa-regalos-evento', eventoId, params],
    queryFn: async () => {
      const response = await eventosDigitalesApi.listarRegalos(eventoId, sanitizeParams(params));
      return response.data.data.regalos || [];
    },
    enabled: !!eventoId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para listar felicitaciones de un evento
 * @param {number} eventoId - ID del evento
 * @param {Object} params - { aprobadas?, limit?, offset? }
 * @returns {Object} { data: { felicitaciones, total }, isLoading, error }
 *
 * @example
 * const { data } = useFelicitaciones(1, { aprobadas: true });
 */
export function useFelicitaciones(eventoId, params = {}) {
  return useQuery({
    queryKey: ['felicitaciones-evento', eventoId, params],
    queryFn: async () => {
      const response = await eventosDigitalesApi.listarFelicitaciones(eventoId, sanitizeParams(params));
      return {
        felicitaciones: response.data.data.felicitaciones || [],
        total: response.data.data.total || 0,
      };
    },
    enabled: !!eventoId,
    staleTime: 1000 * 60, // 1 minuto
  });
}

/**
 * Hook para listar plantillas disponibles
 * @param {Object} params - { tipo_evento?, es_premium? }
 * @returns {Object} { data: plantillas[], isLoading, error }
 *
 * @example
 * const { data: plantillas } = usePlantillas({ tipo_evento: 'boda' });
 */
export function usePlantillas(params = {}) {
  return useQuery({
    queryKey: ['plantillas-eventos', params],
    queryFn: async () => {
      const response = await eventosDigitalesApi.listarPlantillas(sanitizeParams(params));
      return response.data.data.plantillas || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutos (plantillas cambian poco)
  });
}

/**
 * Hook para obtener plantilla por ID
 * @param {number} id - ID de la plantilla
 * @returns {Object} { data: plantilla, isLoading, error }
 *
 * @example
 * const { data: plantilla } = usePlantilla(1);
 */
export function usePlantilla(id) {
  return useQuery({
    queryKey: ['plantilla-evento', id],
    queryFn: async () => {
      const response = await eventosDigitalesApi.obtenerPlantilla(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Hook para listar plantillas por tipo de evento
 * @param {string} tipoEvento - boda, xv_anos, bautizo, cumpleanos, corporativo, otro
 * @returns {Object} { data: plantillas[], isLoading, error }
 *
 * @example
 * const { data: plantillas } = usePlantillasPorTipo('boda');
 */
export function usePlantillasPorTipo(tipoEvento) {
  return useQuery({
    queryKey: ['plantillas-tipo', tipoEvento],
    queryFn: async () => {
      const response = await eventosDigitalesApi.listarPlantillasPorTipo(tipoEvento);
      return response.data.data.plantillas || [];
    },
    enabled: !!tipoEvento,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

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

// ==================== QUERIES PUBLICOS (2) ====================

/**
 * Hook para obtener evento público por slug (sin auth)
 * @param {string} slug - Slug del evento
 * @returns {Object} { data: evento, isLoading, error }
 *
 * @example
 * const { data: evento } = useEventoPublico('boda-juan-maria-abc123');
 */
export function useEventoPublico(slug) {
  return useQuery({
    queryKey: ['evento-publico', slug],
    queryFn: async () => {
      const response = await eventosDigitalesApi.obtenerEventoPublico(slug);
      return response.data.data;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obtener invitación personalizada por token (sin auth)
 * @param {string} slug - Slug del evento
 * @param {string} token - Token del invitado
 * @returns {Object} { data: { evento, invitado }, isLoading, error }
 *
 * @example
 * const { data } = useInvitacionPublica('boda-juan-maria-abc123', 'abc123xyz');
 */
export function useInvitacionPublica(slug, token) {
  return useQuery({
    queryKey: ['invitacion-publica', slug, token],
    queryFn: async () => {
      const response = await eventosDigitalesApi.obtenerInvitacion(slug, token);
      return response.data.data;
    },
    enabled: !!slug && !!token,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// ==================== MUTATIONS EVENTOS (4) ====================

/**
 * Hook para crear evento
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const crearEvento = useCrearEvento();
 * crearEvento.mutate({
 *   nombre: 'Boda Juan y María',
 *   tipo: 'boda',
 *   fecha_evento: '2025-06-15'
 * });
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

// ==================== MUTATIONS INVITADOS (5) ====================

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
      queryClient.invalidateQueries({ queryKey: ['invitados-evento', variables.eventoId] });
      queryClient.invalidateQueries({ queryKey: ['evento-digital-estadisticas', variables.eventoId] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);

      const errorMessages = {
        400: 'Datos inválidos',
        409: 'Ya existe un invitado con ese email o teléfono',
        429: 'Has alcanzado el límite de invitados de tu plan',
      };

      const statusCode = error.response?.status;
      throw new Error(errorMessages[statusCode] || 'Error al crear invitado');
    },
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
      queryClient.invalidateQueries({ queryKey: ['invitados-evento', data.eventoId] });
      queryClient.invalidateQueries({ queryKey: ['evento-digital-estadisticas', data.eventoId] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);

      const errorMessages = {
        404: 'Invitado no encontrado',
        400: 'Datos inválidos',
      };

      const statusCode = error.response?.status;
      throw new Error(errorMessages[statusCode] || 'Error al actualizar invitado');
    },
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
      queryClient.invalidateQueries({ queryKey: ['invitados-evento', data.eventoId] });
      queryClient.invalidateQueries({ queryKey: ['evento-digital-estadisticas', data.eventoId] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al eliminar invitado');
    },
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
      queryClient.invalidateQueries({ queryKey: ['invitados-evento', data.eventoId] });
      queryClient.invalidateQueries({ queryKey: ['evento-digital-estadisticas', data.eventoId] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al importar invitados');
    },
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
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al exportar invitados');
    },
  });
}

// ==================== MUTATIONS UBICACIONES (3) ====================

/**
 * Extrae mensajes de error detallados de la respuesta del backend
 * @param {Object} responseData - response.data del error de axios
 * @returns {string} Mensaje de error formateado
 */
function extraerMensajesValidacion(responseData) {
  if (!responseData?.errors) {
    return responseData?.message || 'Error de validación';
  }

  const errores = [];
  // Los errores vienen agrupados por tipo: body, params, query
  for (const tipo of ['body', 'params', 'query']) {
    if (Array.isArray(responseData.errors[tipo])) {
      for (const err of responseData.errors[tipo]) {
        errores.push(err.message);
      }
    }
  }

  if (errores.length === 0) {
    return responseData?.message || 'Error de validación';
  }

  return errores.join('. ');
}

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
      queryClient.invalidateQueries({ queryKey: ['ubicaciones-evento', variables.eventoId] });
    },
    onError: (error) => {
      const mensaje = extraerMensajesValidacion(error.response?.data);
      throw new Error(mensaje);
    },
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
      queryClient.invalidateQueries({ queryKey: ['ubicaciones-evento', data.eventoId] });
    },
    onError: (error) => {
      const mensaje = extraerMensajesValidacion(error.response?.data);
      throw new Error(mensaje);
    },
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
      queryClient.invalidateQueries({ queryKey: ['ubicaciones-evento', data.eventoId] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al eliminar ubicación');
    },
  });
}

// ==================== MUTATIONS MESA DE REGALOS (4) ====================

/**
 * Hook para crear regalo
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useCrearRegalo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventoId, data }) => {
      const sanitized = {
        ...data,
        descripcion: data.descripcion?.trim() || undefined,
        url_externa: data.url_externa?.trim() || undefined,
        imagen_url: data.imagen_url?.trim() || undefined,
      };
      const response = await eventosDigitalesApi.crearRegalo(eventoId, sanitized);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mesa-regalos-evento', variables.eventoId] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al crear regalo');
    },
  });
}

/**
 * Hook para actualizar regalo
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useActualizarRegalo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventoId, data }) => {
      const sanitized = {
        ...data,
        descripcion: data.descripcion?.trim() || undefined,
        url_externa: data.url_externa?.trim() || undefined,
        imagen_url: data.imagen_url?.trim() || undefined,
      };
      const response = await eventosDigitalesApi.actualizarRegalo(id, sanitized);
      return { ...response.data.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mesa-regalos-evento', data.eventoId] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al actualizar regalo');
    },
  });
}

/**
 * Hook para marcar regalo como comprado
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useMarcarRegaloComprado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventoId, comprado_por }) => {
      const response = await eventosDigitalesApi.marcarRegaloComprado(id, { comprado_por });
      return { ...response.data.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mesa-regalos-evento', data.eventoId] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al marcar regalo como comprado');
    },
  });
}

/**
 * Hook para eliminar regalo
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useEliminarRegalo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventoId }) => {
      const response = await eventosDigitalesApi.eliminarRegalo(id);
      return { ...response.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mesa-regalos-evento', data.eventoId] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al eliminar regalo');
    },
  });
}

// ==================== MUTATIONS FELICITACIONES (4) ====================

/**
 * Hook para crear felicitación (admin)
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useCrearFelicitacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventoId, data }) => {
      const sanitized = {
        nombre_autor: data.nombre_autor.trim(),
        mensaje: data.mensaje.trim(),
        invitado_id: data.invitado_id || undefined,
      };
      const response = await eventosDigitalesApi.crearFelicitacion(eventoId, sanitized);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['felicitaciones-evento', variables.eventoId] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al crear felicitación');
    },
  });
}

/**
 * Hook para aprobar felicitación
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useAprobarFelicitacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventoId }) => {
      const response = await eventosDigitalesApi.aprobarFelicitacion(id);
      return { ...response.data.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['felicitaciones-evento', data.eventoId] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al aprobar felicitación');
    },
  });
}

/**
 * Hook para rechazar felicitación
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useRechazarFelicitacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventoId }) => {
      const response = await eventosDigitalesApi.rechazarFelicitacion(id);
      return { ...response.data.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['felicitaciones-evento', data.eventoId] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al rechazar felicitación');
    },
  });
}

/**
 * Hook para eliminar felicitación
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useEliminarFelicitacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventoId }) => {
      const response = await eventosDigitalesApi.eliminarFelicitacion(id);
      return { ...response.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['felicitaciones-evento', data.eventoId] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al eliminar felicitación');
    },
  });
}

// ==================== MUTATIONS PUBLICOS (1) ====================

/**
 * Hook para confirmar RSVP (público, sin auth)
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const confirmarRSVP = useConfirmarRSVP();
 * confirmarRSVP.mutate({
 *   slug: 'boda-juan-maria-abc123',
 *   token: 'abc123xyz',
 *   data: { asistira: true, num_asistentes: 2 }
 * });
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
 *
 * @example
 * const { data: mesas, isLoading } = useMesas(eventoId);
 */
export function useMesas(eventoId) {
  return useQuery({
    queryKey: ['mesas-evento', eventoId],
    queryFn: async () => {
      const response = await eventosDigitalesApi.listarMesas(eventoId);
      return response.data.data || [];
    },
    enabled: !!eventoId,
    staleTime: 1000 * 30, // 30 segundos
  });
}

/**
 * Hook para obtener estadísticas de ocupación de mesas
 * @param {number} eventoId - ID del evento
 * @returns {Object} { data: estadisticas, isLoading, error }
 *
 * @example
 * const { data: stats } = useEstadisticasMesas(eventoId);
 */
export function useEstadisticasMesas(eventoId) {
  return useQuery({
    queryKey: ['mesas-estadisticas', eventoId],
    queryFn: async () => {
      const response = await eventosDigitalesApi.obtenerEstadisticasMesas(eventoId);
      return response.data.data;
    },
    enabled: !!eventoId,
    staleTime: 1000 * 30, // 30 segundos
  });
}

// ==================== MUTATIONS MESAS (Seating Chart) ====================

/**
 * Hook para crear mesa
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
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
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
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
      // Remove undefined values
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
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
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
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
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
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
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
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
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

// ==================== QUERIES GALERÍA ====================

/**
 * Hook para listar fotos de la galería de un evento
 * @param {number} eventoId - ID del evento
 * @param {Object} params - { estado?, limit?, offset? }
 * @returns {Object} { data: { fotos, total, estadisticas }, isLoading, error }
 *
 * @example
 * const { data } = useGaleria(eventoId, { estado: 'visible', limit: 50 });
 */
export function useGaleria(eventoId, params = {}) {
  return useQuery({
    queryKey: ['galeria-evento', eventoId, params],
    queryFn: async () => {
      const response = await eventosDigitalesApi.listarFotos(eventoId, sanitizeParams(params));
      return response.data.data;
    },
    enabled: !!eventoId,
    staleTime: 1000 * 30, // 30 segundos
  });
}

/**
 * Hook para obtener galería pública de un evento (sin auth)
 * @param {string} slug - Slug del evento
 * @param {number} limit - Límite de fotos
 * @returns {Object} { data: { fotos, total }, isLoading, error }
 *
 * @example
 * const { data } = useGaleriaPublica('mi-boda-2025');
 */
export function useGaleriaPublica(slug, limit = 100) {
  return useQuery({
    queryKey: ['galeria-publica', slug, limit],
    queryFn: async () => {
      const response = await eventosDigitalesApi.obtenerGaleriaPublica(slug, limit);
      return response.data.data;
    },
    enabled: !!slug,
    staleTime: 1000 * 60, // 1 minuto
  });
}

// ==================== MUTATIONS GALERÍA ====================

/**
 * Hook para subir foto a la galería (admin/organizador)
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useSubirFoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventoId, data }) => {
      const sanitized = {
        url: data.url,
        thumbnail_url: data.thumbnail_url || undefined,
        caption: data.caption?.trim() || undefined,
        tamanio_bytes: data.tamanio_bytes || undefined,
        tipo_mime: data.tipo_mime || undefined,
      };
      const response = await eventosDigitalesApi.subirFoto(eventoId, sanitized);
      return { ...response.data.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['galeria-evento', data.eventoId] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al subir foto');
    },
  });
}

/**
 * Hook para cambiar estado de foto (visible/oculta)
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useCambiarEstadoFoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fotoId, estado, eventoId }) => {
      const response = await eventosDigitalesApi.cambiarEstadoFoto(fotoId, estado);
      return { ...response.data.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['galeria-evento', data.eventoId] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al cambiar estado de foto');
    },
  });
}

/**
 * Hook para eliminar foto (soft delete)
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useEliminarFoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fotoId, eventoId }) => {
      const response = await eventosDigitalesApi.eliminarFoto(fotoId);
      return { ...response.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['galeria-evento', data.eventoId] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al eliminar foto');
    },
  });
}

/**
 * Hook para eliminar foto permanentemente
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useEliminarFotoPermanente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fotoId, eventoId }) => {
      const response = await eventosDigitalesApi.eliminarFotoPermanente(fotoId);
      return { ...response.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['galeria-evento', data.eventoId] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al eliminar foto permanentemente');
    },
  });
}

/**
 * Hook para subir foto como invitado (público)
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const subirFoto = useSubirFotoPublica();
 * subirFoto.mutate({ slug: 'mi-boda', token: 'abc123', file: fileObject, caption: 'Mi foto' });
 */
export function useSubirFotoPublica() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, token, file, caption }) => {
      const response = await eventosDigitalesApi.subirFotoPublica(slug, token, file, caption?.trim() || '');
      return { ...response.data.data, slug };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['galeria-publica', data.slug] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);

      const errorMessages = {
        400: 'No está permitido subir fotos en este evento',
        404: 'Invitación no encontrada',
        413: 'La imagen es demasiado grande. Máximo 10MB.',
      };

      const statusCode = error.response?.status;
      throw new Error(errorMessages[statusCode] || 'Error al subir foto');
    },
  });
}

/**
 * Hook para reportar foto inapropiada (público)
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useReportarFoto() {
  return useMutation({
    mutationFn: async ({ fotoId, motivo }) => {
      const response = await eventosDigitalesApi.reportarFoto(fotoId, motivo);
      return response.data;
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al reportar foto');
    },
  });
}

// ==================== EXPORT DEFAULT ====================

export default {
  // Queries Admin
  useEventos,
  useEvento,
  useEventoEstadisticas,
  useInvitados,
  useUbicacionesEvento,
  useMesaRegalos,
  useFelicitaciones,
  usePlantillas,
  usePlantilla,
  usePlantillasPorTipo,
  useCrearPlantilla,
  useActualizarPlantilla,
  useEliminarPlantilla,

  // Queries Públicos
  useEventoPublico,
  useInvitacionPublica,

  // Mutations Eventos
  useCrearEvento,
  useActualizarEvento,
  useEliminarEvento,
  usePublicarEvento,

  // Mutations Invitados
  useCrearInvitado,
  useActualizarInvitado,
  useEliminarInvitado,
  useImportarInvitados,
  useExportarInvitados,

  // Mutations Ubicaciones
  useCrearUbicacion,
  useActualizarUbicacion,
  useEliminarUbicacion,

  // Mutations Mesa de Regalos
  useCrearRegalo,
  useActualizarRegalo,
  useMarcarRegaloComprado,
  useEliminarRegalo,

  // Mutations Felicitaciones
  useCrearFelicitacion,
  useAprobarFelicitacion,
  useRechazarFelicitacion,
  useEliminarFelicitacion,

  // Mutations Públicos
  useConfirmarRSVP,

  // Queries Mesas (Seating Chart)
  useMesas,
  useEstadisticasMesas,

  // Mutations Mesas
  useCrearMesa,
  useActualizarMesa,
  useEliminarMesa,
  useActualizarPosicionesMesas,
  useAsignarInvitadoAMesa,
  useDesasignarInvitadoDeMesa,

  // Queries Galería
  useGaleria,
  useGaleriaPublica,

  // Mutations Galería
  useSubirFoto,
  useCambiarEstadoFoto,
  useEliminarFoto,
  useEliminarFotoPermanente,
  useSubirFotoPublica,
  useReportarFoto,
};

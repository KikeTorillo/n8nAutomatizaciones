/**
 * Helpers para hooks de eventos-digitales
 * Centraliza query keys e invalidación de dependencias
 *
 * Fecha creación: 3 Febrero 2026
 */

/**
 * Query keys centralizados para eventos-digitales
 * Usar estos keys en useQuery/useMutation para consistencia
 */
export const EVENTO_QUERY_KEYS = {
  // Eventos
  eventos: () => ['eventos-digitales'],
  evento: (id) => ['evento-digital', id],
  eventoEstadisticas: (id) => ['evento-digital-estadisticas', id],

  // Invitados
  invitados: (eventoId) => ['invitados-evento', eventoId],
  invitado: (id) => ['invitado', id],
  gruposFamiliares: (eventoId) => ['grupos-familiares', eventoId],
  etiquetas: (eventoId) => ['etiquetas-evento', eventoId],

  // Ubicaciones
  ubicaciones: (eventoId) => ['ubicaciones-evento', eventoId],

  // Mesa de regalos
  regalos: (eventoId) => ['mesa-regalos-evento', eventoId],

  // Felicitaciones
  felicitaciones: (eventoId) => ['felicitaciones-evento', eventoId],

  // Galería
  galeria: (eventoId) => ['galeria-evento', eventoId],

  // Check-in
  checkinStats: (eventoId) => ['checkin-stats', eventoId],
  checkinLista: (eventoId) => ['checkin-lista', eventoId],

  // Mesas (Seating Chart)
  mesas: (eventoId) => ['mesas-evento', eventoId],
  mesasEstadisticas: (eventoId) => ['mesas-estadisticas', eventoId],

  // Plantillas
  plantillas: () => ['plantillas-eventos'],
  plantilla: (id) => ['plantilla', id],
  plantillaBloques: (id) => ['plantilla-bloques', id],
};

/**
 * Grupos de query keys que deben invalidarse juntos
 */
export const EVENTO_QUERY_GROUPS = {
  // Todas las queries de un evento específico
  evento: (eventoId) => [
    EVENTO_QUERY_KEYS.evento(eventoId),
    EVENTO_QUERY_KEYS.eventoEstadisticas(eventoId),
    EVENTO_QUERY_KEYS.invitados(eventoId),
    EVENTO_QUERY_KEYS.ubicaciones(eventoId),
    EVENTO_QUERY_KEYS.regalos(eventoId),
    EVENTO_QUERY_KEYS.felicitaciones(eventoId),
    EVENTO_QUERY_KEYS.galeria(eventoId),
    EVENTO_QUERY_KEYS.checkinStats(eventoId),
    EVENTO_QUERY_KEYS.checkinLista(eventoId),
  ],

  // Queries relacionadas con invitados
  invitados: (eventoId) => [
    EVENTO_QUERY_KEYS.invitados(eventoId),
    EVENTO_QUERY_KEYS.gruposFamiliares(eventoId),
    EVENTO_QUERY_KEYS.etiquetas(eventoId),
    EVENTO_QUERY_KEYS.eventoEstadisticas(eventoId),
    EVENTO_QUERY_KEYS.checkinStats(eventoId),
  ],

  // Queries relacionadas con check-in
  checkin: (eventoId) => [
    EVENTO_QUERY_KEYS.checkinStats(eventoId),
    EVENTO_QUERY_KEYS.checkinLista(eventoId),
    EVENTO_QUERY_KEYS.eventoEstadisticas(eventoId),
  ],
};

/**
 * Invalida queries dependientes de un evento
 *
 * @param {QueryClient} queryClient - Instance de QueryClient de React Query
 * @param {string|number} eventoId - ID del evento
 * @param {string[]} keys - Array de keys a invalidar (null = todas)
 *
 * @example
 * // Invalidar todas las queries del evento
 * invalidateEventoDependencies(queryClient, eventoId);
 *
 * // Invalidar solo queries específicas
 * invalidateEventoDependencies(queryClient, eventoId, ['invitados', 'estadisticas']);
 */
export function invalidateEventoDependencies(queryClient, eventoId, keys = null) {
  const queryKeys = keys
    ? keys.map(key => {
        const getter = EVENTO_QUERY_KEYS[key];
        return getter ? getter(eventoId) : [key, eventoId];
      })
    : EVENTO_QUERY_GROUPS.evento(eventoId);

  queryKeys.forEach(queryKey => {
    queryClient.invalidateQueries({
      queryKey,
      refetchType: 'active'
    });
  });
}

/**
 * Invalida queries de invitados y dependencias
 * @param {QueryClient} queryClient
 * @param {string|number} eventoId
 */
export function invalidateInvitadosDependencies(queryClient, eventoId) {
  EVENTO_QUERY_GROUPS.invitados(eventoId).forEach(queryKey => {
    queryClient.invalidateQueries({
      queryKey,
      refetchType: 'active'
    });
  });
}

/**
 * Invalida queries de check-in
 * @param {QueryClient} queryClient
 * @param {string|number} eventoId
 */
export function invalidateCheckinDependencies(queryClient, eventoId) {
  EVENTO_QUERY_GROUPS.checkin(eventoId).forEach(queryKey => {
    queryClient.invalidateQueries({
      queryKey,
      refetchType: 'active'
    });
  });
}

/**
 * Invalida la lista de eventos (para crear/eliminar evento)
 * @param {QueryClient} queryClient
 */
export function invalidateEventosList(queryClient) {
  queryClient.invalidateQueries({
    queryKey: EVENTO_QUERY_KEYS.eventos(),
    refetchType: 'all'
  });
}

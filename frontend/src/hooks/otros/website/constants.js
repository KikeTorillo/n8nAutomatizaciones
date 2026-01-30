/**
 * ====================================================================
 * WEBSITE - CONSTANTES Y QUERY KEYS
 * ====================================================================
 * Centraliza las query keys de TanStack Query para el modulo website.
 *
 * @since 2026-01-29
 */

/**
 * Query keys para el modulo website
 * Patron: ['website', recurso, ...params]
 */
export const WEBSITE_KEYS = {
  all: ['website'],
  config: () => [...WEBSITE_KEYS.all, 'config'],
  paginas: () => [...WEBSITE_KEYS.all, 'paginas'],
  pagina: (id) => [...WEBSITE_KEYS.paginas(), id],
  bloques: (paginaId) => [...WEBSITE_KEYS.all, 'bloques', paginaId],
  bloque: (id) => [...WEBSITE_KEYS.all, 'bloque', id],
  tiposBloques: () => [...WEBSITE_KEYS.all, 'tipos-bloques'],
  defaultBloque: (tipo) => [...WEBSITE_KEYS.all, 'default-bloque', tipo],
  slugDisponible: (slug) => [...WEBSITE_KEYS.all, 'slug', slug],
};

/**
 * Query keys para analytics del website
 */
export const ANALYTICS_KEYS = {
  all: ['website', 'analytics'],
  resumen: (params) => [...ANALYTICS_KEYS.all, 'resumen', params],
  paginas: (params) => [...ANALYTICS_KEYS.all, 'paginas', params],
  eventos: (params) => [...ANALYTICS_KEYS.all, 'eventos', params],
  tiempoReal: (websiteId) => [...ANALYTICS_KEYS.all, 'tiempo-real', websiteId],
};

export default { WEBSITE_KEYS, ANALYTICS_KEYS };

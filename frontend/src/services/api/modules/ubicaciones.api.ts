import apiClient from '../client';

/**
 * API de Ubicaciones
 */
export const ubicacionesApi = {
  // ========== Países ==========

  /** Listar todos los países activos */
  listarPaises: () => apiClient.get('/ubicaciones/paises'),

  /** Obtener país por defecto (México) */
  obtenerPaisDefault: () => apiClient.get('/ubicaciones/paises/default'),

  // ========== Estados ==========

  /** Listar estados de México (shortcut) */
  listarEstadosMexico: () => apiClient.get('/ubicaciones/estados'),

  /** Listar estados de un país específico */
  listarEstadosPorPais: (paisId: number) => apiClient.get(`/ubicaciones/paises/${paisId}/estados`),

  /** Buscar estados por nombre (autocomplete) */
  buscarEstados: (q: string, options: Record<string, unknown> = {}) =>
    apiClient.get('/ubicaciones/estados/buscar', { params: { q, ...options } }),

  /** Obtener un estado por ID */
  obtenerEstado: (id: number) => apiClient.get(`/ubicaciones/estados/${id}`),

  // ========== Ciudades ==========

  /** Listar ciudades de un estado */
  listarCiudadesPorEstado: (estadoId: number, principales: boolean = false) =>
    apiClient.get(`/ubicaciones/estados/${estadoId}/ciudades`, {
      params: principales ? { principales: 'true' } : {}
    }),

  /** Listar ciudades principales de México */
  listarCiudadesPrincipales: (limite: number = 50) =>
    apiClient.get('/ubicaciones/ciudades/principales', { params: { limite } }),

  /** Buscar ciudades por nombre (autocomplete) */
  buscarCiudades: (q: string, options: Record<string, unknown> = {}) =>
    apiClient.get('/ubicaciones/ciudades/buscar', { params: { q, ...options } }),

  /** Obtener una ciudad por ID */
  obtenerCiudad: (id: number) => apiClient.get(`/ubicaciones/ciudades/${id}`),

  /** Obtener ubicación completa (ciudad + estado + país) */
  obtenerUbicacionCompleta: (ciudadId: number) =>
    apiClient.get(`/ubicaciones/ciudades/${ciudadId}/completa`),

  // ========== Códigos Postales ==========

  /** Buscar códigos postales */
  buscarCodigosPostales: (q: string, options: Record<string, unknown> = {}) =>
    apiClient.get('/ubicaciones/codigos-postales/buscar', { params: { q, ...options } }),

  // ========== Utilidades ==========

  /** Validar combinación de ubicación */
  validarUbicacion: (data: Record<string, unknown>) => apiClient.post('/ubicaciones/validar', data),
};

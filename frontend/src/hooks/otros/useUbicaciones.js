import { useQuery } from '@tanstack/react-query';
import { ubicacionesApi } from '@/services/api/endpoints';

/**
 * QUERY KEYS para ubicaciones
 */
export const UBICACIONES_KEYS = {
  all: ['ubicaciones'],
  paises: () => [...UBICACIONES_KEYS.all, 'paises'],
  paisDefault: () => [...UBICACIONES_KEYS.all, 'pais-default'],
  estados: () => [...UBICACIONES_KEYS.all, 'estados'],
  estadosMexico: () => [...UBICACIONES_KEYS.estados(), 'mexico'],
  estadosPorPais: (paisId) => [...UBICACIONES_KEYS.estados(), 'pais', paisId],
  estado: (id) => [...UBICACIONES_KEYS.estados(), id],
  ciudades: () => [...UBICACIONES_KEYS.all, 'ciudades'],
  ciudadesPorEstado: (estadoId) => [...UBICACIONES_KEYS.ciudades(), 'estado', estadoId],
  ciudadesPrincipales: () => [...UBICACIONES_KEYS.ciudades(), 'principales'],
  ciudad: (id) => [...UBICACIONES_KEYS.ciudades(), id],
  ubicacionCompleta: (ciudadId) => [...UBICACIONES_KEYS.all, 'completa', ciudadId],
};

// ==================== PAÍSES ====================

/**
 * Hook para obtener todos los países
 */
export function usePaises() {
  return useQuery({
    queryKey: UBICACIONES_KEYS.paises(),
    queryFn: async () => {
      const response = await ubicacionesApi.listarPaises();
      return response.data.data.paises;
    },
    staleTime: 1000 * 60 * 60, // 1 hora (datos estáticos)
  });
}

/**
 * Hook para obtener el país por defecto (México)
 */
export function usePaisDefault() {
  return useQuery({
    queryKey: UBICACIONES_KEYS.paisDefault(),
    queryFn: async () => {
      const response = await ubicacionesApi.obtenerPaisDefault();
      return response.data.data;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 horas
  });
}

// ==================== ESTADOS ====================

/**
 * Hook para obtener estados de México (más común)
 */
export function useEstadosMexico() {
  return useQuery({
    queryKey: UBICACIONES_KEYS.estadosMexico(),
    queryFn: async () => {
      const response = await ubicacionesApi.listarEstadosMexico();
      return response.data.data.estados;
    },
    staleTime: 1000 * 60 * 60, // 1 hora
  });
}

/**
 * Hook para obtener estados de un país específico
 * @param {number} paisId - ID del país
 */
export function useEstadosPorPais(paisId) {
  return useQuery({
    queryKey: UBICACIONES_KEYS.estadosPorPais(paisId),
    queryFn: async () => {
      const response = await ubicacionesApi.listarEstadosPorPais(paisId);
      return response.data.data.estados;
    },
    enabled: !!paisId,
    staleTime: 1000 * 60 * 60,
  });
}

/**
 * Hook para obtener un estado por ID
 * @param {number} id - ID del estado
 */
export function useEstado(id) {
  return useQuery({
    queryKey: UBICACIONES_KEYS.estado(id),
    queryFn: async () => {
      const response = await ubicacionesApi.obtenerEstado(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 60,
  });
}

// ==================== CIUDADES ====================

/**
 * Hook para obtener ciudades de un estado
 * @param {number} estadoId - ID del estado
 * @param {boolean} principales - Solo ciudades principales
 */
export function useCiudadesPorEstado(estadoId, principales = false) {
  return useQuery({
    queryKey: [...UBICACIONES_KEYS.ciudadesPorEstado(estadoId), principales],
    queryFn: async () => {
      const response = await ubicacionesApi.listarCiudadesPorEstado(estadoId, principales);
      return response.data.data.ciudades;
    },
    enabled: !!estadoId,
    staleTime: 1000 * 60 * 30, // 30 minutos
  });
}

/**
 * Hook para obtener ciudades principales de México
 * @param {number} limite - Límite de resultados
 */
export function useCiudadesPrincipales(limite = 50) {
  return useQuery({
    queryKey: [...UBICACIONES_KEYS.ciudadesPrincipales(), limite],
    queryFn: async () => {
      const response = await ubicacionesApi.listarCiudadesPrincipales(limite);
      return response.data.data.ciudades;
    },
    staleTime: 1000 * 60 * 60, // 1 hora
  });
}

/**
 * Hook para obtener una ciudad por ID
 * @param {number} id - ID de la ciudad
 */
export function useCiudad(id) {
  return useQuery({
    queryKey: UBICACIONES_KEYS.ciudad(id),
    queryFn: async () => {
      const response = await ubicacionesApi.obtenerCiudad(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 60,
  });
}

/**
 * Hook para obtener ubicación completa (ciudad + estado + país)
 * @param {number} ciudadId - ID de la ciudad
 */
export function useUbicacionCompleta(ciudadId) {
  return useQuery({
    queryKey: UBICACIONES_KEYS.ubicacionCompleta(ciudadId),
    queryFn: async () => {
      const response = await ubicacionesApi.obtenerUbicacionCompleta(ciudadId);
      return response.data.data;
    },
    enabled: !!ciudadId,
    staleTime: 1000 * 60 * 60,
  });
}

// ==================== HOOK COMBINADO ====================

/**
 * Hook combinado para selector de ubicación cascada
 * Estado -> Ciudad
 *
 * @param {Object} options - Opciones
 * @param {number} options.estadoId - ID del estado seleccionado
 * @param {number} options.ciudadId - ID de la ciudad seleccionada
 * @returns {Object} Datos y funciones para el selector
 */
export function useUbicacionSelector({ estadoId, ciudadId } = {}) {
  // Estados de México
  const {
    data: estados = [],
    isLoading: loadingEstados,
    error: errorEstados
  } = useEstadosMexico();

  // Ciudades del estado seleccionado
  const {
    data: ciudades = [],
    isLoading: loadingCiudades,
    error: errorCiudades
  } = useCiudadesPorEstado(estadoId);

  // Ubicación completa (si hay ciudad seleccionada)
  const {
    data: ubicacionCompleta,
    isLoading: loadingUbicacion
  } = useUbicacionCompleta(ciudadId);

  return {
    // Datos
    estados,
    ciudades,
    ubicacionCompleta,

    // Loading states
    loadingEstados,
    loadingCiudades,
    loadingUbicacion,
    isLoading: loadingEstados || loadingCiudades,

    // Errors
    errorEstados,
    errorCiudades,
    hasError: !!errorEstados || !!errorCiudades,

    // Helpers
    getEstadoNombre: (id) => estados.find(e => e.id === id)?.nombre_corto || '',
    getCiudadNombre: (id) => ciudades.find(c => c.id === id)?.nombre || '',
  };
}

export default {
  usePaises,
  usePaisDefault,
  useEstadosMexico,
  useEstadosPorPais,
  useEstado,
  useCiudadesPorEstado,
  useCiudadesPrincipales,
  useCiudad,
  useUbicacionCompleta,
  useUbicacionSelector,
};

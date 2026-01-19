/**
 * Queries - Cuentas Contables
 */

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { contabilidadApi } from '@/services/api/endpoints';
import { CONTABILIDAD_KEYS } from '../constants';

/**
 * Helper para sanitizar parámetros
 */
const sanitizeParams = (params) =>
  Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});

/**
 * Hook para listar cuentas contables
 * @param {Object} params - { tipo?, naturaleza?, nivel?, cuenta_padre_id?, activo?, afectable?, busqueda?, pagina?, limite? }
 * @returns {Object} { data, isLoading, error, refetch }
 */
export function useCuentasContables(params = {}) {
  return useQuery({
    queryKey: CONTABILIDAD_KEYS.cuentas.list(params),
    queryFn: async () => {
      const sanitizedParams = sanitizeParams(params);
      const response = await contabilidadApi.listarCuentas(sanitizedParams);
      return {
        cuentas: response.data?.data?.cuentas || [],
        paginacion: response.data?.data?.paginacion || {},
      };
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para obtener árbol jerárquico de cuentas
 * @param {Object} params - { solo_activas? }
 * @returns {Object} { data, isLoading, error }
 */
export function useArbolCuentas(params = {}) {
  return useQuery({
    queryKey: CONTABILIDAD_KEYS.cuentas.arbol(params),
    queryFn: async () => {
      const response = await contabilidadApi.obtenerArbolCuentas(params);
      return response.data?.data || [];
    },
    staleTime: STALE_TIMES.STATIC_DATA, // 10 minutos (el árbol cambia poco)
  });
}

/**
 * Hook para obtener cuentas afectables (para selects)
 * @param {Object} params - { tipo? }
 * @returns {Object} { data, isLoading, error }
 */
export function useCuentasAfectables(params = {}) {
  return useQuery({
    queryKey: CONTABILIDAD_KEYS.cuentas.afectables(params),
    queryFn: async () => {
      const response = await contabilidadApi.listarCuentasAfectables(params);
      return response.data?.data || [];
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para obtener cuenta por ID
 * @param {number} id
 * @returns {Object} { data, isLoading, error }
 */
export function useCuenta(id) {
  return useQuery({
    queryKey: CONTABILIDAD_KEYS.cuentas.detail(id),
    queryFn: async () => {
      const response = await contabilidadApi.obtenerCuenta(id);
      return response.data?.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

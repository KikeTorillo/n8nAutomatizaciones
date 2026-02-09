/**
 * Hooks para historial y reportes del programa de lealtad
 * Extraído de useLealtad.js — Feb 2026
 */

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { posApi } from '@/services/api/endpoints';
import { queryKeys } from '@/hooks/config';

/**
 * Hook para obtener historial de transacciones de un cliente
 * GET /pos/lealtad/clientes/:clienteId/historial
 * @param {number} clienteId
 * @param {Object} params - { limit, offset, tipo, fechaDesde, fechaHasta }
 */
export function useHistorialPuntos(clienteId, params = {}) {
  return useQuery({
    queryKey: queryKeys.pos.lealtad.historial(clienteId, params),
    queryFn: async () => {
      const sanitizedParams = {
        limit: params.limit,
        offset: params.offset,
        tipo: params.tipo,
        fecha_desde: params.fechaDesde,
        fecha_hasta: params.fechaHasta,
      };

      // Limpiar undefined/null
      Object.keys(sanitizedParams).forEach(key => {
        if (sanitizedParams[key] === undefined || sanitizedParams[key] === null) {
          delete sanitizedParams[key];
        }
      });

      const response = await posApi.obtenerHistorialPuntos(clienteId, sanitizedParams);
      return {
        transacciones: response.data.data,
        paginacion: response.data.pagination,
      };
    },
    enabled: !!clienteId,
    staleTime: STALE_TIMES.REAL_TIME, // 30 segundos
  });
}

/**
 * Hook para listar clientes con puntos (admin)
 * GET /pos/lealtad/clientes
 * @param {Object} params - { limit, offset, busqueda, nivelId, orden }
 */
export function useClientesConPuntos(params = {}) {
  return useQuery({
    queryKey: queryKeys.pos.lealtad.clientes(params),
    queryFn: async () => {
      const sanitizedParams = {
        limit: params.limit,
        offset: params.offset,
        busqueda: params.busqueda,
        nivel_id: params.nivelId,
        orden: params.orden,
      };

      // Limpiar undefined/null/empty
      Object.keys(sanitizedParams).forEach(key => {
        if (sanitizedParams[key] === undefined || sanitizedParams[key] === null || sanitizedParams[key] === '') {
          delete sanitizedParams[key];
        }
      });

      const response = await posApi.listarClientesConPuntos(sanitizedParams);
      return {
        clientes: response.data.data,
        paginacion: response.data.pagination,
      };
    },
    staleTime: STALE_TIMES.FREQUENT, // 1 minuto
    keepPreviousData: true,
  });
}

/**
 * Hook para obtener estadísticas del programa de lealtad
 * GET /pos/lealtad/estadisticas
 * @param {number} sucursalId - ID de la sucursal (requerido para permisos)
 */
export function useEstadisticasLealtad(sucursalId) {
  return useQuery({
    queryKey: queryKeys.pos.lealtad.estadisticas(sucursalId),
    queryFn: async () => {
      const response = await posApi.obtenerEstadisticasLealtad(sucursalId);
      return response.data.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
    enabled: !!sucursalId,
  });
}

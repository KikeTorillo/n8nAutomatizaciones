/**
 * ====================================================================
 * HOOKS: PAGOS DE SUSCRIPCIONES
 * ====================================================================
 * Hooks manuales para gestión de pagos con operaciones especiales.
 * Feb 2026 - Mutations migradas a createStatusMutationHook
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { suscripcionesNegocioApi } from '@/services/api/modules';
import { sanitizeParams } from '@/lib/params';
import { createStatusMutationHook } from '@/hooks/factories';
import { QUERY_KEYS } from './constants';

// ==================== QUERY HOOKS ====================

/**
 * Hook para listar pagos con paginación y filtros
 * @param {Object} params - { page, limit, estado, suscripcion_id, metodo_pago, fecha_desde, fecha_hasta }
 * @param {Object} options - Opciones adicionales de useQuery (ej: { enabled: false })
 */
export function usePagos(params = {}, options = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.PAGOS, params],
    queryFn: async () => {
      const sanitized = sanitizeParams(params);
      const response = await suscripcionesNegocioApi.listarPagos(sanitized);
      const data = response.data?.data;
      const pagination = response.data?.pagination || response.data?.meta || data?.paginacion;

      return {
        items: data?.items || data?.pagos || [],
        total: data?.paginacion?.total || pagination?.total || 0,
        paginacion: data?.paginacion || pagination,
      };
    },
    staleTime: STALE_TIMES.DYNAMIC,
    placeholderData: keepPreviousData,
    ...options,
  });
}

/**
 * Hook para obtener pago por ID
 * @param {number} id - ID del pago
 */
export function usePago(id) {
  return useQuery({
    queryKey: [QUERY_KEYS.PAGO, id],
    queryFn: async () => {
      const response = await suscripcionesNegocioApi.obtenerPago(id);
      return response.data?.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener resumen de pagos (dashboard)
 * @param {Object} params - { fecha_desde, fecha_hasta }
 */
export function useResumenPagos(params = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.PAGOS_RESUMEN, params],
    queryFn: async () => {
      const sanitized = sanitizeParams(params);
      const response = await suscripcionesNegocioApi.obtenerResumenPagos(sanitized);
      return response.data?.data || {};
    },
    staleTime: STALE_TIMES.FREQUENT,
  });
}

/**
 * Hook para buscar pago por transacción del gateway
 * @param {string} gateway - Nombre del gateway
 * @param {string} transactionId - ID de transacción
 */
export function usePagoPorTransaccion(gateway, transactionId) {
  return useQuery({
    queryKey: [QUERY_KEYS.PAGO, 'transaccion', gateway, transactionId],
    queryFn: async () => {
      const response = await suscripcionesNegocioApi.buscarPagoPorTransaccion(gateway, transactionId);
      return response.data?.data;
    },
    enabled: !!gateway && !!transactionId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

// ==================== MUTATION HOOKS (via factory) ====================

/** Hook para crear pago manual */
export const useCrearPago = createStatusMutationHook({
  mutationFn: (data) => {
    const sanitized = {
      suscripcion_id: data.suscripcion_id,
      monto: data.monto,
      moneda: data.moneda || 'MXN',
      metodo_pago: data.metodo_pago,
      referencia_externa: data.referencia_externa?.trim() || undefined,
      notas: data.notas?.trim() || undefined,
    };
    return suscripcionesNegocioApi.crearPago(sanitized);
  },
  queryKey: QUERY_KEYS.PAGOS,
  relatedKeys: [QUERY_KEYS.PAGOS_RESUMEN, QUERY_KEYS.SUSCRIPCIONES, QUERY_KEYS.METRICAS_DASHBOARD],
  successMessage: 'Pago registrado exitosamente',
  errorType: 'create',
  entityName: 'Pago',
});

/** Hook para actualizar estado del pago */
export const useActualizarEstadoPago = createStatusMutationHook({
  mutationFn: ({ id, estado, notas }) =>
    suscripcionesNegocioApi.actualizarEstadoPago(id, { estado, notas }),
  queryKey: QUERY_KEYS.PAGOS,
  relatedKeys: [QUERY_KEYS.PAGOS_RESUMEN],
  getEntityId: (v) => v.id,
  successMessage: 'Estado de pago actualizado',
  entityName: 'Pago',
});

/** Hook para procesar reembolso */
export const useProcesarReembolso = createStatusMutationHook({
  mutationFn: ({ id, monto_reembolso, motivo, reembolso_parcial }) =>
    suscripcionesNegocioApi.procesarReembolso(id, { monto_reembolso, motivo, reembolso_parcial }),
  queryKey: QUERY_KEYS.PAGOS,
  relatedKeys: [QUERY_KEYS.PAGOS_RESUMEN, QUERY_KEYS.METRICAS_DASHBOARD],
  getEntityId: (v) => v.id,
  successMessage: 'Reembolso procesado',
  entityName: 'Pago',
});

export default {
  // Queries
  usePagos,
  usePago,
  useResumenPagos,
  usePagoPorTransaccion,

  // Mutations
  useCrearPago,
  useActualizarEstadoPago,
  useProcesarReembolso,
};

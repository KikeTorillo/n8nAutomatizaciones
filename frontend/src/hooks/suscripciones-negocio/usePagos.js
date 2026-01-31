/**
 * ====================================================================
 * HOOKS: PAGOS DE SUSCRIPCIONES
 * ====================================================================
 * Hooks manuales para gestión de pagos con operaciones especiales.
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { suscripcionesNegocioApi } from '@/services/api/modules';
import { sanitizeParams } from '@/lib/params';
import { useToast } from '@/hooks/utils/useToast';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
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

// ==================== MUTATION HOOKS ====================

/**
 * Hook para crear pago manual
 */
export function useCrearPago() {
  const queryClient = useQueryClient();
  const { success } = useToast();

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = {
        suscripcion_id: data.suscripcion_id,
        monto: data.monto,
        moneda: data.moneda || 'MXN',
        metodo_pago: data.metodo_pago,
        referencia_externa: data.referencia_externa?.trim() || undefined,
        notas: data.notas?.trim() || undefined,
      };
      const response = await suscripcionesNegocioApi.crearPago(sanitized);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAGOS], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAGOS_RESUMEN], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCIONES], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.METRICAS_DASHBOARD], refetchType: 'active' });
      success('Pago registrado exitosamente');
    },
    onError: createCRUDErrorHandler('create', 'Pago'),
  });
}

/**
 * Hook para actualizar estado del pago
 */
export function useActualizarEstadoPago() {
  const queryClient = useQueryClient();
  const { success } = useToast();

  return useMutation({
    mutationFn: async ({ id, estado, notas }) => {
      const response = await suscripcionesNegocioApi.actualizarEstadoPago(id, { estado, notas });
      return response.data?.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAGOS], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAGO, id], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAGOS_RESUMEN], refetchType: 'active' });
      success('Estado de pago actualizado');
    },
    onError: createCRUDErrorHandler('update', 'Pago'),
  });
}

/**
 * Hook para procesar reembolso
 */
export function useProcesarReembolso() {
  const queryClient = useQueryClient();
  const { success } = useToast();

  return useMutation({
    mutationFn: async ({ id, monto_reembolso, motivo, reembolso_parcial }) => {
      const response = await suscripcionesNegocioApi.procesarReembolso(id, {
        monto_reembolso,
        motivo,
        reembolso_parcial,
      });
      return response.data?.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAGOS], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAGO, id], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAGOS_RESUMEN], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.METRICAS_DASHBOARD], refetchType: 'active' });
      success('Reembolso procesado');
    },
    onError: createCRUDErrorHandler('update', 'Pago'),
  });
}

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

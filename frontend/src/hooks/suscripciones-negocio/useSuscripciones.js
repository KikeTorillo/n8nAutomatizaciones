/**
 * ====================================================================
 * HOOKS: SUSCRIPCIONES
 * ====================================================================
 * Hooks manuales para gestión de suscripciones con operaciones especiales.
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
 * Hook para listar suscripciones con paginación y filtros
 * @param {Object} params - { page, limit, estado, plan_id, cliente_id, fecha_desde, fecha_hasta }
 */
export function useSuscripciones(params = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.SUSCRIPCIONES, params],
    queryFn: async () => {
      const sanitized = sanitizeParams(params);
      const response = await suscripcionesNegocioApi.listarSuscripciones(sanitized);
      const data = response.data?.data;
      const pagination = response.data?.pagination || response.data?.meta || data?.paginacion;

      return {
        items: data?.suscripciones || data || [],
        total: data?.total || pagination?.total || 0,
        paginacion: pagination,
      };
    },
    staleTime: STALE_TIMES.DYNAMIC,
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook para obtener suscripción por ID
 * @param {number} id - ID de la suscripción
 */
export function useSuscripcion(id) {
  return useQuery({
    queryKey: [QUERY_KEYS.SUSCRIPCION, id],
    queryFn: async () => {
      const response = await suscripcionesNegocioApi.obtenerSuscripcion(id);
      return response.data?.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener suscripciones de un cliente
 * @param {number} clienteId - ID del cliente
 */
export function useSuscripcionesCliente(clienteId) {
  return useQuery({
    queryKey: [QUERY_KEYS.SUSCRIPCIONES, 'cliente', clienteId],
    queryFn: async () => {
      const response = await suscripcionesNegocioApi.buscarSuscripcionesPorCliente(clienteId);
      return response.data?.data?.suscripciones || [];
    },
    enabled: !!clienteId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener historial de cambios de una suscripción
 * @param {number} suscripcionId - ID de la suscripción
 */
export function useHistorialSuscripcion(suscripcionId) {
  return useQuery({
    queryKey: [QUERY_KEYS.SUSCRIPCION_HISTORIAL, suscripcionId],
    queryFn: async () => {
      const response = await suscripcionesNegocioApi.obtenerHistorialSuscripcion(suscripcionId);
      return response.data?.data?.historial || [];
    },
    enabled: !!suscripcionId,
    staleTime: STALE_TIMES.STATIC_DATA,
  });
}

// ==================== MUTATION HOOKS ====================

/**
 * Hook para crear suscripción
 */
export function useCrearSuscripcion() {
  const queryClient = useQueryClient();
  const { success } = useToast();

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = {
        cliente_id: data.cliente_id,
        plan_id: data.plan_id,
        cupon_codigo: data.cupon_codigo?.trim() || undefined,
        metodo_pago: data.metodo_pago || undefined,
        notas: data.notas?.trim() || undefined,
      };
      const response = await suscripcionesNegocioApi.crearSuscripcion(sanitized);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCIONES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.METRICAS_DASHBOARD] });
      success('Suscripción creada exitosamente');
    },
    onError: createCRUDErrorHandler('create', 'Suscripcion'),
  });
}

/**
 * Hook para actualizar suscripción
 */
export function useActualizarSuscripcion() {
  const queryClient = useQueryClient();
  const { success } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await suscripcionesNegocioApi.actualizarSuscripcion(id, data);
      return response.data?.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCIONES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCION, id] });
      success('Suscripción actualizada');
    },
    onError: createCRUDErrorHandler('update', 'Suscripcion'),
  });
}

/**
 * Hook para cambiar estado de suscripción
 */
export function useCambiarEstadoSuscripcion() {
  const queryClient = useQueryClient();
  const { success } = useToast();

  return useMutation({
    mutationFn: async ({ id, estado, motivo }) => {
      const response = await suscripcionesNegocioApi.cambiarEstadoSuscripcion(id, { estado, motivo });
      return response.data?.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCIONES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCION, id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.METRICAS_DASHBOARD] });
      success('Estado actualizado');
    },
    onError: createCRUDErrorHandler('update', 'Suscripcion'),
  });
}

/**
 * Hook para cambiar plan de suscripción
 */
export function useCambiarPlanSuscripcion() {
  const queryClient = useQueryClient();
  const { success } = useToast();

  return useMutation({
    mutationFn: async ({ id, nuevo_plan_id, aplicar_desde, prorrateo }) => {
      const response = await suscripcionesNegocioApi.cambiarPlanSuscripcion(id, {
        nuevo_plan_id,
        aplicar_desde,
        prorrateo,
      });
      return response.data?.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCIONES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCION, id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.METRICAS_DASHBOARD] });
      success('Plan cambiado exitosamente');
    },
    onError: createCRUDErrorHandler('update', 'Suscripcion'),
  });
}

/**
 * Hook para cancelar suscripción
 */
export function useCancelarSuscripcion() {
  const queryClient = useQueryClient();
  const { success } = useToast();

  return useMutation({
    mutationFn: async ({ id, motivo_cancelacion, cancelar_inmediatamente, solicitar_reembolso }) => {
      const response = await suscripcionesNegocioApi.cancelarSuscripcion(id, {
        motivo_cancelacion,
        cancelar_inmediatamente,
        solicitar_reembolso,
      });
      return response.data?.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCIONES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCION, id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.METRICAS_DASHBOARD] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.METRICAS_CHURN] });
      success('Suscripción cancelada');
    },
    onError: createCRUDErrorHandler('delete', 'Suscripcion'),
  });
}

/**
 * Hook para pausar suscripción
 */
export function usePausarSuscripcion() {
  const queryClient = useQueryClient();
  const { success } = useToast();

  return useMutation({
    mutationFn: async ({ id, motivo, duracion_pausa_dias }) => {
      const response = await suscripcionesNegocioApi.pausarSuscripcion(id, {
        motivo,
        duracion_pausa_dias,
      });
      return response.data?.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCIONES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCION, id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.METRICAS_DASHBOARD] });
      success('Suscripción pausada');
    },
    onError: createCRUDErrorHandler('update', 'Suscripcion'),
  });
}

/**
 * Hook para reactivar suscripción
 */
export function useReactivarSuscripcion() {
  const queryClient = useQueryClient();
  const { success } = useToast();

  return useMutation({
    mutationFn: async (id) => {
      const response = await suscripcionesNegocioApi.reactivarSuscripcion(id);
      return response.data?.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCIONES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCION, id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.METRICAS_DASHBOARD] });
      success('Suscripción reactivada');
    },
    onError: createCRUDErrorHandler('update', 'Suscripcion'),
  });
}

/**
 * Hook para actualizar fecha de próximo cobro
 */
export function useActualizarProximoCobro() {
  const queryClient = useQueryClient();
  const { success } = useToast();

  return useMutation({
    mutationFn: async ({ id, proxima_fecha_cobro }) => {
      const response = await suscripcionesNegocioApi.actualizarProximoCobro(id, { proxima_fecha_cobro });
      return response.data?.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCION, id] });
      success('Fecha de cobro actualizada');
    },
    onError: createCRUDErrorHandler('update', 'Suscripcion'),
  });
}

export default {
  // Queries
  useSuscripciones,
  useSuscripcion,
  useSuscripcionesCliente,
  useHistorialSuscripcion,

  // Mutations
  useCrearSuscripcion,
  useActualizarSuscripcion,
  useCambiarEstadoSuscripcion,
  useCambiarPlanSuscripcion,
  useCancelarSuscripcion,
  usePausarSuscripcion,
  useReactivarSuscripcion,
  useActualizarProximoCobro,
};

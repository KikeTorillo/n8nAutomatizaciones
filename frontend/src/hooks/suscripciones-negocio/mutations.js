/**
 * ====================================================================
 * MUTATION HOOKS: SUSCRIPCIONES
 * ====================================================================
 * Hooks de escritura para gestión de suscripciones.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { suscripcionesNegocioApi } from '@/services/api/modules';
import { useToast } from '@/hooks/utils/useToast';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { QUERY_KEYS } from './constants';

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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCIONES], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.METRICAS_DASHBOARD], refetchType: 'active' });
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCIONES], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCION, id], refetchType: 'active' });
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCIONES], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCION, id], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.METRICAS_DASHBOARD], refetchType: 'active' });
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCIONES], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCION, id], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.METRICAS_DASHBOARD], refetchType: 'active' });
      success('Plan cambiado exitosamente');
    },
    onError: createCRUDErrorHandler('update', 'Suscripcion'),
  });
}

/**
 * Hook para cambiar MI plan de suscripción (para usuarios, no admins)
 * Usa el endpoint /mi-suscripcion/cambiar-plan que no requiere permisos de admin
 */
export function useCambiarMiPlan() {
  const queryClient = useQueryClient();
  const { success } = useToast();

  return useMutation({
    mutationFn: async ({ nuevo_plan_id, periodo, cambio_inmediato }) => {
      const response = await suscripcionesNegocioApi.cambiarMiPlan({
        nuevo_plan_id,
        periodo,
        cambio_inmediato,
      });
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MI_SUSCRIPCION], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCIONES], refetchType: 'active' });
      success('Plan cambiado exitosamente');
    },
    onError: createCRUDErrorHandler('update', 'Plan'),
  });
}

/**
 * Hook para cancelar suscripción (Customer Billing - admin cancela suscripción de cliente)
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCIONES], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCION, id], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.METRICAS_DASHBOARD], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.METRICAS_CHURN], refetchType: 'active' });
      success('Suscripción cancelada');
    },
    onError: createCRUDErrorHandler('delete', 'Suscripcion'),
  });
}

/**
 * Hook para cancelar mi propia suscripción (Dogfooding - usuario cancela su plan)
 */
export function useCancelarMiSuscripcion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ motivo_cancelacion }) => {
      const response = await suscripcionesNegocioApi.cancelarMiSuscripcion({
        motivo_cancelacion,
      });
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MI_SUSCRIPCION], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCIONES], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.METRICAS_DASHBOARD], refetchType: 'active' });
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCIONES], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCION, id], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.METRICAS_DASHBOARD], refetchType: 'active' });
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCIONES], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCION, id], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.METRICAS_DASHBOARD], refetchType: 'active' });
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCION, id], refetchType: 'active' });
      success('Fecha de cobro actualizada');
    },
    onError: createCRUDErrorHandler('update', 'Suscripcion'),
  });
}

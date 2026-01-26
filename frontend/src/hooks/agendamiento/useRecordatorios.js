/**
 * ====================================================================
 * HOOK: useRecordatorios
 * ====================================================================
 *
 * Hook para gestionar la configuración de recordatorios automáticos.
 * Incluye queries y mutations para TanStack Query.
 *
 * QUERIES:
 * - useConfiguracionRecordatorios() - Obtener config
 * - useEstadisticasRecordatorios() - Estadísticas
 * - useHistorialRecordatorios(citaId) - Historial por cita
 *
 * MUTATIONS:
 * - useActualizarConfiguracion() - Actualizar config
 * - useEnviarPrueba() - Enviar mensaje de prueba
 *
 * @module hooks/useRecordatorios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { recordatoriosApi } from '@/services/api/endpoints';
import { useToast } from '../utils/useToast';
import { createCRUDErrorHandler, getErrorMessage } from '@/hooks/config/errorHandlerFactory';

// ==================== QUERY KEYS ====================

export const recordatoriosKeys = {
  all: ['recordatorios'],
  configuracion: () => [...recordatoriosKeys.all, 'configuracion'],
  estadisticas: (filtros) => [...recordatoriosKeys.all, 'estadisticas', filtros],
  historial: (citaId) => [...recordatoriosKeys.all, 'historial', citaId],
};

// ==================== QUERIES ====================

/**
 * Hook para obtener la configuración de recordatorios
 * @returns {Object} { data, isLoading, error, refetch }
 *
 * @example
 * const { data: config, isLoading } = useConfiguracionRecordatorios();
 */
export function useConfiguracionRecordatorios() {
  return useQuery({
    queryKey: recordatoriosKeys.configuracion(),
    queryFn: async () => {
      const response = await recordatoriosApi.obtenerConfiguracion();
      return response.data?.data || response.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos (configuración cambia poco)
  });
}

/**
 * Hook para obtener estadísticas de recordatorios
 * @param {Object} filtros - { fecha_desde?, fecha_hasta? }
 * @returns {Object} { data, isLoading, error }
 *
 * @example
 * const { data: stats } = useEstadisticasRecordatorios({
 *   fecha_desde: '2025-11-01',
 *   fecha_hasta: '2025-11-30'
 * });
 */
export function useEstadisticasRecordatorios(filtros = {}) {
  return useQuery({
    queryKey: recordatoriosKeys.estadisticas(filtros),
    queryFn: async () => {
      const response = await recordatoriosApi.obtenerEstadisticas(filtros);
      return response.data?.data || response.data;
    },
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
  });
}

/**
 * Hook para obtener historial de recordatorios de una cita
 * @param {number} citaId - ID de la cita
 * @returns {Object} { data, isLoading, error }
 *
 * @example
 * const { data: historial } = useHistorialRecordatorios(123);
 */
export function useHistorialRecordatorios(citaId) {
  return useQuery({
    queryKey: recordatoriosKeys.historial(citaId),
    queryFn: async () => {
      const response = await recordatoriosApi.obtenerHistorial(citaId);
      return response.data?.data || response.data;
    },
    enabled: !!citaId,
    staleTime: STALE_TIMES.FREQUENT, // 1 minuto
  });
}

// ==================== MUTATIONS ====================

/**
 * Hook para actualizar la configuración de recordatorios
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const actualizarMutation = useActualizarConfiguracion();
 *
 * actualizarMutation.mutate({
 *   habilitado: true,
 *   recordatorio_1_horas: 24,
 *   plantilla_mensaje: 'Hola {{cliente_nombre}}...'
 * });
 */
export function useActualizarConfiguracion() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async (datos) => {
      const response = await recordatoriosApi.actualizarConfiguracion(datos);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      // Invalidar query de configuración
      queryClient.invalidateQueries({ queryKey: recordatoriosKeys.configuracion(), refetchType: 'active' });
      success('Configuracion de recordatorios actualizada');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('update', 'Configuracion de recordatorios')(error);
      } catch (e) {
        showError(getErrorMessage(e));
      }
    },
  });
}

/**
 * Hook para enviar un mensaje de prueba
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const enviarPruebaMutation = useEnviarPrueba();
 *
 * enviarPruebaMutation.mutate({
 *   telefono: '+521234567890',
 *   mensaje: 'Mensaje de prueba personalizado' // opcional
 * });
 */
export function useEnviarPrueba() {
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async (datos) => {
      const response = await recordatoriosApi.enviarPrueba(datos);
      return response.data?.data || response.data;
    },
    onSuccess: (data) => {
      success(`Mensaje de prueba enviado via ${data.plataforma}`);
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('create', 'Mensaje de prueba')(error);
      } catch (e) {
        showError(getErrorMessage(e));
      }
    },
  });
}

// ==================== EXPORT DEFAULT ====================

export default {
  // Queries
  useConfiguracionRecordatorios,
  useEstadisticasRecordatorios,
  useHistorialRecordatorios,
  // Mutations
  useActualizarConfiguracion,
  useEnviarPrueba,
  // Keys
  recordatoriosKeys,
};

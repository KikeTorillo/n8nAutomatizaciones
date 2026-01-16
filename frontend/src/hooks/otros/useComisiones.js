import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { comisionesApi } from '@/services/api/endpoints';
import { useToast } from '../utils/useToast';

/**
 * Hooks personalizados para gestión de comisiones
 * Sigue el patrón de useCitas.js y useServicios.js
 */

// ==================== CONFIGURACIÓN - QUERY HOOKS ====================

/**
 * Hook para listar configuraciones de comisión
 * @param {Object} params - Filtros: { profesional_id, aplica_a, servicio_id, producto_id, categoria_producto_id, activo, tipo_comision }
 * @returns {Object} { data, isLoading, error, refetch }
 *
 * @example
 * const { data: configuraciones, isLoading } = useConfiguracionesComision({
 *   profesional_id: 1,
 *   aplica_a: 'servicio', // 'servicio', 'producto' o 'ambos'
 *   activo: true
 * });
 */
export function useConfiguracionesComision(params = {}) {
  return useQuery({
    queryKey: ['comisiones', 'configuracion', params],
    queryFn: async () => {
      // Sanitizar parámetros: eliminar valores vacíos
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await comisionesApi.listarConfiguraciones(sanitizedParams);
      return response.data?.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: true,
  });
}

/**
 * Hook para obtener historial de cambios en configuración
 * @param {Object} params - { profesional_id, servicio_id, fecha_desde, fecha_hasta, limite, offset }
 * @returns {Object} { data, isLoading, error }
 *
 * @example
 * const { data: historial } = useHistorialConfiguracion({
 *   profesional_id: 1
 * });
 */
export function useHistorialConfiguracion(params = {}) {
  return useQuery({
    queryKey: ['comisiones', 'historial-configuracion', params],
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await comisionesApi.obtenerHistorialConfiguracion(sanitizedParams);
      return response.data?.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutos (el historial no cambia frecuentemente)
    enabled: Object.keys(params).length > 0, // Solo ejecutar si hay filtros
  });
}

// ==================== CONFIGURACIÓN - MUTATION HOOKS ====================

/**
 * Hook para crear o actualizar configuración de comisión
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const crearConfigMutation = useCrearConfiguracionComision();
 *
 * const handleCrear = () => {
 *   crearConfigMutation.mutate({
 *     profesional_id: 1,
 *     servicio_id: 2,
 *     tipo_comision: 'porcentaje',
 *     valor_comision: 15,
 *     activo: true
 *   });
 * };
 */
export function useCrearConfiguracionComision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      // Sanitizar campos opcionales
      const sanitizedData = {
        ...data,
        aplica_a: data.aplica_a || 'servicio',
        servicio_id: data.servicio_id || undefined,
        producto_id: data.producto_id || undefined,
        categoria_producto_id: data.categoria_producto_id || undefined,
        notas: data.notas?.trim() || undefined,
      };

      const response = await comisionesApi.crearConfiguracion(sanitizedData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidar queries de configuración
      queryClient.invalidateQueries({ queryKey: ['comisiones', 'configuracion'] });
    },
  });
}

/**
 * Hook para eliminar configuración de comisión
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const eliminarMutation = useEliminarConfiguracionComision();
 *
 * const handleEliminar = () => {
 *   eliminarMutation.mutate({ id: 1 });
 * };
 */
export function useEliminarConfiguracionComision() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({ id }) => {
      const response = await comisionesApi.eliminarConfiguracion(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comisiones', 'configuracion'] });
      queryClient.invalidateQueries({ queryKey: ['comisiones', 'historial-configuracion'] });
      success('Configuración eliminada exitosamente');
    },
    onError: (error) => {
      const mensaje =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error al eliminar la configuración';
      showError(mensaje);
    },
  });
}

// ==================== COMISIONES - QUERY HOOKS ====================

/**
 * Hook para obtener comisiones de un profesional
 * @param {number} profesionalId - ID del profesional
 * @param {Object} params - { fecha_desde, fecha_hasta, estado_pago, origen, limite, offset }
 * @returns {Object} { data, isLoading, error, refetch }
 *
 * @example
 * const { data, isLoading } = useComisionesProfesional(1, {
 *   fecha_desde: '2025-01-01',
 *   fecha_hasta: '2025-01-31',
 *   estado_pago: 'pendiente',
 *   origen: 'cita' // 'cita' o 'venta'
 * });
 */
export function useComisionesProfesional(profesionalId, params = {}) {
  return useQuery({
    queryKey: ['comisiones', 'profesional', profesionalId, params],
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await comisionesApi.obtenerPorProfesional(profesionalId, sanitizedParams);
      return {
        comisiones: response.data?.data?.comisiones || [],
        total: response.data?.data?.total || 0,
        resumen: response.data?.data?.resumen || {},
      };
    },
    enabled: !!profesionalId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para obtener comisiones por período
 * @param {Object} params - { fecha_desde, fecha_hasta, profesional_id, estado_pago, origen, limite, offset }
 * @returns {Object} { data, isLoading, error }
 *
 * @example
 * const { data } = useComisionesPorPeriodo({
 *   fecha_desde: '2025-01-01',
 *   fecha_hasta: '2025-01-31',
 *   origen: 'venta' // 'cita' o 'venta'
 * });
 */
export function useComisionesPorPeriodo(params = {}) {
  return useQuery({
    queryKey: ['comisiones', 'periodo', params],
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await comisionesApi.obtenerPorPeriodo(sanitizedParams);
      const comisiones = response.data?.data || [];

      // Calcular resumen
      const resumen = {
        total: comisiones.reduce((sum, c) => sum + parseFloat(c.monto_comision || 0), 0),
        total_pendientes: comisiones
          .filter(c => c.estado_pago === 'pendiente')
          .reduce((sum, c) => sum + parseFloat(c.monto_comision || 0), 0),
        total_pagadas: comisiones
          .filter(c => c.estado_pago === 'pagada')
          .reduce((sum, c) => sum + parseFloat(c.monto_comision || 0), 0),
      };

      return {
        comisiones,
        total: comisiones.length,
        resumen,
      };
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!(params.fecha_desde && params.fecha_hasta),
  });
}

/**
 * Hook para obtener una comisión específica por ID
 * @param {number} id - ID de la comisión
 * @returns {Object} { data, isLoading, error }
 *
 * @example
 * const { data: comision } = useComision(123);
 */
export function useComision(id) {
  return useQuery({
    queryKey: ['comisiones', id],
    queryFn: async () => {
      const response = await comisionesApi.obtener(id);
      return response.data?.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// ==================== COMISIONES - MUTATION HOOKS ====================

/**
 * Hook para marcar comisión como pagada
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const pagarMutation = useMarcarComoPagada();
 *
 * const handlePagar = () => {
 *   pagarMutation.mutate({
 *     id: 123,
 *     fecha_pago: '2025-01-15',
 *     metodo_pago: 'Transferencia',
 *     referencia_pago: 'TRX-12345',
 *     notas_pago: 'Pago correspondiente a enero 2025'
 *   });
 * };
 */
export function useMarcarComoPagada() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const sanitizedData = {
        fecha_pago: data.fecha_pago,
        metodo_pago: data.metodo_pago?.trim() || undefined,
        referencia_pago: data.referencia_pago?.trim() || undefined,
        notas_pago: data.notas_pago?.trim() || undefined,
      };

      const response = await comisionesApi.marcarComoPagada(id, sanitizedData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comisiones'] });
      queryClient.invalidateQueries({ queryKey: ['comisiones', variables.id] });
      success('Comisión marcada como pagada');
    },
    onError: (error) => {
      const mensaje =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error al marcar la comisión como pagada';
      showError(mensaje);
    },
  });
}

// ==================== DASHBOARD Y ESTADÍSTICAS ====================

/**
 * Hook para obtener métricas del dashboard de comisiones
 * @param {Object} params - { fecha_desde, fecha_hasta, profesional_id, origen }
 * @returns {Object} { data, isLoading, error }
 *
 * @example
 * const { data: dashboard } = useDashboardComisiones({
 *   fecha_desde: '2025-01-01',
 *   fecha_hasta: '2025-01-31',
 *   origen: 'cita' // 'cita' o 'venta' (opcional, muestra ambos si no se especifica)
 * });
 */
export function useDashboardComisiones(params = {}) {
  return useQuery({
    queryKey: ['comisiones', 'dashboard', params],
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await comisionesApi.obtenerDashboard(sanitizedParams);
      return response.data?.data || {};
    },
    staleTime: 1 * 60 * 1000, // 1 minuto (dashboard debe estar actualizado)
    refetchInterval: 5 * 60 * 1000, // Refetch cada 5 minutos
  });
}

/**
 * Hook para obtener estadísticas de comisiones
 * @param {Object} params - { fecha_desde, fecha_hasta, profesional_id, origen }
 * @returns {Object} { data, isLoading, error }
 *
 * @example
 * const { data: estadisticas } = useEstadisticasComisiones({
 *   fecha_desde: '2025-01-01',
 *   fecha_hasta: '2025-12-31',
 *   origen: 'venta' // 'cita' o 'venta'
 * });
 */
export function useEstadisticasComisiones(params = {}) {
  return useQuery({
    queryKey: ['comisiones', 'estadisticas', params],
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await comisionesApi.obtenerEstadisticas(sanitizedParams);
      return response.data?.data || {};
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!(params.fecha_desde && params.fecha_hasta),
  });
}

/**
 * Hook para obtener datos para gráfica de comisiones por día
 * @param {Object} params - { fecha_desde, fecha_hasta, profesional_id, origen }
 * @returns {Object} { data, isLoading, error }
 *
 * @example
 * const { data: graficaData } = useGraficaComisionesPorDia({
 *   fecha_desde: '2025-01-01',
 *   fecha_hasta: '2025-01-31',
 *   profesional_id: 1,
 *   origen: 'cita' // 'cita' o 'venta'
 * });
 */
export function useGraficaComisionesPorDia(params = {}) {
  return useQuery({
    queryKey: ['comisiones', 'grafica-por-dia', params],
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await comisionesApi.obtenerGraficaPorDia(sanitizedParams);
      return response.data?.data?.grafica || [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!(params.fecha_desde && params.fecha_hasta),
  });
}

// ==================== EXPORT DEFAULT ====================

export default {
  // Configuración - Query
  useConfiguracionesComision,
  useHistorialConfiguracion,

  // Configuración - Mutation
  useCrearConfiguracionComision,
  useEliminarConfiguracionComision,

  // Comisiones - Query
  useComisionesProfesional,
  useComisionesPorPeriodo,
  useComision,

  // Comisiones - Mutation
  useMarcarComoPagada,

  // Dashboard y Estadísticas
  useDashboardComisiones,
  useEstadisticasComisiones,
  useGraficaComisionesPorDia,
};

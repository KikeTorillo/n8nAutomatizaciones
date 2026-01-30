/**
 * ====================================================================
 * HOOKS: USO DE USUARIOS (SEAT-BASED BILLING)
 * ====================================================================
 * Hooks para gestión de uso de usuarios y facturación por usuario.
 *
 * @module hooks/suscripciones-negocio/useUsoUsuarios
 * @version 1.0.0
 * @date Enero 2026
 */

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { suscripcionesNegocioApi } from '@/services/api/modules';
import { sanitizeParams } from '@/lib/params';
import { QUERY_KEYS } from './constants';

/**
 * Hook para obtener resumen de uso de usuarios
 *
 * Retorna información sobre:
 * - usuariosActuales: Usuarios activos en la organización
 * - usuariosIncluidos: Usuarios incluidos en el plan
 * - usuariosExtra: Usuarios por encima del incluido
 * - porcentajeUso: Porcentaje de uso (puede ser >100%)
 * - estadoUso: 'normal' | 'advertencia' | 'excedido'
 * - cobroAdicionalProyectado: Monto adicional proyectado
 * - precioUsuarioAdicional: Precio por usuario extra
 *
 * @param {Object} options - Opciones de React Query
 * @returns {Object} Query result con resumen de uso
 */
export function useResumenUso(options = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.USO_RESUMEN],
    queryFn: async () => {
      try {
        const response = await suscripcionesNegocioApi.obtenerResumenUso();
        return response.data?.data || { tieneSuscripcion: false };
      } catch (error) {
        // Si es 403 o no tiene suscripción, retornar datos vacíos
        if (error.response?.status === 403 || error.response?.status === 404) {
          return { tieneSuscripcion: false };
        }
        throw error;
      }
    },
    staleTime: STALE_TIMES.FREQUENT, // 1 minuto
    refetchInterval: 60 * 1000, // Refetch cada minuto
    retry: (failureCount, error) => {
      if (error.response?.status === 403) return false;
      return failureCount < 3;
    },
    ...options,
  });
}

/**
 * Hook para obtener historial de uso diario de usuarios
 *
 * @param {Object} params - { dias?: number } - Días hacia atrás (default 30)
 * @param {Object} options - Opciones de React Query
 * @returns {Object} Query result con historial de uso
 */
export function useHistorialUso(params = {}, options = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.USO_HISTORIAL, params],
    queryFn: async () => {
      const sanitized = sanitizeParams(params);
      const response = await suscripcionesNegocioApi.obtenerHistorialUso(sanitized);
      return response.data?.data || { items: [] };
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
    ...options,
  });
}

/**
 * Hook para obtener proyección del próximo cobro
 *
 * Retorna:
 * - precioBase: Precio base del plan
 * - ajusteUsuarios: Detalle del ajuste por usuarios
 * - totalProyectado: Total a cobrar
 * - fechaProximoCobro: Fecha del próximo cobro
 *
 * @param {Object} options - Opciones de React Query
 * @returns {Object} Query result con proyección
 */
export function useProyeccionCobro(options = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.USO_PROYECCION],
    queryFn: async () => {
      const response = await suscripcionesNegocioApi.obtenerProyeccionCobro();
      return response.data?.data || { tieneSuscripcion: false };
    },
    staleTime: STALE_TIMES.FREQUENT,
    ...options,
  });
}

/**
 * Hook para verificar si se puede crear usuario(s)
 *
 * Útil para mostrar advertencias/bloqueos antes de crear usuarios.
 *
 * Retorna:
 * - puedeCrear: boolean
 * - advertencia: string | null
 * - costoAdicional: number
 * - esHardLimit: boolean
 *
 * @param {number} cantidad - Cantidad de usuarios a crear (default 1)
 * @param {Object} options - Opciones de React Query
 * @returns {Object} Query result con verificación
 */
export function useVerificarLimiteUsuarios(cantidad = 1, options = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.USO_VERIFICAR_LIMITE, { cantidad }],
    queryFn: async () => {
      const response = await suscripcionesNegocioApi.verificarLimiteUsuarios({ cantidad });
      return response.data?.data || { puedeCrear: true };
    },
    staleTime: STALE_TIMES.FREQUENT,
    enabled: options.enabled !== false,
    ...options,
  });
}

/**
 * Hook combinado para dashboard de uso de usuarios
 *
 * Combina resumen y proyección en una sola query para uso en UI.
 *
 * @param {Object} options - Opciones de React Query
 * @returns {Object} Datos combinados de uso
 */
export function useUsoUsuariosDashboard(options = {}) {
  const resumenQuery = useResumenUso(options);
  const proyeccionQuery = useProyeccionCobro({ ...options, enabled: !!resumenQuery.data?.tieneSuscripcion });

  const isLoading = resumenQuery.isLoading || proyeccionQuery.isLoading;
  const isError = resumenQuery.isError || proyeccionQuery.isError;
  const error = resumenQuery.error || proyeccionQuery.error;

  return {
    // Estado de carga
    isLoading,
    isError,
    error,
    isFetching: resumenQuery.isFetching || proyeccionQuery.isFetching,

    // Datos combinados
    resumen: resumenQuery.data || {},
    proyeccion: proyeccionQuery.data || {},

    // Helpers de refetch
    refetch: () => {
      resumenQuery.refetch();
      proyeccionQuery.refetch();
    },
  };
}

export default {
  useResumenUso,
  useHistorialUso,
  useProyeccionCobro,
  useVerificarLimiteUsuarios,
  useUsoUsuariosDashboard,
};

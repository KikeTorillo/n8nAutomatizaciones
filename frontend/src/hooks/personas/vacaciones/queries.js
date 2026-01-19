/**
 * Queries - Vacaciones (hooks de lectura)
 */

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { vacacionesApi } from '@/services/api/endpoints';
import { VACACIONES_KEYS } from './constants';

// ==================== POLÍTICA ====================

/**
 * Obtener política de vacaciones
 */
export function usePoliticaVacaciones() {
  return useQuery({
    queryKey: VACACIONES_KEYS.politica(),
    queryFn: async () => {
      const response = await vacacionesApi.obtenerPolitica();
      return response.data.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

// ==================== NIVELES ====================

/**
 * Lista niveles de vacaciones
 */
export function useNivelesVacaciones(filtros = {}) {
  return useQuery({
    queryKey: VACACIONES_KEYS.niveles(filtros),
    queryFn: async () => {
      const response = await vacacionesApi.listarNiveles(filtros);
      return response.data.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

// ==================== SALDOS ====================

/**
 * Obtener mi saldo de vacaciones
 */
export function useMiSaldoVacaciones(anio = null) {
  return useQuery({
    queryKey: VACACIONES_KEYS.miSaldo(anio),
    queryFn: async () => {
      const response = await vacacionesApi.obtenerMiSaldo({ anio });
      return response.data.data;
    },
    staleTime: STALE_TIMES.REAL_TIME, // 30 segundos
  });
}

/**
 * Listar saldos de vacaciones (admin)
 */
export function useSaldosVacaciones(filtros = {}) {
  return useQuery({
    queryKey: VACACIONES_KEYS.saldos(filtros),
    queryFn: async () => {
      const response = await vacacionesApi.listarSaldos(filtros);
      return response.data;
    },
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

// ==================== SOLICITUDES ====================

/**
 * Listar mis solicitudes
 */
export function useMisSolicitudesVacaciones(filtros = {}) {
  return useQuery({
    queryKey: VACACIONES_KEYS.misSolicitudes(filtros),
    queryFn: async () => {
      const response = await vacacionesApi.listarMisSolicitudes(filtros);
      return response.data;
    },
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

/**
 * Listar todas las solicitudes (admin)
 */
export function useSolicitudesVacaciones(filtros = {}) {
  return useQuery({
    queryKey: VACACIONES_KEYS.solicitudes(filtros),
    queryFn: async () => {
      const response = await vacacionesApi.listarSolicitudes(filtros);
      return response.data;
    },
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

/**
 * Hook para obtener solicitudes para el calendario de equipo
 * Soporta filtros de fecha_inicio, fecha_fin, estado, departamento_id
 * @param {Object} filtros - { fecha_inicio, fecha_fin, estado, departamento_id }
 */
export function useSolicitudesCalendario(filtros = {}) {
  return useQuery({
    queryKey: VACACIONES_KEYS.solicitudes({ ...filtros, tipo: 'calendario' }),
    queryFn: async () => {
      const params = {
        fecha_inicio: filtros.fecha_inicio,
        fecha_fin: filtros.fecha_fin,
        estado: filtros.estado || undefined,
        departamento_id: filtros.departamento_id || undefined,
        limit: 100, // Máximo permitido por el backend
      };
      const response = await vacacionesApi.listarSolicitudes(params);
      return response.data.data || [];
    },
    enabled: !!filtros.fecha_inicio && !!filtros.fecha_fin,
    staleTime: STALE_TIMES.REAL_TIME,
    keepPreviousData: true, // Suaviza transiciones al cambiar mes
  });
}

/**
 * Listar solicitudes pendientes
 */
export function useSolicitudesPendientes(filtros = {}) {
  return useQuery({
    queryKey: VACACIONES_KEYS.pendientes(filtros),
    queryFn: async () => {
      const response = await vacacionesApi.listarPendientes(filtros);
      return response.data;
    },
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

/**
 * Obtener solicitud por ID
 */
export function useSolicitudVacaciones(id) {
  return useQuery({
    queryKey: VACACIONES_KEYS.solicitud(id),
    queryFn: async () => {
      const response = await vacacionesApi.obtenerSolicitud(id);
      return response.data.data;
    },
    enabled: !!id,
  });
}

// ==================== DASHBOARD ====================

/**
 * Obtener dashboard de vacaciones del usuario
 */
export function useDashboardVacaciones(anio = null) {
  return useQuery({
    queryKey: VACACIONES_KEYS.dashboard(anio),
    queryFn: async () => {
      const response = await vacacionesApi.obtenerDashboard({ anio });
      return response.data.data;
    },
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

/**
 * Obtener estadísticas generales (admin)
 */
export function useEstadisticasVacaciones(filtros = {}) {
  return useQuery({
    queryKey: VACACIONES_KEYS.estadisticas(filtros),
    queryFn: async () => {
      const response = await vacacionesApi.obtenerEstadisticas(filtros);
      return response.data.data;
    },
    staleTime: STALE_TIMES.FREQUENT, // 1 minuto
  });
}

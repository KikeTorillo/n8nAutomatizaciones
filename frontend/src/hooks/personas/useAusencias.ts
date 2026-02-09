/**
 * useAusencias - Hook consolidado para el módulo Ausencias
 * Combina vacaciones + incapacidades en una vista unificada
 * Enero 2026
 * Feb 2026 - Migrado a TypeScript
 */
import { useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { queryKeys } from '@/hooks/config';
import {
  calcularDiasRestantes as calcularDiasRestantesLib,
  formatRangoFechas as formatRangoFechasLib,
} from '@/lib/dateHelpers';

// Re-exportar hooks existentes para conveniencia
export {
  // Vacaciones
  useDashboardVacaciones,
  useMiSaldoVacaciones,
  useMisSolicitudesVacaciones,
  useSolicitudesPendientes,
  useSolicitudesCalendario,
  useCrearSolicitudVacaciones,
  useAprobarSolicitud,
  useRechazarSolicitud,
  useCancelarSolicitud,
  usePoliticaVacaciones,
  useNivelesVacaciones,
  useSaldosVacaciones,
  useEstadisticasVacaciones,
  ESTADOS_SOLICITUD,
  TURNOS_MEDIO_DIA,
  getEstadoSolicitud,
  formatDias,
} from './useVacaciones';

export {
  // Incapacidades
  useIncapacidades,
  useMisIncapacidades,
  useIncapacidad,
  useIncapacidadesActivasProfesional,
  useEstadisticasIncapacidades,
  useCrearIncapacidad,
  useFinalizarIncapacidad,
  useCancelarIncapacidad,
  useCrearProrroga,
  TIPOS_INCAPACIDAD,
  TIPOS_INCAPACIDAD_CONFIG,
  ESTADOS_INCAPACIDAD,
  ESTADOS_INCAPACIDAD_CONFIG,
  getTipoIncapacidadConfig,
  getEstadoIncapacidadConfig,
  formatDiasIncapacidad,
} from './useIncapacidades';

// Importar para uso interno
import {
  useDashboardVacaciones,
  useMisSolicitudesVacaciones,
  useSolicitudesPendientes,
  useSolicitudesCalendario,
  ESTADOS_SOLICITUD,
} from './useVacaciones';

import {
  useMisIncapacidades,
  useIncapacidades,
  TIPOS_INCAPACIDAD_CONFIG,
  ESTADOS_INCAPACIDAD_CONFIG,
} from './useIncapacidades';

// ==================== INTERFACES ====================

interface TipoAusenciaConfig {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon: string;
}

interface AusenciaItem {
  id: number | string;
  tipo: string;
  tipoConfig: TipoAusenciaConfig;
  subTipo?: string;
  subTipoConfig?: Record<string, unknown>;
  profesionalId?: number;
  profesionalNombre?: string;
  puestoNombre?: string;
  departamentoNombre?: string;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  estado: string;
  estadoConfig?: Record<string, unknown>;
  motivo?: string;
  motivoRechazo?: string;
  folioImss?: string;
  creadoEn?: string;
  codigo?: string;
  raw: Record<string, unknown>;
}

interface MisAusenciasFiltros {
  anio?: number;
  tipo?: string;
  estado?: string;
}

interface CalendarioFiltros {
  fecha_inicio?: string;
  fecha_fin?: string;
  tipo?: string;
  estado?: string;
  departamento_id?: number;
}

interface EstadisticasFiltros {
  anio?: number;
}

// ==================== CONSTANTES ====================

export const TIPOS_AUSENCIA = {
  VACACIONES: 'vacaciones',
  INCAPACIDAD: 'incapacidad',
} as const;

export const TIPOS_AUSENCIA_CONFIG: Record<string, TipoAusenciaConfig> = {
  vacaciones: {
    label: 'Vacaciones',
    color: 'green',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-300',
    icon: 'Palmtree',
  },
  incapacidad: {
    label: 'Incapacidad',
    color: 'red',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-300',
    icon: 'HeartPulse',
  },
};

// ==================== HOOKS CONSOLIDADOS ====================

/**
 * Dashboard consolidado de ausencias para el usuario actual
 * Combina saldo de vacaciones + incapacidades activas + próximas ausencias
 */
export function useDashboardAusencias(anio: number | null = null) {
  const anioActual = anio || new Date().getFullYear();

  // Datos de vacaciones
  const {
    data: vacacionesData,
    isLoading: isLoadingVacaciones,
    error: errorVacaciones,
  } = useDashboardVacaciones(anioActual as any);

  // Mis incapacidades
  const {
    data: incapacidadesData,
    isLoading: isLoadingIncapacidades,
    error: errorIncapacidades,
  } = useMisIncapacidades({ anio: anioActual });

  // Consolidar datos
  const dashboard = useMemo(() => {
    if (!vacacionesData && !incapacidadesData) return null;

    const rawIncapacidades = (incapacidadesData as any)?.data;
    const incapacidades = Array.isArray(rawIncapacidades) ? rawIncapacidades : [];
    const incapacidadesActivas = incapacidades.filter((i: any) => i.estado === 'activa');

    return {
      // Vacaciones
      saldoVacaciones: (vacacionesData as any)?.saldo || null,
      nivelVacaciones: (vacacionesData as any)?.nivel || null,
      conteosSolicitudes: (vacacionesData as any)?.conteos || {},

      // Incapacidades
      incapacidadesActivas,
      totalIncapacidadesAnio: incapacidades.length,
      diasIncapacidadAnio: incapacidades.reduce(
        (sum: number, i: any) => sum + (i.dias_autorizados || 0),
        0,
      ),

      // Resumen
      tieneIncapacidadActiva: incapacidadesActivas.length > 0,
      diasVacacionesDisponibles: (vacacionesData as any)?.saldo?.dias_pendientes || 0,
      diasVacacionesUsados: (vacacionesData as any)?.saldo?.dias_usados || 0,
      diasVacacionesEnTramite:
        (vacacionesData as any)?.saldo?.dias_solicitados_pendientes || 0,
    };
  }, [vacacionesData, incapacidadesData]);

  return {
    data: dashboard,
    isLoading: isLoadingVacaciones || isLoadingIncapacidades,
    error: errorVacaciones || errorIncapacidades,
    // Datos individuales para más control
    vacaciones: vacacionesData,
    incapacidades: incapacidadesData,
  };
}

/**
 * Mis ausencias (solicitudes de vacaciones + incapacidades propias)
 */
export function useMisAusencias(filtros: MisAusenciasFiltros = {}) {
  const { anio, tipo, estado } = filtros;

  // Mis solicitudes de vacaciones
  const filtrosVacaciones = {
    anio,
    estado: tipo === 'incapacidad' ? undefined : estado,
  };
  const {
    data: vacacionesData,
    isLoading: isLoadingVacaciones,
  } = useMisSolicitudesVacaciones(filtrosVacaciones);

  // Mis incapacidades
  const filtrosIncapacidades = {
    anio,
    estado: tipo === 'vacaciones' ? undefined : estado,
  };
  const {
    data: incapacidadesData,
    isLoading: isLoadingIncapacidades,
  } = useMisIncapacidades(filtrosIncapacidades);

  // Combinar y ordenar por fecha
  const ausencias = useMemo(() => {
    const items: AusenciaItem[] = [];

    // Agregar vacaciones
    if (tipo !== 'incapacidad') {
      // La respuesta tiene estructura { data: { data: [...], total, ... } }
      const rawSolicitudes = (vacacionesData as any)?.data?.data || (vacacionesData as any)?.data;
      const solicitudes = Array.isArray(rawSolicitudes) ? rawSolicitudes : [];
      solicitudes.forEach((s: any) => {
        items.push({
          id: s.id,
          tipo: 'vacaciones',
          tipoConfig: TIPOS_AUSENCIA_CONFIG.vacaciones,
          fechaInicio: s.fecha_inicio,
          fechaFin: s.fecha_fin,
          dias: s.dias_habiles || s.dias_solicitados,
          estado: s.estado,
          estadoConfig: (ESTADOS_SOLICITUD as any)[s.estado],
          motivo: s.motivo_solicitud,
          motivoRechazo: s.motivo_rechazo,
          creadoEn: s.creado_en,
          codigo: s.codigo,
          raw: s,
        });
      });
    }

    // Agregar incapacidades
    if (tipo !== 'vacaciones') {
      // La respuesta tiene estructura { data: { data: [...], total, ... } }
      const rawIncapacidades = (incapacidadesData as any)?.data?.data || (incapacidadesData as any)?.data;
      const incapacidades = Array.isArray(rawIncapacidades) ? rawIncapacidades : [];
      incapacidades.forEach((i: any) => {
        items.push({
          id: i.id,
          tipo: 'incapacidad',
          tipoConfig: TIPOS_AUSENCIA_CONFIG.incapacidad,
          subTipo: i.tipo_incapacidad,
          subTipoConfig: (TIPOS_INCAPACIDAD_CONFIG as any)[i.tipo_incapacidad],
          fechaInicio: i.fecha_inicio,
          fechaFin: i.fecha_fin,
          dias: i.dias_autorizados,
          estado: i.estado,
          estadoConfig: (ESTADOS_INCAPACIDAD_CONFIG as any)[i.estado],
          motivo: i.diagnostico,
          folioImss: i.folio_imss,
          creadoEn: i.creado_en,
          codigo: i.codigo,
          raw: i,
        });
      });
    }

    // Ordenar por fecha de inicio (más reciente primero)
    items.sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime());

    return items;
  }, [vacacionesData, incapacidadesData, tipo]);

  return {
    data: ausencias,
    isLoading: isLoadingVacaciones || isLoadingIncapacidades,
    total: ausencias.length,
  };
}

/**
 * Calendario unificado de ausencias
 * Combina vacaciones aprobadas/pendientes + incapacidades activas
 */
export function useCalendarioAusencias(filtros: CalendarioFiltros = {}) {
  const { fecha_inicio, fecha_fin, tipo, estado, departamento_id } = filtros;

  // Solicitudes de vacaciones para el rango
  const filtrosVacaciones = {
    fecha_inicio,
    fecha_fin,
    estado: tipo === 'incapacidad' ? undefined : estado,
    departamento_id,
  };
  const {
    data: vacacionesData,
    isLoading: isLoadingVacaciones,
  } = useSolicitudesCalendario(filtrosVacaciones);

  // Estados válidos para incapacidades (diferente a vacaciones)
  const estadosIncapacidadesValidos = ['activa', 'finalizada', 'cancelada'];
  const estadoIncapacidad = estado && estadosIncapacidadesValidos.includes(estado) ? estado : undefined;

  // Incapacidades para el rango (usando query directa)
  const {
    data: incapacidadesData,
    isLoading: isLoadingIncapacidades,
  } = useQuery({
    queryKey: ['ausencias', 'calendario', 'incapacidades', { fecha_inicio, fecha_fin, estado: estadoIncapacidad }],
    queryFn: async () => {
      if (tipo === 'vacaciones') return [];

      // Importar dinámicamente para evitar dependencia circular
      const { incapacidadesApi } = await import('@/services/api/endpoints');
      const response = await incapacidadesApi.listar({
        fecha_inicio,
        fecha_fin,
        estado: estadoIncapacidad,
        limite: 100, // Máximo permitido por el backend
      });
      return (response as any).data?.data || [];
    },
    enabled: !!fecha_inicio && !!fecha_fin && tipo !== 'vacaciones',
    staleTime: STALE_TIMES.REAL_TIME,
    placeholderData: keepPreviousData,
  });

  // Combinar eventos para el calendario
  const eventos = useMemo(() => {
    const items: AusenciaItem[] = [];

    // Agregar vacaciones
    if (tipo !== 'incapacidad') {
      const solicitudes = Array.isArray(vacacionesData) ? vacacionesData : [];
      solicitudes.forEach((s: any) => {
        items.push({
          id: `vac-${s.id}`,
          tipo: 'vacaciones',
          tipoConfig: TIPOS_AUSENCIA_CONFIG.vacaciones,
          profesionalId: s.profesional_id,
          profesionalNombre: s.profesional_nombre,
          departamentoNombre: s.departamento_nombre,
          fechaInicio: s.fecha_inicio,
          fechaFin: s.fecha_fin,
          dias: s.dias_habiles || s.dias_solicitados,
          estado: s.estado,
          estadoConfig: (ESTADOS_SOLICITUD as any)[s.estado],
          codigo: s.codigo,
          raw: s,
        });
      });
    }

    // Agregar incapacidades
    if (tipo !== 'vacaciones') {
      const incapacidades = (incapacidadesData as any[]) || [];
      incapacidades.forEach((i: any) => {
        items.push({
          id: `inc-${i.id}`,
          tipo: 'incapacidad',
          tipoConfig: TIPOS_AUSENCIA_CONFIG.incapacidad,
          subTipo: i.tipo_incapacidad,
          subTipoConfig: (TIPOS_INCAPACIDAD_CONFIG as any)[i.tipo_incapacidad],
          profesionalId: i.profesional_id,
          profesionalNombre: i.profesional_nombre,
          departamentoNombre: i.departamento_nombre,
          fechaInicio: i.fecha_inicio,
          fechaFin: i.fecha_fin,
          dias: i.dias_autorizados,
          estado: i.estado,
          estadoConfig: (ESTADOS_INCAPACIDAD_CONFIG as any)[i.estado],
          codigo: i.codigo,
          raw: i,
        });
      });
    }

    return items;
  }, [vacacionesData, incapacidadesData, tipo]);

  // Agrupar por fecha para renderizado del calendario
  const eventosPorFecha = useMemo(() => {
    const agrupados: Record<string, AusenciaItem[]> = {};

    eventos.forEach((evento) => {
      const inicio = new Date(evento.fechaInicio);
      const fin = new Date(evento.fechaFin);

      // Expandir rango de fechas
      const current = new Date(inicio);
      while (current <= fin) {
        const fechaISO = current.toISOString().split('T')[0];

        if (!agrupados[fechaISO]) {
          agrupados[fechaISO] = [];
        }

        // Evitar duplicados
        if (!agrupados[fechaISO].find((e) => e.id === evento.id)) {
          agrupados[fechaISO].push(evento);
        }

        current.setDate(current.getDate() + 1);
      }
    });

    return agrupados;
  }, [eventos]);

  return {
    data: eventos,
    eventosPorFecha,
    isLoading: isLoadingVacaciones || isLoadingIncapacidades,
    totalEventos: eventos.length,
  };
}

/**
 * Solicitudes pendientes de aprobación (para supervisores)
 * Actualmente solo vacaciones tienen flujo de aprobación
 */
export function useSolicitudesPendientesAusencias(filtros: Record<string, unknown> = {}) {
  const { data, isLoading, error } = useSolicitudesPendientes(filtros);

  const solicitudes = useMemo(() => {
    const rawItems = (data as any)?.data;
    const items = Array.isArray(rawItems) ? rawItems : [];
    return items.map((s: any): AusenciaItem => ({
      id: s.id,
      tipo: 'vacaciones',
      tipoConfig: TIPOS_AUSENCIA_CONFIG.vacaciones,
      profesionalId: s.profesional_id,
      profesionalNombre: s.profesional_nombre,
      puestoNombre: s.puesto_nombre,
      fechaInicio: s.fecha_inicio,
      fechaFin: s.fecha_fin,
      dias: s.dias_habiles || s.dias_solicitados,
      estado: s.estado,
      motivo: s.motivo_solicitud,
      creadoEn: s.creado_en,
      raw: s,
    }));
  }, [data]);

  return {
    data: solicitudes,
    total: solicitudes.length,
    isLoading,
    error,
    // También retornar si el usuario es supervisor (basado en si la query retorna datos)
    esSupervisor: data !== undefined && !error,
  };
}

/**
 * Estadísticas consolidadas de ausencias (admin)
 */
export function useEstadisticasAusencias(filtros: EstadisticasFiltros = {}) {
  const { anio = new Date().getFullYear() } = filtros;

  // Estadísticas de vacaciones
  const {
    data: statsVacaciones,
    isLoading: isLoadingVacaciones,
  } = useQuery({
    queryKey: queryKeys.ausencias.estadisticas.vacaciones(anio),
    queryFn: async () => {
      const { vacacionesApi } = await import('@/services/api/endpoints');
      const response = await vacacionesApi.obtenerEstadisticas({ anio });
      return (response as any).data?.data || {};
    },
    staleTime: STALE_TIMES.FREQUENT,
  });

  // Estadísticas de incapacidades
  const {
    data: statsIncapacidades,
    isLoading: isLoadingIncapacidades,
  } = useQuery({
    queryKey: queryKeys.ausencias.estadisticas.incapacidades(anio),
    queryFn: async () => {
      const { incapacidadesApi } = await import('@/services/api/endpoints');
      const response = await incapacidadesApi.obtenerEstadisticas({ anio });
      return (response as any).data?.data || {};
    },
    staleTime: STALE_TIMES.FREQUENT,
  });

  const estadisticas = useMemo(() => {
    return {
      vacaciones: statsVacaciones || {},
      incapacidades: statsIncapacidades || {},
      resumen: {
        totalDiasVacaciones: (statsVacaciones as any)?.total_dias || 0,
        totalDiasIncapacidades: (statsIncapacidades as any)?.dias_totales || 0,
        solicitudesPendientes: (statsVacaciones as any)?.pendientes || 0,
        incapacidadesActivas: (statsIncapacidades as any)?.activas || 0,
      },
    };
  }, [statsVacaciones, statsIncapacidades]);

  return {
    data: estadisticas,
    isLoading: isLoadingVacaciones || isLoadingIncapacidades,
  };
}

// ==================== UTILIDADES ====================

/**
 * Obtiene la configuración de un tipo de ausencia
 */
export function getTipoAusenciaConfig(tipo: string): TipoAusenciaConfig {
  return TIPOS_AUSENCIA_CONFIG[tipo] || {
    label: tipo,
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    icon: '',
  };
}

/**
 * Formatea rango de fechas para mostrar
 * Re-exportado desde @/lib/dateHelpers
 */
export const formatRangoFechas = formatRangoFechasLib;

/**
 * Calcula días restantes de una ausencia activa
 * Re-exportado desde @/lib/dateHelpers
 */
export const calcularDiasRestantes = calcularDiasRestantesLib;

// ==================== EXPORT DEFAULT ====================

export default {
  // Hooks consolidados
  useDashboardAusencias,
  useMisAusencias,
  useCalendarioAusencias,
  useSolicitudesPendientesAusencias,
  useEstadisticasAusencias,

  // Constantes
  TIPOS_AUSENCIA,
  TIPOS_AUSENCIA_CONFIG,

  // Utilidades
  getTipoAusenciaConfig,
  formatRangoFechas,
  calcularDiasRestantes,
};

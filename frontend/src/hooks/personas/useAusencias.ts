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
  TIPOS_INCAPACIDAD_CONFIG,
  ESTADOS_INCAPACIDAD_CONFIG,
} from './useIncapacidades';

// ==================== INTERFACES ====================

// --- Interfaces de respuesta API (eliminar `as any` en response casts) ---

/** Estructura del dashboard de vacaciones (retornado por useDashboardVacaciones) */
interface DashboardVacacionesData {
  saldo?: SaldoVacaciones;
  nivel?: NivelVacaciones;
  conteos?: Record<string, number>;
}

/** Saldo de vacaciones del empleado */
interface SaldoVacaciones {
  dias_pendientes?: number;
  dias_usados?: number;
  dias_solicitados_pendientes?: number;
  dias_totales?: number;
  [key: string]: unknown;
}

interface NivelVacaciones {
  nombre?: string;
  dias_vacaciones?: number;
  anios_antiguedad_min?: number;
  [key: string]: unknown;
}

/** Respuesta paginada de solicitudes de vacaciones */
interface SolicitudesVacacionesResponse {
  data?: SolicitudVacaciones[] | SolicitudesPaginadas;
}

interface SolicitudesPaginadas {
  data?: SolicitudVacaciones[];
  total?: number;
}

/** Solicitud de vacaciones individual */
interface SolicitudVacaciones {
  id: number;
  fecha_inicio: string;
  fecha_fin: string;
  dias_habiles?: number;
  dias_solicitados?: number;
  estado: string;
  motivo_solicitud?: string;
  motivo_rechazo?: string;
  creado_en?: string;
  codigo?: string;
  profesional_id?: number;
  profesional_nombre?: string;
  departamento_nombre?: string;
  puesto_nombre?: string;
  [key: string]: unknown;
}

/** Incapacidad individual (datos que vienen de la API) */
interface IncapacidadItem {
  id: number;
  tipo_incapacidad: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias_autorizados: number;
  estado: string;
  diagnostico?: string;
  folio_imss?: string;
  creado_en?: string;
  codigo?: string;
  profesional_id?: number;
  profesional_nombre?: string;
  departamento_nombre?: string;
  [key: string]: unknown;
}

/** Respuesta de incapacidades (retornado por useMisIncapacidades / useIncapacidades) */
interface IncapacidadesResponse {
  data?: IncapacidadItem[] | { data?: IncapacidadItem[]; total?: number };
}

/** Respuesta de solicitudes pendientes */
interface SolicitudesPendientesResponse {
  data?: SolicitudVacaciones[];
}

/** Estadísticas de vacaciones */
interface EstadisticasVacacionesData {
  total_dias?: number;
  pendientes?: number;
  [key: string]: unknown;
}

/** Estadísticas de incapacidades */
interface EstadisticasIncapacidadesData {
  dias_totales?: number;
  activas?: number;
  [key: string]: unknown;
}

/** Respuesta API genérica de AxiosResponse wrapping ApiResponse */
interface AxiosApiResponse<T> {
  data: { data: T };
}

interface TipoAusenciaConfig {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon: string;
}

/** Config genérica de estado/tipo con label y color mínimo */
type StatusConfig = { label: string; color: string };

interface AusenciaItem {
  id: number | string;
  tipo: string;
  tipoConfig: TipoAusenciaConfig;
  subTipo?: string;
  subTipoConfig?: StatusConfig;
  profesionalId?: number;
  profesionalNombre?: string;
  puestoNombre?: string;
  departamentoNombre?: string;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  estado: string;
  estadoConfig?: StatusConfig;
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
    // useDashboardVacaciones viene de JS (anio = null), TS infiere tipo literal null
     
  } = useDashboardVacaciones(anioActual as never);

  // Mis incapacidades
  const {
    data: incapacidadesData,
    isLoading: isLoadingIncapacidades,
    error: errorIncapacidades,
  } = useMisIncapacidades({ anio: anioActual });

  // Consolidar datos
  const dashboard = useMemo(() => {
    if (!vacacionesData && !incapacidadesData) return null;

    const typedVacaciones = vacacionesData as
      | DashboardVacacionesData
      | undefined;
    const typedIncapacidades = incapacidadesData as
      | IncapacidadesResponse
      | undefined;

    const rawIncapacidades = typedIncapacidades?.data;
    const incapacidades: IncapacidadItem[] = Array.isArray(rawIncapacidades)
      ? rawIncapacidades
      : [];
    const incapacidadesActivas = incapacidades.filter(
      (i) => i.estado === 'activa'
    );

    return {
      // Vacaciones
      saldoVacaciones: typedVacaciones?.saldo || null,
      nivelVacaciones: typedVacaciones?.nivel || null,
      conteosSolicitudes: typedVacaciones?.conteos || {},

      // Incapacidades
      incapacidadesActivas,
      totalIncapacidadesAnio: incapacidades.length,
      diasIncapacidadAnio: incapacidades.reduce(
        (sum: number, i: IncapacidadItem) => sum + (i.dias_autorizados || 0),
        0
      ),

      // Resumen
      tieneIncapacidadActiva: incapacidadesActivas.length > 0,
      diasVacacionesDisponibles: typedVacaciones?.saldo?.dias_pendientes || 0,
      diasVacacionesUsados: typedVacaciones?.saldo?.dias_usados || 0,
      diasVacacionesEnTramite:
        typedVacaciones?.saldo?.dias_solicitados_pendientes || 0,
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
  const { data: vacacionesData, isLoading: isLoadingVacaciones } =
    useMisSolicitudesVacaciones(filtrosVacaciones);

  // Mis incapacidades
  const filtrosIncapacidades = {
    anio,
    estado: tipo === 'vacaciones' ? undefined : estado,
  };
  const { data: incapacidadesData, isLoading: isLoadingIncapacidades } =
    useMisIncapacidades(filtrosIncapacidades);

  // Combinar y ordenar por fecha
  const ausencias = useMemo(() => {
    const items: AusenciaItem[] = [];

    // Agregar vacaciones
    if (tipo !== 'incapacidad') {
      // La respuesta tiene estructura { data: { data: [...], total, ... } }
      const typedVacaciones = vacacionesData as
        | SolicitudesVacacionesResponse
        | undefined;
      const rawData = typedVacaciones?.data;
      const rawSolicitudes =
        rawData && !Array.isArray(rawData) && 'data' in rawData
          ? rawData.data
          : rawData;
      const solicitudes: SolicitudVacaciones[] = Array.isArray(rawSolicitudes)
        ? rawSolicitudes
        : [];
      solicitudes.forEach((s) => {
        items.push({
          id: s.id,
          tipo: 'vacaciones',
          tipoConfig: TIPOS_AUSENCIA_CONFIG.vacaciones,
          fechaInicio: s.fecha_inicio,
          fechaFin: s.fecha_fin,
          dias: s.dias_habiles || s.dias_solicitados || 0,
          estado: s.estado,
          estadoConfig:
            ESTADOS_SOLICITUD[s.estado as keyof typeof ESTADOS_SOLICITUD],
          motivo: s.motivo_solicitud,
          motivoRechazo: s.motivo_rechazo,
          creadoEn: s.creado_en,
          codigo: s.codigo,
          raw: s as unknown as Record<string, unknown>,
        });
      });
    }

    // Agregar incapacidades
    if (tipo !== 'vacaciones') {
      // La respuesta tiene estructura { data: { data: [...], total, ... } }
      const typedIncapacidades = incapacidadesData as
        | IncapacidadesResponse
        | undefined;
      const rawData = typedIncapacidades?.data;
      const rawIncapacidades =
        rawData && !Array.isArray(rawData) && 'data' in rawData
          ? rawData.data
          : rawData;
      const incapacidades: IncapacidadItem[] = Array.isArray(rawIncapacidades)
        ? rawIncapacidades
        : [];
      incapacidades.forEach((i) => {
        items.push({
          id: i.id,
          tipo: 'incapacidad',
          tipoConfig: TIPOS_AUSENCIA_CONFIG.incapacidad,
          subTipo: i.tipo_incapacidad,
          subTipoConfig: TIPOS_INCAPACIDAD_CONFIG[i.tipo_incapacidad],
          fechaInicio: i.fecha_inicio,
          fechaFin: i.fecha_fin,
          dias: i.dias_autorizados,
          estado: i.estado,
          estadoConfig: ESTADOS_INCAPACIDAD_CONFIG[i.estado],
          motivo: i.diagnostico,
          folioImss: i.folio_imss,
          creadoEn: i.creado_en,
          codigo: i.codigo,
          raw: i as unknown as Record<string, unknown>,
        });
      });
    }

    // Ordenar por fecha de inicio (más reciente primero)
    items.sort(
      (a, b) =>
        new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
    );

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
  const { data: vacacionesData, isLoading: isLoadingVacaciones } =
    useSolicitudesCalendario(filtrosVacaciones);

  // Estados válidos para incapacidades (diferente a vacaciones)
  const estadosIncapacidadesValidos = ['activa', 'finalizada', 'cancelada'];
  const estadoIncapacidad =
    estado && estadosIncapacidadesValidos.includes(estado) ? estado : undefined;

  // Incapacidades para el rango (usando query directa)
  const { data: incapacidadesData, isLoading: isLoadingIncapacidades } =
    useQuery({
      queryKey: [
        'ausencias',
        'calendario',
        'incapacidades',
        { fecha_inicio, fecha_fin, estado: estadoIncapacidad },
      ],
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
        return (
          (response as unknown as AxiosApiResponse<IncapacidadItem[]>).data
            ?.data || []
        );
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
      const solicitudes: SolicitudVacaciones[] = Array.isArray(vacacionesData)
        ? vacacionesData
        : [];
      solicitudes.forEach((s) => {
        items.push({
          id: `vac-${s.id}`,
          tipo: 'vacaciones',
          tipoConfig: TIPOS_AUSENCIA_CONFIG.vacaciones,
          profesionalId: s.profesional_id,
          profesionalNombre: s.profesional_nombre,
          departamentoNombre: s.departamento_nombre,
          fechaInicio: s.fecha_inicio,
          fechaFin: s.fecha_fin,
          dias: s.dias_habiles || s.dias_solicitados || 0,
          estado: s.estado,
          estadoConfig:
            ESTADOS_SOLICITUD[s.estado as keyof typeof ESTADOS_SOLICITUD],
          codigo: s.codigo,
          raw: s as unknown as Record<string, unknown>,
        });
      });
    }

    // Agregar incapacidades
    if (tipo !== 'vacaciones') {
      const incapacidades: IncapacidadItem[] =
        (incapacidadesData as IncapacidadItem[]) || [];
      incapacidades.forEach((i) => {
        items.push({
          id: `inc-${i.id}`,
          tipo: 'incapacidad',
          tipoConfig: TIPOS_AUSENCIA_CONFIG.incapacidad,
          subTipo: i.tipo_incapacidad,
          subTipoConfig: TIPOS_INCAPACIDAD_CONFIG[i.tipo_incapacidad],
          profesionalId: i.profesional_id,
          profesionalNombre: i.profesional_nombre,
          departamentoNombre: i.departamento_nombre,
          fechaInicio: i.fecha_inicio,
          fechaFin: i.fecha_fin,
          dias: i.dias_autorizados,
          estado: i.estado,
          estadoConfig: ESTADOS_INCAPACIDAD_CONFIG[i.estado],
          codigo: i.codigo,
          raw: i as unknown as Record<string, unknown>,
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
export function useSolicitudesPendientesAusencias(
  filtros: Record<string, unknown> = {}
) {
  const { data, isLoading, error } = useSolicitudesPendientes(filtros);

  const solicitudes = useMemo(() => {
    const typedData = data as SolicitudesPendientesResponse | undefined;
    const rawItems = typedData?.data;
    const items: SolicitudVacaciones[] = Array.isArray(rawItems)
      ? rawItems
      : [];
    return items.map(
      (s): AusenciaItem => ({
        id: s.id,
        tipo: 'vacaciones',
        tipoConfig: TIPOS_AUSENCIA_CONFIG.vacaciones,
        profesionalId: s.profesional_id,
        profesionalNombre: s.profesional_nombre,
        puestoNombre: s.puesto_nombre,
        fechaInicio: s.fecha_inicio,
        fechaFin: s.fecha_fin,
        dias: s.dias_habiles || s.dias_solicitados || 0,
        estado: s.estado,
        motivo: s.motivo_solicitud,
        creadoEn: s.creado_en,
        raw: s as unknown as Record<string, unknown>,
      })
    );
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
  const { data: statsVacaciones, isLoading: isLoadingVacaciones } = useQuery({
    queryKey: queryKeys.ausencias.estadisticas.vacaciones(anio),
    queryFn: async () => {
      const { vacacionesApi } = await import('@/services/api/endpoints');
      const response = await vacacionesApi.obtenerEstadisticas({ anio });
      return (
        (response as unknown as AxiosApiResponse<EstadisticasVacacionesData>)
          .data?.data || {}
      );
    },
    staleTime: STALE_TIMES.FREQUENT,
  });

  // Estadísticas de incapacidades
  const { data: statsIncapacidades, isLoading: isLoadingIncapacidades } =
    useQuery({
      queryKey: queryKeys.ausencias.estadisticas.incapacidades(anio),
      queryFn: async () => {
        const { incapacidadesApi } = await import('@/services/api/endpoints');
        const response = await incapacidadesApi.obtenerEstadisticas({ anio });
        return (
          (
            response as unknown as AxiosApiResponse<EstadisticasIncapacidadesData>
          ).data?.data || {}
        );
      },
      staleTime: STALE_TIMES.FREQUENT,
    });

  const estadisticas = useMemo(() => {
    const typedVacaciones = statsVacaciones as
      | EstadisticasVacacionesData
      | undefined;
    const typedIncapacidades = statsIncapacidades as
      | EstadisticasIncapacidadesData
      | undefined;

    return {
      vacaciones: statsVacaciones || {},
      incapacidades: statsIncapacidades || {},
      resumen: {
        totalDiasVacaciones: typedVacaciones?.total_dias || 0,
        totalDiasIncapacidades: typedIncapacidades?.dias_totales || 0,
        solicitudesPendientes: typedVacaciones?.pendientes || 0,
        incapacidadesActivas: typedIncapacidades?.activas || 0,
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
  return (
    TIPOS_AUSENCIA_CONFIG[tipo] || {
      label: tipo,
      color: 'gray',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      icon: '',
    }
  );
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

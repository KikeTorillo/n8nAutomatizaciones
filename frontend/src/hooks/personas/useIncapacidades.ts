/**
 * useIncapacidades - Hooks para gestion de incapacidades medicas
 * Enero 2026 | Migrado a TypeScript - Feb 2026
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incapacidadesApi } from '@/services/api/endpoints';
import { useToast } from '../utils/useToast';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';

// ==================== INTERFACES ====================

interface TipoIncapacidadConfig {
  codigo: string;
  label: string;
  maxSemanas?: number | null;
  diasFijos?: number;
  porcentajePago: number;
  diaInicioPago: number;
  descripcion: string;
  color: string;
  bgColor: string;
  textColor: string;
}

interface EstadoIncapacidadConfig {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
}

interface IncapacidadFiltros {
  profesional_id?: number;
  estado?: string;
  tipo_incapacidad?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  page?: number;
  limite?: number;
}

interface MisIncapacidadesFiltros {
  estado?: string;
  anio?: number;
  page?: number;
  limite?: number;
}

interface ActualizarIncapacidadParams {
  id: number;
  data: Record<string, unknown>;
}

interface FinalizarIncapacidadParams {
  id: number;
  data?: Record<string, unknown>;
}

interface CancelarIncapacidadParams {
  id: number;
  motivo_cancelacion: string;
}

interface CrearProrrogaParams {
  id: number;
  data: Record<string, unknown>;
}

// ==================== CONSTANTES ====================

export const TIPOS_INCAPACIDAD = {
  ENFERMEDAD_GENERAL: 'enfermedad_general',
  MATERNIDAD: 'maternidad',
  RIESGO_TRABAJO: 'riesgo_trabajo',
} as const;

export const TIPOS_INCAPACIDAD_CONFIG: Record<string, TipoIncapacidadConfig> = {
  enfermedad_general: {
    codigo: 'enfermedad_general',
    label: 'Enfermedad General',
    maxSemanas: 52,
    porcentajePago: 60,
    diaInicioPago: 4,
    descripcion: 'Enfermedades no relacionadas al trabajo',
    color: 'red',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-300',
  },
  maternidad: {
    codigo: 'maternidad',
    label: 'Maternidad',
    diasFijos: 84,
    porcentajePago: 100,
    diaInicioPago: 1,
    descripcion: '42 días antes y 42 días después del parto',
    color: 'pink',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    textColor: 'text-pink-700 dark:text-pink-300',
  },
  riesgo_trabajo: {
    codigo: 'riesgo_trabajo',
    label: 'Riesgo de Trabajo',
    maxSemanas: null,
    porcentajePago: 100,
    diaInicioPago: 1,
    descripcion: 'Accidentes o enfermedades laborales',
    color: 'orange',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-700 dark:text-orange-300',
  },
} as const;

export const ESTADOS_INCAPACIDAD = {
  ACTIVA: 'activa',
  FINALIZADA: 'finalizada',
  CANCELADA: 'cancelada',
} as const;

export const ESTADOS_INCAPACIDAD_CONFIG: Record<string, EstadoIncapacidadConfig> = {
  activa: {
    label: 'Activa',
    color: 'green',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-300',
  },
  finalizada: {
    label: 'Finalizada',
    color: 'gray',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-700 dark:text-gray-300',
  },
  cancelada: {
    label: 'Cancelada',
    color: 'red',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-300',
  },
} as const;

// ==================== UTILIDADES ====================

/**
 * Obtiene la configuracion de un tipo de incapacidad
 */
export function getTipoIncapacidadConfig(tipo: string): TipoIncapacidadConfig {
  return TIPOS_INCAPACIDAD_CONFIG[tipo] || {
    codigo: tipo,
    label: tipo,
    porcentajePago: 0,
    diaInicioPago: 1,
    descripcion: '',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
  };
}

/**
 * Obtiene la configuracion de un estado de incapacidad
 */
export function getEstadoIncapacidadConfig(estado: string): EstadoIncapacidadConfig {
  return ESTADOS_INCAPACIDAD_CONFIG[estado] || {
    label: estado,
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
  };
}

/**
 * Formatea dias de incapacidad
 */
export function formatDiasIncapacidad(dias: number): string {
  if (dias === 1) return '1 día';
  return `${dias} días`;
}

// ==================== HOOKS DE CONSULTA ====================

/**
 * Lista incapacidades (admin)
 */
export function useIncapacidades(filtros: IncapacidadFiltros = {}, opciones: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.personas.incapacidades.list(filtros),
    queryFn: async () => {
      const response = await incapacidadesApi.listar(filtros);
      return (response as any).data;
    },
    ...opciones,
  });
}

/**
 * Lista mis incapacidades (empleado)
 */
export function useMisIncapacidades(filtros: MisIncapacidadesFiltros = {}, opciones: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['incapacidades', 'mis', filtros],
    queryFn: async () => {
      const response = await incapacidadesApi.listarMis(filtros);
      return (response as any).data;
    },
    ...opciones,
  });
}

/**
 * Obtiene una incapacidad por ID
 */
export function useIncapacidad(id: number | string | null | undefined, opciones: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.personas.incapacidades.detail(id),
    queryFn: async () => {
      const response = await incapacidadesApi.obtener(Number(id));
      return (response as any).data?.data || (response as any).data;
    },
    enabled: !!id,
    ...opciones,
  });
}

/**
 * Obtiene incapacidades activas de un profesional
 */
export function useIncapacidadesActivasProfesional(profesionalId: number | string | null | undefined, opciones: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['incapacidades', 'activas', profesionalId],
    queryFn: async () => {
      const response = await incapacidadesApi.obtenerActivasPorProfesional(Number(profesionalId));
      return (response as any).data?.data || (response as any).data || [];
    },
    enabled: !!profesionalId,
    ...opciones,
  });
}

/**
 * Obtiene estadisticas de incapacidades
 */
export function useEstadisticasIncapacidades(filtros: Record<string, unknown> = {}, opciones: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.personas.incapacidades.estadisticas(filtros),
    queryFn: async () => {
      const response = await incapacidadesApi.obtenerEstadisticas(filtros);
      return (response as any).data?.data || (response as any).data;
    },
    ...opciones,
  });
}

// ==================== HOOKS DE MUTACION ====================

/**
 * Crear nueva incapacidad
 */
export function useCrearIncapacidad() {
  const queryClient = useQueryClient();
  const { success } = useToast();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await incapacidadesApi.crear(data);
      return (response as any).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.incapacidades.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.profesionales.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.agendamiento.bloqueos.all, refetchType: 'active' });
      success('Incapacidad registrada correctamente');
    },
    onError: createCRUDErrorHandler('create', 'Incapacidad'),
  });
}

/**
 * Actualizar incapacidad
 */
export function useActualizarIncapacidad() {
  const queryClient = useQueryClient();
  const { success } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: ActualizarIncapacidadParams) => {
      const response = await incapacidadesApi.actualizar(id, data);
      return (response as any).data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.incapacidades.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.incapacidades.detail(variables.id), refetchType: 'active' });
      success('Incapacidad actualizada correctamente');
    },
    onError: createCRUDErrorHandler('update', 'Incapacidad'),
  });
}

/**
 * Finalizar incapacidad anticipadamente
 */
export function useFinalizarIncapacidad() {
  const queryClient = useQueryClient();
  const { success } = useToast();

  return useMutation({
    mutationFn: async ({ id, data = {} }: FinalizarIncapacidadParams) => {
      const response = await incapacidadesApi.finalizar(id, data);
      return (response as any).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.incapacidades.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.profesionales.all, refetchType: 'active' });
      success('Incapacidad finalizada correctamente');
    },
    onError: createCRUDErrorHandler('update', 'Incapacidad'),
  });
}

/**
 * Cancelar incapacidad
 */
export function useCancelarIncapacidad() {
  const queryClient = useQueryClient();
  const { success } = useToast();

  return useMutation({
    mutationFn: async ({ id, motivo_cancelacion }: CancelarIncapacidadParams) => {
      const response = await incapacidadesApi.cancelar(id, { motivo_cancelacion });
      return (response as any).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.incapacidades.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.profesionales.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.agendamiento.bloqueos.all, refetchType: 'active' });
      success('Incapacidad cancelada correctamente');
    },
    onError: createCRUDErrorHandler('delete', 'Incapacidad'),
  });
}

/**
 * Crear prorroga de incapacidad
 */
export function useCrearProrroga() {
  const queryClient = useQueryClient();
  const { success } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: CrearProrrogaParams) => {
      const response = await incapacidadesApi.crearProrroga(id, data);
      return (response as any).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.incapacidades.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.agendamiento.bloqueos.all, refetchType: 'active' });
      success('Prórroga creada correctamente');
    },
    onError: createCRUDErrorHandler('create', 'Prórroga'),
  });
}

// ==================== EXPORT DEFAULT ====================

export default {
  // Constantes
  TIPOS_INCAPACIDAD,
  TIPOS_INCAPACIDAD_CONFIG,
  ESTADOS_INCAPACIDAD,
  ESTADOS_INCAPACIDAD_CONFIG,
  // Utilidades
  getTipoIncapacidadConfig,
  getEstadoIncapacidadConfig,
  formatDiasIncapacidad,
  // Hooks de consulta
  useIncapacidades,
  useMisIncapacidades,
  useIncapacidad,
  useIncapacidadesActivasProfesional,
  useEstadisticasIncapacidades,
  // Hooks de mutacion
  useCrearIncapacidad,
  useActualizarIncapacidad,
  useFinalizarIncapacidad,
  useCancelarIncapacidad,
  useCrearProrroga,
};

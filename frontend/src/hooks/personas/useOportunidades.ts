/**
 * ====================================================================
 * HOOKS - OPORTUNIDADES B2B
 * ====================================================================
 *
 * Fase 5 - Pipeline de Oportunidades (Ene 2026)
 * Hooks TanStack Query para gestión de oportunidades y pipeline Kanban
 * Feb 2026 - Migrado a TypeScript
 *
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { oportunidadesApi } from '@/services/api/endpoints';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';

// ====================================================================
// INTERFACES
// ====================================================================

interface PrioridadConfig {
  value: string;
  label: string;
  color: string;
  bgColor: string;
}

interface EstadoConfig {
  value: string;
  label: string;
  color: string;
  bgColor: string;
}

interface FuenteConfig {
  value: string;
  label: string;
}

interface OportunidadData {
  nombre?: string;
  cliente_id?: number;
  etapa_id?: number;
  vendedor_id?: number;
  ingreso_estimado?: number;
  probabilidad?: number;
  prioridad?: string;
  fuente?: string;
  fecha_cierre_estimada?: string;
  notas?: string;
  [key: string]: unknown;
}

interface EtapaData {
  nombre?: string;
  color?: string;
  orden?: number;
  activo?: boolean;
  probabilidad_default?: number;
  [key: string]: unknown;
}

interface ActualizarEtapaParams {
  etapaId: number;
  data: EtapaData;
}

interface ActualizarOportunidadParams {
  oportunidadId: number;
  data: Partial<OportunidadData>;
}

interface MoverOportunidadParams {
  oportunidadId: number;
  etapaId: number;
}

interface MarcarPerdidaParams {
  oportunidadId: number;
  motivoPerdida: string;
}

interface OportunidadesListParams {
  estado?: string;
  etapa_id?: number;
  vendedor_id?: number;
  cliente_id?: number;
  prioridad?: string;
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

// ====================================================================
// CONSTANTES
// ====================================================================

export const PRIORIDADES_OPORTUNIDAD: PrioridadConfig[] = [
  { value: 'baja', label: 'Baja', color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  { value: 'normal', label: 'Normal', color: 'text-primary-500', bgColor: 'bg-primary-100 dark:bg-primary-900/30' },
  { value: 'alta', label: 'Alta', color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  { value: 'urgente', label: 'Urgente', color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' },
];

export const ESTADOS_OPORTUNIDAD: EstadoConfig[] = [
  { value: 'abierta', label: 'Abierta', color: 'text-primary-500', bgColor: 'bg-primary-100 dark:bg-primary-900/30' },
  { value: 'ganada', label: 'Ganada', color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  { value: 'perdida', label: 'Perdida', color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' },
];

export const FUENTES_OPORTUNIDAD: FuenteConfig[] = [
  { value: 'web', label: 'Sitio web' },
  { value: 'referido', label: 'Referido' },
  { value: 'llamada', label: 'Llamada entrante' },
  { value: 'evento', label: 'Evento/Feria' },
  { value: 'redes_sociales', label: 'Redes sociales' },
  { value: 'otro', label: 'Otro' },
];

// ====================================================================
// QUERIES - ETAPAS
// ====================================================================

/**
 * Hook para listar etapas del pipeline
 */
export function useEtapasPipeline(incluirInactivas: boolean = false) {
  return useQuery({
    queryKey: ['etapas-pipeline', incluirInactivas],
    queryFn: async () => {
      const response = await oportunidadesApi.listarEtapas({ incluirInactivas });
      return (response as any).data.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

// ====================================================================
// QUERIES - OPORTUNIDADES
// ====================================================================

/**
 * Hook para listar oportunidades con filtros
 */
export function useOportunidades(params: OportunidadesListParams = {}) {
  return useQuery({
    queryKey: queryKeys.personas.oportunidades.list(params),
    queryFn: async () => {
      const response = await oportunidadesApi.listar(params);
      return {
        oportunidades: (response as any).data.data,
        paginacion: (response as any).data.pagination,
      };
    },
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener oportunidades de un cliente
 */
export function useOportunidadesCliente(clienteId: number | null | undefined, params: OportunidadesListParams = {}) {
  return useQuery({
    queryKey: ['oportunidades-cliente', clienteId, params],
    queryFn: async () => {
      const response = await oportunidadesApi.listarPorCliente(clienteId!, params);
      return {
        oportunidades: (response as any).data.data,
        paginacion: (response as any).data.pagination,
      };
    },
    enabled: !!clienteId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener una oportunidad por ID
 */
export function useOportunidad(oportunidadId: number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.personas.oportunidades.detail(oportunidadId!),
    queryFn: async () => {
      const response = await oportunidadesApi.obtenerPorId(oportunidadId!);
      return (response as any).data.data;
    },
    enabled: !!oportunidadId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener el pipeline completo (Kanban)
 */
export function usePipeline(vendedorId: number | null = null) {
  return useQuery({
    queryKey: queryKeys.personas.oportunidades.pipeline(vendedorId),
    queryFn: async () => {
      const response = await oportunidadesApi.obtenerPipeline({ vendedor_id: vendedorId });
      return (response as any).data.data;
    },
    staleTime: STALE_TIMES.FREQUENT,
  });
}

/**
 * Hook para obtener estadísticas del pipeline
 */
export function useEstadisticasPipeline(vendedorId: number | null = null) {
  return useQuery({
    queryKey: queryKeys.personas.oportunidades.estadisticas(vendedorId),
    queryFn: async () => {
      const response = await oportunidadesApi.obtenerEstadisticas({ vendedor_id: vendedorId });
      return (response as any).data.data;
    },
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener pronóstico de ventas
 */
export function usePronosticoVentas(fechaInicio: string, fechaFin: string) {
  return useQuery({
    queryKey: ['pronostico-ventas', fechaInicio, fechaFin],
    queryFn: async () => {
      const response = await oportunidadesApi.obtenerPronostico({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });
      return (response as any).data.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para obtener estadísticas de oportunidades de un cliente
 */
export function useEstadisticasOportunidadesCliente(clienteId: number | null | undefined) {
  return useQuery({
    queryKey: ['oportunidades-cliente-estadisticas', clienteId],
    queryFn: async () => {
      const response = await oportunidadesApi.obtenerEstadisticasCliente(clienteId!);
      return (response as any).data.data;
    },
    enabled: !!clienteId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

// ====================================================================
// MUTATIONS - ETAPAS
// ====================================================================

/**
 * Hook para crear etapa
 */
export function useCrearEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EtapaData) => {
      const response = await oportunidadesApi.crearEtapa(data as any);
      return (response as any).data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etapas-pipeline'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pipeline'], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Etapa'),
  });
}

/**
 * Hook para actualizar etapa
 */
export function useActualizarEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ etapaId, data }: ActualizarEtapaParams) => {
      const response = await oportunidadesApi.actualizarEtapa(etapaId, data as any);
      return (response as any).data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etapas-pipeline'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pipeline'], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Etapa'),
  });
}

/**
 * Hook para eliminar etapa
 */
export function useEliminarEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (etapaId: number) => {
      await oportunidadesApi.eliminarEtapa(etapaId);
      return etapaId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etapas-pipeline'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pipeline'], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('delete', 'Etapa'),
  });
}

/**
 * Hook para reordenar etapas
 */
export function useReordenarEtapas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ordenIds: number[]) => {
      const response = await oportunidadesApi.reordenarEtapas({ orden: ordenIds });
      return (response as any).data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etapas-pipeline'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pipeline'], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Etapas'),
  });
}

// ====================================================================
// MUTATIONS - OPORTUNIDADES
// ====================================================================

/**
 * Hook para crear oportunidad
 */
export function useCrearOportunidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: OportunidadData) => {
      const response = await oportunidadesApi.crear(data as any);
      return (response as any).data.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.oportunidades.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pipeline'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pipeline-estadisticas'], refetchType: 'active' });
      if (data.cliente_id) {
        queryClient.invalidateQueries({ queryKey: ['oportunidades-cliente', data.cliente_id], refetchType: 'active' });
        queryClient.invalidateQueries({ queryKey: ['oportunidades-cliente-estadisticas', data.cliente_id], refetchType: 'active' });
      }
    },
    onError: createCRUDErrorHandler('create', 'Oportunidad'),
  });
}

/**
 * Hook para actualizar oportunidad
 */
export function useActualizarOportunidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ oportunidadId, data }: ActualizarOportunidadParams) => {
      const response = await oportunidadesApi.actualizar(oportunidadId, data as any);
      return (response as any).data.data;
    },
    onSuccess: (_data: unknown, variables: ActualizarOportunidadParams) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.oportunidades.detail(variables.oportunidadId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.oportunidades.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pipeline'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pipeline-estadisticas'], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Oportunidad'),
  });
}

/**
 * Hook para eliminar oportunidad
 */
export function useEliminarOportunidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (oportunidadId: number) => {
      await oportunidadesApi.eliminar(oportunidadId);
      return oportunidadId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.oportunidades.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pipeline'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pipeline-estadisticas'], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('delete', 'Oportunidad'),
  });
}

/**
 * Hook para mover oportunidad a otra etapa (drag & drop)
 */
export function useMoverOportunidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ oportunidadId, etapaId }: MoverOportunidadParams) => {
      const response = await oportunidadesApi.mover(oportunidadId, { etapa_id: etapaId });
      return (response as any).data.data;
    },
    onMutate: async (_variables: MoverOportunidadParams) => {
      // Optimistic update para drag & drop fluido
      await queryClient.cancelQueries({ queryKey: ['pipeline'] });
      const previousPipeline = queryClient.getQueryData(['pipeline']);
      return { previousPipeline };
    },
    onError: (error: Error, _variables: MoverOportunidadParams, context) => {
      // Rollback en caso de error
      if (context?.previousPipeline) {
        queryClient.setQueryData(['pipeline'], context.previousPipeline);
      }
      createCRUDErrorHandler('update', 'Oportunidad')(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pipeline-estadisticas'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.oportunidades.all, refetchType: 'active' });
    },
  });
}

/**
 * Hook para marcar oportunidad como ganada
 */
export function useMarcarGanada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (oportunidadId: number) => {
      const response = await oportunidadesApi.marcarGanada(oportunidadId);
      return (response as any).data.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.oportunidades.detail(data.id), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.oportunidades.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pipeline'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pipeline-estadisticas'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pronostico-ventas'], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Oportunidad'),
  });
}

/**
 * Hook para marcar oportunidad como perdida
 */
export function useMarcarPerdida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ oportunidadId, motivoPerdida }: MarcarPerdidaParams) => {
      const response = await oportunidadesApi.marcarPerdida(oportunidadId, { motivo_perdida: motivoPerdida });
      return (response as any).data.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.oportunidades.detail(data.id), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.oportunidades.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pipeline'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pipeline-estadisticas'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['pronostico-ventas'], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Oportunidad'),
  });
}

// ====================================================================
// HELPER FUNCTIONS
// ====================================================================

/**
 * Obtener configuración de prioridad
 */
export function getPrioridadOportunidad(prioridad: string): PrioridadConfig {
  return PRIORIDADES_OPORTUNIDAD.find(p => p.value === prioridad) || PRIORIDADES_OPORTUNIDAD[1];
}

/**
 * Obtener configuración de estado
 */
export function getEstado(estado: string): EstadoConfig {
  return ESTADOS_OPORTUNIDAD.find(e => e.value === estado) || ESTADOS_OPORTUNIDAD[0];
}

/**
 * Obtener configuración de fuente
 */
export function getFuente(fuente: string | null | undefined): FuenteConfig {
  return FUENTES_OPORTUNIDAD.find(f => f.value === fuente) || { value: fuente || '', label: fuente || 'Sin especificar' };
}

/**
 * Formatear valor monetario
 */
export function formatMoney(amount: number | null | undefined, currency: string = 'MXN'): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calcular valor ponderado (ingreso * probabilidad)
 */
export function calcularValorPonderado(ingreso: number | null | undefined, probabilidad: number | null | undefined): number {
  if (!ingreso || !probabilidad) return 0;
  return (ingreso * probabilidad) / 100;
}

/**
 * Obtener color de probabilidad
 */
export function getProbabilidadColor(probabilidad: number): string {
  if (probabilidad >= 75) return 'text-green-500';
  if (probabilidad >= 50) return 'text-primary-500';
  if (probabilidad >= 25) return 'text-yellow-500';
  return 'text-gray-500';
}

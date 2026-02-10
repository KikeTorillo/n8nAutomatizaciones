/**
 * useExperienciaLaboral - Hooks para Experiencia Laboral
 * Fase 4 del Plan de Empleados Competitivo
 * Enero 2026 | Migrado a TypeScript - Feb 2026
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { profesionalesApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';

// ==================== INTERFACES ====================

interface ExperienciaFiltros {
  limit?: number;
  offset?: number;
}

interface ExperienciaQueryOptions {
  filtros?: ExperienciaFiltros;
  enabled?: boolean;
}

interface CrearExperienciaParams {
  profesionalId: number;
  data: Record<string, unknown>;
}

interface ActualizarExperienciaParams {
  profesionalId: number;
  experienciaId: number;
  data: Record<string, unknown>;
}

interface EliminarExperienciaParams {
  profesionalId: number;
  experienciaId: number;
}

interface ReordenarExperienciaParams {
  profesionalId: number;
  orden: Array<{ id: number; orden: number }>;
}

// ==================== QUERY KEYS ====================

/** @deprecated Usar queryKeys.personas.experienciaLaboral */
export const experienciaKeys = queryKeys.personas.experienciaLaboral;

// ==================== HOOKS DE QUERY ====================

/**
 * Lista experiencia laboral de un profesional
 */
export function useExperienciaLaboral(profesionalId: number | string | null | undefined, options: ExperienciaQueryOptions = {}) {
  const { filtros = {}, enabled = true } = options;

  return useQuery({
    queryKey: experienciaKeys.list(profesionalId, filtros),
    queryFn: async () => {
      const response = await profesionalesApi.listarExperiencia(Number(profesionalId), filtros);
      return (response as any).data?.data || (response as any).data;
    },
    enabled: enabled && !!profesionalId,
    staleTime: STALE_TIMES.REAL_TIME, // 30 segundos
  });
}

/**
 * Obtiene una experiencia laboral especifica
 */
export function useExperienciaLaboralDetalle(
  profesionalId: number | string | null | undefined,
  experienciaId: number | string | null | undefined,
) {
  return useQuery({
    queryKey: experienciaKeys.detail(profesionalId, experienciaId),
    queryFn: async () => {
      const response = await profesionalesApi.obtenerExperiencia(Number(profesionalId), Number(experienciaId));
      return (response as any).data?.data || (response as any).data;
    },
    enabled: !!profesionalId && !!experienciaId,
  });
}

/**
 * Obtiene el empleo actual del profesional
 */
export function useEmpleoActual(profesionalId: number | string | null | undefined) {
  return useQuery({
    queryKey: experienciaKeys.actual(profesionalId),
    queryFn: async () => {
      const response = await profesionalesApi.obtenerEmpleoActual(Number(profesionalId));
      return (response as any).data?.data || (response as any).data;
    },
    enabled: !!profesionalId,
    staleTime: STALE_TIMES.FREQUENT, // 1 minuto
  });
}

// ==================== HOOKS DE MUTACION ====================

/**
 * Crea una nueva experiencia laboral
 */
export function useCrearExperiencia() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ profesionalId, data }: CrearExperienciaParams) => {
      const response = await profesionalesApi.crearExperiencia(profesionalId, data);
      return (response as any).data?.data || (response as any).data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: experienciaKeys.lists(), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: experienciaKeys.actual(variables.profesionalId), refetchType: 'active' });
      toast.success('Experiencia laboral agregada');
    },
    onError: createCRUDErrorHandler('create', 'Experiencia'),
  });
}

/**
 * Actualiza una experiencia laboral
 */
export function useActualizarExperiencia() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ profesionalId, experienciaId, data }: ActualizarExperienciaParams) => {
      const response = await profesionalesApi.actualizarExperiencia(profesionalId, experienciaId, data);
      return (response as any).data?.data || (response as any).data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: experienciaKeys.lists(), refetchType: 'active' });
      queryClient.invalidateQueries({
        queryKey: experienciaKeys.detail(variables.profesionalId, variables.experienciaId)
      });
      queryClient.invalidateQueries({ queryKey: experienciaKeys.actual(variables.profesionalId), refetchType: 'active' });
      toast.success('Experiencia actualizada');
    },
    onError: createCRUDErrorHandler('update', 'Experiencia'),
  });
}

/**
 * Elimina una experiencia laboral (soft delete)
 */
export function useEliminarExperiencia() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ profesionalId, experienciaId }: EliminarExperienciaParams) => {
      const response = await profesionalesApi.eliminarExperiencia(profesionalId, experienciaId);
      return (response as any).data?.data || (response as any).data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: experienciaKeys.lists(), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: experienciaKeys.actual(variables.profesionalId), refetchType: 'active' });
      toast.success('Experiencia eliminada');
    },
    onError: createCRUDErrorHandler('delete', 'Experiencia'),
  });
}

/**
 * Reordena experiencias laborales
 */
export function useReordenarExperiencia() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ profesionalId, orden }: ReordenarExperienciaParams) => {
      const response = await profesionalesApi.reordenarExperiencia(profesionalId, { orden });
      return (response as any).data?.data || (response as any).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: experienciaKeys.lists(), refetchType: 'active' });
      toast.success('Orden actualizado');
    },
    onError: createCRUDErrorHandler('update', 'Experiencia'),
  });
}

// ==================== UTILIDADES ====================

/**
 * Calcula anios de experiencia desde fecha inicio hasta fecha fin (o ahora)
 */
export function calcularDuracion(fechaInicio: string | null | undefined, fechaFin: string | null | undefined): string {
  if (!fechaInicio) return '';

  const inicio = new Date(fechaInicio);
  const fin = fechaFin ? new Date(fechaFin) : new Date();

  let meses = (fin.getFullYear() - inicio.getFullYear()) * 12;
  meses += fin.getMonth() - inicio.getMonth();

  if (meses < 0) return '';

  const anios = Math.floor(meses / 12);
  const mesesRestantes = meses % 12;

  if (anios === 0) {
    return `${mesesRestantes} ${mesesRestantes === 1 ? 'mes' : 'meses'}`;
  }

  if (mesesRestantes === 0) {
    return `${anios} ${anios === 1 ? 'año' : 'años'}`;
  }

  return `${anios} ${anios === 1 ? 'año' : 'años'}, ${mesesRestantes} ${mesesRestantes === 1 ? 'mes' : 'meses'}`;
}

/**
 * Formatea fecha para visualizacion
 */
export function formatearFechaMes(fecha: string | null | undefined): string {
  if (!fecha) return '';
  const d = new Date(fecha);
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${meses[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Formatea rango de fechas para experiencia
 */
export function formatearRangoFechas(fechaInicio: string | null | undefined, fechaFin: string | null | undefined): string {
  const inicio = formatearFechaMes(fechaInicio);
  const fin = fechaFin ? formatearFechaMes(fechaFin) : 'Presente';
  return `${inicio} - ${fin}`;
}

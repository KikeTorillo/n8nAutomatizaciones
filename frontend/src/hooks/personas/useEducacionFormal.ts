/**
 * useEducacionFormal - Hooks para Educación Formal
 * Fase 4 del Plan de Empleados Competitivo
 * Enero 2026
 * Feb 2026 - Migrado a TypeScript
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { profesionalesApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

// ==================== INTERFACES ====================

interface NivelEducacion {
  value: string;
  label: string;
  orden: number;
}

interface Educacion {
  id: number;
  profesional_id: number;
  institucion: string;
  titulo?: string;
  nivel: string;
  campo_estudio?: string;
  fecha_inicio?: string;
  fecha_fin?: string | null;
  en_curso?: boolean;
  descripcion?: string;
  [key: string]: unknown;
}

interface EducacionFiltros {
  nivel?: string;
  limit?: number;
  offset?: number;
}

interface EducacionQueryOptions {
  filtros?: EducacionFiltros;
  enabled?: boolean;
}

interface CrearEducacionParams {
  profesionalId: number;
  data: Partial<Educacion>;
}

interface ActualizarEducacionParams {
  profesionalId: number;
  educacionId: number;
  data: Partial<Educacion>;
}

interface EliminarEducacionParams {
  profesionalId: number;
  educacionId: number;
}

interface ReordenarEducacionParams {
  profesionalId: number;
  orden: number[];
}

interface EstadoEstudio {
  label: string;
  color: string;
}

// ==================== CONSTANTES ====================

// IMPORTANTE: Debe coincidir con ENUM nivel_educacion en PostgreSQL (07-curriculum.sql)
export const NIVELES_EDUCACION: NivelEducacion[] = [
  { value: 'basica', label: 'Educación Básica', orden: 1 },
  { value: 'intermedia', label: 'Secundaria', orden: 2 },
  { value: 'preparatoria', label: 'Preparatoria / Bachillerato', orden: 3 },
  { value: 'tecnica', label: 'Carrera Técnica / Tecnólogo', orden: 4 },
  { value: 'licenciatura', label: 'Licenciatura / Ingeniería', orden: 5 },
  { value: 'especialidad', label: 'Especialidad', orden: 6 },
  { value: 'maestria', label: 'Maestría', orden: 7 },
  { value: 'doctorado', label: 'Doctorado', orden: 8 },
];

// ==================== QUERY KEYS ====================

export const educacionKeys = {
  all: ['educacion-formal'] as const,
  lists: () => [...educacionKeys.all, 'list'] as const,
  list: (profesionalId: number, filters: EducacionFiltros) =>
    [...educacionKeys.lists(), profesionalId, filters] as const,
  details: () => [...educacionKeys.all, 'detail'] as const,
  detail: (profesionalId: number, educacionId: number) =>
    [...educacionKeys.details(), profesionalId, educacionId] as const,
  enCurso: (profesionalId: number) =>
    [...educacionKeys.all, 'en-curso', profesionalId] as const,
};

// ==================== HOOKS DE QUERY ====================

/**
 * Lista educación formal de un profesional
 */
export function useEducacionFormal(
  profesionalId: number | null | undefined,
  options: EducacionQueryOptions = {}
) {
  const { filtros = {}, enabled = true } = options;

  return useQuery({
    queryKey: educacionKeys.list(profesionalId!, filtros),
    queryFn: async () => {
      const response = await profesionalesApi.listarEducacion(
        profesionalId!,
        filtros
      );
      return (response as any).data?.data || (response as any).data;
    },
    enabled: enabled && !!profesionalId,
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

/**
 * Obtiene una educación específica
 */
export function useEducacionFormalDetalle(
  profesionalId: number | null | undefined,
  educacionId: number | null | undefined
) {
  return useQuery({
    queryKey: educacionKeys.detail(profesionalId!, educacionId!),
    queryFn: async () => {
      const response = await profesionalesApi.obtenerEducacion(
        profesionalId!,
        educacionId!
      );
      return (response as any).data?.data || (response as any).data;
    },
    enabled: !!profesionalId && !!educacionId,
  });
}

/**
 * Obtiene estudios en curso del profesional
 */
export function useEducacionEnCurso(profesionalId: number | null | undefined) {
  return useQuery({
    queryKey: educacionKeys.enCurso(profesionalId!),
    queryFn: async () => {
      const response = await profesionalesApi.obtenerEducacionEnCurso(
        profesionalId!
      );
      return (response as any).data?.data || (response as any).data;
    },
    enabled: !!profesionalId,
    staleTime: STALE_TIMES.FREQUENT,
  });
}

// ==================== HOOKS DE MUTACIÓN ====================

/**
 * Crea un nuevo registro de educación
 */
export function useCrearEducacion() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ profesionalId, data }: CrearEducacionParams) => {
      const response = await profesionalesApi.crearEducacion(
        profesionalId,
        data as any
      );
      return (response as any).data?.data || (response as any).data;
    },
    onSuccess: (_data: unknown, variables: CrearEducacionParams) => {
      queryClient.invalidateQueries({
        queryKey: educacionKeys.lists(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: educacionKeys.enCurso(variables.profesionalId),
        refetchType: 'active',
      });
      toast.success('Educación agregada');
    },
    onError: createCRUDErrorHandler('create', 'Educación'),
  });
}

/**
 * Actualiza un registro de educación
 */
export function useActualizarEducacion() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({
      profesionalId,
      educacionId,
      data,
    }: ActualizarEducacionParams) => {
      const response = await profesionalesApi.actualizarEducacion(
        profesionalId,
        educacionId,
        data as any
      );
      return (response as any).data?.data || (response as any).data;
    },
    onSuccess: (_data: unknown, variables: ActualizarEducacionParams) => {
      queryClient.invalidateQueries({
        queryKey: educacionKeys.lists(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: educacionKeys.detail(
          variables.profesionalId,
          variables.educacionId
        ),
      });
      queryClient.invalidateQueries({
        queryKey: educacionKeys.enCurso(variables.profesionalId),
        refetchType: 'active',
      });
      toast.success('Educación actualizada');
    },
    onError: createCRUDErrorHandler('update', 'Educación'),
  });
}

/**
 * Elimina un registro de educación (soft delete)
 */
export function useEliminarEducacion() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({
      profesionalId,
      educacionId,
    }: EliminarEducacionParams) => {
      const response = await profesionalesApi.eliminarEducacion(
        profesionalId,
        educacionId
      );
      return (response as any).data?.data || (response as any).data;
    },
    onSuccess: (_data: unknown, variables: EliminarEducacionParams) => {
      queryClient.invalidateQueries({
        queryKey: educacionKeys.lists(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: educacionKeys.enCurso(variables.profesionalId),
        refetchType: 'active',
      });
      toast.success('Educación eliminada');
    },
    onError: createCRUDErrorHandler('delete', 'Educación'),
  });
}

/**
 * Reordena registros de educación
 */
export function useReordenarEducacion() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ profesionalId, orden }: ReordenarEducacionParams) => {
      const response = await profesionalesApi.reordenarEducacion(
        profesionalId,
        { orden }
      );
      return (response as any).data?.data || (response as any).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: educacionKeys.lists(),
        refetchType: 'active',
      });
      toast.success('Orden actualizado');
    },
    onError: createCRUDErrorHandler('update', 'Educación'),
  });
}

// ==================== UTILIDADES ====================

/**
 * Obtiene el label de un nivel de educación
 */
export function getNivelEducacionLabel(nivel: string): string {
  return NIVELES_EDUCACION.find((n) => n.value === nivel)?.label || nivel;
}

/**
 * Ordena niveles de educación por jerarquía
 */
export function ordenarPorNivel(educaciones: Educacion[]): Educacion[] {
  const ordenNiveles = NIVELES_EDUCACION.reduce<Record<string, number>>(
    (acc, n) => {
      acc[n.value] = n.orden;
      return acc;
    },
    {}
  );

  return [...educaciones].sort((a, b) => {
    const ordenA = ordenNiveles[a.nivel] || 0;
    const ordenB = ordenNiveles[b.nivel] || 0;
    return ordenB - ordenA; // Mayor nivel primero
  });
}

/**
 * Formatea estado del estudio
 */
export function getEstadoEstudio(
  enCurso: boolean,
  fechaFin: string | null | undefined
): EstadoEstudio {
  if (enCurso) {
    return { label: 'En curso', color: 'blue' };
  }
  if (fechaFin) {
    return { label: 'Completado', color: 'green' };
  }
  return { label: 'Incompleto', color: 'gray' };
}

/**
 * Formatea rango de años para educación
 */
export function formatearRangoAnios(
  fechaInicio: string | null | undefined,
  fechaFin: string | null | undefined,
  enCurso: boolean
): string {
  const anioInicio = fechaInicio ? new Date(fechaInicio).getFullYear() : '';
  if (enCurso) {
    return `${anioInicio} - Presente`;
  }
  const anioFin = fechaFin ? new Date(fechaFin).getFullYear() : '';
  return anioFin ? `${anioInicio} - ${anioFin}` : String(anioInicio);
}

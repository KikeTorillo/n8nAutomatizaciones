/**
 * useHabilidades - Hooks para Habilidades (Catálogo y Empleado)
 * Fase 4 del Plan de Empleados Competitivo
 * Enero 2026
 * Feb 2026 - Migrado a TypeScript
 * Feb 2026 - Migrado CRUD del catálogo a createCRUDHooks factory
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { profesionalesApi, habilidadesApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';
import { extractData } from '@/lib/apiHelpers';
import { createCRUDHooks } from '@/hooks/factories/createCRUDHooks';

// ==================== INTERFACES ====================

interface CategoriaHabilidad {
  value: string;
  label: string;
  color: string;
  icon: string;
}

interface NivelHabilidad {
  value: string;
  label: string;
  porcentaje: number;
  color: string;
}

interface HabilidadCatalogo {
  id: number;
  nombre: string;
  categoria: string;
  descripcion?: string;
  [key: string]: unknown;
}

interface HabilidadEmpleado {
  id: number;
  habilidad_id: number;
  profesional_id: number;
  nivel?: string;
  categoria?: string;
  verificado?: boolean;
  anios_experiencia?: number;
  [key: string]: unknown;
}

interface CatalogoFiltros {
  categoria?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

interface EmpleadoHabilidadFiltros {
  categoria?: string;
  nivel?: string;
  verificado?: boolean;
  limit?: number;
  offset?: number;
}

interface CatalogoQueryOptions {
  filtros?: CatalogoFiltros;
  enabled?: boolean;
}

interface EmpleadoQueryOptions {
  filtros?: EmpleadoHabilidadFiltros;
  enabled?: boolean;
}

interface AsignarHabilidadParams {
  profesionalId: number;
  data: Record<string, unknown>;
}

interface AsignarBatchParams {
  profesionalId: number;
  habilidades: Array<Record<string, unknown>>;
}

interface ActualizarEmpleadoParams {
  profesionalId: number;
  habilidadEmpleadoId: number;
  data: Partial<HabilidadEmpleado>;
}

interface EliminarEmpleadoParams {
  profesionalId: number;
  habilidadEmpleadoId: number;
}

interface VerificarParams {
  profesionalId: number;
  habilidadEmpleadoId: number;
  verificado: boolean;
}

// ==================== CONSTANTES ====================

export const CATEGORIAS_HABILIDAD: CategoriaHabilidad[] = [
  { value: 'tecnica', label: 'Técnica', color: 'blue', icon: 'wrench' },
  { value: 'blanda', label: 'Blanda', color: 'purple', icon: 'users' },
  { value: 'idioma', label: 'Idioma', color: 'green', icon: 'globe' },
  { value: 'software', label: 'Software', color: 'orange', icon: 'laptop' },
  {
    value: 'certificacion',
    label: 'Certificación',
    color: 'red',
    icon: 'certificate',
  },
  { value: 'otro', label: 'Otra', color: 'gray', icon: 'tag' },
];

export const NIVELES_HABILIDAD: NivelHabilidad[] = [
  { value: 'basico', label: 'Básico', porcentaje: 25, color: 'gray' },
  { value: 'intermedio', label: 'Intermedio', porcentaje: 50, color: 'blue' },
  { value: 'avanzado', label: 'Avanzado', porcentaje: 75, color: 'green' },
  { value: 'experto', label: 'Experto', porcentaje: 100, color: 'purple' },
];

// ==================== QUERY KEYS ====================

/** @deprecated Usar queryKeys.personas.habilidades.catalogo */
export const catalogoKeys = queryKeys.personas.habilidades.catalogo;

/** @deprecated Usar queryKeys.personas.habilidades.empleado */
export const habilidadesEmpleadoKeys = queryKeys.personas.habilidades.empleado;

// ==================== FACTORY CRUD CATÁLOGO ====================

const catalogoCRUD = createCRUDHooks<HabilidadCatalogo, CatalogoFiltros>({
  name: 'habilidad',
  namePlural: 'habilidades',
  api: habilidadesApi,
  baseKey: 'catalogo-habilidades',
  apiMethods: {
    list: 'listar',
    get: 'obtener',
    create: 'crear',
    update: 'actualizar',
    delete: 'eliminar',
  },
  invalidateOnCreate: ['catalogo-habilidades'],
  invalidateOnUpdate: ['catalogo-habilidades'],
  invalidateOnDelete: ['catalogo-habilidades'],
  successMessages: {
    create: 'Habilidad creada en catálogo',
    update: 'Habilidad actualizada',
    delete: 'Habilidad eliminada del catálogo',
  },
});

// ==================== HOOKS CATÁLOGO ====================

/**
 * Lista catálogo de habilidades de la organización
 * @deprecated Factory-generated hook
 */
export const useCatalogoHabilidades = catalogoCRUD.useList;

/**
 * Obtiene una habilidad del catálogo
 * @deprecated Factory-generated hook
 */
export const useHabilidadCatalogo = catalogoCRUD.useDetail;

/**
 * Lista profesionales con una habilidad específica
 * Hook especializado (no CRUD)
 */
export function useProfesionalesConHabilidad(
  habilidadId: number | null | undefined,
  options: CatalogoQueryOptions = {}
) {
  const { filtros = {}, enabled = true } = options;

  return useQuery({
    queryKey: catalogoKeys.profesionales(habilidadId!),
    queryFn: async () => {
      const response = await habilidadesApi.listarProfesionales(
        habilidadId!,
        filtros
      );
      return extractData(response);
    },
    enabled: enabled && !!habilidadId,
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

// ==================== MUTATIONS CATÁLOGO ====================

/**
 * Crea una habilidad en el catálogo
 * @deprecated Factory-generated hook
 */
export const useCrearHabilidadCatalogo = catalogoCRUD.useCreate;

/**
 * Actualiza una habilidad del catálogo
 * @deprecated Factory-generated hook
 */
export const useActualizarHabilidadCatalogo = catalogoCRUD.useUpdate;

/**
 * Elimina una habilidad del catálogo
 * @deprecated Factory-generated hook
 */
export const useEliminarHabilidadCatalogo = catalogoCRUD.useDelete;

// ==================== HOOKS HABILIDADES EMPLEADO ====================

/**
 * Lista habilidades de un profesional
 */
export function useHabilidadesEmpleado(
  profesionalId: number | null | undefined,
  options: EmpleadoQueryOptions = {}
) {
  const { filtros = {}, enabled = true } = options;

  return useQuery({
    queryKey: habilidadesEmpleadoKeys.list(profesionalId!, filtros),
    queryFn: async () => {
      const response = await profesionalesApi.listarHabilidades(
        profesionalId!,
        filtros
      );
      return extractData(response);
    },
    enabled: enabled && !!profesionalId,
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

/**
 * Obtiene una habilidad específica de un empleado
 */
export function useHabilidadEmpleadoDetalle(
  profesionalId: number | null | undefined,
  habilidadEmpleadoId: number | null | undefined
) {
  return useQuery({
    queryKey: habilidadesEmpleadoKeys.detail(
      profesionalId!,
      habilidadEmpleadoId!
    ),
    queryFn: async () => {
      const response = await profesionalesApi.obtenerHabilidadEmpleado(
        profesionalId!,
        habilidadEmpleadoId!
      );
      return extractData(response);
    },
    enabled: !!profesionalId && !!habilidadEmpleadoId,
  });
}

// ==================== MUTATIONS HABILIDADES EMPLEADO ====================

/**
 * Asigna una habilidad a un profesional
 */
export function useAsignarHabilidad() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ profesionalId, data }: AsignarHabilidadParams) => {
      const response = await profesionalesApi.asignarHabilidad(
        profesionalId,
        data
      );
      return extractData(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: habilidadesEmpleadoKeys.lists(),
        refetchType: 'active',
      });
      toast.success('Habilidad asignada');
    },
    onError: createCRUDErrorHandler('create', 'Habilidad'),
  });
}

/**
 * Asigna múltiples habilidades en batch
 */
export function useAsignarHabilidadesBatch() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ profesionalId, habilidades }: AsignarBatchParams) => {
      const response = await profesionalesApi.asignarHabilidadesBatch(
        profesionalId,
        { habilidades }
      );
      return extractData(response);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: habilidadesEmpleadoKeys.lists(),
        refetchType: 'active',
      });
      toast.success(`${data.asignadas || 'Varias'} habilidades asignadas`);
    },
    onError: createCRUDErrorHandler('create', 'Habilidades'),
  });
}

/**
 * Actualiza una habilidad de empleado
 */
export function useActualizarHabilidadEmpleado() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({
      profesionalId,
      habilidadEmpleadoId,
      data,
    }: ActualizarEmpleadoParams) => {
      const response = await profesionalesApi.actualizarHabilidadEmpleado(
        profesionalId,
        habilidadEmpleadoId,
        data as any
      );
      return extractData(response);
    },
    onSuccess: (_data: unknown, variables: ActualizarEmpleadoParams) => {
      queryClient.invalidateQueries({
        queryKey: habilidadesEmpleadoKeys.lists(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: habilidadesEmpleadoKeys.detail(
          variables.profesionalId,
          variables.habilidadEmpleadoId
        ),
      });
      toast.success('Habilidad actualizada');
    },
    onError: createCRUDErrorHandler('update', 'Habilidad'),
  });
}

/**
 * Elimina una habilidad de un empleado
 */
export function useEliminarHabilidadEmpleado() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({
      profesionalId,
      habilidadEmpleadoId,
    }: EliminarEmpleadoParams) => {
      const response = await profesionalesApi.eliminarHabilidadEmpleado(
        profesionalId,
        habilidadEmpleadoId
      );
      return extractData(response);
    },
    onSuccess: (_data: unknown, _variables: EliminarEmpleadoParams) => {
      queryClient.invalidateQueries({
        queryKey: habilidadesEmpleadoKeys.lists(),
        refetchType: 'active',
      });
      toast.success('Habilidad eliminada');
    },
    onError: createCRUDErrorHandler('delete', 'Habilidad'),
  });
}

/**
 * Verifica/desverifica una habilidad de empleado
 */
export function useVerificarHabilidadEmpleado() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({
      profesionalId,
      habilidadEmpleadoId,
      verificado,
    }: VerificarParams) => {
      const response = await profesionalesApi.verificarHabilidadEmpleado(
        profesionalId,
        habilidadEmpleadoId,
        { verificado }
      );
      return extractData(response);
    },
    onSuccess: (_data: unknown, variables: VerificarParams) => {
      queryClient.invalidateQueries({
        queryKey: habilidadesEmpleadoKeys.lists(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: habilidadesEmpleadoKeys.detail(
          variables.profesionalId,
          variables.habilidadEmpleadoId
        ),
      });
      const accion = variables.verificado ? 'verificada' : 'desverificada';
      toast.success(`Habilidad ${accion}`);
    },
    onError: createCRUDErrorHandler('update', 'Habilidad'),
  });
}

// ==================== UTILIDADES ====================

/**
 * Obtiene la configuración de una categoría de habilidad
 */
export function getCategoriaConfig(categoria: string): CategoriaHabilidad {
  return (
    CATEGORIAS_HABILIDAD.find((c) => c.value === categoria) ||
    CATEGORIAS_HABILIDAD[5]
  ); // 'otro' como default
}

/**
 * Obtiene la configuración de un nivel de habilidad
 */
export function getNivelConfig(nivel: string): NivelHabilidad {
  return (
    NIVELES_HABILIDAD.find((n) => n.value === nivel) || NIVELES_HABILIDAD[0]
  ); // 'basico' como default
}

/**
 * Agrupa habilidades por categoría
 */
export function agruparPorCategoria(
  habilidades: HabilidadEmpleado[]
): Record<string, HabilidadEmpleado[]> {
  return habilidades.reduce<Record<string, HabilidadEmpleado[]>>((acc, hab) => {
    const cat = hab.categoria || 'otro';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(hab);
    return acc;
  }, {});
}

/**
 * Filtra habilidades del catálogo que no están asignadas al empleado
 */
export function filtrarDisponibles(
  catalogo: HabilidadCatalogo[],
  asignadas: HabilidadEmpleado[]
): HabilidadCatalogo[] {
  const idsAsignados = new Set(asignadas.map((h) => h.habilidad_id));
  return catalogo.filter((h) => !idsAsignados.has(h.id));
}

/**
 * Formatea años de experiencia
 */
export function formatearAniosExperiencia(
  anios: number | null | undefined
): string {
  if (!anios || anios === 0) return 'Sin experiencia';
  if (anios < 1) return 'Menos de 1 año';
  if (anios === 1) return '1 año';
  return `${anios} años`;
}

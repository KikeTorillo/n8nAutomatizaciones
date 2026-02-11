/**
 * ====================================================================
 * HOOKS - PROFESIONALES
 * ====================================================================
 *
 * Migrado parcialmente a factory - Ene 2026
 * - CRUD básico via createCRUDHooks
 * - Hooks especializados se mantienen para casos específicos
 *
 * Migrado a TypeScript - Feb 2026
 *
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { profesionalesApi } from '@/services/api/endpoints';
import {
  createCRUDHooks,
  createSanitizer,
  createSearchHook,
} from '@/hooks/factories';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';
import { extractData } from '@/lib/apiHelpers';
import type {
  Profesional,
  CrearProfesionalData,
  ActualizarProfesionalData,
} from '@/types/entities';

// ====================================================================
// CRUD BÁSICO VIA FACTORY
// ====================================================================

// Sanitizador para datos de profesional
const sanitizeProfesional = createSanitizer([
  'email',
  'telefono',
  'descripcion',
  'direccion',
  'codigo_postal',
  { name: 'departamento_id', type: 'id' },
  { name: 'supervisor_id', type: 'id' },
  { name: 'puesto_id', type: 'id' },
]);

// Crear hooks CRUD básicos
const hooks = createCRUDHooks<
  Profesional,
  CrearProfesionalData,
  ActualizarProfesionalData
>({
  name: 'profesional',
  namePlural: 'profesionales',
  api: profesionalesApi,
  baseKey: 'profesionales',
  apiMethods: {
    list: 'listar',
    get: 'obtener',
    create: 'crear',
    update: 'actualizar',
    delete: 'eliminar',
  },
  sanitize: sanitizeProfesional,
  invalidateOnCreate: queryKeys.personas.profesionales.all,
  invalidateOnUpdate: queryKeys.personas.profesionales.all,
  invalidateOnDelete: queryKeys.personas.profesionales.all,
  errorMessages: {
    create: { 409: 'Ya existe un profesional con ese email o teléfono' },
    update: { 409: 'Ya existe un profesional con ese email o teléfono' },
    delete: {
      400: 'No se puede eliminar el profesional (puede tener citas asociadas)',
    },
  },
  staleTime: STALE_TIMES.SEMI_STATIC,
  responseKey: 'profesionales',
  usePreviousData: true,
});

// Exportar hooks CRUD básicos
export const useProfesionales = hooks.useList;
export const useProfesional = hooks.useDetail;
export const useCrearProfesional = hooks.useCreate;
export const useActualizarProfesional = hooks.useUpdate;
export const useEliminarProfesional = hooks.useDelete;

// ====================================================================
// HOOKS ESPECIALIZADOS (no factorizables)
// ====================================================================

export const useBuscarProfesionales = createSearchHook<Profesional>({
  key: 'profesionales',
  searchFn: (params: Record<string, unknown>) =>
    profesionalesApi.listar({ ...params, limit: 50 }),
  searchParam: 'busqueda',
  transformResponse: (data: Record<string, unknown>) =>
    (data?.profesionales as Profesional[]) || [],
  staleTime: STALE_TIMES.REAL_TIME,
});

export function useProfesionalesPorModulo(
  modulo: string,
  options: Record<string, unknown> = {}
): UseQueryResult<Profesional[]> {
  return useQuery({
    queryKey: ['profesionales-modulo', modulo, options],
    queryFn: async () => {
      const response = await profesionalesApi.listarPorModulo(modulo, options);
      return extractData<any>(response)?.profesionales || [];
    },
    enabled: !!modulo,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

export function useVincularUsuario(): UseMutationResult<
  Profesional,
  Error,
  { profesionalId: number; usuarioId: number }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      profesionalId,
      usuarioId,
    }: {
      profesionalId: number;
      usuarioId: number;
    }) => {
      const response = await profesionalesApi.vincularUsuario(
        profesionalId,
        usuarioId
      );
      return extractData(response);
    },
    onSuccess: (data: Profesional) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.profesionales.detail(data.id),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.profesionales.all,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.profesionales.disponibles,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: ['profesional-usuario'],
        refetchType: 'active',
      });
    },
    onError: createCRUDErrorHandler('update', 'Profesional', {
      409: 'El usuario ya está vinculado a otro profesional',
    }),
  });
}

export function useActualizarModulos(): UseMutationResult<
  Profesional,
  Error,
  { profesionalId: number; modulosAcceso: Record<string, boolean> }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      profesionalId,
      modulosAcceso,
    }: {
      profesionalId: number;
      modulosAcceso: Record<string, boolean>;
    }) => {
      const response = await profesionalesApi.actualizarModulos(
        profesionalId,
        modulosAcceso
      );
      return extractData(response);
    },
    onSuccess: (data: Profesional) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.profesionales.detail(data.id),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.profesionales.all,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: ['profesionales-modulo'],
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: ['profesional-usuario'],
        refetchType: 'active',
      });
    },
    onError: createCRUDErrorHandler('update', 'Módulos'),
  });
}

export function useProfesionalesPorEstado(
  estado: string,
  options: Record<string, unknown> = {}
): UseQueryResult<Profesional[]> {
  return useQuery({
    queryKey: ['profesionales', { estado, ...options }],
    queryFn: async () => {
      const response = await profesionalesApi.listarPorEstado(estado, options);
      return extractData<any>(response)?.profesionales || [];
    },
    enabled: !!estado,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

export function useProfesionalesPorDepartamento(
  departamentoId: number,
  options: Record<string, unknown> = {}
): UseQueryResult<Profesional[]> {
  return useQuery({
    queryKey: [
      'profesionales',
      { departamento_id: departamentoId, ...options },
    ],
    queryFn: async () => {
      const response = await profesionalesApi.listarPorDepartamento(
        departamentoId,
        options
      );
      return extractData<any>(response)?.profesionales || [];
    },
    enabled: !!departamentoId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

export function useSubordinados(
  profesionalId: number,
  options: Record<string, unknown> = {}
): UseQueryResult<Profesional[]> {
  return useQuery({
    queryKey: ['profesional-subordinados', profesionalId, options],
    queryFn: async () => {
      const response = await profesionalesApi.obtenerSubordinados(
        profesionalId,
        options
      );
      return extractData<any>(response)?.subordinados || [];
    },
    enabled: !!profesionalId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

export function useCadenaSupervisores(
  profesionalId: number
): UseQueryResult<Profesional[]> {
  return useQuery({
    queryKey: ['profesional-supervisores', profesionalId],
    queryFn: async () => {
      const response =
        await profesionalesApi.obtenerCadenaSupervisores(profesionalId);
      return extractData<any>(response)?.supervisores || [];
    },
    enabled: !!profesionalId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

interface Categoria {
  id: number;
  nombre: string;
  [key: string]: unknown;
}

export function useCategoriasDeProfesional(
  profesionalId: number
): UseQueryResult<Categoria[]> {
  return useQuery({
    queryKey: ['profesional-categorias', profesionalId],
    queryFn: async () => {
      const response = await profesionalesApi.obtenerCategorias(profesionalId);
      return extractData<any>(response)?.categorias || [];
    },
    enabled: !!profesionalId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

export function useAsignarCategoria(): UseMutationResult<
  unknown,
  Error,
  { profesionalId: number; categoriaId: number }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      profesionalId,
      categoriaId,
    }: {
      profesionalId: number;
      categoriaId: number;
    }) => {
      const response = await profesionalesApi.asignarCategoria(
        profesionalId,
        categoriaId
      );
      return extractData(response);
    },
    onSuccess: (
      _: unknown,
      variables: { profesionalId: number; categoriaId: number }
    ) => {
      queryClient.invalidateQueries({
        queryKey: ['profesional-categorias', variables.profesionalId],
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.profesionales.detail(
          variables.profesionalId
        ),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: ['categoria-profesionales'],
        refetchType: 'active',
      });
    },
    onError: createCRUDErrorHandler('create', 'Categoría', {
      409: 'El profesional ya tiene asignada esta categoría',
    }),
  });
}

export function useEliminarCategoriaDeProf(): UseMutationResult<
  { profesionalId: number; categoriaId: number },
  Error,
  { profesionalId: number; categoriaId: number }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      profesionalId,
      categoriaId,
    }: {
      profesionalId: number;
      categoriaId: number;
    }) => {
      await profesionalesApi.eliminarCategoria(profesionalId, categoriaId);
      return { profesionalId, categoriaId };
    },
    onSuccess: (
      _: { profesionalId: number; categoriaId: number },
      variables: { profesionalId: number; categoriaId: number }
    ) => {
      queryClient.invalidateQueries({
        queryKey: ['profesional-categorias', variables.profesionalId],
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.profesionales.detail(
          variables.profesionalId
        ),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: ['categoria-profesionales'],
        refetchType: 'active',
      });
    },
    onError: createCRUDErrorHandler('delete', 'Categoría'),
  });
}

export function useSincronizarCategorias(): UseMutationResult<
  unknown,
  Error,
  { profesionalId: number; categoriaIds: number[] }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      profesionalId,
      categoriaIds,
    }: {
      profesionalId: number;
      categoriaIds: number[];
    }) => {
      const response = await profesionalesApi.sincronizarCategorias(
        profesionalId,
        categoriaIds
      );
      return extractData(response);
    },
    onSuccess: (
      _: unknown,
      variables: { profesionalId: number; categoriaIds: number[] }
    ) => {
      queryClient.invalidateQueries({
        queryKey: ['profesional-categorias', variables.profesionalId],
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.profesionales.detail(
          variables.profesionalId
        ),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: ['categoria-profesionales'],
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.catalogos.categoriasProfesional,
        refetchType: 'active',
      });
    },
    onError: createCRUDErrorHandler('update', 'Categorías'),
  });
}

// ====================================================================
// CONSTANTES PARA GESTIÓN DE EMPLEADOS
// ====================================================================

export const ESTADOS_LABORALES = {
  activo: { label: 'Activo', color: 'green' },
  vacaciones: { label: 'Vacaciones', color: 'blue' },
  incapacidad: { label: 'Incapacidad', color: 'yellow' },
  suspendido: { label: 'Suspendido', color: 'red' },
  baja: { label: 'Baja', color: 'gray' },
} as const;

export const TIPOS_CONTRATACION = {
  tiempo_completo: { label: 'Tiempo completo', color: 'green' },
  medio_tiempo: { label: 'Medio tiempo', color: 'blue' },
  temporal: { label: 'Temporal', color: 'yellow' },
  contrato: { label: 'Por contrato', color: 'purple' },
  freelance: { label: 'Freelance', color: 'gray' },
} as const;

export const GENEROS = {
  masculino: { label: 'Masculino' },
  femenino: { label: 'Femenino' },
  otro: { label: 'Otro' },
  no_especificado: { label: 'No especificado' },
} as const;

export const ESTADOS_CIVILES = {
  soltero: { label: 'Soltero/a' },
  casado: { label: 'Casado/a' },
  divorciado: { label: 'Divorciado/a' },
  viudo: { label: 'Viudo/a' },
  union_libre: { label: 'Unión libre' },
} as const;

export const FORMAS_PAGO = {
  comision: { label: 'Solo comisión', color: 'purple' },
  salario: { label: 'Solo salario', color: 'blue' },
  mixto: { label: 'Salario + Comisión', color: 'green' },
} as const;

export const IDIOMAS_DISPONIBLES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'Inglés' },
  { value: 'fr', label: 'Francés' },
  { value: 'pt', label: 'Portugués' },
  { value: 'de', label: 'Alemán' },
  { value: 'it', label: 'Italiano' },
  { value: 'zh', label: 'Chino Mandarín' },
  { value: 'ja', label: 'Japonés' },
  { value: 'ko', label: 'Coreano' },
  { value: 'ar', label: 'Árabe' },
  { value: 'ru', label: 'Ruso' },
  { value: 'nah', label: 'Náhuatl' },
  { value: 'maya', label: 'Maya' },
] as const;

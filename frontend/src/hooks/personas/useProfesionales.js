/**
 * ====================================================================
 * HOOKS - PROFESIONALES
 * ====================================================================
 *
 * Migrado parcialmente a factory - Ene 2026
 * - CRUD básico via createCRUDHooks
 * - Hooks especializados se mantienen para casos específicos
 *
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { profesionalesApi } from '@/services/api/endpoints';
import { createCRUDHooks, createSanitizer, createSearchHook } from '@/hooks/factories';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

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
const hooks = createCRUDHooks({
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
  invalidateOnCreate: ['profesionales', 'profesionales-dashboard', 'estadisticas'],
  invalidateOnUpdate: ['profesionales', 'profesionales-dashboard'],
  invalidateOnDelete: ['profesionales', 'profesionales-dashboard', 'estadisticas'],
  errorMessages: {
    create: { 409: 'Ya existe un profesional con ese email o teléfono' },
    update: { 409: 'Ya existe un profesional con ese email o teléfono' },
    delete: { 400: 'No se puede eliminar el profesional (puede tener citas asociadas)' },
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

/**
 * Hook para buscar profesionales (búsqueda rápida)
 * Refactorizado con createSearchHook - Ene 2026
 */
export const useBuscarProfesionales = createSearchHook({
  key: 'profesionales',
  searchFn: (params) => profesionalesApi.listar({ ...params, limit: 50 }),
  searchParam: 'busqueda',
  transformResponse: (data) => data?.profesionales || [],
  staleTime: STALE_TIMES.REAL_TIME,
});

/**
 * Hook para listar profesionales por módulo habilitado
 */
export function useProfesionalesPorModulo(modulo, options = {}) {
  return useQuery({
    queryKey: ['profesionales-modulo', modulo, options],
    queryFn: async () => {
      const response = await profesionalesApi.listarPorModulo(modulo, options);
      return response.data.data?.profesionales || [];
    },
    enabled: !!modulo,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para vincular/desvincular usuario a profesional
 */
export function useVincularUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profesionalId, usuarioId }) => {
      const response = await profesionalesApi.vincularUsuario(profesionalId, usuarioId);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profesional', data.id] });
      queryClient.invalidateQueries({ queryKey: ['profesionales'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios-disponibles'] });
      queryClient.invalidateQueries({ queryKey: ['profesional-usuario'] });
    },
    onError: createCRUDErrorHandler('update', 'Profesional', {
      409: 'El usuario ya está vinculado a otro profesional',
    }),
  });
}

/**
 * Hook para actualizar módulos habilitados de un profesional
 */
export function useActualizarModulos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profesionalId, modulosAcceso }) => {
      const response = await profesionalesApi.actualizarModulos(profesionalId, modulosAcceso);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profesional', data.id] });
      queryClient.invalidateQueries({ queryKey: ['profesionales'] });
      queryClient.invalidateQueries({ queryKey: ['profesionales-modulo'] });
      queryClient.invalidateQueries({ queryKey: ['profesional-usuario'] });
    },
    onError: createCRUDErrorHandler('update', 'Módulos'),
  });
}

/**
 * Hook para listar profesionales por estado laboral
 */
export function useProfesionalesPorEstado(estado, options = {}) {
  return useQuery({
    queryKey: ['profesionales', { estado, ...options }],
    queryFn: async () => {
      const response = await profesionalesApi.listarPorEstado(estado, options);
      return response.data.data?.profesionales || [];
    },
    enabled: !!estado,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para listar profesionales por departamento
 */
export function useProfesionalesPorDepartamento(departamentoId, options = {}) {
  return useQuery({
    queryKey: ['profesionales', { departamento_id: departamentoId, ...options }],
    queryFn: async () => {
      const response = await profesionalesApi.listarPorDepartamento(departamentoId, options);
      return response.data.data?.profesionales || [];
    },
    enabled: !!departamentoId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para obtener subordinados de un profesional
 */
export function useSubordinados(profesionalId, options = {}) {
  return useQuery({
    queryKey: ['profesional-subordinados', profesionalId, options],
    queryFn: async () => {
      const response = await profesionalesApi.obtenerSubordinados(profesionalId, options);
      return response.data.data?.subordinados || [];
    },
    enabled: !!profesionalId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para obtener cadena de supervisores de un profesional
 */
export function useCadenaSupervisores(profesionalId) {
  return useQuery({
    queryKey: ['profesional-supervisores', profesionalId],
    queryFn: async () => {
      const response = await profesionalesApi.obtenerCadenaSupervisores(profesionalId);
      return response.data.data?.supervisores || [];
    },
    enabled: !!profesionalId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para obtener categorías de un profesional
 */
export function useCategoriasDeProfesional(profesionalId) {
  return useQuery({
    queryKey: ['profesional-categorias', profesionalId],
    queryFn: async () => {
      const response = await profesionalesApi.obtenerCategorias(profesionalId);
      return response.data.data?.categorias || [];
    },
    enabled: !!profesionalId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para asignar categoría a un profesional
 */
export function useAsignarCategoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profesionalId, categoriaId }) => {
      const response = await profesionalesApi.asignarCategoria(profesionalId, categoriaId);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profesional-categorias', variables.profesionalId] });
      queryClient.invalidateQueries({ queryKey: ['profesional', variables.profesionalId] });
      queryClient.invalidateQueries({ queryKey: ['categoria-profesionales'] });
    },
    onError: createCRUDErrorHandler('create', 'Categoría', {
      409: 'El profesional ya tiene asignada esta categoría',
    }),
  });
}

/**
 * Hook para eliminar categoría de un profesional
 */
export function useEliminarCategoriaDeProf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profesionalId, categoriaId }) => {
      await profesionalesApi.eliminarCategoria(profesionalId, categoriaId);
      return { profesionalId, categoriaId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profesional-categorias', variables.profesionalId] });
      queryClient.invalidateQueries({ queryKey: ['profesional', variables.profesionalId] });
      queryClient.invalidateQueries({ queryKey: ['categoria-profesionales'] });
    },
    onError: createCRUDErrorHandler('delete', 'Categoría'),
  });
}

/**
 * Hook para sincronizar categorías de un profesional (reemplaza todas)
 */
export function useSincronizarCategorias() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profesionalId, categoriaIds }) => {
      const response = await profesionalesApi.sincronizarCategorias(profesionalId, categoriaIds);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profesional-categorias', variables.profesionalId] });
      queryClient.invalidateQueries({ queryKey: ['profesional', variables.profesionalId] });
      queryClient.invalidateQueries({ queryKey: ['categoria-profesionales'] });
      queryClient.invalidateQueries({ queryKey: ['categorias-profesional'] });
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
};

export const TIPOS_CONTRATACION = {
  tiempo_completo: { label: 'Tiempo completo', color: 'green' },
  medio_tiempo: { label: 'Medio tiempo', color: 'blue' },
  temporal: { label: 'Temporal', color: 'yellow' },
  contrato: { label: 'Por contrato', color: 'purple' },
  freelance: { label: 'Freelance', color: 'gray' },
};

export const GENEROS = {
  masculino: { label: 'Masculino' },
  femenino: { label: 'Femenino' },
  otro: { label: 'Otro' },
  no_especificado: { label: 'No especificado' },
};

export const ESTADOS_CIVILES = {
  soltero: { label: 'Soltero/a' },
  casado: { label: 'Casado/a' },
  divorciado: { label: 'Divorciado/a' },
  viudo: { label: 'Viudo/a' },
  union_libre: { label: 'Unión libre' },
};

export const FORMAS_PAGO = {
  comision: { label: 'Solo comisión', color: 'purple' },
  salario: { label: 'Solo salario', color: 'blue' },
  mixto: { label: 'Salario + Comisión', color: 'green' },
};

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
];

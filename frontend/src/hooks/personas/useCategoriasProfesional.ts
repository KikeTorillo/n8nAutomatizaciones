/**
 * useCategoriasProfesional - Hooks CRUD para categorías de profesional
 * Enero 2026
 * Feb 2026 - Migrado a TypeScript
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { categoriasProfesionalApi } from '@/services/api/endpoints';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';

// ==================== INTERFACES ====================

interface CategoriaProfesional {
  id: number;
  nombre: string;
  tipo_categoria: string;
  descripcion?: string;
  color?: string;
  icono?: string;
  orden?: number;
  activo: boolean;
  [key: string]: unknown;
}

interface CategoriaProfesionalParams {
  activo?: boolean;
  tipo_categoria?: string;
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

interface CrearCategoriaData {
  nombre: string;
  tipo_categoria: string;
  descripcion?: string;
  color?: string;
  icono?: string;
  orden?: number;
  [key: string]: unknown;
}

interface ActualizarCategoriaParams {
  id: number;
  data: CrearCategoriaData;
}

interface TipoCategoriaConfig {
  label: string;
  color: string;
}

// ==================== HOOKS CRUD CATEGORÍAS PROFESIONAL ====================

/**
 * Hook para listar categorías de profesional con filtros
 */
export function useCategoriasProfesional(params: CategoriaProfesionalParams = {}) {
  return useQuery({
    queryKey: [...queryKeys.catalogos.categoriasProfesional, params],
    queryFn: async () => {
      // Sanitizar params - eliminar valores vacíos
      const sanitizedParams = Object.entries(params).reduce<Record<string, unknown>>((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await categoriasProfesionalApi.listar(sanitizedParams);
      // La API retorna { data: [...], meta: {...} } sin wrapper 'categorias'
      return (response as any).data.data || [];
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para listar categorías agrupadas por tipo
 * Retorna: { especialidad: [...], nivel: [...], area: [...], ... }
 */
export function useCategoriasAgrupadas() {
  return useQuery({
    queryKey: [...queryKeys.catalogos.categoriasProfesional, { agrupado: true }],
    queryFn: async () => {
      const response = await categoriasProfesionalApi.listarAgrupadas();
      // La API retorna { data: { area: [...], nivel: [...], ... } } directamente
      return (response as any).data.data || {};
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para obtener categoría por ID
 */
export function useCategoriaProfesional(id: number | null | undefined) {
  return useQuery({
    queryKey: ['categoria-profesional', id],
    queryFn: async () => {
      const response = await categoriasProfesionalApi.obtener(id!);
      return (response as any).data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para obtener profesionales de una categoría
 */
export function useProfesionalesDeCategoria(categoriaId: number | null | undefined) {
  return useQuery({
    queryKey: ['categoria-profesionales', categoriaId],
    queryFn: async () => {
      const response = await categoriasProfesionalApi.obtenerProfesionales(categoriaId!);
      return (response as any).data.data?.profesionales || [];
    },
    enabled: !!categoriaId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para crear categoría de profesional
 */
export function useCrearCategoriaProfesional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CrearCategoriaData) => {
      // Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        descripcion: data.descripcion?.trim() || undefined,
        color: data.color?.trim() || undefined,
        icono: data.icono?.trim() || undefined,
        orden: data.orden || undefined,
      };
      const response = await categoriasProfesionalApi.crear(sanitized as any);
      return (response as any).data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalogos.categoriasProfesional, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Categoría', {
      409: 'Ya existe una categoría con ese nombre en ese tipo',
    }),
  });
}

/**
 * Hook para actualizar categoría de profesional
 */
export function useActualizarCategoriaProfesional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: ActualizarCategoriaParams) => {
      // Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        descripcion: data.descripcion?.trim() || undefined,
        color: data.color?.trim() || undefined,
        icono: data.icono?.trim() || undefined,
        orden: data.orden || undefined,
      };
      const response = await categoriasProfesionalApi.actualizar(id, sanitized as any);
      return (response as any).data.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.catalogos.categoriasProfesional, data.id], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.catalogos.categoriasProfesional, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Categoría'),
  });
}

/**
 * Hook para eliminar categoría de profesional (soft delete)
 */
export function useEliminarCategoriaProfesional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await categoriasProfesionalApi.eliminar(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalogos.categoriasProfesional, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('delete', 'Categoría', {
      400: 'No se puede eliminar: hay profesionales con esta categoría',
    }),
  });
}

// ==================== HOOKS POR TIPO ====================

/**
 * Hook para obtener categorías de tipo especialidad
 */
export function useEspecialidades() {
  return useCategoriasProfesional({ activo: true, tipo_categoria: 'especialidad' });
}

/**
 * Hook para obtener categorías de tipo nivel
 */
export function useNiveles() {
  return useCategoriasProfesional({ activo: true, tipo_categoria: 'nivel' });
}

/**
 * Hook para obtener categorías de tipo área
 */
export function useAreas() {
  return useCategoriasProfesional({ activo: true, tipo_categoria: 'area' });
}

/**
 * Hook para obtener categorías de tipo certificación
 */
export function useCertificaciones() {
  return useCategoriasProfesional({ activo: true, tipo_categoria: 'certificacion' });
}

/**
 * Hook para obtener categorías activas (para selectores)
 */
export function useCategoriasActivas() {
  return useCategoriasProfesional({ activo: true });
}

// ==================== CONSTANTES ====================

export const TIPOS_CATEGORIA: Record<string, TipoCategoriaConfig> = {
  especialidad: { label: 'Especialidad', color: 'purple' },
  nivel: { label: 'Nivel', color: 'blue' },
  area: { label: 'Área', color: 'green' },
  certificacion: { label: 'Certificación', color: 'yellow' },
  general: { label: 'General', color: 'gray' },
} as const;

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { categoriasProfesionalApi } from '@/services/api/endpoints';

// ==================== HOOKS CRUD CATEGORÍAS PROFESIONAL ====================

/**
 * Hook para listar categorías de profesional con filtros
 * @param {Object} params - { activo, tipo_categoria, limit, offset }
 */
export function useCategoriasProfesional(params = {}) {
  return useQuery({
    queryKey: ['categorias-profesional', params],
    queryFn: async () => {
      // Sanitizar params - eliminar valores vacíos
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await categoriasProfesionalApi.listar(sanitizedParams);
      // La API retorna { data: [...], meta: {...} } sin wrapper 'categorias'
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para listar categorías agrupadas por tipo
 * Retorna: { especialidad: [...], nivel: [...], area: [...], ... }
 */
export function useCategoriasAgrupadas() {
  return useQuery({
    queryKey: ['categorias-profesional', { agrupado: true }],
    queryFn: async () => {
      const response = await categoriasProfesionalApi.listarAgrupadas();
      // La API retorna { data: { area: [...], nivel: [...], ... } } directamente
      return response.data.data || {};
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para obtener categoría por ID
 * @param {number} id
 */
export function useCategoriaProfesional(id) {
  return useQuery({
    queryKey: ['categoria-profesional', id],
    queryFn: async () => {
      const response = await categoriasProfesionalApi.obtener(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para obtener profesionales de una categoría
 * @param {number} categoriaId
 */
export function useProfesionalesDeCategoria(categoriaId) {
  return useQuery({
    queryKey: ['categoria-profesionales', categoriaId],
    queryFn: async () => {
      const response = await categoriasProfesionalApi.obtenerProfesionales(categoriaId);
      return response.data.data?.profesionales || [];
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
    mutationFn: async (data) => {
      // Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        descripcion: data.descripcion?.trim() || undefined,
        color: data.color?.trim() || undefined,
        icono: data.icono?.trim() || undefined,
        orden: data.orden || undefined,
      };
      const response = await categoriasProfesionalApi.crear(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-profesional'] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);

      const errorMessages = {
        409: 'Ya existe una categoría con ese nombre en ese tipo',
        400: 'Datos inválidos. Revisa los campos',
        500: 'Error del servidor',
      };

      const statusCode = error.response?.status;
      throw new Error(errorMessages[statusCode] || 'Error al crear categoría');
    },
  });
}

/**
 * Hook para actualizar categoría de profesional
 */
export function useActualizarCategoriaProfesional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      // Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        descripcion: data.descripcion?.trim() || undefined,
        color: data.color?.trim() || undefined,
        icono: data.icono?.trim() || undefined,
        orden: data.orden || undefined,
      };
      const response = await categoriasProfesionalApi.actualizar(id, sanitized);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categoria-profesional', data.id] });
      queryClient.invalidateQueries({ queryKey: ['categorias-profesional'] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al actualizar categoría');
    },
  });
}

/**
 * Hook para eliminar categoría de profesional (soft delete)
 */
export function useEliminarCategoriaProfesional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await categoriasProfesionalApi.eliminar(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-profesional'] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);

      if (error.response?.data?.error?.includes('profesionales')) {
        throw new Error('No se puede eliminar: hay profesionales con esta categoría');
      }
      throw new Error('Error al eliminar categoría');
    },
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

export const TIPOS_CATEGORIA = {
  especialidad: { label: 'Especialidad', color: 'purple' },
  nivel: { label: 'Nivel', color: 'blue' },
  area: { label: 'Área', color: 'green' },
  certificacion: { label: 'Certificación', color: 'yellow' },
  general: { label: 'General', color: 'gray' },
};

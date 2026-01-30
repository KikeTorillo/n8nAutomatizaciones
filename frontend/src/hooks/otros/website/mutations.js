/**
 * ====================================================================
 * WEBSITE - HOOKS DE ESCRITURA (MUTATIONS)
 * ====================================================================
 * Hooks de TanStack Query para operaciones de escritura del modulo website.
 * Incluye manejo de errores 409 (conflicto de version / bloqueo optimista).
 *
 * @since 2026-01-29
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { websiteApi } from '@/services/api/endpoints';
import { toast } from 'sonner';
import { WEBSITE_KEYS } from './constants';

// ==================== MUTATIONS - CONFIG ====================

/**
 * Hook para crear configuracion del sitio
 */
export function useCrearWebsiteConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await websiteApi.crearConfig(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEBSITE_KEYS.config(), refetchType: 'active' });
    },
  });
}

/**
 * Hook para actualizar configuracion del sitio
 * Maneja errores 409 (conflicto de version) con toast y opcion de recargar
 */
export function useActualizarWebsiteConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await websiteApi.actualizarConfig(id, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEBSITE_KEYS.config(), refetchType: 'active' });
    },
    onError: (error) => {
      if (error?.response?.status === 409) {
        toast.error('Conflicto de edicion', {
          description: 'Otro usuario modifico esta configuracion. Recarga para ver los cambios.',
          action: {
            label: 'Recargar',
            onClick: () => queryClient.invalidateQueries({ queryKey: WEBSITE_KEYS.config() }),
          },
          duration: 10000,
        });
      }
    },
  });
}

/**
 * Hook para publicar/despublicar sitio
 */
export function usePublicarWebsite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, publicar }) => {
      const response = await websiteApi.publicarConfig(id, publicar);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEBSITE_KEYS.config(), refetchType: 'active' });
    },
  });
}

/**
 * Hook para eliminar sitio web
 */
export function useEliminarWebsite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await websiteApi.eliminarConfig(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEBSITE_KEYS.all, refetchType: 'active' });
    },
  });
}

// ==================== MUTATIONS - PAGINAS ====================

/**
 * Hook para crear pagina
 */
export function useCrearPagina() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await websiteApi.crearPagina(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEBSITE_KEYS.paginas(), refetchType: 'active' });
    },
  });
}

/**
 * Hook para actualizar pagina
 * Maneja errores 409 (conflicto de version) con toast y opcion de recargar
 */
export function useActualizarPagina() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await websiteApi.actualizarPagina(id, data);
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: WEBSITE_KEYS.paginas(), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: WEBSITE_KEYS.pagina(id), refetchType: 'active' });
    },
    onError: (error, { id }) => {
      if (error?.response?.status === 409) {
        toast.error('Conflicto de edicion', {
          description: 'Otro usuario modifico esta pagina. Recarga para ver los cambios.',
          action: {
            label: 'Recargar',
            onClick: () => {
              queryClient.invalidateQueries({ queryKey: WEBSITE_KEYS.paginas() });
              queryClient.invalidateQueries({ queryKey: WEBSITE_KEYS.pagina(id) });
            },
          },
          duration: 10000,
        });
      }
    },
  });
}

/**
 * Hook para reordenar paginas
 */
export function useReordenarPaginas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ordenamiento) => {
      const response = await websiteApi.reordenarPaginas(ordenamiento);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEBSITE_KEYS.paginas(), refetchType: 'active' });
    },
  });
}

/**
 * Hook para eliminar pagina
 */
export function useEliminarPagina() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await websiteApi.eliminarPagina(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEBSITE_KEYS.paginas(), refetchType: 'active' });
    },
  });
}

// ==================== MUTATIONS - BLOQUES ====================

/**
 * Hook para crear bloque
 */
export function useCrearBloque() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await websiteApi.crearBloque(data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: WEBSITE_KEYS.bloques(variables.pagina_id), refetchType: 'active' });
    },
  });
}

/**
 * Hook para actualizar bloque
 * Maneja errores 409 (conflicto de version) con toast y opcion de recargar
 */
export function useActualizarBloque() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data, paginaId }) => {
      const response = await websiteApi.actualizarBloque(id, data);
      return { ...response.data.data, _paginaId: paginaId };
    },
    onSuccess: (result) => {
      const paginaId = result._paginaId || result.pagina_id;
      queryClient.invalidateQueries({ queryKey: WEBSITE_KEYS.bloques(paginaId), refetchType: 'active' });
    },
    onError: (error, { paginaId }) => {
      if (error?.response?.status === 409) {
        toast.error('Conflicto de edicion', {
          description: 'Otro usuario modifico este bloque. Recarga para ver los cambios.',
          action: {
            label: 'Recargar',
            onClick: () => {
              if (paginaId) {
                queryClient.invalidateQueries({ queryKey: WEBSITE_KEYS.bloques(paginaId) });
              }
            },
          },
          duration: 10000,
        });
      }
    },
  });
}

/**
 * Hook para reordenar bloques
 */
export function useReordenarBloques() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paginaId, ordenamiento }) => {
      const response = await websiteApi.reordenarBloques(paginaId, ordenamiento);
      return response.data.data;
    },
    onSuccess: (_, { paginaId }) => {
      queryClient.invalidateQueries({ queryKey: WEBSITE_KEYS.bloques(paginaId), refetchType: 'active' });
    },
  });
}

/**
 * Hook para duplicar bloque
 */
export function useDuplicarBloque() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await websiteApi.duplicarBloque(id);
      return response.data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: WEBSITE_KEYS.bloques(result.pagina_id), refetchType: 'active' });
    },
  });
}

/**
 * Hook para eliminar bloque
 */
export function useEliminarBloque() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, paginaId }) => {
      const response = await websiteApi.eliminarBloque(id);
      return { ...response.data.data, paginaId };
    },
    onSuccess: (_, { paginaId }) => {
      queryClient.invalidateQueries({ queryKey: WEBSITE_KEYS.bloques(paginaId), refetchType: 'active' });
    },
  });
}

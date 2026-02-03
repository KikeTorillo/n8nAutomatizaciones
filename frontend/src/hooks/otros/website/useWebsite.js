import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { websiteApi } from '@/services/api/endpoints';
import { useAuthStore, selectIsAuthenticated } from '@/features/auth';
import { toast } from 'sonner';

/**
 * QUERY KEYS para website
 */
export const WEBSITE_KEYS = {
  all: ['website'],
  config: () => [...WEBSITE_KEYS.all, 'config'],
  paginas: () => [...WEBSITE_KEYS.all, 'paginas'],
  pagina: (id) => [...WEBSITE_KEYS.paginas(), id],
  bloques: (paginaId) => [...WEBSITE_KEYS.all, 'bloques', paginaId],
  bloque: (id) => [...WEBSITE_KEYS.all, 'bloque', id],
  tiposBloques: () => [...WEBSITE_KEYS.all, 'tipos-bloques'],
  defaultBloque: (tipo) => [...WEBSITE_KEYS.all, 'default-bloque', tipo],
  slugDisponible: (slug) => [...WEBSITE_KEYS.all, 'slug', slug],
};

// ==================== QUERIES - CONFIG ====================

/**
 * Hook para obtener la configuración del sitio web
 */
export function useWebsiteConfig() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return useQuery({
    queryKey: WEBSITE_KEYS.config(),
    queryFn: async () => {
      const response = await websiteApi.obtenerConfig();
      return response.data.data;
    },
    enabled: isAuthenticated,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para verificar disponibilidad de slug
 */
export function useVerificarSlug(slug, excludeId) {
  return useQuery({
    queryKey: WEBSITE_KEYS.slugDisponible(slug),
    queryFn: async () => {
      const response = await websiteApi.verificarSlug(slug, excludeId);
      return response.data.data;
    },
    enabled: !!slug && slug.length >= 3,
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

// ==================== QUERIES - PÁGINAS ====================

/**
 * Hook para listar páginas del sitio
 */
export function useWebsitePaginas() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return useQuery({
    queryKey: WEBSITE_KEYS.paginas(),
    queryFn: async () => {
      const response = await websiteApi.listarPaginas();
      return response.data.data;
    },
    enabled: isAuthenticated,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener una página por ID
 */
export function useWebsitePagina(id) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return useQuery({
    queryKey: WEBSITE_KEYS.pagina(id),
    queryFn: async () => {
      const response = await websiteApi.obtenerPagina(id);
      return response.data.data;
    },
    enabled: isAuthenticated && !!id,
  });
}

// ==================== QUERIES - BLOQUES ====================

/**
 * Hook para listar bloques de una página
 */
export function useWebsiteBloques(paginaId) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return useQuery({
    queryKey: WEBSITE_KEYS.bloques(paginaId),
    queryFn: async () => {
      const response = await websiteApi.listarBloques(paginaId);
      return response.data.data;
    },
    enabled: isAuthenticated && !!paginaId,
    staleTime: STALE_TIMES.FREQUENT,
  });
}

/**
 * Hook para obtener tipos de bloques disponibles
 */
export function useTiposBloques() {
  return useQuery({
    queryKey: WEBSITE_KEYS.tiposBloques(),
    queryFn: async () => {
      const response = await websiteApi.listarTiposBloques();
      return response.data.data;
    },
    staleTime: STALE_TIMES.LONG,
  });
}

/**
 * Hook para obtener contenido default de un tipo de bloque
 */
export function useDefaultBloque(tipo) {
  return useQuery({
    queryKey: WEBSITE_KEYS.defaultBloque(tipo),
    queryFn: async () => {
      const response = await websiteApi.obtenerDefaultBloque(tipo);
      return response.data.data;
    },
    enabled: !!tipo,
    staleTime: STALE_TIMES.LONG,
  });
}

// ==================== MUTATIONS - CONFIG ====================

/**
 * Hook para crear configuración del sitio
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
 * Hook para actualizar configuración del sitio
 * Maneja errores 409 (conflicto de versión) con toast y opción de recargar
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
        toast.error('Conflicto de edición', {
          description: 'Otro usuario modificó esta configuración. Recarga para ver los cambios.',
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

// ==================== MUTATIONS - PÁGINAS ====================

/**
 * Hook para crear página
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
 * Hook para actualizar página
 * Maneja errores 409 (conflicto de versión) con toast y opción de recargar
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
        toast.error('Conflicto de edición', {
          description: 'Otro usuario modificó esta página. Recarga para ver los cambios.',
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
 * Hook para reordenar páginas
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
 * Hook para eliminar página
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
 * Maneja errores 409 (conflicto de versión) con toast y opción de recargar
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
        toast.error('Conflicto de edición', {
          description: 'Otro usuario modificó este bloque. Recarga para ver los cambios.',
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

// ==================== HOOK COMBINADO ====================

/**
 * Hook combinado para el editor del website
 */
export function useWebsiteEditor() {
  const { data: config, isLoading: configLoading, refetch: refetchConfig } = useWebsiteConfig();
  const { data: paginasData, isLoading: paginasLoading, refetch: refetchPaginas } = useWebsitePaginas();
  const { data: tiposBloques } = useTiposBloques();

  const crearConfig = useCrearWebsiteConfig();
  const actualizarConfig = useActualizarWebsiteConfig();
  const publicarSitio = usePublicarWebsite();
  const eliminarSitio = useEliminarWebsite();

  const crearPagina = useCrearPagina();
  const actualizarPagina = useActualizarPagina();
  const reordenarPaginas = useReordenarPaginas();
  const eliminarPagina = useEliminarPagina();

  const crearBloque = useCrearBloque();
  const actualizarBloque = useActualizarBloque();
  const reordenarBloques = useReordenarBloques();
  const duplicarBloque = useDuplicarBloque();
  const eliminarBloque = useEliminarBloque();

  return {
    // Data
    config,
    paginas: paginasData || [],
    tiposBloques: tiposBloques?.tipos || [],

    // Estado
    isLoading: configLoading || paginasLoading,
    tieneSitio: !!config,
    estaPublicado: config?.publicado || false,

    // Refetch
    refetchConfig,
    refetchPaginas,

    // Mutations - Config
    crearConfig,
    actualizarConfig,
    publicarSitio,
    eliminarSitio,

    // Mutations - Páginas
    crearPagina,
    actualizarPagina,
    reordenarPaginas,
    eliminarPagina,

    // Mutations - Bloques
    crearBloque,
    actualizarBloque,
    reordenarBloques,
    duplicarBloque,
    eliminarBloque,
  };
}

export default useWebsiteEditor;

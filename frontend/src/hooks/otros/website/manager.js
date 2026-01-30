/**
 * ====================================================================
 * WEBSITE - HOOK COMBINADO (MANAGER)
 * ====================================================================
 * Hook que combina queries y mutations para el editor del website.
 * Proporciona una interfaz unificada para manejar todo el estado del editor.
 *
 * @since 2026-01-29
 */

import {
  useWebsiteConfig,
  useWebsitePaginas,
  useTiposBloques,
} from './queries';

import {
  useCrearWebsiteConfig,
  useActualizarWebsiteConfig,
  usePublicarWebsite,
  useEliminarWebsite,
  useCrearPagina,
  useActualizarPagina,
  useReordenarPaginas,
  useEliminarPagina,
  useCrearBloque,
  useActualizarBloque,
  useReordenarBloques,
  useDuplicarBloque,
  useEliminarBloque,
} from './mutations';

/**
 * Hook combinado para el editor del website
 *
 * Proporciona acceso a:
 * - Data: config, paginas, tiposBloques
 * - Estado: isLoading, tieneSitio, estaPublicado
 * - Refetch: refetchConfig, refetchPaginas
 * - Mutations: crearConfig, actualizarConfig, etc.
 *
 * @returns {Object} Objeto con data, estado y mutations
 */
export function useWebsiteEditor() {
  // Queries
  const { data: config, isLoading: configLoading, refetch: refetchConfig } = useWebsiteConfig();
  const { data: paginasData, isLoading: paginasLoading, refetch: refetchPaginas } = useWebsitePaginas();
  const { data: tiposBloques } = useTiposBloques();

  // Mutations - Config
  const crearConfig = useCrearWebsiteConfig();
  const actualizarConfig = useActualizarWebsiteConfig();
  const publicarSitio = usePublicarWebsite();
  const eliminarSitio = useEliminarWebsite();

  // Mutations - Paginas
  const crearPagina = useCrearPagina();
  const actualizarPagina = useActualizarPagina();
  const reordenarPaginas = useReordenarPaginas();
  const eliminarPagina = useEliminarPagina();

  // Mutations - Bloques
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

    // Mutations - Paginas
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

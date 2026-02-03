/**
 * ====================================================================
 * SITE CONTEXT
 * ====================================================================
 *
 * Contexto para el estado del sitio web.
 * Extraído de EditorContext para reducir re-renders.
 *
 * Responsabilidades:
 * - config, paginas, tiposBloques
 * - paginaActiva, setPaginaActiva
 * - tieneSitio, estaPublicado, isLoading
 * - handleCrearSitio, handlePublicar
 * - editorMutations (para BlocksProvider)
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { toast } from 'sonner';
import { useWebsiteEditor } from '@/hooks/otros';

// ========== CONTEXT ==========

const SiteContext = createContext(null);

// ========== PROVIDER ==========

/**
 * SiteProvider - Proveedor del contexto del sitio
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes hijos
 */
export function SiteProvider({ children }) {
  // ========== ESTADO LOCAL ==========
  const [paginaActiva, setPaginaActiva] = useState(null);
  const [mostrarCrearSitio, setMostrarCrearSitio] = useState(false);
  const [mostrarTemplates, setMostrarTemplates] = useState(false);
  const [mostrarAIWizard, setMostrarAIWizard] = useState(false);

  // ========== HOOK DEL EDITOR ==========
  const editorData = useWebsiteEditor();
  const {
    config,
    paginas,
    tiposBloques,
    isLoading,
    tieneSitio,
    estaPublicado,
    crearConfig,
    actualizarConfig,
    publicarSitio,
    crearPagina,
    actualizarPagina,
    eliminarPagina,
    crearBloque,
    actualizarBloque,
    reordenarBloques,
    duplicarBloque,
    eliminarBloque,
  } = editorData;

  // Seleccionar primera página al cargar
  useEffect(() => {
    if (paginas.length > 0 && !paginaActiva) {
      const paginaInicio = paginas.find((p) => p.es_inicio) || paginas[0];
      setPaginaActiva(paginaInicio);
    }
  }, [paginas, paginaActiva]);

  // ========== HANDLERS ==========

  const handleCrearSitio = useCallback(
    async (datosIniciales) => {
      try {
        await crearConfig.mutateAsync(datosIniciales);
        toast.success('Sitio web creado exitosamente');
        setMostrarCrearSitio(false);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al crear sitio');
      }
    },
    [crearConfig]
  );

  const handlePublicar = useCallback(async () => {
    try {
      await publicarSitio.mutateAsync({
        id: config.id,
        publicar: !estaPublicado,
      });
      toast.success(
        estaPublicado ? 'Sitio despublicado' : 'Sitio publicado exitosamente'
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al publicar');
    }
  }, [publicarSitio, config?.id, estaPublicado]);

  // ========== MUTATIONS PARA BLOQUES ==========
  // Se pasan a BlocksProvider para evitar prop drilling
  const editorMutations = useMemo(() => ({
    crearBloque,
    actualizarBloque,
    reordenarBloques,
    duplicarBloque,
    eliminarBloque,
  }), [crearBloque, actualizarBloque, reordenarBloques, duplicarBloque, eliminarBloque]);

  // ========== CONTEXT VALUE ==========

  const value = useMemo(
    () => ({
      // Estado de la página
      paginaActiva,
      setPaginaActiva,
      mostrarCrearSitio,
      setMostrarCrearSitio,
      mostrarTemplates,
      setMostrarTemplates,
      mostrarAIWizard,
      setMostrarAIWizard,

      // Datos del sitio
      config,
      paginas,
      tiposBloques,
      isLoading,
      tieneSitio,
      estaPublicado,

      // Handlers del sitio
      handleCrearSitio,
      handlePublicar,

      // Mutations directas (para casos específicos)
      crearConfig,
      actualizarConfig,
      publicarSitio,
      crearPagina,
      actualizarPagina,
      eliminarPagina,

      // Mutations de bloques (para BlocksProvider)
      editorMutations,
    }),
    [
      paginaActiva,
      mostrarCrearSitio,
      mostrarTemplates,
      mostrarAIWizard,
      config,
      paginas,
      tiposBloques,
      isLoading,
      tieneSitio,
      estaPublicado,
      handleCrearSitio,
      handlePublicar,
      crearConfig,
      actualizarConfig,
      publicarSitio,
      crearPagina,
      actualizarPagina,
      eliminarPagina,
      editorMutations,
    ]
  );

  return (
    <SiteContext.Provider value={value}>
      {children}
    </SiteContext.Provider>
  );
}

// ========== HOOK ==========

/**
 * Hook para acceder al contexto del sitio
 * @returns {Object} Contexto del sitio
 * @throws {Error} Si se usa fuera de SiteProvider
 */
export function useSite() {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSite debe usarse dentro de un SiteProvider');
  }
  return context;
}

export default SiteContext;

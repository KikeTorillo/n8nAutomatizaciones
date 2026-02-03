/**
 * ====================================================================
 * EDITOR CONTEXT (Refactorizado)
 * ====================================================================
 *
 * Contexto wrapper que compone los 4 contextos especializados:
 * - SiteContext: config, paginas, paginaActiva, mutations
 * - LayoutContext: isMobile, showSidebar, drawer state
 * - BlocksContext: bloques, handlers CRUD/DND
 * - UIContext: modoEditor, slashMenu, autosave, shortcuts
 *
 * Mantiene backward compatibility: useEditor() retorna el mismo API.
 *
 * @version 2.0.0
 * @since 2026-02-03
 */

import { createContext, useContext, useMemo } from 'react';
import { SiteProvider, useSite } from './SiteContext';
import { LayoutProvider, useLayout } from './LayoutContext';
import { BlocksProvider, useBlocks } from './BlocksContext';
import { UIProvider, useUI } from './UIContext';

// ========== COMBINED CONTEXT ==========

const EditorContext = createContext(null);

// ========== INTERNAL PROVIDERS ==========

/**
 * Componente interno que combina BlocksProvider y UIProvider
 * Necesita acceso a SiteContext y LayoutContext
 */
function BlocksAndUIProvider({ children }) {
  const siteContext = useSite();
  const layoutContext = useLayout();

  return (
    <BlocksProvider
      paginaActiva={siteContext.paginaActiva}
      editorMutations={siteContext.editorMutations}
    >
      <UIProviderWithBlocks
        siteContext={siteContext}
        layoutContext={layoutContext}
      >
        {children}
      </UIProviderWithBlocks>
    </BlocksProvider>
  );
}

/**
 * UIProvider que tiene acceso a BlocksContext
 */
function UIProviderWithBlocks({ children, siteContext, layoutContext }) {
  const blocksContext = useBlocks();

  return (
    <UIProvider
      blocksContext={blocksContext}
      siteContext={siteContext}
      layoutContext={layoutContext}
    >
      <EditorContextCombiner>
        {children}
      </EditorContextCombiner>
    </UIProvider>
  );
}

/**
 * Combina todos los contextos en uno solo para backward compatibility
 */
function EditorContextCombiner({ children }) {
  const siteContext = useSite();
  const layoutContext = useLayout();
  const blocksContext = useBlocks();
  const uiContext = useUI();

  // Combinar todos los contextos manteniendo el mismo API que antes
  const combinedValue = useMemo(() => ({
    // ========== SITE CONTEXT ==========
    // Estado de la página
    paginaActiva: siteContext.paginaActiva,
    setPaginaActiva: siteContext.setPaginaActiva,
    mostrarCrearSitio: siteContext.mostrarCrearSitio,
    setMostrarCrearSitio: siteContext.setMostrarCrearSitio,
    mostrarTemplates: siteContext.mostrarTemplates,
    setMostrarTemplates: siteContext.setMostrarTemplates,
    mostrarAIWizard: siteContext.mostrarAIWizard,
    setMostrarAIWizard: siteContext.setMostrarAIWizard,

    // Datos del editor
    config: siteContext.config,
    paginas: siteContext.paginas,
    tiposBloques: siteContext.tiposBloques,
    isLoading: siteContext.isLoading,
    tieneSitio: siteContext.tieneSitio,
    estaPublicado: siteContext.estaPublicado,

    // Handlers de sitio
    handleCrearSitio: siteContext.handleCrearSitio,
    handlePublicar: siteContext.handlePublicar,

    // Mutations (para componentes que los necesiten directamente)
    crearConfig: siteContext.crearConfig,
    actualizarConfig: siteContext.actualizarConfig,
    publicarSitio: siteContext.publicarSitio,
    crearPagina: siteContext.crearPagina,
    actualizarPagina: siteContext.actualizarPagina,
    eliminarPagina: siteContext.eliminarPagina,

    // ========== LAYOUT CONTEXT ==========
    isMobile: layoutContext.isMobile,
    isTablet: layoutContext.isTablet,
    isDesktop: layoutContext.isDesktop,
    showSidebar: layoutContext.showSidebar,
    showSecondaryPanel: layoutContext.showSecondaryPanel,
    propertiesAsDrawer: layoutContext.propertiesAsDrawer,
    showPropertiesPanel: layoutContext.showPropertiesPanel,
    drawerAbierto: layoutContext.drawerAbierto,
    panelActivo: layoutContext.panelActivo,
    mostrarPropiedades: layoutContext.mostrarPropiedades,
    openPanel: layoutContext.openPanel,
    closeDrawer: layoutContext.closeDrawer,
    setPanelActivo: layoutContext.setPanelActivo,
    abrirPropiedades: layoutContext.abrirPropiedades,
    cerrarPropiedades: layoutContext.cerrarPropiedades,
    setMostrarPropiedades: layoutContext.setMostrarPropiedades,
    PANEL_TYPES: layoutContext.PANEL_TYPES,

    // ========== BLOCKS CONTEXT ==========
    bloques: blocksContext.bloques,
    bloqueSeleccionado: blocksContext.bloqueSeleccionado,
    bloqueSeleccionadoCompleto: blocksContext.bloqueSeleccionadoCompleto,
    bloquesLoading: blocksContext.bloquesLoading,

    // Handlers de bloques
    handleAgregarBloque: blocksContext.handleAgregarBloque,
    handleActualizarBloque: blocksContext.handleActualizarBloque,
    handleEliminarBloque: blocksContext.handleEliminarBloque,
    handleDuplicarBloque: blocksContext.handleDuplicarBloque,
    handleToggleVisibilidad: blocksContext.handleToggleVisibilidad,
    handleReordenarBloques: blocksContext.handleReordenarBloques,
    handleDropFromPalette: blocksContext.handleDropFromPalette,
    handleDndReorder: blocksContext.handleDndReorder,

    // Store actions (para casos específicos)
    seleccionarBloque: blocksContext.seleccionarBloque,
    deseleccionarBloque: blocksContext.deseleccionarBloque,

    // ========== UI CONTEXT ==========
    modoEditor: uiContext.modoEditor,
    setModoEditor: uiContext.setModoEditor,
    tourReady: uiContext.tourReady,

    // Slash menu
    slashMenu: uiContext.slashMenu,
    setSlashMenu: uiContext.setSlashMenu,
    handleSlashSelect: uiContext.handleSlashSelect,
    handleSlashClose: uiContext.handleSlashClose,

    // Autosave
    estaGuardando: uiContext.estaGuardando,
    guardarAhora: uiContext.guardarAhora,
  }), [siteContext, layoutContext, blocksContext, uiContext]);

  return (
    <EditorContext.Provider value={combinedValue}>
      {children}
    </EditorContext.Provider>
  );
}

// ========== PUBLIC PROVIDER ==========

/**
 * EditorProvider - Proveedor principal del contexto del editor
 *
 * Compone los 4 contextos especializados y mantiene backward compatibility.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes hijos
 */
export function EditorProvider({ children }) {
  return (
    <SiteProvider>
      <LayoutProvider>
        <BlocksAndUIProvider>
          {children}
        </BlocksAndUIProvider>
      </LayoutProvider>
    </SiteProvider>
  );
}

// ========== PUBLIC HOOKS ==========

/**
 * Hook para acceder al contexto del editor (combinado)
 * Mantiene backward compatibility con el API anterior.
 *
 * @returns {Object} Contexto del editor completo
 * @throws {Error} Si se usa fuera de EditorProvider
 */
export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor debe usarse dentro de un EditorProvider');
  }
  return context;
}

export default EditorContext;

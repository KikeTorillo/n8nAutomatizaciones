/**
 * ====================================================================
 * EDITOR CONTEXT (WRAPPER DE COMPATIBILIDAD)
 * ====================================================================
 *
 * Este archivo mantiene backward compatibility con el código existente.
 * Internamente usa el nuevo WebsiteEditorContext centralizado.
 *
 * @deprecated Usar WebsiteEditorProvider y useWebsiteEditorContext directamente
 * @version 3.0.0
 * @since 2026-02-04
 */

import WebsiteEditorContext, { WebsiteEditorProvider, useWebsiteEditorContext } from './WebsiteEditorContext';

// Re-export del nuevo provider y hook con aliases para compatibilidad
export const EditorProvider = WebsiteEditorProvider;
export const useEditor = useWebsiteEditorContext;

// Export del contexto para casos que lo necesiten
export const EditorContext = WebsiteEditorContext;

// Export individual hooks de sub-contextos (deprecados, usan el contexto unificado)
// Estos wrappers permiten que imports existentes sigan funcionando

/**
 * @deprecated Usar useWebsiteEditorContext directamente
 */
export function useSite() {
  const ctx = useWebsiteEditorContext();
  return {
    paginaActiva: ctx.paginaActiva,
    setPaginaActiva: ctx.setPaginaActiva,
    mostrarCrearSitio: ctx.mostrarCrearSitio,
    setMostrarCrearSitio: ctx.setMostrarCrearSitio,
    mostrarTemplates: ctx.mostrarTemplates,
    setMostrarTemplates: ctx.setMostrarTemplates,
    mostrarAIWizard: ctx.mostrarAIWizard,
    setMostrarAIWizard: ctx.setMostrarAIWizard,
    config: ctx.config,
    paginas: ctx.paginas,
    tiposBloques: ctx.tiposBloques,
    isLoading: ctx.isLoading,
    tieneSitio: ctx.tieneSitio,
    estaPublicado: ctx.estaPublicado,
    handleCrearSitio: ctx.handleCrearSitio,
    handlePublicar: ctx.handlePublicar,
    crearConfig: ctx.crearConfig,
    actualizarConfig: ctx.actualizarConfig,
    publicarSitio: ctx.publicarSitio,
    crearPagina: ctx.crearPagina,
    actualizarPagina: ctx.actualizarPagina,
    eliminarPagina: ctx.eliminarPagina,
    editorMutations: {
      crearBloque: ctx.crearBloque,
      actualizarBloque: ctx.actualizarBloque,
      reordenarBloques: ctx.reordenarBloques,
      duplicarBloque: ctx.duplicarBloque,
      eliminarBloque: ctx.eliminarBloque,
    },
  };
}

/**
 * @deprecated Usar useWebsiteEditorContext directamente
 */
export function useLayout() {
  const ctx = useWebsiteEditorContext();
  return {
    isMobile: ctx.isMobile,
    isTablet: ctx.isTablet,
    isDesktop: ctx.isDesktop,
    showSidebar: ctx.showSidebar,
    showSecondaryPanel: ctx.showSecondaryPanel,
    propertiesAsDrawer: ctx.propertiesAsDrawer,
    showPropertiesPanel: ctx.showPropertiesPanel,
    drawerAbierto: ctx.drawerAbierto,
    panelActivo: ctx.panelActivo,
    mostrarPropiedades: ctx.mostrarPropiedades,
    openPanel: ctx.openPanel,
    closeDrawer: ctx.closeDrawer,
    setPanelActivo: ctx.setPanelActivo,
    abrirPropiedades: ctx.abrirPropiedades,
    cerrarPropiedades: ctx.cerrarPropiedades,
    setMostrarPropiedades: ctx.setMostrarPropiedades,
    PANEL_TYPES: ctx.PANEL_TYPES,
  };
}

/**
 * @deprecated Usar useWebsiteEditorContext directamente
 */
export function useBlocks() {
  const ctx = useWebsiteEditorContext();
  return {
    bloques: ctx.bloques,
    bloqueSeleccionado: ctx.bloqueSeleccionado,
    bloqueSeleccionadoCompleto: ctx.bloqueSeleccionadoCompleto,
    bloquesLoading: ctx.bloquesLoading,
    handleAgregarBloque: ctx.handleAgregarBloque,
    handleActualizarBloque: ctx.handleActualizarBloque,
    handleEliminarBloque: ctx.handleEliminarBloque,
    handleDuplicarBloque: ctx.handleDuplicarBloque,
    handleToggleVisibilidad: ctx.handleToggleVisibilidad,
    handleReordenarBloques: ctx.handleReordenarBloques,
    handleDropFromPalette: ctx.handleDropFromPalette,
    handleDndReorder: ctx.handleDndReorder,
    seleccionarBloque: ctx.seleccionarBloque,
    deseleccionarBloque: ctx.deseleccionarBloque,
  };
}

/**
 * @deprecated Usar useWebsiteEditorContext directamente
 */
export function useUI() {
  const ctx = useWebsiteEditorContext();
  return {
    modoEditor: ctx.modoEditor,
    setModoEditor: ctx.setModoEditor,
    modoPreview: ctx.modoPreview,
    setModoPreview: ctx.setModoPreview,
    tourReady: ctx.tourReady,
    slashMenu: ctx.slashMenu,
    setSlashMenu: ctx.setSlashMenu,
    handleSlashSelect: ctx.handleSlashSelect,
    handleSlashClose: ctx.handleSlashClose,
    estaGuardando: ctx.estaGuardando,
    guardarAhora: ctx.guardarAhora,
  };
}

export default WebsiteEditorContext;

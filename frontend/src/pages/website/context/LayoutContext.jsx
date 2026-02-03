/**
 * ====================================================================
 * LAYOUT CONTEXT
 * ====================================================================
 *
 * Contexto para el estado de layout responsive del editor.
 * Extraído de EditorContext para reducir re-renders.
 *
 * Responsabilidades:
 * - isMobile, isTablet, isDesktop
 * - showSidebar, showSecondaryPanel, showPropertiesPanel
 * - drawerAbierto, panelActivo
 * - openPanel, closeDrawer, abrirPropiedades, cerrarPropiedades
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { createContext, useContext, useMemo } from 'react';
import { useEditorLayout, PANEL_TYPES } from '../hooks';

// ========== CONTEXT ==========

const LayoutContext = createContext(null);

// ========== PROVIDER ==========

/**
 * LayoutProvider - Proveedor del contexto de layout
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes hijos
 */
export function LayoutProvider({ children }) {
  // Hook del layout responsive
  const layout = useEditorLayout();

  // Memoizar valor del contexto
  const value = useMemo(() => ({
    // Breakpoints
    isMobile: layout.isMobile,
    isTablet: layout.isTablet,
    isDesktop: layout.isDesktop,
    layoutType: layout.layoutType,

    // Configuración de sidebar
    sidebarWidth: layout.sidebarWidth,
    showSidebar: layout.showSidebar,
    showSecondaryPanel: layout.showSecondaryPanel,

    // Configuración de propiedades
    propertiesAsDrawer: layout.propertiesAsDrawer,
    showPropertiesPanel: layout.showPropertiesPanel,

    // Estado de drawers
    drawerAbierto: layout.drawerAbierto,
    panelActivo: layout.panelActivo,
    mostrarPropiedades: layout.mostrarPropiedades,

    // Actions
    openPanel: layout.openPanel,
    closeDrawer: layout.closeDrawer,
    setPanelActivo: layout.setPanelActivo,
    togglePropiedades: layout.togglePropiedades,
    abrirPropiedades: layout.abrirPropiedades,
    cerrarPropiedades: layout.cerrarPropiedades,
    setMostrarPropiedades: layout.setMostrarPropiedades,

    // Helpers
    isDrawerOpen: layout.isDrawerOpen,

    // Constantes
    PANEL_TYPES,
  }), [layout]);

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}

// ========== HOOK ==========

/**
 * Hook para acceder al contexto de layout
 * @returns {Object} Contexto de layout
 * @throws {Error} Si se usa fuera de LayoutProvider
 */
export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout debe usarse dentro de un LayoutProvider');
  }
  return context;
}

export default LayoutContext;

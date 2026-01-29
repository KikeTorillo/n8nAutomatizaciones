/**
 * ====================================================================
 * USE EDITOR LAYOUT
 * ====================================================================
 * Hook centralizado para manejar el estado de layout responsive
 * del editor de website. Maneja breakpoints, estado de drawers
 * y helpers para navegación móvil.
 */

import { useState, useCallback, useMemo } from 'react';
import { useIsMobile, useIsTablet } from '@/hooks/utils/useMediaQuery';

/**
 * Tipos de paneles/drawers disponibles
 */
const PANEL_TYPES = {
  BLOQUES: 'bloques',
  PAGINAS: 'paginas',
  TEMA: 'tema',
  PROPIEDADES: 'propiedades',
};

/**
 * Hook para manejar el layout responsive del editor
 *
 * @returns {Object} Estado y helpers del layout
 */
export function useEditorLayout() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = !isTablet;

  // Estado del drawer abierto (solo uno a la vez en móvil)
  const [drawerAbierto, setDrawerAbierto] = useState(null);

  // Panel activo en sidebar desktop (no drawer)
  const [panelActivo, setPanelActivo] = useState(PANEL_TYPES.BLOQUES);

  // Estado de propiedades visible (solo desktop)
  const [mostrarPropiedades, setMostrarPropiedades] = useState(true);

  /**
   * Abre un panel/drawer
   * En móvil: abre el drawer correspondiente
   * En desktop: cambia el panel activo del sidebar
   */
  const openPanel = useCallback((tipo) => {
    if (isMobile || (isTablet && tipo === PANEL_TYPES.PROPIEDADES)) {
      // En móvil o tablet (para propiedades), usar drawer
      setDrawerAbierto(tipo);
    } else {
      // En desktop, cambiar panel del sidebar
      setPanelActivo(tipo);
    }
  }, [isMobile, isTablet]);

  /**
   * Cierra el drawer actualmente abierto
   */
  const closeDrawer = useCallback(() => {
    setDrawerAbierto(null);
  }, []);

  /**
   * Toggle del panel de propiedades
   * En móvil/tablet: abre/cierra drawer
   * En desktop: muestra/oculta panel lateral
   */
  const togglePropiedades = useCallback(() => {
    if (isMobile || isTablet) {
      setDrawerAbierto(prev =>
        prev === PANEL_TYPES.PROPIEDADES ? null : PANEL_TYPES.PROPIEDADES
      );
    } else {
      setMostrarPropiedades(prev => !prev);
    }
  }, [isMobile, isTablet]);

  /**
   * Abre el panel de propiedades (al seleccionar un bloque)
   */
  const abrirPropiedades = useCallback(() => {
    if (isMobile || isTablet) {
      setDrawerAbierto(PANEL_TYPES.PROPIEDADES);
    } else {
      setMostrarPropiedades(true);
    }
  }, [isMobile, isTablet]);

  /**
   * Cierra el panel de propiedades
   */
  const cerrarPropiedades = useCallback(() => {
    if (isMobile || isTablet) {
      if (drawerAbierto === PANEL_TYPES.PROPIEDADES) {
        setDrawerAbierto(null);
      }
    } else {
      setMostrarPropiedades(false);
    }
  }, [isMobile, isTablet, drawerAbierto]);

  /**
   * Comprueba si un drawer específico está abierto
   */
  const isDrawerOpen = useCallback((tipo) => {
    return drawerAbierto === tipo;
  }, [drawerAbierto]);

  /**
   * Valores memorizados del layout
   */
  const layout = useMemo(() => ({
    // Breakpoints
    isMobile,
    isTablet,
    isDesktop,

    // Tipo de layout para el editor
    // 'mobile': FAB + drawers full-screen
    // 'tablet': sidebar colapsado + drawer propiedades
    // 'desktop': sidebar completo + panel propiedades
    layoutType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',

    // Configuración de sidebar
    sidebarWidth: isMobile ? 0 : isTablet ? 56 : 72, // w-0, w-14, w-72
    showSidebar: !isMobile,
    showSecondaryPanel: isDesktop,

    // Configuración de propiedades
    propertiesAsDrawer: isMobile || isTablet,
    showPropertiesPanel: isDesktop && mostrarPropiedades,
  }), [isMobile, isTablet, isDesktop, mostrarPropiedades]);

  return {
    // Layout info
    ...layout,

    // Estado de drawers
    drawerAbierto,
    panelActivo,
    mostrarPropiedades,

    // Actions
    openPanel,
    closeDrawer,
    setPanelActivo,
    togglePropiedades,
    abrirPropiedades,
    cerrarPropiedades,
    setMostrarPropiedades,

    // Helpers
    isDrawerOpen,

    // Constantes
    PANEL_TYPES,
  };
}

export { PANEL_TYPES };
export default useEditorLayout;

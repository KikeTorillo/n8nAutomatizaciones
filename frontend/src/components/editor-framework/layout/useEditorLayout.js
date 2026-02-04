/**
 * ====================================================================
 * USE EDITOR LAYOUT (FRAMEWORK)
 * ====================================================================
 * Hook centralizado y configurable para manejar el estado de layout
 * responsive de editores. Maneja breakpoints, estado de drawers
 * y helpers para navegación móvil.
 *
 * Usado por: Website Builder, Editor de Invitaciones
 *
 * @version 2.0.0
 * @since 2026-02-04
 */

import { useState, useCallback, useMemo } from 'react';
import { useIsMobile, useIsTablet } from '@/hooks/utils/useMediaQuery';

/**
 * Tipos de paneles/drawers predefinidos
 */
const DEFAULT_PANEL_TYPES = {
  BLOQUES: 'bloques',
  PROPIEDADES: 'propiedades',
};

/**
 * Hook configurable para manejar el layout responsive del editor
 *
 * @param {Object} config - Configuración del layout
 * @param {string[]} config.panels - Lista de paneles disponibles ['bloques', 'propiedades', ...]
 * @param {string} config.defaultPanel - Panel activo por defecto
 * @param {Object} config.customPanelTypes - Tipos de panel adicionales { PAGINAS: 'paginas', ... }
 * @returns {Object} Estado y helpers del layout
 *
 * @example
 * // Invitaciones (simple)
 * const layout = useEditorLayout({
 *   panels: ['bloques', 'propiedades'],
 * });
 *
 * @example
 * // Website (completo)
 * const layout = useEditorLayout({
 *   panels: ['bloques', 'paginas', 'tema', 'propiedades'],
 *   defaultPanel: 'bloques',
 *   customPanelTypes: { PAGINAS: 'paginas', TEMA: 'tema' },
 * });
 */
export function useEditorLayout(config = {}) {
  const {
    panels = ['bloques', 'propiedades'],
    defaultPanel = 'bloques',
    customPanelTypes = {},
  } = config;

  // Combinar tipos de panel predefinidos con custom
  const PANEL_TYPES = useMemo(
    () => ({
      ...DEFAULT_PANEL_TYPES,
      ...customPanelTypes,
    }),
    [customPanelTypes]
  );

  // Detección de breakpoints
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = !isTablet;

  // Estado del drawer abierto (solo uno a la vez en móvil/tablet)
  const [drawerAbierto, setDrawerAbierto] = useState(null);

  // Panel activo en sidebar desktop (no drawer)
  const [panelActivo, setPanelActivo] = useState(defaultPanel);

  // Estado de propiedades visible (solo desktop)
  const [mostrarPropiedades, setMostrarPropiedades] = useState(true);

  /**
   * Abre un panel/drawer
   * En móvil/tablet: abre el drawer correspondiente
   * En desktop: cambia el panel activo del sidebar
   */
  const openPanel = useCallback(
    (tipo) => {
      if (isMobile || isTablet) {
        // En móvil y tablet, usar drawer para todos los paneles
        setDrawerAbierto(tipo);
      } else {
        // En desktop, cambiar panel del sidebar (excepto propiedades)
        if (tipo !== PANEL_TYPES.PROPIEDADES) {
          setPanelActivo(tipo);
        }
      }
    },
    [isMobile, isTablet, PANEL_TYPES.PROPIEDADES]
  );

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
      setDrawerAbierto((prev) =>
        prev === PANEL_TYPES.PROPIEDADES ? null : PANEL_TYPES.PROPIEDADES
      );
    } else {
      setMostrarPropiedades((prev) => !prev);
    }
  }, [isMobile, isTablet, PANEL_TYPES.PROPIEDADES]);

  /**
   * Abre el panel de propiedades (al seleccionar un bloque)
   */
  const abrirPropiedades = useCallback(() => {
    if (isMobile || isTablet) {
      setDrawerAbierto(PANEL_TYPES.PROPIEDADES);
    } else {
      setMostrarPropiedades(true);
    }
  }, [isMobile, isTablet, PANEL_TYPES.PROPIEDADES]);

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
  }, [isMobile, isTablet, drawerAbierto, PANEL_TYPES.PROPIEDADES]);

  /**
   * Comprueba si un drawer específico está abierto
   */
  const isDrawerOpen = useCallback(
    (tipo) => {
      return drawerAbierto === tipo;
    },
    [drawerAbierto]
  );

  /**
   * Valores memorizados del layout
   */
  const layout = useMemo(
    () => ({
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
      sidebarWidth: isMobile ? 0 : isTablet ? 56 : 256, // w-0, w-14, w-64
      showSidebar: !isMobile,
      showSecondaryPanel: isDesktop,

      // Configuración de propiedades
      propertiesAsDrawer: isMobile || isTablet,
      showPropertiesPanel: isDesktop && mostrarPropiedades,

      // Paneles disponibles
      panels,
    }),
    [isMobile, isTablet, isDesktop, mostrarPropiedades, panels]
  );

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

export { DEFAULT_PANEL_TYPES as PANEL_TYPES };
export default useEditorLayout;

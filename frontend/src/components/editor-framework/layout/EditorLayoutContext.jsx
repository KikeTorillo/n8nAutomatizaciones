/* eslint-disable react-refresh/only-export-components */
/**
 * ====================================================================
 * EDITOR LAYOUT CONTEXT
 * ====================================================================
 * Contexto para compartir el estado de layout responsive entre
 * componentes del editor. Permite que FAB, Drawers y Paneles
 * accedan al estado de layout sin prop drilling.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { createContext, useContext, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { useEditorLayout } from './useEditorLayout';

// Crear contexto
const EditorLayoutContext = createContext(null);

/**
 * Provider del layout del editor
 *
 * @param {Object} props
 * @param {ReactNode} props.children - Contenido del editor
 * @param {string[]} props.panels - Paneles disponibles ['bloques', 'propiedades', ...]
 * @param {string} props.defaultPanel - Panel activo por defecto
 * @param {Object} props.customPanelTypes - Tipos de panel adicionales
 *
 * @example
 * // Invitaciones
 * <EditorLayoutProvider panels={['bloques', 'propiedades']}>
 *   <InvitacionEditor />
 * </EditorLayoutProvider>
 *
 * @example
 * // Website
 * <EditorLayoutProvider
 *   panels={['bloques', 'paginas', 'tema', 'propiedades']}
 *   customPanelTypes={{ PAGINAS: 'paginas', TEMA: 'tema' }}
 * >
 *   <WebsiteEditor />
 * </EditorLayoutProvider>
 */
function EditorLayoutProvider({
  children,
  panels = ['bloques', 'propiedades'],
  defaultPanel = 'bloques',
  customPanelTypes = {},
}) {
  // Usar el hook de layout con la configuración
  const layoutState = useEditorLayout({
    panels,
    defaultPanel,
    customPanelTypes,
  });

  // Memorizar el valor del contexto
  const contextValue = useMemo(() => layoutState, [layoutState]);

  return (
    <EditorLayoutContext.Provider value={contextValue}>
      {children}
    </EditorLayoutContext.Provider>
  );
}

EditorLayoutProvider.propTypes = {
  children: PropTypes.node.isRequired,
  panels: PropTypes.arrayOf(PropTypes.string),
  defaultPanel: PropTypes.string,
  customPanelTypes: PropTypes.object,
};

/**
 * Hook para consumir el contexto de layout
 *
 * @returns {Object} Estado y helpers del layout
 * @throws {Error} Si se usa fuera de EditorLayoutProvider
 *
 * @example
 * function MiComponente() {
 *   const { isMobile, showSidebar, openPanel, closeDrawer } = useEditorLayoutContext();
 *   // ...
 * }
 */
export function useEditorLayoutContext() {
  const context = useContext(EditorLayoutContext);

  if (!context) {
    throw new Error(
      'useEditorLayoutContext debe usarse dentro de un EditorLayoutProvider'
    );
  }

  return context;
}

/**
 * HOC para inyectar el contexto de layout a un componente
 * Útil para componentes de clase o cuando se necesita el layout como prop
 *
 * @param {React.Component} Component - Componente a envolver
 * @returns {React.Component} Componente con layout inyectado
 */
export function withEditorLayout(Component) {
  const WrappedComponent = memo(function WithEditorLayout(props) {
    const layout = useEditorLayoutContext();
    return <Component {...props} layout={layout} />;
  });

  WrappedComponent.displayName = `withEditorLayout(${
    Component.displayName || Component.name || 'Component'
  })`;

  return WrappedComponent;
}

export { EditorLayoutProvider, EditorLayoutContext };
export default EditorLayoutProvider;

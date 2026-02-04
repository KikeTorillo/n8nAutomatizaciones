/**
 * ====================================================================
 * EDITOR DRAWER
 * ====================================================================
 * Wrapper de Drawer que se integra con EditorLayoutContext.
 * Solo se renderiza cuando el drawer correspondiente está abierto.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo } from 'react';
import PropTypes from 'prop-types';
import { Drawer } from '@/components/ui';
import { useEditorLayoutContext } from './EditorLayoutContext';

/**
 * EditorDrawer - Drawer que usa el contexto de layout
 *
 * @param {Object} props
 * @param {string} props.panelType - Tipo de panel ('bloques', 'propiedades', etc.)
 * @param {string} props.title - Título del drawer
 * @param {string} props.subtitle - Subtítulo opcional
 * @param {ReactNode} props.children - Contenido del drawer
 * @param {string} props.size - Tamaño del drawer ('sm'|'md'|'lg'|'xl'|'full')
 * @param {boolean} props.showCloseButton - Mostrar botón de cerrar
 * @param {function} props.onClose - Callback adicional al cerrar
 *
 * @example
 * // Drawer de bloques
 * <EditorDrawer panelType="bloques" title="Agregar bloque">
 *   <BlockPalette onAdd={handleAdd} />
 * </EditorDrawer>
 *
 * @example
 * // Drawer de propiedades con callback
 * <EditorDrawer
 *   panelType="propiedades"
 *   title="Propiedades"
 *   showCloseButton
 *   onClose={handleDeselect}
 * >
 *   <PropertiesPanel bloque={bloque} />
 * </EditorDrawer>
 */
function EditorDrawer({
  panelType,
  title,
  subtitle,
  children,
  size = 'lg',
  showCloseButton = false,
  onClose: onCloseCallback,
}) {
  const { drawerAbierto, closeDrawer, propertiesAsDrawer } =
    useEditorLayoutContext();

  // Determinar si este drawer debe mostrarse
  const isOpen = drawerAbierto === panelType;

  // Para propiedades, solo mostrar si propertiesAsDrawer es true
  if (panelType === 'propiedades' && !propertiesAsDrawer) {
    return null;
  }

  const handleClose = () => {
    closeDrawer();
    onCloseCallback?.();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      subtitle={subtitle}
      size={size}
      showCloseButton={showCloseButton}
    >
      {children}
    </Drawer>
  );
}

EditorDrawer.propTypes = {
  /** Tipo de panel que controla este drawer */
  panelType: PropTypes.string.isRequired,
  /** Título del drawer */
  title: PropTypes.string,
  /** Subtítulo opcional */
  subtitle: PropTypes.string,
  /** Contenido del drawer */
  children: PropTypes.node,
  /** Tamaño del drawer */
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
  /** Mostrar botón de cerrar */
  showCloseButton: PropTypes.bool,
  /** Callback adicional al cerrar */
  onClose: PropTypes.func,
};

export default memo(EditorDrawer);

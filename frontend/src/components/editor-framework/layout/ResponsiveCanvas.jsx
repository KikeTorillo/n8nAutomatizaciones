/**
 * ====================================================================
 * RESPONSIVE CANVAS
 * ====================================================================
 * Wrapper de canvas que ajusta el ancho según breakpoint.
 * Proporciona una transición suave entre tamaños.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo } from 'react';
import { useCanvasBreakpoint } from '../hooks/useCanvasBreakpoint';

/**
 * ResponsiveCanvas - Canvas responsive según breakpoint
 *
 * @param {Object} props
 * @param {string} props.breakpoint - 'desktop' | 'tablet' | 'mobile'
 * @param {React.ReactNode} props.children - Contenido del canvas
 * @param {string} props.className - Clases adicionales
 * @param {Object} props.style - Estilos adicionales
 */
function ResponsiveCanvas({ breakpoint = 'desktop', children, className = '', style = {} }) {
  const { width } = useCanvasBreakpoint(breakpoint);

  return (
    <div
      className={`mx-auto transition-all duration-300 ease-in-out ${className}`}
      style={{
        maxWidth: width,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default memo(ResponsiveCanvas);

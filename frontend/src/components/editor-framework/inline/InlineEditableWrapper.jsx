/**
 * ====================================================================
 * INLINE EDITABLE WRAPPER
 * ====================================================================
 * Wrapper para hacer cualquier elemento editable inline.
 * Usado para envolver elementos del canvas.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';

/**
 * Wrapper para hacer cualquier elemento editable inline
 * Usado para envolver elementos del canvas
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenido a mostrar cuando no edita
 * @param {boolean} props.isEditing - Si está en modo edición
 * @param {Function} props.onStartEdit - Callback al iniciar edición (doble click)
 * @param {Function} props.onStopEdit - Callback al terminar edición
 * @param {React.ReactNode} props.editComponent - Componente de edición
 * @param {string} props.className - Clases adicionales
 */
export const InlineEditableWrapper = memo(function InlineEditableWrapper({
  children,
  isEditing,
  onStartEdit,
  onStopEdit,
  editComponent,
  className,
}) {
  const handleDoubleClick = useCallback(
    (e) => {
      e.stopPropagation();
      onStartEdit?.();
    },
    [onStartEdit]
  );

  const handleBlur = useCallback(
    (e) => {
      // Solo si el foco sale del contenedor
      if (!e.currentTarget.contains(e.relatedTarget)) {
        onStopEdit?.();
      }
    },
    [onStopEdit]
  );

  if (isEditing) {
    return (
      <div className={className} onBlur={handleBlur}>
        {editComponent}
      </div>
    );
  }

  return (
    <div
      className={cn('cursor-text', className)}
      onDoubleClick={handleDoubleClick}
    >
      {children}
    </div>
  );
});

export default InlineEditableWrapper;

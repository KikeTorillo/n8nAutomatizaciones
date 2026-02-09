import { useState, useRef, useCallback, useEffect, memo, forwardRef, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface PopoverProps {
  /** Elemento que dispara el popover (click) */
  trigger: ReactNode;
  /** Contenido del popover */
  content: ReactNode;
  /** Posición relativa al trigger */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Offset en px desde el trigger */
  offset?: number;
  /** Clases CSS para el contenedor del popover */
  className?: string;
  /** Clases CSS para el contenido */
  contentClassName?: string;
}

const PLACEMENT_STYLES: Record<string, (rect: DOMRect, offset: number) => { top: number; left: number }> = {
  bottom: (rect, offset) => ({
    top: rect.bottom + offset,
    left: rect.left + rect.width / 2,
  }),
  top: (rect, offset) => ({
    top: rect.top - offset,
    left: rect.left + rect.width / 2,
  }),
  left: (rect, offset) => ({
    top: rect.top + rect.height / 2,
    left: rect.left - offset,
  }),
  right: (rect, offset) => ({
    top: rect.top + rect.height / 2,
    left: rect.right + offset,
  }),
};

const TRANSFORM: Record<string, string> = {
  bottom: 'translate(-50%, 0)',
  top: 'translate(-50%, -100%)',
  left: 'translate(-100%, -50%)',
  right: 'translate(0, -50%)',
};

/**
 * Popover - Contenido flotante activado por click
 *
 * Usa posicionamiento CSS (sin @floating-ui).
 * Se cierra al hacer click fuera o al presionar Escape.
 *
 * @example
 * <Popover
 *   trigger={<Button>Opciones</Button>}
 *   content={<div className="p-4">Contenido del popover</div>}
 *   placement="bottom"
 * />
 */
const Popover = memo(forwardRef<HTMLDivElement, PopoverProps>(function Popover(
  {
    trigger,
    content,
    placement = 'bottom',
    offset = 8,
    className,
    contentClassName,
  },
  ref
) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();
  const rafRef = useRef<number>(0);

  const updatePosition = useCallback(() => {
    const triggerEl = triggerRef.current;
    if (!triggerEl) return;

    const rect = triggerEl.getBoundingClientRect();
    const calcPosition = PLACEMENT_STYLES[placement] || PLACEMENT_STYLES.bottom;
    setPosition(calcPosition(rect, offset));
  }, [placement, offset]);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => {
      if (!prev) {
        // Calcular posición al abrir
        requestAnimationFrame(updatePosition);
      }
      return !prev;
    });
  }, [updatePosition]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Cerrar al click fuera
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        handleClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleClose]);

  // Actualizar posición en scroll/resize (debounced con rAF)
  useEffect(() => {
    if (!isOpen) return;

    const debouncedUpdate = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('scroll', debouncedUpdate, true);
    window.addEventListener('resize', debouncedUpdate);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('scroll', debouncedUpdate, true);
      window.removeEventListener('resize', debouncedUpdate);
    };
  }, [isOpen, updatePosition]);

  return (
    <div ref={ref} className={cn('inline-block', className)}>
      <div
        ref={triggerRef}
        onClick={handleToggle}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={popoverId}
      >
        {trigger}
      </div>
      {isOpen && createPortal(
        <div
          ref={popoverRef}
          id={popoverId}
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            transform: TRANSFORM[placement],
            zIndex: 50,
          }}
          className={cn(
            'bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700',
            'animate-in fade-in-0 zoom-in-95 duration-150',
            contentClassName,
          )}
        >
          {content}
        </div>,
        document.body
      )}
    </div>
  );
}));

Popover.displayName = 'Popover';

export { Popover };

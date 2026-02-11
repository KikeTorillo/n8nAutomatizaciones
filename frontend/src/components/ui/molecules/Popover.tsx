import {
  useState,
  useRef,
  useCallback,
  memo,
  forwardRef,
  useId,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/cn';
import {
  useFloatingPosition,
  type Placement,
} from '../hooks/useFloatingPosition';
import { useFloatingDismiss } from '../hooks/useFloatingDismiss';

export interface PopoverProps {
  /** Elemento que dispara el popover (click) */
  trigger: ReactNode;
  /** Contenido del popover */
  content: ReactNode;
  /** Posicion relativa al trigger */
  placement?: Placement;
  /** Offset en px desde el trigger */
  offset?: number;
  /** Clases CSS para el contenedor del popover */
  className?: string;
  /** Clases CSS para el contenido */
  contentClassName?: string;
}

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
const Popover = memo(
  forwardRef<HTMLDivElement, PopoverProps>(function Popover(
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
    const triggerRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const popoverId = useId();

    const { position, transform, updatePosition } = useFloatingPosition(
      triggerRef,
      {
        placement,
        offset,
        enabled: isOpen,
      }
    );

    const handleClose = useCallback(() => {
      setIsOpen(false);
    }, []);

    useFloatingDismiss(handleClose, {
      enabled: isOpen,
      excludeRefs: [triggerRef, popoverRef],
    });

    const handleToggle = useCallback(() => {
      setIsOpen((prev) => {
        if (!prev) {
          requestAnimationFrame(updatePosition);
        }
        return !prev;
      });
    }, [updatePosition]);

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
        {isOpen &&
          createPortal(
            <div
              ref={popoverRef}
              id={popoverId}
              role="dialog"
              aria-modal="true"
              style={{
                position: 'fixed',
                top: position.top,
                left: position.left,
                transform,
                zIndex: 50,
              }}
              className={cn(
                'bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700',
                'animate-in fade-in-0 zoom-in-95 duration-150',
                contentClassName
              )}
            >
              {content}
            </div>,
            document.body
          )}
      </div>
    );
  })
);

Popover.displayName = 'Popover';

export { Popover };

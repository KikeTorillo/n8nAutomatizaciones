import { memo, useId, useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface TooltipProps {
  /** Contenido del tooltip */
  content: ReactNode;
  /** Posición del tooltip */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay en ms antes de mostrar */
  delay?: number;
  /** Elemento que activa el tooltip */
  children: ReactNode;
  /** Clases CSS adicionales para el tooltip */
  className?: string;
}

const PORTAL_TRANSFORMS = {
  top: '-translate-x-1/2 -translate-y-full',
  bottom: '-translate-x-1/2',
  left: '-translate-y-1/2 -translate-x-full',
  right: '-translate-y-1/2',
} as const;

const OFFSET = 8; // px de separación del trigger

/**
 * Tooltip - Tooltip accesible con portal y soporte de teclado
 */
const Tooltip = memo(function Tooltip({
  content,
  position = 'top',
  delay = 200,
  children,
  className,
}: TooltipProps) {
  const tooltipId = useId();
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Escape key para cerrar
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setVisible(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible]);

  // Calcular posición cuando se muestra
  useEffect(() => {
    if (!visible || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top - OFFSET;
        left = rect.left + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + OFFSET;
        left = rect.left + rect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - OFFSET;
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + OFFSET;
        break;
    }

    setCoords({ top, left });
  }, [visible, position]);

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setVisible(false);
  }, []);

  return (
    <div
      className="inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      ref={triggerRef}
    >
      <div aria-describedby={visible ? tooltipId : undefined}>
        {children}
      </div>
      {visible && createPortal(
        <div
          id={tooltipId}
          role="tooltip"
          style={{ position: 'fixed', top: coords.top, left: coords.left }}
          className={cn(
            'z-[9999] px-2 py-1 text-xs font-medium',
            'text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900',
            'rounded shadow-sm whitespace-nowrap pointer-events-none',
            PORTAL_TRANSFORMS[position],
            className
          )}
        >
          {content}
        </div>,
        document.body
      )}
    </div>
  );
});

Tooltip.displayName = 'Tooltip';

export { Tooltip };

import {
  memo,
  useId,
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/cn';
import { useCombineRefs } from '../hooks/useCombineRefs';
import {
  useFloatingPosition,
  type Placement,
} from '../hooks/useFloatingPosition';
import { useEscapeKey } from '../hooks/useEscapeKey';

export interface TooltipProps {
  /** Contenido del tooltip */
  content: ReactNode;
  /** Posicion del tooltip */
  position?: Placement;
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

const OFFSET = 8;

/**
 * Tooltip - Tooltip accesible con portal y soporte de teclado
 */
const Tooltip = memo(
  forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(
    {
      content,
      position = 'top',
      delay = 200,
      children,
      className,
    }: TooltipProps,
    ref
  ) {
    const tooltipId = useId();
    const [visible, setVisible] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [triggerRef, setRefs] = useCombineRefs<HTMLDivElement>(ref);

    const { position: coords } = useFloatingPosition(triggerRef, {
      placement: position,
      offset: OFFSET,
      enabled: visible,
    });

    // Limpiar timeout al desmontar
    useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, []);

    // Escape key para cerrar
    const handleEscape = useCallback(() => {
      setVisible(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }, []);
    useEscapeKey(handleEscape, visible);

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
        ref={setRefs}
      >
        <div aria-describedby={visible ? tooltipId : undefined}>{children}</div>
        {visible &&
          createPortal(
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
  })
);

Tooltip.displayName = 'Tooltip';

export { Tooltip };

import { memo, useId, useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
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

const POSITION_CLASSES = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
} as const;

/**
 * Tooltip - Tooltip accesible con CSS puro
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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

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
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <div aria-describedby={visible ? tooltipId : undefined}>
        {children}
      </div>
      {visible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={cn(
            'absolute z-50 px-2 py-1 text-xs font-medium',
            'text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900',
            'rounded shadow-sm whitespace-nowrap pointer-events-none',
            POSITION_CLASSES[position],
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
});

Tooltip.displayName = 'Tooltip';

export { Tooltip };

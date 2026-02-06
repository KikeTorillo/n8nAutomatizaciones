import { memo } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SPINNER_SIZES,
  SEMANTIC_COLORS,
  getLoadingAriaLabel,
} from '@/lib/uiConstants';
import type { UISize } from '@/types/ui';

export interface LoadingSpinnerProps {
  /** Tamaño del spinner */
  size?: UISize;
  /** Clases adicionales para el icono */
  className?: string;
  /** Clases adicionales para el wrapper div contenedor */
  wrapperClassName?: string;
  /** Texto opcional visible debajo del spinner */
  text?: string;
  /** Label para screen readers (usa text si no se provee) */
  'aria-label'?: string;
}

/**
 * LoadingSpinner - Indicador de carga accesible
 *
 * @example
 * <LoadingSpinner size="md" text="Cargando datos..." />
 */
const LoadingSpinner = memo(function LoadingSpinner({
  size = 'md',
  className,
  wrapperClassName,
  text,
  'aria-label': ariaLabel,
}: LoadingSpinnerProps) {
  const label = ariaLabel || getLoadingAriaLabel(text);

  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3", wrapperClassName)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <Loader2
        className={cn(
          'animate-spin',
          SEMANTIC_COLORS.primary.text,
          (SPINNER_SIZES as Record<string, string>)[size] || SPINNER_SIZES.md,
          className
        )}
        aria-hidden="true"
      />
      {text && <p className={cn('text-sm', SEMANTIC_COLORS.neutral.text)}>{text}</p>}
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export { LoadingSpinner };

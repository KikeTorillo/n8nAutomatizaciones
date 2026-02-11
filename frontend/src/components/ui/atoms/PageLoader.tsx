import { memo, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/cn';
import {
  SPINNER_SIZES,
  SEMANTIC_COLORS,
  getLoadingAriaLabel,
} from '../constants';
import type { UISize } from '../types';

export interface PageLoaderProps {
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
 * PageLoader - Indicador de carga a nivel de página, accesible
 *
 * Usa Spinner para indicadores inline en botones/badges.
 *
 * @example
 * <PageLoader size="md" text="Cargando datos..." />
 */
const PageLoader = memo(
  forwardRef<HTMLDivElement, PageLoaderProps>(function PageLoader(
    { size = 'md', className, wrapperClassName, text, 'aria-label': ariaLabel },
    ref
  ) {
    const label = ariaLabel || getLoadingAriaLabel(text);

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center gap-3',
          wrapperClassName
        )}
        role="status"
        aria-live="polite"
        aria-label={label}
      >
        <Loader2
          className={cn(
            'animate-spin',
            SEMANTIC_COLORS.primary.text,
            SPINNER_SIZES[size] || SPINNER_SIZES.md,
            className
          )}
          aria-hidden="true"
        />
        {text && (
          <p className={cn('text-sm', SEMANTIC_COLORS.neutral.text)}>{text}</p>
        )}
      </div>
    );
  })
);

PageLoader.displayName = 'PageLoader';

export { PageLoader };

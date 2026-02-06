import { memo, type SVGProps } from 'react';
import { cn } from '@/lib/utils';
import { ICON_SIZES } from '@/lib/uiConstants';
import type { ExtendedSize } from '@/types/ui';

export interface SpinnerProps extends SVGProps<SVGSVGElement> {
  /** Tamaño del spinner */
  size?: ExtendedSize;
  /** Clases adicionales */
  className?: string;
}

/**
 * Spinner - Indicador de carga SVG reutilizable
 *
 * @example
 * // Uso básico
 * <Spinner size="md" />
 *
 * @example
 * // Con color personalizado
 * <Spinner size="sm" className="text-primary-500" />
 */
const Spinner = memo(function Spinner({
  size = 'md',
  className,
  ...props
}: SpinnerProps) {
  return (
    <svg
      className={cn(ICON_SIZES[size] || ICON_SIZES.md, 'animate-spin', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
});

Spinner.displayName = 'Spinner';

export { Spinner };

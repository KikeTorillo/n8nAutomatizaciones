import { memo, forwardRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { BADGE_VARIANTS, BADGE_SIZES, normalizeVariant } from '../constants';
import type { BadgeVariantWithAliases, UISize } from '../types';

export interface BadgeProps {
  /** Variante de color del badge */
  variant?: BadgeVariantWithAliases;
  /** Tamaño del badge */
  size?: UISize;
  /** Icono a mostrar antes del texto */
  icon?: ReactNode;
  /** Contenido del badge */
  children: ReactNode;
  /** Clases CSS adicionales */
  className?: string;
  /** Label para accesibilidad */
  'aria-label'?: string;
}

/**
 * Badge - Componente de etiqueta/badge
 */
const Badge = memo(
  forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
    {
      variant = 'default',
      size = 'md',
      icon,
      children,
      className = '',
      'aria-label': ariaLabel,
    },
    ref
  ) {
    const normalizedVariant = normalizeVariant(variant);

    return (
      <span
        ref={ref}
        role="status"
        aria-label={ariaLabel}
        className={cn(
          'inline-flex items-center gap-1 font-medium rounded-full',
          BADGE_VARIANTS[normalizedVariant] || BADGE_VARIANTS.default,
          BADGE_SIZES[size] || BADGE_SIZES.md,
          className
        )}
      >
        {icon && (
          <span className="inline-flex" aria-hidden="true">
            {icon}
          </span>
        )}
        {children}
      </span>
    );
  })
);

Badge.displayName = 'Badge';

export { Badge };

import { memo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { BADGE_VARIANTS, BADGE_SIZES } from '@/lib/uiConstants';
import type { BadgeVariantWithAliases, UISize } from '@/types/ui';

export interface BadgeProps {
  /** Variante de color del badge */
  variant?: BadgeVariantWithAliases;
  /** Tamaño del badge */
  size?: UISize;
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
const Badge = memo(function Badge({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  'aria-label': ariaLabel,
}: BadgeProps) {
  // Normalizar 'error' a 'danger' para compatibilidad
  const normalizedVariant = variant === 'error' ? 'danger' : variant;

  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full',
        BADGE_VARIANTS[normalizedVariant] || BADGE_VARIANTS.default,
        BADGE_SIZES[size] || BADGE_SIZES.md,
        className
      )}
    >
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

export { Badge };

import { memo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { BADGE_VARIANTS, BADGE_SIZES } from '@/lib/uiConstants';

/**
 * Badge - Componente de etiqueta/badge
 *
 * @param {string} variant - default, primary, success, warning, error, info
 * @param {string} size - sm, md, lg
 * @param {ReactNode} children - Content
 * @param {string} className - Additional classes
 */
const Badge = memo(function Badge({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  'aria-label': ariaLabel,
}) {
  return (
    <span
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full',
        BADGE_VARIANTS[variant] || BADGE_VARIANTS.default,
        BADGE_SIZES[size] || BADGE_SIZES.md,
        className
      )}
    >
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

Badge.propTypes = {
  /** Variante de color del badge */
  variant: PropTypes.oneOf(['default', 'primary', 'success', 'warning', 'danger', 'error', 'info']),
  /** Tamaño del badge */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Contenido del badge */
  children: PropTypes.node.isRequired,
  /** Clases CSS adicionales */
  className: PropTypes.string,
  /** Label para accesibilidad */
  'aria-label': PropTypes.string,
};

export { Badge };

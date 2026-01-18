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
function Badge({
  variant = 'default',
  size = 'md',
  children,
  className = '',
}) {
  return (
    <span
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
}

export default Badge;

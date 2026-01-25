import { memo } from 'react';
import PropTypes from 'prop-types';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SPINNER_SIZES, SEMANTIC_COLORS, ARIA_ROLES, ARIA_LIVE, getLoadingAriaLabel } from '@/lib/uiConstants';

/**
 * LoadingSpinner - Indicador de carga accesible
 *
 * @component
 * @example
 * <LoadingSpinner size="md" text="Cargando datos..." />
 *
 * @param {Object} props
 * @param {'sm'|'md'|'lg'|'xl'} [props.size='md'] - Tamaño del spinner
 * @param {string} [props.className] - Clases adicionales para el icono
 * @param {string} [props.text] - Texto opcional visible debajo del spinner
 * @param {string} [props['aria-label']] - Label para screen readers (usa text si no se provee)
 * @returns {React.ReactElement}
 */
const LoadingSpinner = memo(function LoadingSpinner({
  size = 'md',
  className,
  text,
  'aria-label': ariaLabel,
}) {
  const label = ariaLabel || getLoadingAriaLabel(text);

  return (
    <div
      className="flex flex-col items-center justify-center gap-3"
      role={ARIA_ROLES.status}
      aria-live={ARIA_LIVE.polite}
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
});

LoadingSpinner.displayName = 'LoadingSpinner';

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
  text: PropTypes.string,
  'aria-label': PropTypes.string,
};

export { LoadingSpinner };
export default LoadingSpinner;

import { memo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { ICON_SIZES } from '@/lib/uiConstants';

/**
 * Spinner - Indicador de carga SVG reutilizable
 *
 * @component
 * @example
 * // Uso básico
 * <Spinner size="md" />
 *
 * @example
 * // Con color personalizado
 * <Spinner size="sm" className="text-primary-500" />
 *
 * @param {Object} props
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} [props.size='md'] - Tamaño del spinner
 * @param {string} [props.className] - Clases adicionales
 * @returns {React.ReactElement}
 */
const Spinner = memo(function Spinner({
  size = 'md',
  className,
  ...props
}) {
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

Spinner.propTypes = {
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
};

export { Spinner };

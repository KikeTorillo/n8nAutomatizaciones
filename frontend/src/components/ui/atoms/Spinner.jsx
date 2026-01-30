import { memo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';

/**
 * Tamaños del spinner
 * Ene 2026: Extraído de ToggleSwitch y LoadingSpinner para reutilización
 */
const SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

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
      className={cn(SIZES[size] || SIZES.md, 'animate-spin', className)}
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

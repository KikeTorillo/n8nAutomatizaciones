import { forwardRef, memo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { BUTTON_VARIANTS, BUTTON_SIZES, FOCUS_STATES } from '@/lib/uiConstants';

/**
 * Componente Button reutilizable
 * Soporta variantes, tamaños, estados de carga y disabled
 */
const Button = memo(forwardRef(function Button(
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      children,
      type = 'button',
      ...props
    },
    ref
  ) {
    const baseStyles = cn(
      'inline-flex items-center justify-center font-semibold rounded-lg transition-colors',
      FOCUS_STATES.ring,
      'disabled:opacity-50 disabled:cursor-not-allowed'
    );

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary,
          BUTTON_SIZES[size] || BUTTON_SIZES.md,
          className
        )}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {children}
      </button>
    );
  }
));

Button.displayName = 'Button';

Button.propTypes = {
  /** Variante visual del botón */
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'danger', 'ghost', 'warning', 'success', 'link']),
  /** Tamaño del botón */
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  /** Mostrar estado de carga con spinner */
  isLoading: PropTypes.bool,
  /** Deshabilitar el botón */
  disabled: PropTypes.bool,
  /** Tipo del botón HTML */
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  /** Contenido del botón */
  children: PropTypes.node.isRequired,
  /** Clases CSS adicionales */
  className: PropTypes.string,
  /** Handler de click */
  onClick: PropTypes.func,
};

export { Button };

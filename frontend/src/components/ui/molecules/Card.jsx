import { memo, forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';

/**
 * Card - Contenedor genérico reutilizable
 *
 * Variantes:
 * - base: Fondo blanco con borde (default)
 * - elevated: Con sombra pronunciada
 * - flat: Fondo gris sin borde
 * - outline: Solo borde, fondo transparente
 *
 * @example
 * <Card variant="elevated" hover onClick={handleClick}>
 *   Contenido interactivo
 * </Card>
 */
const Card = memo(forwardRef(function Card(
  {
    variant = 'base',
    status,
    padding = 'md',
    hover = false,
    className,
    children,
    onClick,
    as: Component = 'div',
    ...props
  },
  ref
) {
  const variantStyles = {
    base: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    elevated: 'bg-white dark:bg-gray-800 shadow-md',
    flat: 'bg-gray-50 dark:bg-gray-900',
    outline: 'border border-gray-200 dark:border-gray-700 bg-transparent',
  };

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const statusStyles = {
    success: 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800',
    warning: 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800',
    error: 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800',
    info: 'bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800',
  };

  const isClickable = !!onClick || hover;

  return (
    <Component
      ref={ref}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick(e) : undefined}
      className={cn(
        'rounded-lg',
        status ? statusStyles[status] : variantStyles[variant],
        paddingStyles[padding],
        isClickable && 'hover:shadow-md transition-shadow cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}));

Card.displayName = 'Card';

Card.propTypes = {
  variant: PropTypes.oneOf(['base', 'elevated', 'flat', 'outline']),
  status: PropTypes.oneOf(['success', 'warning', 'error', 'info']),
  padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
  hover: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
  onClick: PropTypes.func,
  as: PropTypes.oneOf(['div', 'article', 'section', 'aside']),
};

export { Card };

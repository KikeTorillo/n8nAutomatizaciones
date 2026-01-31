import { memo, forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import {
  CARD_BASE,
  CARD_ELEVATED,
  CARD_FLAT,
  CARD_OUTLINE,
  CARD_STATUS_STYLES,
  CARD_PADDING_STYLES,
  SURFACE_HOVER,
} from '@/lib/uiConstants';

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
// Mapeo de variantes a constantes importadas
const variantStyles = {
  base: CARD_BASE,
  elevated: CARD_ELEVATED,
  flat: CARD_FLAT,
  outline: CARD_OUTLINE,
};

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
        status ? CARD_STATUS_STYLES[status] : variantStyles[variant],
        CARD_PADDING_STYLES[padding],
        isClickable && SURFACE_HOVER,
        isClickable && 'cursor-pointer',
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

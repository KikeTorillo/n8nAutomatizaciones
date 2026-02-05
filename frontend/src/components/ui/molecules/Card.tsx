import { memo, forwardRef, type ReactNode, type HTMLAttributes, type KeyboardEvent, type ElementType } from 'react';
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
import type { CardVariant, CardStatus, CardPadding } from '@/types/ui';

type CardElement = 'div' | 'article' | 'section' | 'aside';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  /** Variante visual */
  variant?: CardVariant;
  /** Estado del borde */
  status?: CardStatus;
  /** Padding interno */
  padding?: CardPadding;
  /** Efecto hover */
  hover?: boolean;
  /** Clases adicionales */
  className?: string;
  /** Contenido */
  children?: ReactNode;
  /** Callback al hacer clic */
  onClick?: (e: React.MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) => void;
  /** Tipo de elemento HTML */
  as?: CardElement;
}

// Mapeo de variantes a constantes importadas
const variantStyles: Record<CardVariant, string> = {
  base: CARD_BASE,
  elevated: CARD_ELEVATED,
  flat: CARD_FLAT,
  outline: CARD_OUTLINE,
};

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
const Card = memo(forwardRef<HTMLDivElement, CardProps>(function Card(
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

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (onClick && e.key === 'Enter') {
      onClick(e);
    }
  };

  // TypeScript requires explicit handling for polymorphic components
  const Element = Component as ElementType;

  return (
    <Element
      ref={ref}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      className={cn(
        'rounded-lg',
        status ? (CARD_STATUS_STYLES as Record<CardStatus, string>)[status] : variantStyles[variant],
        (CARD_PADDING_STYLES as Record<CardPadding, string>)[padding],
        isClickable && SURFACE_HOVER,
        isClickable && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </Element>
  );
}));

Card.displayName = 'Card';

export { Card };

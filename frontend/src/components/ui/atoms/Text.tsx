import { memo, type ElementType, type ReactNode, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { TEXT_SIZES } from '@/lib/uiConstants';
import type { UISize } from '@/types/ui';

type TextElement = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';

const WEIGHT_CLASSES: Record<TextWeight, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const DEFAULT_WEIGHTS: Partial<Record<TextElement, TextWeight>> = {
  h1: 'bold',
  h2: 'semibold',
  h3: 'semibold',
  h4: 'medium',
};

const DEFAULT_SIZES: Partial<Record<TextElement, string>> = {
  h1: '2xl',
  h2: 'xl',
  h3: 'lg',
  h4: 'md',
};

export interface TextProps extends HTMLAttributes<HTMLElement> {
  /** Elemento HTML a renderizar */
  as?: TextElement;
  /** Tamaño del texto */
  size?: UISize | '2xl' | '3xl';
  /** Peso de la fuente */
  weight?: TextWeight;
  /** Clases CSS adicionales */
  className?: string;
  /** Contenido */
  children: ReactNode;
}

/**
 * Text - Componente tipográfico polimórfico
 */
const Text = memo(function Text({
  as: Component = 'p' as TextElement,
  size,
  weight,
  className,
  children,
  ...props
}: TextProps) {
  const resolvedSize = size || DEFAULT_SIZES[Component] || 'md';
  const resolvedWeight = weight || DEFAULT_WEIGHTS[Component] || 'normal';
  const Tag = Component as ElementType;

  return (
    <Tag
      className={cn(
        'text-gray-900 dark:text-gray-100',
        (TEXT_SIZES as Record<string, string>)[resolvedSize],
        WEIGHT_CLASSES[resolvedWeight],
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
});

Text.displayName = 'Text';

export { Text };

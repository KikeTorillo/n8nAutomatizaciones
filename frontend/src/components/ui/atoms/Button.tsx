import { forwardRef, memo, isValidElement, createElement, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { BUTTON_VARIANTS, BUTTON_SIZES, FOCUS_STATES } from '@/lib/uiConstants';
import type { ButtonVariant, ButtonType, UISize } from '@/types/ui';

type IconComponent = React.ComponentType<{ className?: string }>;

/** Resuelve icon como componente o JSX */
const resolveIcon = (icon: ReactNode | IconComponent): ReactNode => {
  if (!icon) return null;
  if (isValidElement(icon)) return icon;
  if (typeof icon === 'function' || (typeof icon === 'object' && '$$typeof' in icon)) {
    return createElement(icon as IconComponent, { className: 'h-4 w-4' });
  }
  return icon as ReactNode;
};

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** Variante visual del botón */
  variant?: ButtonVariant;
  /** Tamaño del botón */
  size?: UISize;
  /** Mostrar estado de carga con spinner */
  isLoading?: boolean;
  /** Deshabilitar el botón */
  disabled?: boolean;
  /** Tipo del botón HTML */
  type?: ButtonType;
  /** Icono a mostrar junto al texto (componente o JSX) */
  icon?: ReactNode | IconComponent;
  /** Posición del icono */
  iconPosition?: 'left' | 'right';
  /** Contenido del botón */
  children: ReactNode;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Componente Button reutilizable
 * Soporta variantes, tamaños, estados de carga y disabled
 */
const Button = memo(
  forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      icon,
      iconPosition = 'left',
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
        aria-busy={isLoading || undefined}
        aria-disabled={disabled || isLoading || undefined}
        className={cn(
          baseStyles,
          BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary,
          BUTTON_SIZES[size] || BUTTON_SIZES.md,
          className
        )}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {!isLoading && icon && iconPosition === 'left' && (
          <span className="mr-2 inline-flex" aria-hidden="true">{resolveIcon(icon)}</span>
        )}
        {children}
        {!isLoading && icon && iconPosition === 'right' && (
          <span className="ml-2 inline-flex" aria-hidden="true">{resolveIcon(icon)}</span>
        )}
      </button>
    );
  })
);

Button.displayName = 'Button';

export { Button };

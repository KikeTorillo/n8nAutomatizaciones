import { forwardRef, memo, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { BUTTON_VARIANTS, BUTTON_SIZES, FOCUS_STATES } from '@/lib/uiConstants';
import type { ButtonVariant, ButtonType } from '@/types/ui';

type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** Variante visual del botón */
  variant?: ButtonVariant;
  /** Tamaño del botón */
  size?: ButtonSize;
  /** Mostrar estado de carga con spinner */
  isLoading?: boolean;
  /** Deshabilitar el botón */
  disabled?: boolean;
  /** Tipo del botón HTML */
  type?: ButtonType;
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
          (BUTTON_VARIANTS as Record<string, string>)[variant] || BUTTON_VARIANTS.primary,
          (BUTTON_SIZES as Record<string, string>)[size] || BUTTON_SIZES.md,
          className
        )}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {children}
      </button>
    );
  })
);

Button.displayName = 'Button';

export { Button };

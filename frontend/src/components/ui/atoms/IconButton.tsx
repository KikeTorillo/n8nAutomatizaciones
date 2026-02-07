import { forwardRef, memo, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { ICON_BUTTON_VARIANTS, ICON_BUTTON_SIZES, FOCUS_STATES } from '@/lib/uiConstants';

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Icono a renderizar */
  icon: ReactNode;
  /** Variante visual */
  variant?: 'ghost' | 'outline' | 'solid' | 'danger';
  /** Tamaño del botón */
  size?: 'sm' | 'md' | 'lg';
  /** aria-label obligatorio para accesibilidad */
  label: string;
  /** Mostrar estado de carga con spinner */
  loading?: boolean;
  /** Estado activo (ej: filtro seleccionado) */
  active?: boolean;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * IconButton - Botón cuadrado para acciones con solo icono
 *
 * Atom diseñado para reemplazar `<button>` inline con iconos.
 * Incluye aria-label obligatorio, dark mode y design tokens.
 */
const IconButton = memo(
  forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
    {
      icon,
      variant = 'ghost',
      size = 'md',
      label,
      loading = false,
      active = false,
      disabled = false,
      className,
      type = 'button',
      ...props
    },
    ref
  ) {
    const sizeConfig = ICON_BUTTON_SIZES[size] || ICON_BUTTON_SIZES.md;

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-label={label}
        aria-busy={loading || undefined}
        aria-pressed={active || undefined}
        className={cn(
          'inline-flex items-center justify-center rounded-lg transition-colors',
          FOCUS_STATES.ring,
          'disabled:opacity-50 disabled:cursor-not-allowed',
          sizeConfig.button,
          ICON_BUTTON_VARIANTS[variant] || ICON_BUTTON_VARIANTS.ghost,
          active && 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300',
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className={cn(sizeConfig.icon, 'animate-spin')} aria-hidden="true" />
        ) : (
          <span className={cn('flex items-center justify-center', sizeConfig.icon)} aria-hidden="true">
            {icon}
          </span>
        )}
      </button>
    );
  })
);

IconButton.displayName = 'IconButton';

export { IconButton };

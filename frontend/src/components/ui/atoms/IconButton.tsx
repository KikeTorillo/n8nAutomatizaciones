import { forwardRef, memo, isValidElement, createElement, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { ICON_BUTTON_VARIANTS, ICON_BUTTON_SIZES, FOCUS_STATES } from '@/lib/uiConstants';

type IconComponent = React.ComponentType<{ className?: string }>;

/** Resuelve icon como componente o JSX */
const resolveIcon = (icon: ReactNode | IconComponent, sizeClass: string): ReactNode => {
  if (!icon) return null;
  if (isValidElement(icon)) return icon;
  if (typeof icon === 'function' || (typeof icon === 'object' && '$$typeof' in icon)) {
    return createElement(icon as IconComponent, { className: sizeClass });
  }
  return icon as ReactNode;
};

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Icono a renderizar (componente o JSX) */
  icon: ReactNode | IconComponent;
  /** Variante visual */
  variant?: 'ghost' | 'outline' | 'solid' | 'danger';
  /** Tamaño del botón */
  size?: 'sm' | 'md' | 'lg';
  /** aria-label obligatorio para accesibilidad */
  label: string;
  /** Mostrar estado de carga con spinner */
  isLoading?: boolean;
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
      isLoading = false,
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
        disabled={disabled || isLoading}
        aria-label={label}
        aria-busy={isLoading || undefined}
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
        {isLoading ? (
          <Loader2 className={cn(sizeConfig.icon, 'animate-spin')} aria-hidden="true" />
        ) : (
          <span className={cn('flex items-center justify-center', sizeConfig.icon)} aria-hidden="true">
            {resolveIcon(icon, sizeConfig.icon)}
          </span>
        )}
      </button>
    );
  })
);

IconButton.displayName = 'IconButton';

export { IconButton };

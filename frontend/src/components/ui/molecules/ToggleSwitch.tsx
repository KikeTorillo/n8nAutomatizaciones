import { memo, forwardRef, type ReactNode, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { TOGGLE_SIZES, TOGGLE_COLORS } from '@/lib/uiConstants';
import { Spinner } from '../atoms/Spinner';
import type { Size } from '@/types/ui';

export interface ToggleSwitchProps {
  /** Estado del toggle (encendido/apagado) */
  enabled?: boolean;
  /** Callback cuando cambia el estado */
  onChange?: (enabled: boolean) => void;
  /** Si está deshabilitado */
  disabled?: boolean;
  /** Tamaño: 'sm' | 'md' | 'lg' */
  size?: Size;
  /** Label para accesibilidad (aria-label) */
  label?: string;
  /** Clases adicionales */
  className?: string;
  /** Icono cuando está encendido */
  enabledIcon?: ReactNode;
  /** Icono cuando está apagado */
  disabledIcon?: ReactNode;
  /** Estado de carga */
  loading?: boolean;
  /** Icono de carga personalizado */
  loadingIcon?: ReactNode;
}

interface ToggleSizeConfig {
  track: string;
  thumb: string;
  icon: string;
  translate: string;
}

/**
 * ToggleSwitch - Componente de interruptor on/off
 *
 * Toggle switch accesible con soporte para dark mode, múltiples tamaños,
 * estados de loading y personalización de iconos.
 *
 * @example
 * // Toggle simple
 * <ToggleSwitch enabled={isActive} onChange={setIsActive} />
 *
 * @example
 * // Toggle con iconos personalizados
 * <ToggleSwitch
 *   enabled={enabled}
 *   onChange={handleChange}
 *   enabledIcon={<Check className="h-4 w-4 text-green-500" />}
 *   disabledIcon={<X className="h-4 w-4 text-gray-400" />}
 * />
 */
const ToggleSwitch = memo(forwardRef<HTMLButtonElement, ToggleSwitchProps>(function ToggleSwitch({
  enabled = false,
  onChange,
  disabled = false,
  size = 'md',
  label,
  className,
  enabledIcon,
  disabledIcon,
  loading = false,
  loadingIcon,
}, ref) {
  const sizeConfig = (TOGGLE_SIZES as Record<Size, ToggleSizeConfig>)[size] || TOGGLE_SIZES.md;

  const handleClick = () => {
    if (!disabled && !loading && onChange) {
      onChange(!enabled);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled && !loading) {
      e.preventDefault();
      onChange?.(!enabled);
    }
  };

  // Renderizar icono según estado
  const renderIcon = (): ReactNode => {
    if (loading && loadingIcon) {
      return loadingIcon;
    }
    if (loading) {
      return <Spinner className={cn(sizeConfig.icon, 'text-gray-400')} />;
    }
    if (enabled && enabledIcon) {
      return enabledIcon;
    }
    if (!enabled && disabledIcon) {
      return disabledIcon;
    }
    return null;
  };

  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      disabled={disabled || loading}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative inline-flex flex-shrink-0 cursor-pointer rounded-full',
        'border-2 border-transparent transition-colors duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        'dark:focus:ring-offset-gray-900',
        sizeConfig.track,
        enabled ? TOGGLE_COLORS.enabled : TOGGLE_COLORS.disabled,
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-flex items-center justify-center',
          'transform rounded-full bg-white shadow ring-0',
          'transition duration-200 ease-in-out',
          sizeConfig.thumb,
          enabled ? sizeConfig.translate : 'translate-x-0'
        )}
      >
        {renderIcon()}
      </span>
    </button>
  );
}));

ToggleSwitch.displayName = 'ToggleSwitch';

export { ToggleSwitch };

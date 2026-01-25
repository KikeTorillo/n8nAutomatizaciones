import { memo, forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { TOGGLE_SIZES, TOGGLE_COLORS } from '@/lib/uiConstants';

/**
 * ToggleSwitch - Componente de interruptor on/off
 *
 * Toggle switch accesible con soporte para dark mode, múltiples tamaños,
 * estados de loading y personalización de iconos.
 *
 * @param {boolean} enabled - Estado del toggle (encendido/apagado)
 * @param {function} onChange - Callback cuando cambia el estado
 * @param {boolean} disabled - Si está deshabilitado
 * @param {string} size - Tamaño: 'sm' | 'md' | 'lg'
 * @param {string} label - Label para accesibilidad (aria-label)
 * @param {string} className - Clases adicionales
 * @param {ReactNode} enabledIcon - Icono cuando está encendido
 * @param {ReactNode} disabledIcon - Icono cuando está apagado
 * @param {boolean} loading - Estado de carga
 * @param {ReactNode} loadingIcon - Icono de carga personalizado
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
const ToggleSwitch = memo(forwardRef(function ToggleSwitch({
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
  const sizeConfig = TOGGLE_SIZES[size] || TOGGLE_SIZES.md;

  const handleClick = () => {
    if (!disabled && !loading && onChange) {
      onChange(!enabled);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled && !loading) {
      e.preventDefault();
      onChange?.(!enabled);
    }
  };

  // Renderizar icono según estado
  const renderIcon = () => {
    if (loading && loadingIcon) {
      return loadingIcon;
    }
    if (loading) {
      return (
        <svg
          className={cn(sizeConfig.icon, 'animate-spin text-gray-400')}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      );
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

ToggleSwitch.propTypes = {
  enabled: PropTypes.bool,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  label: PropTypes.string,
  className: PropTypes.string,
  enabledIcon: PropTypes.node,
  disabledIcon: PropTypes.node,
  loading: PropTypes.bool,
  loadingIcon: PropTypes.node,
};

export { ToggleSwitch };

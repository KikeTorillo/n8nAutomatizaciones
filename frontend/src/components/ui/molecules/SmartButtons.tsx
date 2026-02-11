import { memo, forwardRef, type ComponentType } from 'react';
import { cn } from '../lib/cn';
import { SMART_BUTTON_COLORS } from '@/lib/uiConstants';

/** Colores disponibles para SmartButton */
export type SmartButtonColor = keyof typeof SMART_BUTTON_COLORS;

/**
 * Configuración individual de un botón inteligente
 */
export interface SmartButtonConfig {
  /** Componente de icono (lucide-react) */
  icon?: ComponentType<{ className?: string }>;
  /** Valor principal a mostrar */
  value: string | number;
  /** Etiqueta descriptiva */
  label: string;
  /** Handler de click */
  onClick?: () => void;
  /** Color del botón */
  color?: SmartButtonColor;
  /** Deshabilitado */
  disabled?: boolean;
  /** ID único del botón */
  id?: string;
}

/**
 * Props del componente SmartButtons
 */
export interface SmartButtonsProps {
  /** Configuración de botones */
  buttons?: SmartButtonConfig[];
  /** Clases adicionales */
  className?: string;
}

/**
 * SmartButtons - Botones de métricas/acciones contextuales en header
 * Botones de contexto (Documentos, Comprado, Vendido, etc.)
 *
 * Presentacional puro: grid de botones de métricas/acciones
 */
export const SmartButtons = memo(
  forwardRef<HTMLDivElement, SmartButtonsProps>(function SmartButtons(
    { buttons = [], className },
    ref
  ) {
    if (!buttons.length) return null;

    return (
      <div ref={ref} className={cn('flex flex-wrap gap-2 sm:gap-3', className)}>
        {buttons.map((btn, index) => {
          const Icon = btn.icon;
          const color = btn.color || 'gray';

          return (
            <button
              key={btn.id || index}
              onClick={btn.onClick}
              disabled={btn.disabled}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg',
                'border border-transparent',
                'transition-all duration-200',
                'hover:border-gray-300 dark:hover:border-gray-600',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                'dark:focus-visible:ring-offset-gray-900',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                SMART_BUTTON_COLORS[color]
              )}
              aria-label={`${btn.label}: ${btn.value}`}
            >
              {Icon && (
                <Icon
                  className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                  aria-hidden="true"
                />
              )}
              <div className="flex flex-col items-start min-w-0">
                <span className="text-sm sm:text-base font-semibold truncate">
                  {btn.value}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {btn.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  })
);

SmartButtons.displayName = 'SmartButtons';

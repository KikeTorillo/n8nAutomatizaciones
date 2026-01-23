import { memo } from 'react';
import { cn } from '@/lib/utils';

/**
 * SmartButtons - Botones de métricas/acciones contextuales en header
 * Similar a los "smart buttons" de Odoo (Documentos, Comprado, Vendido, etc.)
 *
 * Ene 2026: Movido de molecules a organisms (coordina múltiples botones interactivos)
 *
 * @param {Object} props
 * @param {Array} props.buttons - Configuración de botones
 * @param {Object} props.buttons[].icon - Componente de icono (lucide-react)
 * @param {string} props.buttons[].value - Valor principal a mostrar
 * @param {string} props.buttons[].label - Etiqueta descriptiva
 * @param {Function} [props.buttons[].onClick] - Handler de click
 * @param {string} [props.buttons[].color] - Color: primary, blue, green, yellow, red, gray
 * @param {boolean} [props.buttons[].disabled] - Deshabilitado
 * @param {string} [props.buttons[].id] - ID único del botón
 * @param {string} [props.className] - Clases adicionales
 */

const colorClasses = {
  primary: 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
  blue: 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
  green: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  yellow: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  red: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  gray: 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
};

export const SmartButtons = memo(function SmartButtons({ buttons = [], className }) {
  if (!buttons.length) return null;

  return (
    <div className={cn(
      'flex flex-wrap gap-2 sm:gap-3',
      className
    )}>
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
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              'dark:focus:ring-offset-gray-900',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              colorClasses[color]
            )}
            aria-label={`${btn.label}: ${btn.value}`}
          >
            {Icon && (
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" aria-hidden="true" />
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
});

SmartButtons.displayName = 'SmartButtons';

export default SmartButtons;

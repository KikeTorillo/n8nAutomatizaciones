/**
 * ====================================================================
 * BREAKPOINT SELECTOR
 * ====================================================================
 * Selector de breakpoint reutilizable para editores.
 * Permite cambiar entre vistas desktop, tablet y mobile.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo } from 'react';
import { BREAKPOINTS } from './breakpointConfig';

/**
 * BreakpointSelector - Selector de breakpoint
 *
 * @param {Object} props
 * @param {string} props.value - Breakpoint actual ('desktop' | 'tablet' | 'mobile')
 * @param {Function} props.onChange - Callback cuando cambia el breakpoint
 * @param {string} props.className - Clases adicionales
 */
function BreakpointSelector({ value = 'desktop', onChange, className = '' }) {
  return (
    <div
      className={`flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 ${className}`}
    >
      {BREAKPOINTS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange?.(id)}
          className={`p-2 rounded transition-colors ${
            value === id
              ? 'bg-white dark:bg-gray-600 shadow-sm text-primary-600 dark:text-primary-400'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          title={label}
          aria-label={`Vista ${label}`}
          aria-pressed={value === id}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}

export default memo(BreakpointSelector);

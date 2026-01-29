/**
 * ====================================================================
 * SEO RULE
 * ====================================================================
 * Componente para mostrar una regla SEO individual.
 */

import { memo } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Componente de regla SEO
 *
 * @param {Object} props
 * @param {Object} props.regla - Datos de la regla
 * @param {boolean} props.showDescripcion - Mostrar descripcion
 * @param {boolean} props.compact - Modo compacto
 */
function SEORule({ regla, showDescripcion = false, compact = false }) {
  const { nombre, descripcion, peso, resultado } = regla;
  const { valido, mensaje } = resultado;

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs',
          valido
            ? 'bg-green-50 dark:bg-green-900/20'
            : 'bg-red-50 dark:bg-red-900/20'
        )}
      >
        {valido ? (
          <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
        ) : (
          <X className="w-3.5 h-3.5 text-red-600 dark:text-red-400 flex-shrink-0" />
        )}
        <span
          className={cn(
            'truncate',
            valido
              ? 'text-green-700 dark:text-green-300'
              : 'text-red-700 dark:text-red-300'
          )}
        >
          {nombre}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-colors',
        valido
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <div
          className={cn(
            'p-1 rounded-full flex-shrink-0',
            valido
              ? 'bg-green-100 dark:bg-green-800'
              : 'bg-red-100 dark:bg-red-800'
          )}
        >
          {valido ? (
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
          ) : (
            <X className="w-4 h-4 text-red-600 dark:text-red-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4
              className={cn(
                'text-sm font-medium',
                valido
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-red-800 dark:text-red-200'
              )}
            >
              {nombre}
            </h4>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded',
                valido
                  ? 'bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-200'
                  : 'bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-200'
              )}
            >
              {peso}%
            </span>
          </div>

          <p
            className={cn(
              'text-xs mt-1',
              valido
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            )}
          >
            {mensaje}
          </p>

          {showDescripcion && !valido && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex items-start gap-1">
              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>{descripcion}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(SEORule);

/**
 * ====================================================================
 * TONE SELECTOR
 * ====================================================================
 * Componente para seleccionar el tono de generacion de texto.
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { TONOS, LONGITUDES } from './useAIWriter';

/**
 * Selector de tono
 *
 * @param {Object} props
 * @param {string} props.selectedTono - Tono seleccionado
 * @param {string} props.selectedLongitud - Longitud seleccionada
 * @param {Function} props.onTonoChange - Callback al cambiar tono
 * @param {Function} props.onLongitudChange - Callback al cambiar longitud
 * @param {boolean} props.disabled - Si esta deshabilitado
 */
function ToneSelector({
  selectedTono,
  selectedLongitud,
  onTonoChange,
  onLongitudChange,
  disabled = false,
}) {
  return (
    <div className="space-y-3">
      {/* Tonos */}
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
          Tono
        </label>
        <div className="flex flex-wrap gap-1.5">
          {TONOS.map((tono) => (
            <button
              key={tono.id}
              onClick={() => onTonoChange?.(tono.id)}
              disabled={disabled}
              title={`${tono.nombre}: ${tono.descripcion}`}
              className={cn(
                'flex items-center gap-1 px-2 py-1.5 rounded-lg border transition-all',
                selectedTono === tono.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span className="text-sm">{tono.emoji}</span>
              <span className="text-[11px] text-gray-700 dark:text-gray-300">
                {tono.nombre}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Longitud */}
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
          Longitud
        </label>
        <div className="flex gap-1">
          {LONGITUDES.map((longitud) => (
            <button
              key={longitud.id}
              onClick={() => onLongitudChange?.(longitud.id)}
              disabled={disabled}
              className={cn(
                'flex-1 px-2 py-1.5 rounded-md border text-xs font-medium transition-all',
                selectedLongitud === longitud.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {longitud.nombre}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(ToneSelector);

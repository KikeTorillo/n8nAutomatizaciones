/**
 * ====================================================================
 * FONT SELECT
 * ====================================================================
 * Dropdown custom para seleccionar fuentes con preview visual.
 * Cada opción se renderiza con su propia fontFamily aplicada.
 *
 * @version 1.0.0
 * @since 2026-02-05
 */

import { useState, useEffect, memo } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useClickOutside } from '@/hooks/utils/useClickOutside';
import { useEscapeKey } from '@/hooks/utils/useEscapeKey';

/**
 * Precarga todas las fuentes de Google Fonts en un solo <link>
 */
function useFontPreload(fonts) {
  useEffect(() => {
    if (!fonts?.length) return;

    const families = fonts.map(f => f.id.replace(/ /g, '+')).join('&family=');
    const href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;

    // No duplicar si ya existe
    if (document.querySelector(`link[href="${href}"]`)) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }, [fonts]);
}

/**
 * FontSelect - Dropdown con preview de fuentes
 *
 * @param {Object} props
 * @param {string} props.value - ID de la fuente seleccionada
 * @param {Array<{id: string, nombre: string}>} props.options - Fuentes disponibles
 * @param {Function} props.onChange - Callback al seleccionar (recibe id)
 */
function FontSelect({ value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useClickOutside(() => setIsOpen(false), isOpen);
  useEscapeKey(() => setIsOpen(false), isOpen);
  useFontPreload(options);

  const selected = options.find(f => f.id === value) || options[0];

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
      >
        <span style={{ fontFamily: selected?.id }}>
          {selected?.nombre}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map(font => (
            <button
              key={font.id}
              type="button"
              onClick={() => {
                onChange(font.id);
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center justify-between px-3 py-2.5 text-sm text-left
                transition-colors hover:bg-gray-100 dark:hover:bg-gray-600
                ${font.id === value ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-gray-100'}
              `}
            >
              <span style={{ fontFamily: font.id }} className="text-base">
                {font.nombre}
              </span>
              {font.id === value && (
                <Check className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(FontSelect);

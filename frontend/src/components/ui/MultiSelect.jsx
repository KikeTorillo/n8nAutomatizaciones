import { forwardRef, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, X } from 'lucide-react';

/**
 * Componente MultiSelect con checkboxes
 * Compatible con React Hook Form
 *
 * @param {Array} options - Array de objetos {value, label, disabled}
 * @param {Array} value - Array de valores seleccionados
 * @param {Function} onChange - Callback cuando cambia la selección
 * @param {string} placeholder - Texto placeholder
 * @param {number} max - Máximo de opciones seleccionables (default: sin límite)
 */
const MultiSelect = forwardRef(
  (
    {
      className,
      options = [],
      value = [],
      onChange,
      error,
      label,
      helper,
      placeholder = 'Selecciona opciones',
      required = false,
      max,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (containerRef.current && !containerRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Opciones seleccionadas
    const selectedOptions = options.filter(opt => value.includes(opt.value));

    // Handler para toggle de una opción
    const handleToggle = (optionValue) => {
      if (disabled) return;

      let newValue;
      if (value.includes(optionValue)) {
        // Remover
        newValue = value.filter(v => v !== optionValue);
      } else {
        // Agregar (si no excede el máximo)
        if (max && value.length >= max) {
          return; // No agregar si ya llegó al máximo
        }
        newValue = [...value, optionValue];
      }

      onChange?.(newValue);
    };

    // Handler para remover un tag
    const handleRemove = (optionValue, e) => {
      e.stopPropagation();
      if (disabled) return;

      const newValue = value.filter(v => v !== optionValue);
      onChange?.(newValue);
    };

    // Handler para limpiar todo
    const handleClearAll = (e) => {
      e.stopPropagation();
      if (disabled) return;
      onChange?.([]);
    };

    const baseStyles = 'w-full min-h-[48px] px-4 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed bg-white cursor-pointer';

    const stateStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500 hover:border-gray-400';

    return (
      <div className="w-full" ref={containerRef}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {/* Campo principal */}
          <div
            className={cn(baseStyles, stateStyles, className)}
            onClick={() => !disabled && setIsOpen(!isOpen)}
          >
            <div className="flex items-center flex-wrap gap-1.5 min-h-[32px]">
              {/* Tags de seleccionados */}
              {selectedOptions.length > 0 ? (
                selectedOptions.map((option) => (
                  <span
                    key={option.value}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 text-sm rounded-md"
                  >
                    {option.label}
                    <button
                      type="button"
                      onClick={(e) => handleRemove(option.value, e)}
                      className="hover:bg-primary-200 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-gray-500 text-sm">{placeholder}</span>
              )}
            </div>

            {/* Iconos de la derecha */}
            <div className="absolute inset-y-0 right-0 flex items-center px-3 gap-1">
              {selectedOptions.length > 0 && !disabled && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="hover:bg-gray-200 rounded-full p-1 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              )}
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-gray-600 transition-transform",
                  isOpen && "transform rotate-180"
                )}
              />
            </div>
          </div>

          {/* Dropdown de opciones */}
          {isOpen && !disabled && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {options.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No hay opciones disponibles
                </div>
              ) : (
                <>
                  {max && (
                    <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                      {value.length}/{max} seleccionados
                    </div>
                  )}
                  {options.map((option) => {
                    const isSelected = value.includes(option.value);
                    const isDisabled = option.disabled || (max && value.length >= max && !isSelected);

                    return (
                      <div
                        key={option.value}
                        className={cn(
                          "px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between",
                          isDisabled && "opacity-50 cursor-not-allowed hover:bg-white"
                        )}
                        onClick={() => !isDisabled && handleToggle(option.value)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {/* Checkbox */}
                          <div
                            className={cn(
                              "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                              isSelected
                                ? "bg-primary-600 border-primary-600"
                                : "border-gray-300 bg-white"
                            )}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>

                          {/* Label */}
                          <span className="text-sm text-gray-900">
                            {option.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {helper && !error && (
          <p className="mt-1 text-sm text-gray-500">{helper}</p>
        )}

        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

MultiSelect.displayName = 'MultiSelect';

export default MultiSelect;

import { forwardRef, useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SEARCH_INPUT_SIZES } from '@/lib/uiConstants';

/**
 * SearchInput - Componente de búsqueda reutilizable con debounce
 *
 * @param {string} value - Valor controlado del input
 * @param {function} onChange - Callback cuando cambia el valor
 * @param {function} onSearch - Callback con valor debounced (opcional)
 * @param {number} debounceMs - Tiempo de debounce en ms (default: 300)
 * @param {string} placeholder - Placeholder del input
 * @param {string} size - Tamaño: 'sm' | 'md' | 'lg'
 * @param {boolean} showClear - Mostrar botón de limpiar (default: true)
 * @param {boolean} autoFocus - Auto focus al montar
 * @param {string} className - Clases adicionales
 *
 * @example
 * // Uso básico
 * <SearchInput
 *   value={searchTerm}
 *   onChange={(e) => setSearchTerm(e.target.value)}
 *   placeholder="Buscar productos..."
 * />
 *
 * @example
 * // Con debounce para API calls
 * <SearchInput
 *   value={searchTerm}
 *   onChange={(e) => setSearchTerm(e.target.value)}
 *   onSearch={(debouncedValue) => fetchResults(debouncedValue)}
 *   debounceMs={500}
 * />
 */
const SearchInput = memo(forwardRef(
  (
    {
      value = '',
      onChange,
      onSearch,
      debounceMs = 300,
      placeholder = 'Buscar...',
      size = 'md',
      showClear = true,
      autoFocus = false,
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(value);

    // Ref para mantener callback estable y evitar cancelaciones de debounce
    const onSearchRef = useRef(onSearch);
    useEffect(() => {
      onSearchRef.current = onSearch;
    }, [onSearch]);

    // Sincronizar valor externo
    useEffect(() => {
      setInternalValue(value);
    }, [value]);

    // Debounce para onSearch (sin onSearch en deps para evitar cancelaciones)
    useEffect(() => {
      if (!onSearchRef.current) return;

      const timer = setTimeout(() => {
        onSearchRef.current(internalValue);
      }, debounceMs);

      return () => clearTimeout(timer);
    }, [internalValue, debounceMs]);

    const handleChange = useCallback((e) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      onChange?.(e);
    }, [onChange]);

    const handleClear = useCallback(() => {
      const syntheticEvent = {
        target: { value: '' },
        currentTarget: { value: '' },
      };
      setInternalValue('');
      onChange?.(syntheticEvent);
      onSearch?.('');
    }, [onChange, onSearch]);

    // Memoizar estilos de tamaño con padding dinámico
    const currentSize = useMemo(() => {
      const baseSize = SEARCH_INPUT_SIZES[size] || SEARCH_INPUT_SIZES.md;
      return {
        ...baseSize,
        paddingRight: showClear && internalValue
          ? baseSize.paddingRightWithClear
          : baseSize.paddingRightNormal,
      };
    }, [size, showClear, internalValue]);

    return (
      <div className={cn('relative', className)} role="search">
        {/* Icono de búsqueda */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className={cn(
            currentSize.icon,
            'text-gray-400 dark:text-gray-500'
          )} />
        </div>

        {/* Input */}
        <input
          ref={ref}
          type="text"
          value={internalValue}
          onChange={handleChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          className={cn(
            'w-full border rounded-lg transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'bg-white dark:bg-gray-800',
            'text-gray-900 dark:text-gray-100',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'border-gray-300 dark:border-gray-600',
            'focus:border-primary-500 focus:ring-primary-500',
            currentSize.input,
            currentSize.paddingLeft,
            currentSize.paddingRight
          )}
          {...props}
        />

        {/* Botón limpiar */}
        {showClear && internalValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              'absolute inset-y-0 right-0 pr-3 flex items-center',
              'text-gray-400 hover:text-gray-600',
              'dark:text-gray-500 dark:hover:text-gray-300',
              'transition-colors'
            )}
            aria-label="Limpiar búsqueda"
          >
            <X className={currentSize.icon} />
          </button>
        )}
      </div>
    );
  }
));

SearchInput.displayName = 'SearchInput';

SearchInput.propTypes = {
  /** Valor controlado del input */
  value: PropTypes.string,
  /** Callback cuando cambia el valor */
  onChange: PropTypes.func,
  /** Callback con valor debounced */
  onSearch: PropTypes.func,
  /** Tiempo de debounce en ms */
  debounceMs: PropTypes.number,
  /** Placeholder del input */
  placeholder: PropTypes.string,
  /** Tamaño del input */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Mostrar botón de limpiar */
  showClear: PropTypes.bool,
  /** Auto focus al montar */
  autoFocus: PropTypes.bool,
  /** Estado deshabilitado */
  disabled: PropTypes.bool,
  /** Clases CSS adicionales */
  className: PropTypes.string,
};

export { SearchInput };

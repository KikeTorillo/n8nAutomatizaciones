import { forwardRef, useState, useEffect, useCallback, useMemo, memo, type ChangeEvent, type InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SEARCH_INPUT_SIZES, getInputBaseStyles } from '@/lib/uiConstants';
import type { Size } from '@/types/ui';

interface SyntheticEvent {
  target: { value: string };
  currentTarget: { value: string };
}

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'> {
  /** Valor controlado del input */
  value?: string;
  /** Callback cuando cambia el valor */
  onChange?: (e: ChangeEvent<HTMLInputElement> | SyntheticEvent) => void;
  /** Callback con valor debounced */
  onSearch?: (value: string) => void;
  /** Tiempo de debounce en ms */
  debounceMs?: number;
  /** Placeholder del input */
  placeholder?: string;
  /** Tamaño del input */
  size?: Size;
  /** Mostrar botón de limpiar */
  showClear?: boolean;
  /** Auto focus al montar */
  autoFocus?: boolean;
  /** Estado deshabilitado */
  disabled?: boolean;
  /** Clases CSS adicionales */
  className?: string;
}

interface SearchInputSizeConfig {
  input: string;
  icon: string;
  paddingLeft: string;
  paddingRightNormal: string;
  paddingRightWithClear: string;
}

/**
 * SearchInput - Componente de búsqueda reutilizable con debounce
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
const SearchInput = memo(forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
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
  ) {
    const [internalValue, setInternalValue] = useState(value);

    // Callback estable para evitar cancelaciones de debounce
    const stableOnSearch = useCallback((searchValue: string) => {
      if (onSearch) {
        onSearch(searchValue);
      }
    }, [onSearch]);

    // Sincronizar valor externo
    useEffect(() => {
      setInternalValue(value);
    }, [value]);

    // Debounce para onSearch
    useEffect(() => {
      if (!onSearch) return;

      const timer = setTimeout(() => {
        stableOnSearch(internalValue);
      }, debounceMs);

      return () => clearTimeout(timer);
    }, [internalValue, debounceMs, stableOnSearch, onSearch]);

    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      onChange?.(e);
    }, [onChange]);

    const handleClear = useCallback(() => {
      const syntheticEvent: SyntheticEvent = {
        target: { value: '' },
        currentTarget: { value: '' },
      };
      setInternalValue('');
      onChange?.(syntheticEvent);
      onSearch?.('');
    }, [onChange, onSearch]);

    // Memoizar estilos de tamaño con padding dinámico
    const currentSize = useMemo(() => {
      const baseSize = (SEARCH_INPUT_SIZES as Record<Size, SearchInputSizeConfig>)[size] || SEARCH_INPUT_SIZES.md;
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
            getInputBaseStyles(false),
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

export { SearchInput };

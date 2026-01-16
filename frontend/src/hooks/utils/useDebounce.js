import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook para debounce de valores
 * Retorna el valor después de que haya pasado el delay sin cambios
 *
 * @param {any} value - Valor a debounce
 * @param {number} delay - Delay en milisegundos (default: 300ms)
 * @returns {any} - Valor debounced
 *
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 300);
 *
 * useEffect(() => {
 *   // Solo se ejecuta cuando debouncedSearch cambia
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para debounce de callbacks
 * Retorna una función que solo se ejecuta después del delay
 *
 * @param {Function} callback - Función a debounce
 * @param {number} delay - Delay en milisegundos (default: 300ms)
 * @returns {Function} - Función debounced
 *
 * @example
 * const handleSearch = useDebouncedCallback((value) => {
 *   fetchResults(value);
 * }, 300);
 *
 * <input onChange={(e) => handleSearch(e.target.value)} />
 */
export function useDebouncedCallback(callback, delay = 300) {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // Mantener referencia actualizada del callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  return debouncedCallback;
}

export default useDebounce;

import { useRef, useEffect } from 'react';

/**
 * Hook que retorna el valor anterior de una variable
 *
 * @example
 * const prevCount = usePrevious(count);
 * // En el primer render: undefined
 * // Después: el valor de count del render anterior
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

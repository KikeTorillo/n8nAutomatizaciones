import { useCallback, useRef, type ForwardedRef, type MutableRefObject } from 'react';

/**
 * Hook para combinar un ref externo (forwardRef) con uno interno.
 *
 * @returns [internalRef, setRefs] — ref interno + callback para asignar ambos refs
 *
 * @example
 * const MyComponent = forwardRef((props, ref) => {
 *   const [internalRef, setRefs] = useCombineRefs<HTMLDivElement>(ref);
 *   // Usar internalRef.current internamente
 *   return <div ref={setRefs}>...</div>;
 * });
 */
export function useCombineRefs<T>(
  externalRef: ForwardedRef<T>
): [MutableRefObject<T | null>, (node: T | null) => void] {
  const internalRef = useRef<T | null>(null);

  const setRefs = useCallback((node: T | null) => {
    internalRef.current = node;
    if (typeof externalRef === 'function') externalRef(node);
    else if (externalRef) externalRef.current = node;
  }, [externalRef]);

  return [internalRef, setRefs];
}

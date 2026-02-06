import { useEffect, useCallback, useRef, type RefObject } from 'react';

/**
 * Hook para detectar clicks fuera de un elemento
 *
 * @example
 * function Dropdown() {
 *   const [isOpen, setIsOpen] = useState(false);
 *   const ref = useClickOutside(() => setIsOpen(false), isOpen);
 *   return <div ref={ref}>...</div>;
 * }
 */
export function useClickOutside<T extends HTMLElement = HTMLDivElement>(
  callback: () => void,
  enabled: boolean = true,
): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      callbackRef.current();
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [enabled, handleClickOutside]);

  return ref;
}

/**
 * Hook alternativo que acepta una ref externa
 *
 * @example
 * function Dropdown() {
 *   const [isOpen, setIsOpen] = useState(false);
 *   const containerRef = useRef(null);
 *   useClickOutsideRef(containerRef, () => setIsOpen(false), isOpen);
 *   return <div ref={containerRef}>...</div>;
 * }
 */
export function useClickOutsideRef<T extends HTMLElement>(
  ref: RefObject<T | null>,
  callback: () => void,
  enabled: boolean = true,
): void {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      callbackRef.current();
    }
  }, [ref]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [enabled, handleClickOutside]);
}

export default useClickOutside;

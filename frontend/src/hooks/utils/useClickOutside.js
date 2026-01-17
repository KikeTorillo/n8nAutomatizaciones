import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook para detectar clicks fuera de un elemento
 *
 * Ene 2026: Extraído de NavDropdown, MobileNavSelector y otros componentes
 * para reutilización consistente.
 *
 * @param {Function} callback - Función a ejecutar cuando se detecta click fuera
 * @param {boolean} enabled - Habilitar/deshabilitar el listener (default: true)
 * @returns {React.RefObject} Ref para asignar al elemento contenedor
 *
 * @example
 * function Dropdown() {
 *   const [isOpen, setIsOpen] = useState(false);
 *   const ref = useClickOutside(() => setIsOpen(false), isOpen);
 *
 *   return <div ref={ref}>...</div>;
 * }
 */
export function useClickOutside(callback, enabled = true) {
  const ref = useRef(null);

  // Mantener callback estable con ref
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const handleClickOutside = useCallback((event) => {
    if (ref.current && !ref.current.contains(event.target)) {
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
 * @param {React.RefObject} ref - Ref del elemento contenedor
 * @param {Function} callback - Función a ejecutar cuando se detecta click fuera
 * @param {boolean} enabled - Habilitar/deshabilitar el listener
 *
 * @example
 * function Dropdown() {
 *   const [isOpen, setIsOpen] = useState(false);
 *   const containerRef = useRef(null);
 *   useClickOutsideRef(containerRef, () => setIsOpen(false), isOpen);
 *
 *   return <div ref={containerRef}>...</div>;
 * }
 */
export function useClickOutsideRef(ref, callback, enabled = true) {
  // Mantener callback estable con ref
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const handleClickOutside = useCallback((event) => {
    if (ref.current && !ref.current.contains(event.target)) {
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

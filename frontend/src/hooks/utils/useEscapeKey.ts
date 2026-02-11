import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook para detectar tecla Escape
 *
 * Ene 2026: Extraído de Modal, Drawer, NavDropdown y otros componentes
 * para reutilización consistente.
 *
 * @param {Function} callback - Función a ejecutar cuando se presiona Escape
 * @param {boolean} enabled - Habilitar/deshabilitar el listener (default: true)
 *
 * @example
 * function Modal({ isOpen, onClose }) {
 *   useEscapeKey(onClose, isOpen);
 *
 *   return isOpen ? <div>...</div> : null;
 * }
 */
export function useEscapeKey(callback, enabled = true) {
  // Mantener callback estable con ref
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      callbackRef.current();
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}

/**
 * Hook para detectar múltiples teclas
 *
 * @param {Object} keyMap - Objeto con teclas como keys y callbacks como values
 * @param {boolean} enabled - Habilitar/deshabilitar el listener
 *
 * @example
 * useKeyboardShortcuts({
 *   Escape: () => closeModal(),
 *   Enter: () => submitForm(),
 *   'ctrl+s': () => save(),
 * }, isOpen);
 */
export function useKeyboardShortcuts(keyMap, enabled = true) {
  // Mantener keyMap estable con ref
  const keyMapRef = useRef(keyMap);
  useEffect(() => {
    keyMapRef.current = keyMap;
  }, [keyMap]);

  const handleKeyDown = useCallback((event) => {
    const currentKeyMap = keyMapRef.current;

    // Construir la key con modificadores
    const modifiers = [];
    if (event.ctrlKey || event.metaKey) modifiers.push('ctrl');
    if (event.shiftKey) modifiers.push('shift');
    if (event.altKey) modifiers.push('alt');

    const keyWithMods = [...modifiers, event.key.toLowerCase()].join('+');
    const simpleKey = event.key;

    // Buscar callback por key con modificadores o simple
    const callback = currentKeyMap[keyWithMods] || currentKeyMap[simpleKey];

    if (callback) {
      event.preventDefault();
      callback(event);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}

export default useEscapeKey;

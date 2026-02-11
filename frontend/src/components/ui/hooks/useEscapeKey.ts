import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook para detectar tecla Escape
 */
export function useEscapeKey(callback: () => void, enabled = true): void {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
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

type KeyboardShortcutCallback = (event: KeyboardEvent) => void;
type KeyMap = Record<string, KeyboardShortcutCallback>;

/**
 * Hook para detectar múltiples teclas
 */
export function useKeyboardShortcuts(keyMap: KeyMap, enabled = true): void {
  const keyMapRef = useRef(keyMap);
  useEffect(() => {
    keyMapRef.current = keyMap;
  }, [keyMap]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const currentKeyMap = keyMapRef.current;

    const modifiers: string[] = [];
    if (event.ctrlKey || event.metaKey) modifiers.push('ctrl');
    if (event.shiftKey) modifiers.push('shift');
    if (event.altKey) modifiers.push('alt');

    const keyWithMods = [...modifiers, event.key.toLowerCase()].join('+');
    const simpleKey = event.key;

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

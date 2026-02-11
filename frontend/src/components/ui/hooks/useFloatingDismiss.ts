import { useEffect, useCallback, useRef, type RefObject } from 'react';

interface UseFloatingDismissOptions {
  enabled?: boolean;
  escapeKey?: boolean;
  clickOutside?: boolean;
  excludeRefs?: RefObject<HTMLElement | null>[];
}

/**
 * Hook para cerrar elementos flotantes con Escape y/o click outside.
 * Soporta múltiples refs para excluir del click outside (ej: trigger + popover).
 *
 * @example
 * useFloatingDismiss(handleClose, {
 *   enabled: isOpen,
 *   excludeRefs: [triggerRef, popoverRef],
 * });
 */
export function useFloatingDismiss(
  onDismiss: () => void,
  options: UseFloatingDismissOptions = {}
): void {
  const {
    enabled = true,
    escapeKey = true,
    clickOutside = true,
    excludeRefs = [],
  } = options;

  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      const target = e.target as Node;
      const isInside = excludeRefs.some(
        (ref) => ref.current && ref.current.contains(target)
      );
      if (!isInside) {
        onDismissRef.current();
      }
    },
    [excludeRefs]
  );

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onDismissRef.current();
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    if (clickOutside) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    if (escapeKey) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      if (clickOutside) {
        document.removeEventListener('mousedown', handleClickOutside);
      }
      if (escapeKey) {
        document.removeEventListener('keydown', handleEscape);
      }
    };
  }, [enabled, clickOutside, escapeKey, handleClickOutside, handleEscape]);
}

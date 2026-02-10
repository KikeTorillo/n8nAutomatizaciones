import { useState, useCallback, useEffect, useRef, type RefObject } from 'react';

export type Placement = 'top' | 'bottom' | 'left' | 'right';

const PLACEMENT_STYLES: Record<Placement, (rect: DOMRect, offset: number) => { top: number; left: number }> = {
  bottom: (rect, offset) => ({
    top: rect.bottom + offset,
    left: rect.left + rect.width / 2,
  }),
  top: (rect, offset) => ({
    top: rect.top - offset,
    left: rect.left + rect.width / 2,
  }),
  left: (rect, offset) => ({
    top: rect.top + rect.height / 2,
    left: rect.left - offset,
  }),
  right: (rect, offset) => ({
    top: rect.top + rect.height / 2,
    left: rect.right + offset,
  }),
};

const TRANSFORM: Record<Placement, string> = {
  bottom: 'translate(-50%, 0)',
  top: 'translate(-50%, -100%)',
  left: 'translate(-100%, -50%)',
  right: 'translate(0, -50%)',
};

interface UseFloatingPositionOptions {
  placement: Placement;
  offset: number;
  enabled: boolean;
}

interface UseFloatingPositionReturn {
  position: { top: number; left: number };
  transform: string;
  updatePosition: () => void;
}

/**
 * Hook para calcular posición flotante relativa a un trigger.
 * Incluye auto-update en scroll/resize con RAF debounce.
 *
 * @example
 * const { position, transform, updatePosition } = useFloatingPosition(
 *   triggerRef,
 *   { placement: 'bottom', offset: 8, enabled: isOpen }
 * );
 */
export function useFloatingPosition(
  triggerRef: RefObject<HTMLElement | null>,
  options: UseFloatingPositionOptions
): UseFloatingPositionReturn {
  const { placement, offset, enabled } = options;
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const rafRef = useRef<number>(0);

  const updatePosition = useCallback(() => {
    const triggerEl = triggerRef.current;
    if (!triggerEl) return;

    const rect = triggerEl.getBoundingClientRect();
    const calcPosition = PLACEMENT_STYLES[placement];
    setPosition(calcPosition(rect, offset));
  }, [triggerRef, placement, offset]);

  // Auto-update en scroll/resize con RAF debounce
  useEffect(() => {
    if (!enabled) return;

    const debouncedUpdate = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('scroll', debouncedUpdate, true);
    window.addEventListener('resize', debouncedUpdate);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('scroll', debouncedUpdate, true);
      window.removeEventListener('resize', debouncedUpdate);
    };
  }, [enabled, updatePosition]);

  return {
    position,
    transform: TRANSFORM[placement],
    updatePosition,
  };
}

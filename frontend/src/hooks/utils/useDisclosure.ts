import { useState, useCallback } from 'react';

export interface UseDisclosureReturn<T = unknown> {
  isOpen: boolean;
  data: T | null;
  open: (data?: T) => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Hook simple para estado boolean open/close con data opcional.
 * Reemplaza el patrón repetido de `useState(false)` + `useState(null)`.
 *
 * @example
 * const drawer = useDisclosure<Producto>();
 * // Abrir sin data: drawer.open()
 * // Abrir con data: drawer.open(producto)
 * // Cerrar: drawer.close()
 */
export function useDisclosure<T = unknown>(initialOpen = false): UseDisclosureReturn<T> {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((d?: T) => {
    setData(d ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Limpiar data después de la animación de cierre
    setTimeout(() => setData(null), 300);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) setTimeout(() => setData(null), 300);
      return !prev;
    });
  }, []);

  return { isOpen, data, open, close, toggle };
}

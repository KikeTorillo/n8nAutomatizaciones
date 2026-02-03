/**
 * ====================================================================
 * USE SLASH MENU
 * ====================================================================
 * Hook que encapsula la lógica del slash menu ("/") para insertar bloques.
 *
 * Features:
 * - Detecta "/" para abrir el menú
 * - Maneja búsqueda con query
 * - Teclas: Escape para cerrar, Backspace para borrar query
 * - Evita activarse en inputs/textareas/contentEditable
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Estado inicial del slash menu
 */
const INITIAL_STATE = {
  isOpen: false,
  position: { x: 0, y: 0 },
  query: '',
};

/**
 * Hook para manejar el slash menu
 *
 * @param {Object} params
 * @param {boolean} params.enabled - Si el slash menu está habilitado
 * @param {Function} params.onSelect - Callback cuando se selecciona un tipo de bloque
 * @returns {Object} Estado y handlers del slash menu
 */
export function useSlashMenu({ enabled = true, onSelect }) {
  const [slashMenu, setSlashMenu] = useState(INITIAL_STATE);

  /**
   * Seleccionar un tipo de bloque
   */
  const handleSelect = useCallback(
    (tipoBloque) => {
      setSlashMenu(INITIAL_STATE);
      onSelect?.(tipoBloque);
    },
    [onSelect]
  );

  /**
   * Cerrar el slash menu
   */
  const handleClose = useCallback(() => {
    setSlashMenu(INITIAL_STATE);
  }, []);

  /**
   * Abrir el slash menu en una posición específica
   */
  const openMenu = useCallback((position) => {
    setSlashMenu({
      isOpen: true,
      position: position || {
        x: window.innerWidth / 2 - 150,
        y: window.innerHeight / 3,
      },
      query: '',
    });
  }, []);

  /**
   * Actualizar el query de búsqueda
   */
  const setQuery = useCallback((query) => {
    setSlashMenu((prev) => ({ ...prev, query }));
  }, []);

  // Keyboard handler
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      const target = e.target;

      // Detectar si estamos en un elemento editable
      const isEditable =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[contenteditable="true"]');

      // Abrir slash menu con "/"
      if (e.key === '/' && !slashMenu.isOpen && !isEditable) {
        e.preventDefault();
        setSlashMenu({
          isOpen: true,
          position: {
            x: window.innerWidth / 2 - 150,
            y: window.innerHeight / 3,
          },
          query: '',
        });
        return;
      }

      // Si el menú está abierto, manejar teclas
      if (slashMenu.isOpen) {
        if (e.key === 'Escape') {
          setSlashMenu((prev) => ({ ...prev, isOpen: false, query: '' }));
          return;
        }

        if (e.key === 'Backspace') {
          if (slashMenu.query === '') {
            // Si no hay query, cerrar el menú
            setSlashMenu((prev) => ({ ...prev, isOpen: false }));
          } else {
            // Si hay query, borrar último carácter
            setSlashMenu((prev) => ({
              ...prev,
              query: prev.query.slice(0, -1),
            }));
          }
          return;
        }

        // Agregar carácter al query (ignorar teclas especiales)
        if (
          e.key.length === 1 &&
          !e.metaKey &&
          !e.ctrlKey &&
          !['ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)
        ) {
          setSlashMenu((prev) => ({
            ...prev,
            query: prev.query + e.key,
          }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, slashMenu.isOpen, slashMenu.query]);

  return {
    // Estado
    isOpen: slashMenu.isOpen,
    position: slashMenu.position,
    query: slashMenu.query,

    // Estado completo (para compatibilidad)
    slashMenu,
    setSlashMenu,

    // Handlers
    handleSelect,
    handleClose,
    openMenu,
    setQuery,
  };
}

export default useSlashMenu;

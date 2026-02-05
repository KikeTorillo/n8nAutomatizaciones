/**
 * ====================================================================
 * USE CANVAS INTERACTION
 * ====================================================================
 * Hook para gestionar la interacción con el canvas de posición libre.
 * Maneja drag, resize, selección y keyboard shortcuts.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';

/**
 * Hook para manejar interacciones del canvas
 *
 * @param {Object} options
 * @param {Array} options.secciones - Array de secciones
 * @param {string} options.selectedElementId - ID del elemento seleccionado
 * @param {string} options.selectedSectionId - ID de la sección seleccionada
 * @param {Function} options.onSelectElement - Callback para seleccionar elemento
 * @param {Function} options.onSelectSection - Callback para seleccionar sección
 * @param {Function} options.onDeselectAll - Callback para deseleccionar todo
 * @param {Function} options.onMoveElement - Callback para mover elemento
 * @param {Function} options.onDeleteElement - Callback para eliminar elemento
 * @param {Function} options.onDuplicateElement - Callback para duplicar elemento
 * @param {Function} options.onMoveLayer - Callback para mover capa
 * @param {boolean} options.disabled - Si las interacciones están deshabilitadas
 */
export function useCanvasInteraction({
  secciones = [],
  selectedElementId,
  selectedSectionId,
  onSelectElement,
  onSelectSection,
  onDeselectAll,
  onMoveElement,
  onDeleteElement,
  onDuplicateElement,
  onMoveLayer,
  disabled = false,
}) {
  const lastSelectedRef = useRef({ element: null, section: null });

  // Obtener elemento seleccionado
  const selectedElement = useMemo(() => {
    if (!selectedElementId) return null;
    for (const s of secciones) {
      const e = s.elementos?.find((el) => el.id === selectedElementId);
      if (e) return e;
    }
    return null;
  }, [selectedElementId, secciones]);

  // Obtener sección seleccionada
  const selectedSection = useMemo(() => {
    if (!selectedSectionId) return null;
    return secciones.find((s) => s.id === selectedSectionId) || null;
  }, [selectedSectionId, secciones]);

  // Keyboard shortcuts
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e) => {
      // Ignorar si estamos en un input
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) {
        return;
      }

      // Delete - Eliminar elemento seleccionado
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          e.preventDefault();
          onDeleteElement?.(selectedElementId);
        }
      }

      // Escape - Deseleccionar
      if (e.key === 'Escape') {
        e.preventDefault();
        onDeselectAll?.();
      }

      // Ctrl/Cmd + D - Duplicar
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        if (selectedElementId) {
          e.preventDefault();
          onDuplicateElement?.(selectedElementId);
        }
      }

      // Arrow keys - Mover elemento (nudge)
      if (selectedElementId && selectedElement) {
        const step = e.shiftKey ? 10 : 1; // Shift para mover más rápido
        let dx = 0;
        let dy = 0;

        switch (e.key) {
          case 'ArrowUp':
            dy = -step;
            break;
          case 'ArrowDown':
            dy = step;
            break;
          case 'ArrowLeft':
            dx = -step;
            break;
          case 'ArrowRight':
            dx = step;
            break;
          default:
            return;
        }

        if (dx !== 0 || dy !== 0) {
          e.preventDefault();
          const currentPos = selectedElement.posicion || {};
          onMoveElement?.(selectedElementId, selectedSectionId, {
            x: Math.max(0, Math.min(100, (currentPos.x || 50) + dx)),
            y: Math.max(0, Math.min(100, (currentPos.y || 50) + dy)),
          });
        }
      }

      // [ y ] - Mover capas
      if (selectedElementId) {
        if (e.key === '[') {
          e.preventDefault();
          onMoveLayer?.(selectedElementId, 'down');
        } else if (e.key === ']') {
          e.preventDefault();
          onMoveLayer?.(selectedElementId, 'up');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    disabled,
    selectedElementId,
    selectedSectionId,
    selectedElement,
    onDeleteElement,
    onDeselectAll,
    onDuplicateElement,
    onMoveElement,
    onMoveLayer,
  ]);

  // Handler para selección de elemento
  const handleSelectElement = useCallback((elementId, sectionId) => {
    if (disabled) return;
    lastSelectedRef.current = { element: elementId, section: sectionId };
    onSelectElement?.(elementId, sectionId);
  }, [disabled, onSelectElement]);

  // Handler para selección de sección
  const handleSelectSection = useCallback((sectionId) => {
    if (disabled) return;
    lastSelectedRef.current = { element: null, section: sectionId };
    onSelectSection?.(sectionId);
  }, [disabled, onSelectSection]);

  // Handler para deseleccionar
  const handleDeselectAll = useCallback(() => {
    if (disabled) return;
    lastSelectedRef.current = { element: null, section: null };
    onDeselectAll?.();
  }, [disabled, onDeselectAll]);

  // Handler para click en el fondo del canvas
  const handleCanvasBackgroundClick = useCallback((e) => {
    // Solo deseleccionar si el click es en el fondo
    if (e.target === e.currentTarget) {
      handleDeselectAll();
    }
  }, [handleDeselectAll]);

  return {
    selectedElement,
    selectedSection,
    handleSelectElement,
    handleSelectSection,
    handleDeselectAll,
    handleCanvasBackgroundClick,
    lastSelected: lastSelectedRef.current,
  };
}

export default useCanvasInteraction;

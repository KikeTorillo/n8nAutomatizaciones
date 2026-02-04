/**
 * ====================================================================
 * USE DND HANDLERS - Editor Framework
 * ====================================================================
 * Hook genérico para manejar drag & drop de bloques en editores.
 * Proporciona handlers reutilizables para drop desde paleta y reordenamiento.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { useCallback } from 'react';

/**
 * Hook genérico para manejar drag & drop de bloques
 *
 * @param {Object} options
 * @param {Array} options.bloques - Array de bloques actual
 * @param {Function} options.onInsertBlock - (bloque, indice) => void
 * @param {Function} options.onReorderBlocks - (arrayDeIds) => void
 * @param {Function} options.createBlock - (tipo, orden) => Bloque
 * @returns {Object} { handleDropFromPalette, handleDndReorder }
 */
export function useDndHandlers({
  bloques,
  onInsertBlock,
  onReorderBlocks,
  createBlock,
}) {
  /**
   * Handler para drop desde la paleta de bloques
   * Calcula el índice de inserción basado en targetId y position
   */
  const handleDropFromPalette = useCallback(
    ({ tipo, targetId, position }) => {
      // Por defecto insertar al final
      let indice = bloques.length;

      if (targetId) {
        const targetIndex = bloques.findIndex((b) => b.id === targetId);
        if (targetIndex !== -1) {
          indice = position === 'before' ? targetIndex : targetIndex + 1;
        }
      }

      const nuevoBloque = createBlock(tipo, indice);
      onInsertBlock(nuevoBloque, indice);
    },
    [bloques, onInsertBlock, createBlock]
  );

  /**
   * Handler para reordenamiento via drag & drop
   * Mueve el bloque activo a la posición del bloque over
   */
  const handleDndReorder = useCallback(
    ({ activeId, overId }) => {
      const oldIndex = bloques.findIndex((b) => b.id === activeId);
      const newIndex = bloques.findIndex((b) => b.id === overId);

      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = [...bloques];
      const [removed] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, removed);

      onReorderBlocks(newOrder.map((b) => b.id));
    },
    [bloques, onReorderBlocks]
  );

  return { handleDropFromPalette, handleDndReorder };
}

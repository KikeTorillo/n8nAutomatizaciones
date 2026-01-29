/**
 * ====================================================================
 * DND EDITOR PROVIDER
 * ====================================================================
 * Proveedor de contexto DnD que envuelve el editor de website.
 * Permite arrastrar bloques desde la paleta al canvas.
 */

import { createContext, useContext, useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { BlockDragPreview } from './DragPreview';

// Contexto para compartir estado de drag
const DndEditorContext = createContext(null);

export function useDndEditor() {
  return useContext(DndEditorContext);
}

/**
 * Proveedor DnD que envuelve el editor
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenido del editor
 * @param {Function} props.onDropFromPalette - Callback al soltar desde paleta
 * @param {Function} props.onReorder - Callback al reordenar bloques
 * @param {Object} props.tema - Tema del sitio (para preview)
 */
export function DndEditorProvider({ children, onDropFromPalette, onReorder, tema }) {
  // Estado de drag
  const [activeDrag, setActiveDrag] = useState(null);
  const [overInfo, setOverInfo] = useState(null);

  // Sensores de DnD (incluye TouchSensor para dispositivos móviles)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // ========== HANDLERS ==========

  /**
   * Inicio de drag
   */
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    const isPalette = String(active.id).startsWith('palette-');

    setActiveDrag({
      id: active.id,
      tipo: isPalette ? String(active.id).replace('palette-', '') : null,
      source: isPalette ? 'palette' : 'canvas',
      data: active.data?.current,
    });
  }, []);

  /**
   * Drag sobre elemento
   */
  const handleDragOver = useCallback((event) => {
    const { over, active } = event;

    if (!over) {
      setOverInfo(null);
      return;
    }

    // Calcular posicion (antes/despues)
    let position = 'after';
    if (over.rect && active.rect?.current?.translated) {
      const activeCenter = active.rect.current.translated.top + active.rect.current.translated.height / 2;
      const overCenter = over.rect.top + over.rect.height / 2;
      position = activeCenter < overCenter ? 'before' : 'after';
    }

    setOverInfo({
      id: over.id,
      position,
    });
  }, []);

  /**
   * Fin de drag
   */
  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      const isPalette = String(active.id).startsWith('palette-');

      if (isPalette && over) {
        // Drop desde paleta
        const tipo = String(active.id).replace('palette-', '');
        const targetId = over.id;

        // Calcular posicion usando el centro del elemento arrastrado vs centro del target
        let position = 'after';
        if (over.rect && active.rect?.current?.translated) {
          const activeRect = active.rect.current.translated;
          const activeCenter = activeRect.top + activeRect.height / 2;
          const overCenter = over.rect.top + over.rect.height / 2;
          position = activeCenter < overCenter ? 'before' : 'after';
        }

        onDropFromPalette?.({
          tipo,
          targetId: (targetId === 'empty-canvas' || targetId === 'end-of-canvas') ? null : targetId,
          position,
        });
      } else if (!isPalette && over && active.id !== over.id) {
        // Reorden dentro del canvas
        onReorder?.({
          activeId: active.id,
          overId: over.id,
        });
      }

      // Limpiar estado
      setActiveDrag(null);
      setOverInfo(null);
    },
    [onDropFromPalette, onReorder]
  );

  /**
   * Cancelar drag
   */
  const handleDragCancel = useCallback(() => {
    setActiveDrag(null);
    setOverInfo(null);
  }, []);

  // Valor del contexto
  const contextValue = {
    activeDrag,
    overInfo,
    isDraggingFromPalette: activeDrag?.source === 'palette',
  };

  return (
    <DndEditorContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={activeDrag?.source === 'palette' ? pointerWithin : closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}

        {/* Drag Overlay - Preview mejorado */}
        <DragOverlay dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {activeDrag?.source === 'palette' && (
            <BlockDragPreview tipo={activeDrag.tipo} tema={tema} />
          )}
        </DragOverlay>
      </DndContext>
    </DndEditorContext.Provider>
  );
}

export default DndEditorProvider;

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
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { motion } from 'framer-motion';
import {
  Layout,
  Briefcase,
  MessageSquareQuote,
  Users,
  MousePointerClick,
  Mail,
  PanelBottom,
  Type,
  Image,
  Video,
  Minus,
  DollarSign,
  HelpCircle,
  Clock,
  TrendingUp,
  GitBranch,
} from 'lucide-react';

// Iconos por tipo de bloque
const ICONOS_BLOQUES = {
  hero: Layout,
  servicios: Briefcase,
  testimonios: MessageSquareQuote,
  equipo: Users,
  cta: MousePointerClick,
  contacto: Mail,
  footer: PanelBottom,
  texto: Type,
  galeria: Image,
  video: Video,
  separador: Minus,
  pricing: DollarSign,
  faq: HelpCircle,
  countdown: Clock,
  stats: TrendingUp,
  timeline: GitBranch,
};

// Nombres por tipo de bloque
const NOMBRES_BLOQUES = {
  hero: 'Hero',
  servicios: 'Servicios',
  testimonios: 'Testimonios',
  equipo: 'Equipo',
  cta: 'CTA',
  contacto: 'Contacto',
  footer: 'Footer',
  texto: 'Texto',
  galeria: 'Galeria',
  video: 'Video',
  separador: 'Separador',
  pricing: 'Precios',
  faq: 'FAQ',
  countdown: 'Countdown',
  stats: 'Estadisticas',
  timeline: 'Timeline',
};

// Contexto para compartir estado de drag
const DndEditorContext = createContext(null);

export function useDndEditor() {
  return useContext(DndEditorContext);
}

/**
 * Proveedor DnD que envuelve el editor
 */
export function DndEditorProvider({ children, onDropFromPalette, onReorder }) {
  // Estado de drag
  const [activeDrag, setActiveDrag] = useState(null);
  const [overInfo, setOverInfo] = useState(null);

  // Sensores de DnD
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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

    // Extraer el ID real si tiene prefijo droppable-
    let overId = over.id;
    if (String(overId).startsWith('droppable-')) {
      overId = String(overId).replace('droppable-', '');
    }

    setOverInfo({
      id: overId,
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
        let targetId = over.id;
        const position = overInfo?.position || 'after';

        // Si el targetId es un droppable-{blockId}, extraer el blockId real
        if (String(targetId).startsWith('droppable-')) {
          targetId = String(targetId).replace('droppable-', '');
        }

        onDropFromPalette?.({
          tipo,
          targetId: (targetId === 'empty-canvas' || targetId === 'end-of-canvas') ? null : targetId,
          position,
        });
      } else if (!isPalette && over && active.id !== over.id) {
        // Reorden dentro del canvas
        let overId = over.id;
        // Si es droppable-{id}, extraer el id real
        if (String(overId).startsWith('droppable-')) {
          overId = String(overId).replace('droppable-', '');
        }
        onReorder?.({
          activeId: active.id,
          overId: overId,
        });
      }

      // Limpiar estado
      setActiveDrag(null);
      setOverInfo(null);
    },
    [onDropFromPalette, onReorder, overInfo]
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

        {/* Drag Overlay */}
        <DragOverlay dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {activeDrag?.source === 'palette' && (
            <PaletteDragOverlay tipo={activeDrag.tipo} />
          )}
        </DragOverlay>
      </DndContext>
    </DndEditorContext.Provider>
  );
}

/**
 * Overlay visual cuando se arrastra desde la paleta
 */
function PaletteDragOverlay({ tipo }) {
  const Icono = ICONOS_BLOQUES[tipo] || Layout;
  const nombre = NOMBRES_BLOQUES[tipo] || tipo;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-primary-500 pointer-events-none"
    >
      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
        <Icono className="w-5 h-5 text-primary-600 dark:text-primary-400" />
      </div>
      <div>
        <p className="font-medium text-gray-900 dark:text-gray-100">{nombre}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Soltar para agregar</p>
      </div>
    </motion.div>
  );
}

export default DndEditorProvider;

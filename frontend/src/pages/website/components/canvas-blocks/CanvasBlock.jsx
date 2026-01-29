/**
 * ====================================================================
 * CANVAS BLOCK - Wrapper Component
 * ====================================================================
 * Componente wrapper que renderiza el bloque correcto según su tipo
 * y maneja la selección, edición inline y drag-and-drop.
 */

import { memo, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Copy, Trash2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useWebsiteEditorStore, selectBloqueRecienAgregado } from '@/store';

// Canvas block components
import HeroCanvasBlock from './HeroCanvasBlock';
import ServiciosCanvasBlock from './ServiciosCanvasBlock';
import TestimoniosCanvasBlock from './TestimoniosCanvasBlock';
import EquipoCanvasBlock from './EquipoCanvasBlock';
import CtaCanvasBlock from './CtaCanvasBlock';
import ContactoCanvasBlock from './ContactoCanvasBlock';
import FooterCanvasBlock from './FooterCanvasBlock';
import TextoCanvasBlock from './TextoCanvasBlock';
import GaleriaCanvasBlock from './GaleriaCanvasBlock';
import VideoCanvasBlock from './VideoCanvasBlock';
import SeparadorCanvasBlock from './SeparadorCanvasBlock';
import PricingCanvasBlock from './PricingCanvasBlock';
import FaqCanvasBlock from './FaqCanvasBlock';
import CountdownCanvasBlock from './CountdownCanvasBlock';
import StatsCanvasBlock from './StatsCanvasBlock';
import TimelineCanvasBlock from './TimelineCanvasBlock';

// ========== BLOCK COMPONENT MAP ==========

const BLOCK_COMPONENTS = {
  hero: HeroCanvasBlock,
  servicios: ServiciosCanvasBlock,
  testimonios: TestimoniosCanvasBlock,
  equipo: EquipoCanvasBlock,
  cta: CtaCanvasBlock,
  contacto: ContactoCanvasBlock,
  footer: FooterCanvasBlock,
  texto: TextoCanvasBlock,
  galeria: GaleriaCanvasBlock,
  video: VideoCanvasBlock,
  separador: SeparadorCanvasBlock,
  pricing: PricingCanvasBlock,
  faq: FaqCanvasBlock,
  countdown: CountdownCanvasBlock,
  stats: StatsCanvasBlock,
  timeline: TimelineCanvasBlock,
};

// ========== MAIN COMPONENT ==========

/**
 * Wrapper de bloque para el canvas
 *
 * @param {Object} props
 * @param {Object} props.bloque - Datos del bloque
 * @param {Object} props.tema - Tema del sitio
 * @param {boolean} props.isSelected - Si está seleccionado
 * @param {boolean} props.isEditing - Si está en modo inline editing
 * @param {boolean} props.isDragging - Si está siendo arrastrado
 * @param {boolean} props.isDragOver - Si hay drag sobre este bloque
 * @param {string} props.dropPosition - 'before' | 'after' | null
 * @param {boolean} props.isFirstBlock - Si es el primer bloque
 * @param {boolean} props.isLastBlock - Si es el último bloque
 * @param {Function} props.onClick - Callback al hacer click
 * @param {Function} props.onDoubleClick - Callback al hacer doble click
 * @param {Function} props.onContentChange - Callback al cambiar contenido
 * @param {Function} props.onDuplicate - Callback para duplicar
 * @param {Function} props.onDelete - Callback para eliminar
 * @param {Function} props.onToggleVisibility - Callback para toggle visibilidad
 */
function CanvasBlock({
  bloque,
  tema,
  isSelected = false,
  isEditing = false,
  isDragging = false,
  isDragOver = false,
  dropPosition = null,
  isFirstBlock = false,
  isLastBlock = false,
  onClick,
  onDoubleClick,
  onContentChange,
  onDuplicate,
  onDelete,
  onToggleVisibility,
}) {
  // Verificar si es un bloque recien agregado
  const bloqueRecienAgregado = useWebsiteEditorStore(selectBloqueRecienAgregado);
  const isNewlyAdded = bloqueRecienAgregado === bloque.id;

  // Sortable setup (also acts as droppable for palette items)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: bloque.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Use isDragOver from props (set by DndEditorProvider via overInfo)
  const isCurrentDragOver = isDragOver;

  // Get the correct block component
  const BlockComponent = BLOCK_COMPONENTS[bloque.tipo];

  if (!BlockComponent) {
    console.warn(`[CanvasBlock] Tipo de bloque desconocido: ${bloque.tipo}`);
    return null;
  }

  // ========== HANDLERS ==========

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      onClick?.();
    },
    [onClick]
  );

  const handleDoubleClick = useCallback(
    (e) => {
      e.stopPropagation();
      onDoubleClick?.();
    },
    [onDoubleClick]
  );

  // Variantes de animacion para bloques recien agregados
  const insertionVariants = {
    initial: { opacity: 0, y: -20, scale: 0.95 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };

  // ========== RENDER ==========

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      variants={isNewlyAdded ? insertionVariants : undefined}
      initial={isNewlyAdded ? 'initial' : false}
      animate={isNewlyAdded ? 'animate' : undefined}
      className={cn(
        'relative group/block',
        isSortableDragging && 'opacity-30 scale-[0.98]',
        isDragging && 'shadow-2xl',
        'transition-all duration-200',
        // Glow effect para bloque recien agregado
        isNewlyAdded && 'ring-2 ring-primary-500/50 ring-offset-2 rounded-lg'
      )}
    >
      {/* Drop Indicator - Before */}
      <AnimatePresence>
        {isCurrentDragOver && dropPosition === 'before' && (
          <DropIndicator position="before" />
        )}
      </AnimatePresence>

      {/* Selection Indicator & Controls */}
      <AnimatePresence>
        {isSelected && !isSortableDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 ring-2 ring-primary-500 ring-offset-2 rounded-lg pointer-events-none z-10"
          />
        )}
      </AnimatePresence>

      {/* Hover Controls */}
      <div
        className={cn(
          'absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover/block:opacity-100 transition-opacity z-20',
          isSelected && 'opacity-100'
        )}
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1.5 bg-white dark:bg-gray-700 rounded shadow-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-grab active:cursor-grabbing"
          title="Arrastrar para reordenar"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Top-right Controls */}
      <AnimatePresence>
        {(isSelected || false) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -top-10 right-2 flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1 z-20"
          >
            {/* Toggle Visibility */}
            <button
              onClick={() => onToggleVisibility?.(bloque.id)}
              className={cn(
                'p-1.5 rounded transition-colors',
                bloque.visible
                  ? 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  : 'text-amber-500 hover:text-amber-600'
              )}
              title={bloque.visible ? 'Ocultar bloque' : 'Mostrar bloque'}
            >
              {bloque.visible ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>

            {/* Duplicate */}
            <button
              onClick={() => onDuplicate?.(bloque.id)}
              className="p-1.5 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 rounded transition-colors"
              title="Duplicar bloque (Ctrl+D)"
            >
              <Copy className="w-4 h-4" />
            </button>

            {/* Delete */}
            <button
              onClick={() => onDelete?.(bloque.id)}
              className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded transition-colors"
              title="Eliminar bloque (Delete)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Indicator */}
      {!bloque.visible && (
        <div className="absolute inset-0 bg-gray-900/10 dark:bg-gray-900/30 pointer-events-none z-5 flex items-center justify-center">
          <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-1 rounded text-xs font-medium">
            Oculto
          </span>
        </div>
      )}

      {/* Block Content */}
      <div
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={cn(
          'transition-all cursor-pointer',
          !isSelected && !isSortableDragging && 'hover:shadow-md',
          isCurrentDragOver && 'scale-[0.99]'
        )}
      >
        <BlockComponent
          bloque={bloque}
          tema={tema}
          isEditing={isEditing}
          onContentChange={onContentChange}
        />
      </div>

      {/* Drop Indicator - After */}
      <AnimatePresence>
        {isCurrentDragOver && dropPosition === 'after' && (
          <DropIndicator position="after" />
        )}
      </AnimatePresence>

      {/* Glow overlay para bloque recien agregado */}
      <AnimatePresence>
        {isNewlyAdded && (
          <motion.div
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="absolute inset-0 pointer-events-none rounded-lg"
            style={{
              boxShadow: '0 0 30px 10px rgba(117, 53, 114, 0.4)',
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ========== DROP INDICATOR ==========

/**
 * Indicador visual de donde se soltará el bloque
 */
function DropIndicator({ position }) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0.5 }}
      animate={{ opacity: 1, scaleX: 1 }}
      exit={{ opacity: 0, scaleX: 0.5 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={cn(
        'absolute left-0 right-0 z-30 pointer-events-none',
        position === 'before' ? '-top-1' : '-bottom-1'
      )}
    >
      {/* Línea principal */}
      <div className="h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-500 rounded-full shadow-lg shadow-primary-500/30">
        {/* Efecto de pulso */}
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="h-full w-full bg-primary-400/50 rounded-full"
        />
      </div>

      {/* Indicadores en los extremos */}
      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary-500 rounded-full shadow-lg shadow-primary-500/50" />
      <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary-500 rounded-full shadow-lg shadow-primary-500/50" />
    </motion.div>
  );
}

export default memo(CanvasBlock);

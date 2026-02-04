/**
 * ====================================================================
 * EDITOR CANVAS
 * ====================================================================
 * Canvas WYSIWYG principal del editor de website.
 * Permite edicion visual directa, drag-and-drop y responsive preview.
 * Soporta drops desde la paleta de bloques.
 *
 * NOTA: El toolbar ahora está en EditorToolbar del framework.
 * Este componente solo renderiza el canvas y los bloques.
 */

import { useCallback, useMemo, memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Monitor, Loader2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useWebsiteEditorStore } from '@/store';
import { useDndEditor } from '@/components/editor-framework';

// Canvas blocks
import CanvasBlock from './canvas-blocks/CanvasBlock';

// ========== CONSTANTS ==========

const BREAKPOINT_WIDTHS = {
  desktop: 1200,
  tablet: 768,
  mobile: 375,
};

// ========== MAIN COMPONENT ==========

/**
 * Canvas WYSIWYG principal
 *
 * @param {Object} props
 * @param {Array} props.bloques - Lista de bloques a renderizar
 * @param {Object} props.tema - Tema del sitio (colores, fuentes)
 * @param {Function} props.onBloqueClick - Callback para click en bloque (selección + propiedades)
 * @param {Function} props.onReordenar - Callback para reordenar bloques
 * @param {Function} props.onActualizarBloque - Callback para actualizar bloque
 * @param {Function} props.onEliminarBloque - Callback para eliminar bloque (servidor)
 * @param {Function} props.onDuplicarBloque - Callback para duplicar bloque (servidor)
 * @param {Function} props.onToggleVisibilidad - Callback para toggle visibilidad (servidor)
 * @param {boolean} props.isLoading - Si esta cargando
 */
function EditorCanvas({
  bloques = [],
  tema,
  onBloqueClick,
  onReordenar,
  onActualizarBloque,
  onEliminarBloque,
  onDuplicarBloque,
  onToggleVisibilidad,
  isLoading = false,
}) {
  // Store state
  const breakpoint = useWebsiteEditorStore((state) => state.breakpoint);
  const zoom = useWebsiteEditorStore((state) => state.zoom);
  const bloqueSeleccionado = useWebsiteEditorStore(
    (state) => state.bloqueSeleccionado
  );
  const bloqueEditandoInline = useWebsiteEditorStore(
    (state) => state.bloqueEditandoInline
  );

  // Store actions
  const seleccionarBloque = useWebsiteEditorStore(
    (state) => state.seleccionarBloque
  );
  const deseleccionarBloque = useWebsiteEditorStore(
    (state) => state.deseleccionarBloque
  );
  const activarInlineEditing = useWebsiteEditorStore(
    (state) => state.activarInlineEditing
  );
  const actualizarBloqueLocal = useWebsiteEditorStore(
    (state) => state.actualizarBloqueLocal
  );
  const eliminarBloqueLocal = useWebsiteEditorStore(
    (state) => state.eliminarBloqueLocal
  );
  const duplicarBloqueLocal = useWebsiteEditorStore(
    (state) => state.duplicarBloqueLocal
  );
  const toggleVisibilidadBloque = useWebsiteEditorStore(
    (state) => state.toggleVisibilidadBloque
  );

  // Contexto DnD compartido
  const dndContext = useDndEditor();
  const isDraggingFromPalette = dndContext?.isDraggingFromPalette || false;
  const overInfo = dndContext?.overInfo;

  // ========== HANDLERS ==========

  /**
   * Manejar click en canvas (deseleccionar)
   */
  const handleCanvasClick = useCallback(
    (e) => {
      // Solo si el click fue directamente en el canvas, no en un bloque
      if (e.target === e.currentTarget || e.target.dataset.canvasBackground) {
        deseleccionarBloque();
      }
    },
    [deseleccionarBloque]
  );

  /**
   * Manejar seleccion de bloque
   * Usa el callback del padre si está disponible (incluye abrir propiedades)
   */
  const handleBloqueClick = useCallback(
    (id) => {
      if (onBloqueClick) {
        onBloqueClick(id);
      } else {
        seleccionarBloque(id);
      }
    },
    [onBloqueClick, seleccionarBloque]
  );

  /**
   * Manejar doble click para inline editing
   */
  const handleBloqueDoubleClick = useCallback(
    (id) => {
      activarInlineEditing(id);
    },
    [activarInlineEditing]
  );

  /**
   * Manejar actualizacion de contenido
   */
  const handleContentChange = useCallback(
    (id, contenido) => {
      actualizarBloqueLocal(id, contenido);
      // Notificar al padre para autosave
      onActualizarBloque?.(id, contenido);
    },
    [actualizarBloqueLocal, onActualizarBloque]
  );

  /**
   * Manejar toggle de visibilidad
   * Usa el callback del servidor si está disponible
   */
  const handleToggleVisibility = useCallback(
    (id) => {
      if (onToggleVisibilidad) {
        onToggleVisibilidad(id);
      } else {
        toggleVisibilidadBloque(id);
      }
    },
    [onToggleVisibilidad, toggleVisibilidadBloque]
  );

  /**
   * Manejar duplicar bloque
   * Usa el callback del servidor si está disponible
   */
  const handleDuplicate = useCallback(
    (id) => {
      if (onDuplicarBloque) {
        onDuplicarBloque(id);
      } else {
        const nuevoId = `bloque-${Date.now()}`;
        duplicarBloqueLocal(id, nuevoId);
      }
    },
    [onDuplicarBloque, duplicarBloqueLocal]
  );

  /**
   * Manejar eliminar bloque
   * Usa el callback del servidor si está disponible
   */
  const handleDelete = useCallback(
    (id) => {
      if (onEliminarBloque) {
        onEliminarBloque(id);
      } else {
        eliminarBloqueLocal(id);
      }
    },
    [onEliminarBloque, eliminarBloqueLocal]
  );

  // ========== COMPUTED ==========

  const canvasWidth = BREAKPOINT_WIDTHS[breakpoint] || BREAKPOINT_WIDTHS.desktop;
  const scaleFactor = zoom / 100;

  const bloquesIds = useMemo(() => bloques.map((b) => b.id), [bloques]);

  // Estilos CSS variables del tema
  const temaStyles = useMemo(
    () => ({
      '--color-primario': tema?.color_primario || '#753572',
      '--color-secundario': tema?.color_secundario || '#1F2937',
      '--color-acento': tema?.color_acento || '#F59E0B',
      '--color-texto': tema?.color_texto || '#111827',
      '--color-fondo': tema?.color_fondo || '#FFFFFF',
      '--fuente-titulos': tema?.fuente_titulos || 'Inter',
      '--fuente-cuerpo': tema?.fuente_cuerpo || 'Inter',
    }),
    [tema]
  );

  // ========== RENDER ==========

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
      {/* Canvas Area */}
      <div
        className="flex-1 overflow-auto p-2 sm:p-4 md:p-6"
        onClick={handleCanvasClick}
        data-canvas-background="true"
      >
        <div className="flex justify-center items-start min-h-full">
          {/* Canvas Container */}
          <motion.div
            initial={false}
            animate={{ width: canvasWidth * scaleFactor }}
            transition={{ duration: 0.2 }}
            className="origin-top"
            style={{
              transform: `scale(${scaleFactor})`,
              transformOrigin: 'top center',
            }}
          >
            <div
              className={cn(
                'bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden',
                isDraggingFromPalette && 'ring-2 ring-primary-500/50 ring-dashed'
              )}
              style={{
                width: canvasWidth,
                ...temaStyles,
              }}
            >
              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
              )}

              {/* Empty State - Droppable */}
              {!isLoading && bloques.length === 0 && (
                <EmptyCanvasDropZone isDraggingFromPalette={isDraggingFromPalette} />
              )}

              {/* Blocks */}
              {!isLoading && bloques.length > 0 && (
                <SortableContext
                  items={bloquesIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="relative">
                    {bloques.map((bloque, index) => (
                      <CanvasBlock
                        key={bloque.id}
                        bloque={bloque}
                        tema={tema}
                        isSelected={bloqueSeleccionado === bloque.id}
                        isEditing={bloqueEditandoInline === bloque.id}
                        onClick={() => handleBloqueClick(bloque.id)}
                        onDoubleClick={() => handleBloqueDoubleClick(bloque.id)}
                        onContentChange={(contenido) =>
                          handleContentChange(bloque.id, contenido)
                        }
                        onToggleVisibility={handleToggleVisibility}
                        onDuplicate={handleDuplicate}
                        onDelete={handleDelete}
                        isDragOver={overInfo?.id === bloque.id && isDraggingFromPalette}
                        dropPosition={overInfo?.id === bloque.id ? overInfo.position : null}
                        isFirstBlock={index === 0}
                        isLastBlock={index === bloques.length - 1}
                      />
                    ))}
                    {/* Drop zone at end of blocks */}
                    <EndDropZone isDraggingFromPalette={isDraggingFromPalette} />
                  </div>
                </SortableContext>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ========== END DROP ZONE ==========

/**
 * Zona de drop al final de los bloques
 */
function EndDropZone({ isDraggingFromPalette }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'end-of-canvas',
  });

  if (!isDraggingFromPalette) return null;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'h-24 border-2 border-dashed rounded-lg transition-all flex items-center justify-center',
        isOver
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
      )}
    >
      <p className={cn(
        'text-sm',
        isOver ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
      )}>
        {isOver ? 'Soltar aqui' : 'Arrastra aqui para agregar al final'}
      </p>
    </div>
  );
}

// ========== EMPTY STATE WITH DROP ZONE ==========

function EmptyCanvasDropZone({ isDraggingFromPalette }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'empty-canvas',
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col items-center justify-center py-20 px-6 text-center transition-all',
        isDraggingFromPalette && 'bg-primary-50/50 dark:bg-primary-900/20',
        isOver && 'bg-primary-100 dark:bg-primary-900/40 scale-[1.02]'
      )}
    >
      <motion.div
        animate={{
          scale: isDraggingFromPalette ? 1.1 : 1,
          borderColor: isOver ? 'rgb(117, 53, 114)' : 'rgb(209, 213, 219)',
        }}
        className={cn(
          'w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4',
          'border-2 border-dashed',
          isDraggingFromPalette && 'border-primary-400 bg-primary-100 dark:bg-primary-900/30'
        )}
      >
        {isDraggingFromPalette ? (
          <Plus className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        ) : (
          <Monitor className="w-8 h-8 text-gray-400" />
        )}
      </motion.div>

      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {isDraggingFromPalette ? 'Suelta aqui' : 'Pagina vacia'}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm">
        {isDraggingFromPalette
          ? 'Suelta el bloque para agregarlo a la pagina'
          : 'Arrastra bloques desde el panel izquierdo o usa el boton + para comenzar a disenar tu pagina.'}
      </p>
    </div>
  );
}

export default memo(EditorCanvas);

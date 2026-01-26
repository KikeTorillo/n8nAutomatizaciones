/**
 * ====================================================================
 * EDITOR CANVAS
 * ====================================================================
 * Canvas WYSIWYG principal del editor de website.
 * Permite edicion visual directa, drag-and-drop y responsive preview.
 * Soporta drops desde la paleta de bloques.
 */

import { useCallback, useMemo, memo, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Monitor,
  Tablet,
  Smartphone,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Loader2,
  Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useWebsiteEditorStore, useTemporalStore } from '@/store';
import { useEstadoGuardado } from '../hooks';
import { useDndEditor } from './DndEditorProvider';

// Canvas blocks
import CanvasBlock from './canvas-blocks/CanvasBlock';

// ========== CONSTANTS ==========

const BREAKPOINTS = {
  desktop: { width: 1200, icon: Monitor, label: 'Desktop' },
  tablet: { width: 768, icon: Tablet, label: 'Tablet' },
  mobile: { width: 375, icon: Smartphone, label: 'Mobile' },
};

const ZOOM_LEVELS = [50, 75, 100, 125, 150, 200];

// ========== MAIN COMPONENT ==========

/**
 * Canvas WYSIWYG principal
 *
 * @param {Object} props
 * @param {Array} props.bloques - Lista de bloques a renderizar
 * @param {Object} props.tema - Tema del sitio (colores, fuentes)
 * @param {Function} props.onReordenar - Callback para reordenar bloques
 * @param {Function} props.onActualizarBloque - Callback para actualizar bloque
 * @param {boolean} props.isLoading - Si esta cargando
 */
function EditorCanvas({
  bloques = [],
  tema,
  onReordenar,
  onActualizarBloque,
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
  const setBreakpoint = useWebsiteEditorStore((state) => state.setBreakpoint);
  const setZoom = useWebsiteEditorStore((state) => state.setZoom);
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

  // Estado de guardado
  const estadoGuardado = useEstadoGuardado();

  // Temporal store para undo/redo
  const temporal = useTemporalStore();
  const canUndo = temporal?.pastStates?.length > 0;
  const canRedo = temporal?.futureStates?.length > 0;

  // Contexto DnD compartido
  const dndContext = useDndEditor();
  const isDraggingFromPalette = dndContext?.isDraggingFromPalette || false;
  const overInfo = dndContext?.overInfo;

  // Estado de drag interno para sortable
  const [activeDragId, setActiveDragId] = useState(null);

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
   */
  const handleBloqueClick = useCallback(
    (id) => {
      seleccionarBloque(id);
    },
    [seleccionarBloque]
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

  // ========== COMPUTED ==========

  const canvasWidth = BREAKPOINTS[breakpoint].width;
  const scaleFactor = zoom / 100;

  const bloquesIds = useMemo(() => bloques.map((b) => b.id), [bloques]);

  const activeBloque = useMemo(
    () => bloques.find((b) => b.id === activeDragId),
    [bloques, activeDragId]
  );

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
      {/* Toolbar */}
      <CanvasToolbar
        breakpoint={breakpoint}
        onBreakpointChange={setBreakpoint}
        zoom={zoom}
        onZoomChange={setZoom}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={() => temporal?.undo?.()}
        onRedo={() => temporal?.redo?.()}
        estadoGuardado={estadoGuardado}
      />

      {/* Canvas Area */}
      <div
        className="flex-1 overflow-auto p-6"
        onClick={handleCanvasClick}
        data-canvas-background="true"
      >
        <div className="flex justify-center min-h-full">
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


// ========== TOOLBAR COMPONENT ==========

const CanvasToolbar = memo(function CanvasToolbar({
  breakpoint,
  onBreakpointChange,
  zoom,
  onZoomChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  estadoGuardado,
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Left: Undo/Redo */}
      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={cn(
            'p-2 rounded-lg transition-colors',
            canUndo
              ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
          )}
          title="Deshacer (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={cn(
            'p-2 rounded-lg transition-colors',
            canRedo
              ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
          )}
          title="Rehacer (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />

        {/* Save Status */}
        <div
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs',
            estadoGuardado.bgColor,
            estadoGuardado.color
          )}
        >
          {estadoGuardado.icono === 'loader' && (
            <Loader2 className="w-3 h-3 animate-spin" />
          )}
          {estadoGuardado.icono === 'check' && (
            <span className="w-1.5 h-1.5 bg-current rounded-full" />
          )}
          {estadoGuardado.icono === 'circle' && (
            <span className="w-1.5 h-1.5 border border-current rounded-full" />
          )}
          {estadoGuardado.icono === 'alert' && (
            <span className="text-xs">!</span>
          )}
          <span>{estadoGuardado.texto}</span>
        </div>
      </div>

      {/* Center: Breakpoints */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {Object.entries(BREAKPOINTS).map(([key, { icon: Icon, label }]) => (
          <button
            key={key}
            onClick={() => onBreakpointChange(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
              breakpoint === key
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            )}
            title={label}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Right: Zoom */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onZoomChange(Math.max(50, zoom - 25))}
          disabled={zoom <= 50}
          className={cn(
            'p-2 rounded-lg transition-colors',
            zoom > 50
              ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
          )}
          title="Alejar"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <select
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="px-2 py-1 text-sm bg-transparent border border-gray-200 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          {ZOOM_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}%
            </option>
          ))}
        </select>

        <button
          onClick={() => onZoomChange(Math.min(200, zoom + 25))}
          disabled={zoom >= 200}
          className={cn(
            'p-2 rounded-lg transition-colors',
            zoom < 200
              ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
          )}
          title="Acercar"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

// ========== EMPTY STATE WITH DROP ZONE ==========

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

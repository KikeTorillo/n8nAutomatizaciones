/**
 * ====================================================================
 * CANVAS CONTAINER - INVITACIONES
 * ====================================================================
 * Canvas central donde se renderizan los bloques de la invitación.
 *
 * @version 1.1.0
 * @since 2026-02-03
 * @updated 2026-02-04 - Integración completa con DnD context y breakpoints
 */

import { memo, useCallback, useMemo } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Layout, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CanvasBlock } from '../components/canvas-blocks';
import { useInvitacionEditor } from '../context';
import { useDndEditor, useBlockSelection, useInlineEditing, BREAKPOINTS } from '@/components/editor-framework';
import { useInvitacionEditorStore } from '@/store';

/**
 * CanvasContainer - Canvas central del editor
 */
function CanvasContainer() {
  const {
    evento,
    bloques,
    bloqueSeleccionado,
    modoPreview,
    handleActualizarBloque,
    handleEliminarBloque,
    handleDuplicarBloque,
    handleToggleVisibilidad,
    seleccionarBloque,
    deseleccionarBloque,
    abrirPropiedades,
  } = useInvitacionEditor();

  // Hook para selección de bloques + apertura de propiedades
  const { handleBloqueClick } = useBlockSelection({
    seleccionarBloque,
    abrirPropiedades,
  });

  // Hook para edición inline
  const { bloqueEditandoInline, activarEdicion, desactivarEdicion } = useInlineEditing({
    useStore: useInvitacionEditorStore,
  });

  // Contexto DnD compartido
  const dndContext = useDndEditor();
  const isDraggingFromPalette = dndContext?.isDraggingFromPalette || false;
  const overInfo = dndContext?.overInfo;

  // Breakpoint del store
  const breakpoint = useInvitacionEditorStore((s) => s.breakpoint);

  // Droppable para la zona del canvas
  const { setNodeRef } = useDroppable({
    id: 'canvas-drop-zone',
    data: { type: 'canvas' },
  });

  // IDs de bloques para SortableContext
  const bloqueIds = useMemo(() => bloques.map((b) => b.id), [bloques]);

  // Tema del evento (o defaults)
  const tema = useMemo(
    () => ({
      color_primario: evento?.plantilla?.color_primario || '#753572',
      color_secundario: evento?.plantilla?.color_secundario || '#F59E0B',
      fuente_titulos: evento?.plantilla?.fuente_titulos || 'Playfair Display',
      fuente_cuerpo: evento?.plantilla?.fuente_cuerpo || 'Inter',
    }),
    [evento]
  );

  // Datos del evento para los canvas blocks
  const eventoData = useMemo(
    () => ({
      ubicaciones: evento?.ubicaciones || [],
      galeria: evento?.galeria || [],
      mesaRegalos: evento?.mesa_regalos || null,
    }),
    [evento]
  );

  // Handler para click en el canvas (deseleccionar)
  const handleCanvasClick = useCallback(
    (e) => {
      // Solo deseleccionar si el click es directamente en el canvas
      if (e.target === e.currentTarget) {
        deseleccionarBloque();
        desactivarEdicion();
      }
    },
    [deseleccionarBloque, desactivarEdicion]
  );

  // Handler para contenido inline
  const handleContentChange = useCallback(
    (bloqueId, cambios) => {
      handleActualizarBloque(bloqueId, cambios);
    },
    [handleActualizarBloque]
  );

  // Calcular ancho del canvas según breakpoint
  const canvasWidth = useMemo(() => {
    const bp = BREAKPOINTS.find((b) => b.id === breakpoint);
    return bp?.width || '100%';
  }, [breakpoint]);

  return (
    <main
      ref={setNodeRef}
      onClick={handleCanvasClick}
      className={cn(
        'flex-1 overflow-y-auto',
        'bg-gray-100 dark:bg-gray-900',
        isDraggingFromPalette && 'ring-2 ring-inset ring-primary-500/50 ring-dashed'
      )}
      style={{
        '--color-primario': tema.color_primario,
        '--color-secundario': tema.color_secundario,
        '--fuente-titulos': tema.fuente_titulos,
        '--fuente-cuerpo': tema.fuente_cuerpo,
      }}
    >
      {/* Contenedor del canvas - ancho según breakpoint */}
      <div
        className="mx-auto py-8 px-4 transition-all duration-300"
        style={{ maxWidth: canvasWidth }}
      >
        {/* Preview wrapper con estilos del tema */}
        <div
          className={cn(
            'bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden',
            'ring-1 ring-gray-200 dark:ring-gray-700'
          )}
        >
          {bloques.length > 0 ? (
            <SortableContext items={bloqueIds} strategy={verticalListSortingStrategy}>
              <div className="relative">
                {bloques
                  .filter((b) => modoPreview ? b.visible : true)
                  .sort((a, b) => a.orden - b.orden)
                  .map((bloque, index) => (
                    <CanvasBlock
                      key={bloque.id}
                      bloque={bloque}
                      tema={tema}
                      isSelected={bloqueSeleccionado === bloque.id}
                      isEditing={bloqueEditandoInline === bloque.id}
                      isDragOver={overInfo?.id === bloque.id && isDraggingFromPalette}
                      dropPosition={overInfo?.id === bloque.id ? overInfo.position : null}
                      isFirstBlock={index === 0}
                      eventoData={eventoData}
                      onClick={() => handleBloqueClick(bloque.id)}
                      onDoubleClick={() => activarEdicion(bloque.id)}
                      onContentChange={(cambios) => handleContentChange(bloque.id, cambios)}
                      onDuplicate={handleDuplicarBloque}
                      onDelete={handleEliminarBloque}
                      onToggleVisibility={handleToggleVisibilidad}
                    />
                  ))}
                {/* Drop zone al final de los bloques */}
                <EndDropZone isDraggingFromPalette={isDraggingFromPalette} />
              </div>
            </SortableContext>
          ) : (
            /* Empty state con drop zone */
            <EmptyCanvasDropZone isDraggingFromPalette={isDraggingFromPalette} />
          )}
        </div>
      </div>
    </main>
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
        'h-24 border-2 border-dashed rounded-lg transition-all flex items-center justify-center m-4',
        isOver
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
      )}
    >
      <p className={cn(
        'text-sm',
        isOver ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
      )}>
        {isOver ? 'Soltar aquí' : 'Arrastra aquí para agregar al final'}
      </p>
    </div>
  );
}

// ========== EMPTY STATE WITH DROP ZONE ==========

/**
 * Estado vacío con zona de drop
 */
function EmptyCanvasDropZone({ isDraggingFromPalette }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'empty-canvas',
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col items-center justify-center py-32 px-6 text-center transition-all',
        isDraggingFromPalette && 'bg-primary-50/50 dark:bg-primary-900/20',
        isOver && 'bg-primary-100 dark:bg-primary-900/40'
      )}
    >
      <div
        className={cn(
          'w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4',
          'border-2 border-dashed transition-all',
          isDraggingFromPalette
            ? 'border-primary-400 bg-primary-100 dark:bg-primary-900/30 scale-110'
            : 'border-gray-300 dark:border-gray-600'
        )}
      >
        {isDraggingFromPalette ? (
          <Plus className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        ) : (
          <Layout className="w-8 h-8 text-gray-400" />
        )}
      </div>

      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {isDraggingFromPalette ? 'Suelta aquí' : 'Tu invitación está vacía'}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm">
        {isDraggingFromPalette
          ? 'Suelta el bloque para agregarlo a la invitación'
          : 'Arrastra bloques desde la barra lateral o haz clic en ellos para empezar a diseñar tu invitación.'}
      </p>
    </div>
  );
}

export default memo(CanvasContainer);

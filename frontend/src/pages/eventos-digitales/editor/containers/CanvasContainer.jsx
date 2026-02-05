/**
 * ====================================================================
 * CANVAS CONTAINER - INVITACIONES
 * ====================================================================
 * Canvas central donde se renderizan los bloques de la invitación.
 * Soporta dos modos: 'canvas' (visual) y 'bloques' (acordeón).
 *
 * @version 1.4.0
 * @since 2026-02-03
 * @updated 2026-02-04 - Agregado modo bloques con BlockListEditor
 */

import { memo, useCallback, useMemo, lazy, Suspense } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Layout, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CanvasBlock } from '../components/canvas-blocks';
import { useInvitacionEditor } from '../context';
import {
  useDndEditor,
  useBlockSelection,
  useInlineEditing,
  BREAKPOINTS,
  useEditorLayoutContext,
  BlockListEditor,
  FreePositionCanvas,
} from '@/components/editor-framework';
import { useInvitacionEditorStore } from '@/store';
import { EDITORES_BLOQUE } from '../components/blocks';
import { BLOCK_ICONS, BLOCK_NAMES } from '../config/invitacionBlocks';

// ========== LAZY LOADED CUSTOM RENDERERS PARA INVITACIONES ==========

const CountdownElementRenderer = lazy(() =>
  import('@/components/editor-framework/elements/renderers/CountdownElementRenderer')
);
const CalendarioElementRenderer = lazy(() =>
  import('@/components/editor-framework/elements/renderers/CalendarioElementRenderer')
);
const RsvpButtonElementRenderer = lazy(() =>
  import('@/components/editor-framework/elements/renderers/RsvpButtonElementRenderer')
);
const TimelineElementRenderer = lazy(() =>
  import('@/components/editor-framework/elements/renderers/TimelineElementRenderer')
);
const HeroInvitacionElementRenderer = lazy(() =>
  import('@/components/editor-framework/elements/renderers/HeroInvitacionElementRenderer')
);
const ProtagonistasElementRenderer = lazy(() =>
  import('@/components/editor-framework/elements/renderers/ProtagonistasElementRenderer')
);
const UbicacionElementRenderer = lazy(() =>
  import('@/components/editor-framework/elements/renderers/UbicacionElementRenderer')
);
const GaleriaElementRenderer = lazy(() =>
  import('@/components/editor-framework/elements/renderers/GaleriaElementRenderer')
);
const FaqElementRenderer = lazy(() =>
  import('@/components/editor-framework/elements/renderers/FaqElementRenderer')
);
const MesaRegalosElementRenderer = lazy(() =>
  import('@/components/editor-framework/elements/renderers/MesaRegalosElementRenderer')
);

/**
 * Renderers personalizados para elementos específicos de invitaciones
 */
const INVITACION_CUSTOM_RENDERERS = {
  // Elementos básicos de invitaciones
  countdown: CountdownElementRenderer,
  calendario: CalendarioElementRenderer,
  rsvp_button: RsvpButtonElementRenderer,
  timeline: TimelineElementRenderer,
  // Elementos complejos de invitaciones
  hero_invitacion: HeroInvitacionElementRenderer,
  protagonistas: ProtagonistasElementRenderer,
  ubicacion: UbicacionElementRenderer,
  galeria: GaleriaElementRenderer,
  faq: FaqElementRenderer,
  mesa_regalos: MesaRegalosElementRenderer,
};

// ========== CONFIGURACIÓN PARA BLOCKLIST ==========

/**
 * Config de bloques para BlockListEditor (icon, label, color por tipo)
 */
const BLOQUES_CONFIG_INVITACIONES = Object.fromEntries(
  Object.entries(BLOCK_ICONS).map(([tipo, icon]) => [
    tipo,
    {
      icon,
      label: BLOCK_NAMES[tipo] || tipo,
      color: 'primary', // Usamos color primario para todos
    },
  ])
);

// ========== CANVAS CONTAINER ==========

/**
 * CanvasContainer - Canvas central del editor
 * Renderiza vista visual o lista de bloques según modoEditor
 */
function CanvasContainer() {
  const {
    evento,
    bloques,
    bloqueSeleccionado,
    modoPreview,
    modoEditor,
    breakpoint,
    zoom,
    tema,
    isLoading,
    handleActualizarBloque,
    handleEliminarBloque,
    handleDuplicarBloque,
    handleToggleVisibilidad,
    handleReordenarBloques,
    seleccionarBloque,
    deseleccionarBloque,
    getFreePositionStore,
  } = useInvitacionEditor();

  // Usar abrirPropiedades del layout context (única fuente de verdad)
  const { abrirPropiedades } = useEditorLayoutContext();

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

  // Droppable para la zona del canvas
  const { setNodeRef } = useDroppable({
    id: 'canvas-drop-zone',
    data: { type: 'canvas' },
  });

  // IDs de bloques para SortableContext
  const bloqueIds = useMemo(() => bloques.map((b) => b.id), [bloques]);

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

  // Calcular escala del zoom (zoom viene como porcentaje: 50, 75, 100, etc.)
  const zoomScale = zoom / 100;

  // ========== HOOKS MODO LIBRE (siempre se llaman para cumplir reglas de hooks) ==========
  const freeStore = getFreePositionStore();
  const secciones = freeStore((s) => s.secciones);
  const seccionSeleccionada = freeStore((s) => s.seccionSeleccionada);
  const elementoSeleccionado = freeStore((s) => s.elementoSeleccionado);
  const elementoEditando = freeStore((s) => s.elementoEditando);

  // Callbacks del store libre (memoizados)
  const freeStoreActions = useMemo(() => ({
    seleccionarSeccion: (id) => freeStore.getState().seleccionarSeccion(id),
    seleccionarElemento: (elementoId, seccionId) => freeStore.getState().seleccionarElemento(elementoId, seccionId),
    deseleccionarTodo: () => freeStore.getState().deseleccionarTodo(),
    moverElemento: (elementoId, seccionId, pos) => freeStore.getState().moverElemento(elementoId, seccionId, pos),
    redimensionarElemento: (elementoId, seccionId, size) => freeStore.getState().redimensionarElemento(elementoId, seccionId, size),
    activarEdicionElemento: (elementoId) => freeStore.getState().activarEdicionElemento(elementoId),
    actualizarElemento: (elementoId, cambios) => freeStore.getState().actualizarElemento(elementoId, cambios),
  }), [freeStore]);

  // ========== MODO LIBRE (Free Position Canvas) ==========
  if (modoEditor === 'libre') {
    return (
      <main className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900">
        <FreePositionCanvas
          secciones={secciones}
          selectedSectionId={seccionSeleccionada}
          selectedElementId={elementoSeleccionado}
          editingElementId={elementoEditando}
          onSelectSection={freeStoreActions.seleccionarSeccion}
          onSelectElement={freeStoreActions.seleccionarElemento}
          onDeselectAll={freeStoreActions.deseleccionarTodo}
          onMoveElement={freeStoreActions.moverElemento}
          onResizeElement={freeStoreActions.redimensionarElemento}
          onElementDoubleClick={freeStoreActions.activarEdicionElemento}
          onContentChange={freeStoreActions.actualizarElemento}
          breakpoint={breakpoint}
          zoom={zoom}
          tema={tema}
          isPreviewMode={modoPreview}
          customRenderers={INVITACION_CUSTOM_RENDERERS}
          evento={evento}
        />
      </main>
    );
  }

  // ========== MODO BLOQUES (Lista acordeón) ==========
  if (modoEditor === 'bloques') {
    return (
      <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900">
        <BlockListEditor
          bloques={bloques}
          bloqueSeleccionado={bloqueSeleccionado}
          bloquesConfig={BLOQUES_CONFIG_INVITACIONES}
          editoresBloque={EDITORES_BLOQUE}
          onSeleccionar={(bloque) => seleccionarBloque(bloque.id)}
          onActualizar={handleActualizarBloque}
          onEliminar={handleEliminarBloque}
          onDuplicar={handleDuplicarBloque}
          onReordenar={handleReordenarBloques}
          isLoading={isLoading}
          tema={tema}
          emptyTitle="Invitación vacía"
          emptyMessage="Agrega bloques desde la paleta lateral para empezar a diseñar tu invitación"
          editorExtraProps={{ evento }}
        />
      </main>
    );
  }

  // ========== MODO CANVAS (Visual) ==========
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
        '--color-primario': tema?.color_primario || '#753572',
        '--color-secundario': tema?.color_secundario || '#F59E0B',
        '--fuente-titulos': tema?.fuente_titulos || 'Playfair Display',
        '--fuente-cuerpo': tema?.fuente_cuerpo || 'Inter',
      }}
    >
      {/* Contenedor del canvas - ancho según breakpoint + zoom */}
      <div
        className="mx-auto py-8 px-4 transition-all duration-300 origin-top"
        style={{
          maxWidth: canvasWidth,
          transform: `scale(${zoomScale})`,
        }}
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
                      evento={evento}
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

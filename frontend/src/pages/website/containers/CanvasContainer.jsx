/**
 * ====================================================================
 * CANVAS CONTAINER
 * ====================================================================
 * Container para el área principal del canvas.
 * Envuelve EditorCanvas y maneja el modo de edición.
 *
 * @version 1.1.0
 * @since 2026-02-03
 * @updated 2026-02-04 - Fix: abrir propiedades al click en bloque seleccionado
 */

import { memo } from 'react';
import { useWebsiteEditorContext } from '../context';
import { useBlockSelection } from '@/components/editor-framework';
import EditorCanvas from '../components/EditorCanvas';
import BlockEditor from '../components/BlockEditor';

/**
 * CanvasContainer - Área principal del editor
 *
 * Renderiza según modoEditor:
 * - 'canvas': EditorCanvas (modo visual WYSIWYG)
 * - 'bloques': BlockEditor (modo lista de bloques)
 */
function CanvasContainer() {
  const {
    // Estado
    modoEditor,
    paginaActiva,
    bloques,
    bloqueSeleccionado,
    bloquesLoading,
    config,

    // Handlers
    handleActualizarBloque,
    handleEliminarBloque,
    handleDuplicarBloque,
    handleToggleVisibilidad,
    handleReordenarBloques,

    // Store actions
    seleccionarBloque,

    // Layout
    abrirPropiedades,
  } = useWebsiteEditorContext();

  // Hook para selección de bloques + apertura de propiedades
  const { handleBloqueClick } = useBlockSelection({
    seleccionarBloque,
    abrirPropiedades,
  });

  return (
    <main className="flex-1 overflow-hidden" data-tour="editor-canvas">
      {modoEditor === 'canvas' ? (
        <EditorCanvas
          bloques={bloques}
          tema={config}
          onBloqueClick={handleBloqueClick}
          onReordenar={handleReordenarBloques}
          onActualizarBloque={handleActualizarBloque}
          onEliminarBloque={handleEliminarBloque}
          onDuplicarBloque={handleDuplicarBloque}
          onToggleVisibilidad={handleToggleVisibilidad}
          isLoading={bloquesLoading}
        />
      ) : (
        <div className="h-full overflow-y-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
          <BlockEditor
            pagina={paginaActiva}
            bloques={bloques}
            bloqueSeleccionado={bloqueSeleccionado}
            onSeleccionar={seleccionarBloque}
            onActualizar={handleActualizarBloque}
            onEliminar={handleEliminarBloque}
            onDuplicar={handleDuplicarBloque}
            onReordenar={handleReordenarBloques}
            isLoading={bloquesLoading}
            tema={config}
            industria={config?.industria || 'default'}
          />
        </div>
      )}
    </main>
  );
}

export default memo(CanvasContainer);

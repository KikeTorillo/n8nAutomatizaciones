/**
 * ====================================================================
 * EDITOR HEADER - Website Container
 * ====================================================================
 * Wrapper del EditorHeader + EditorToolbar del framework para Website Builder.
 * Conecta con el contexto del editor y los hooks de undo/redo.
 *
 * @version 3.1.0
 * @since 2026-02-03
 * @updated 2026-02-04 - Agregado preview mode
 */

import { memo } from 'react';
import { Globe2 } from 'lucide-react';
import {
  EditorHeader as EditorHeaderBase,
  EditorToolbar,
} from '@/components/editor-framework';
import { useWebsiteEditorContext } from '../context';
import { useUndo, useRedo, useCanUndoRedo, useWebsiteEditorStore } from '@/store';

/**
 * EditorHeader - Cabecera del editor de Website (Header + Toolbar)
 */
function EditorHeader() {
  const {
    // Estado
    config,
    estaPublicado,
    modoEditor,
    setModoEditor,
    modoPreview,
    setModoPreview,

    // Layout
    isMobile,

    // Handlers
    handlePublicar,

    // Mutations
    publicarSitio,
  } = useWebsiteEditorContext();

  // Undo/Redo del store
  const undo = useUndo();
  const redo = useRedo();
  const { canUndo, canRedo } = useCanUndoRedo();

  // Breakpoint y Zoom del store
  const breakpoint = useWebsiteEditorStore((s) => s.breakpoint);
  const setBreakpoint = useWebsiteEditorStore((s) => s.setBreakpoint);
  const zoom = useWebsiteEditorStore((s) => s.zoom);
  const setZoom = useWebsiteEditorStore((s) => s.setZoom);

  // Estado de guardado
  const estadoGuardado = useWebsiteEditorStore((s) => s.estadoGuardado);

  return (
    <>
      {/* Header minimalista: navegación + identidad + publicación */}
      <EditorHeaderBase
        // Info del documento
        title={config?.nombre_sitio || 'Mi Sitio'}
        icon={Globe2}
        status={estaPublicado ? 'published' : 'draft'}

        // Navegación
        backTo="/home"
        backLabel="Volver"

        // Publicación
        onPublish={handlePublicar}
        isPublishing={publicarSitio.isPending}
        publishLabels={{ publish: 'Publicar', unpublish: 'Despublicar' }}

        // Ver publicado
        viewUrl={estaPublicado && config?.slug ? `/sitio/${config.slug}` : undefined}
        viewLabel="Ver sitio"

        // Responsive
        isMobile={isMobile}
      />

      {/* Toolbar: controles de edición */}
      <EditorToolbar
        // Undo/Redo
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}

        // Modos de editor
        editorMode={modoEditor === 'bloques' ? 'blocks' : 'canvas'}
        onEditorModeChange={(mode) => setModoEditor(mode === 'blocks' ? 'bloques' : 'canvas')}
        showEditorModeToggle={true}

        // Breakpoints
        breakpoint={breakpoint}
        onBreakpointChange={setBreakpoint}
        showBreakpoints={true}

        // Zoom (solo en modo canvas)
        zoom={zoom}
        onZoomChange={setZoom}
        showZoom={modoEditor === 'canvas'}

        // Estado de guardado
        saveStatus={estadoGuardado}

        // Preview mode
        previewMode={modoPreview}
        onPreviewModeChange={setModoPreview}
        showPreviewToggle={true}

        // Responsive
        isMobile={isMobile}
      />
    </>
  );
}

export default memo(EditorHeader);

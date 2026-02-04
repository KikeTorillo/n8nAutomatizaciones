/**
 * ====================================================================
 * EDITOR HEADER - Invitaciones Container
 * ====================================================================
 * Wrapper del EditorHeader + EditorToolbar del framework para Editor de Invitaciones.
 * Conecta con el contexto del editor y los hooks de undo/redo.
 *
 * @version 3.4.0
 * @since 2026-02-03
 * @updated 2026-02-04 - Zoom expuesto via context
 */

import { memo } from 'react';
import { Heart, Star, Gift, Calendar, Building2 } from 'lucide-react';
import {
  EditorHeader as EditorHeaderBase,
  EditorToolbar,
  useEditorLayoutContext,
} from '@/components/editor-framework';
import { useInvitacionEditor } from '../context';
import {
  useInvitacionUndo,
  useInvitacionRedo,
  useInvitacionCanUndoRedo,
} from '@/store';

// ========== ICONOS POR TIPO DE EVENTO ==========

const EVENTO_ICONS = {
  boda: Heart,
  xv_anos: Star,
  bautizo: Gift,
  cumpleanos: Calendar,
  corporativo: Building2,
  otro: Calendar,
};

/**
 * EditorHeader - Cabecera del editor de Invitaciones (Header + Toolbar)
 */
function EditorHeader() {
  const {
    evento,
    estadoGuardado,
    estaPublicando,
    estaPublicado,
    modoPreview,
    setModoPreview,
    modoEditor,
    setModoEditor,
    breakpoint,
    setBreakpoint,
    zoom,
    setZoom,
    handlePublicar,
  } = useInvitacionEditor();

  // Layout context para responsive
  const { isMobile, isTablet } = useEditorLayoutContext();

  // Undo/Redo hooks
  const undo = useInvitacionUndo();
  const redo = useInvitacionRedo();
  const { canUndo, canRedo } = useInvitacionCanUndoRedo();

  // Icono según tipo de evento
  const EventoIcon = EVENTO_ICONS[evento?.tipo_evento] || Calendar;

  return (
    <>
      {/* Header minimalista: navegación + identidad + publicación */}
      <EditorHeaderBase
        // Info del documento
        title={evento?.nombre || 'Mi Invitación'}
        icon={EventoIcon}
        status={estaPublicado ? 'published' : 'draft'}
        statusLabels={{ draft: 'Borrador', published: 'Publicada' }}

        // Navegación
        backTo="/eventos-digitales"
        backLabel="Volver"

        // Publicación
        onPublish={handlePublicar}
        isPublishing={estaPublicando}
        publishLabels={{ publish: 'Publicar', unpublish: 'Despublicar' }}

        // Ver publicado
        viewUrl={estaPublicado && evento?.slug ? `/e/${evento.slug}` : undefined}
        viewLabel="Ver invitación"

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

        // Modos de editor (Visual/Bloques)
        editorMode={modoEditor === 'bloques' ? 'blocks' : 'canvas'}
        onEditorModeChange={(mode) => setModoEditor(mode === 'blocks' ? 'bloques' : 'canvas')}
        showEditorModeToggle={!isMobile}

        // Breakpoints (ocultar en móvil/tablet - no tiene sentido)
        breakpoint={breakpoint}
        onBreakpointChange={setBreakpoint}
        showBreakpoints={!isMobile && !isTablet}

        // Zoom (solo en modo canvas)
        zoom={zoom}
        onZoomChange={setZoom}
        showZoom={!isMobile && modoEditor === 'canvas'}

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

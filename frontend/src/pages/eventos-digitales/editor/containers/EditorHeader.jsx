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

import { memo, useState, useCallback } from 'react';
import { Heart, Star, Gift, Calendar, Building2 } from 'lucide-react';
import {
  EditorHeader as EditorHeaderBase,
  EditorToolbar,
  useEditorLayoutContext,
} from '@/components/editor-framework';
import { ConfirmDialog } from '@/components/ui';
import { useEditor as useInvitacionEditor } from '@/components/editor-framework';
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
    esModoLibreGuardado,
    modoPreview,
    setModoPreview,
    modoEditor,
    setModoEditor,
    breakpoint,
    setBreakpoint,
    zoom,
    setZoom,
    handlePublicar,
    cambiarAModoLibre,
    salirDeModoLibre,
    esPlantilla,
    plantilla,
    handleVolver,
  } = useInvitacionEditor();

  // Layout context para responsive
  const { isMobile, isTablet } = useEditorLayoutContext();

  // Estado para diálogo de confirmación al salir de modo libre
  const [confirmExitDialog, setConfirmExitDialog] = useState({ open: false, targetMode: null });

  // Handler cuando el usuario intenta salir del modo libre
  const handleFreeModeExit = useCallback((targetMode) => {
    setConfirmExitDialog({ open: true, targetMode });
  }, []);

  // Confirmar salida del modo libre
  const handleConfirmExit = useCallback(() => {
    const targetMode = confirmExitDialog.targetMode;
    setConfirmExitDialog({ open: false, targetMode: null });
    salirDeModoLibre(targetMode === 'blocks' ? 'bloques' : 'canvas');
  }, [confirmExitDialog.targetMode, salirDeModoLibre]);

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
        title={esPlantilla ? (plantilla?.nombre || 'Plantilla') : (evento?.nombre || 'Mi Invitación')}
        icon={EventoIcon}
        status={estaPublicado ? 'published' : 'draft'}
        statusLabels={{ draft: 'Borrador', published: 'Publicada' }}

        // Navegación
        backTo={esPlantilla ? '/eventos-digitales/plantillas' : '/eventos-digitales'}
        backLabel="Volver"
        onBack={handleVolver}

        // Publicación (oculto en plantillas)
        onPublish={esPlantilla ? undefined : handlePublicar}
        isPublishing={esPlantilla ? false : estaPublicando}
        publishLabels={{ publish: 'Publicar', unpublish: 'Despublicar' }}

        // Ver publicado (oculto en plantillas)
        viewUrl={!esPlantilla && estaPublicado && evento?.slug ? `/e/${evento.slug}` : undefined}
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

        // Modos de editor (Visual/Bloques/Libre)
        editorMode={modoEditor === 'bloques' ? 'blocks' : modoEditor === 'libre' ? 'free' : 'canvas'}
        onEditorModeChange={(mode) => {
          if (mode === 'free') {
            cambiarAModoLibre();
          } else {
            setModoEditor(mode === 'blocks' ? 'bloques' : 'canvas');
          }
        }}
        showEditorModeToggle={!isMobile}
        showFreeMode={!esPlantilla}
        isFreeModeOnly={esModoLibreGuardado}
        onFreeModeExit={handleFreeModeExit}

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

      {/* Diálogo de confirmación para salir del modo libre */}
      <ConfirmDialog
        isOpen={confirmExitDialog.open}
        onClose={() => setConfirmExitDialog({ open: false, targetMode: null })}
        title="Cambiar modo de edición"
        message="El modo libre tiene posicionamiento personalizado que no es compatible con el modo tradicional. Al cambiar, los elementos se convertirán a bloques secuenciales y perderás el posicionamiento libre."
        confirmText="Cambiar de todos modos"
        cancelText="Cancelar"
        onConfirm={handleConfirmExit}
        variant="warning"
      />
    </>
  );
}

export default memo(EditorHeader);

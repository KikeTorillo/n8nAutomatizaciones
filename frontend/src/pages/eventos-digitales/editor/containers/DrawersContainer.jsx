/**
 * ====================================================================
 * DRAWERS CONTAINER - INVITACIONES
 * ====================================================================
 * Container para los drawers móviles del editor de invitaciones.
 *
 * @version 2.0.0 - Refactor: useImageHandlers + useThemeSave
 * @since 2026-02-04
 * @updated 2026-02-06
 */

import { memo } from 'react';
import {
  EditorDrawer,
  PropertiesPanel,
  useEditorLayoutContext,
  BlockPalette,
  ThemeEditorPanel,
  useThemeSave,
} from '@/components/editor-framework';
import { useEditor as useInvitacionEditor } from '@/components/editor-framework';
import {
  BLOQUES_INVITACION,
  CATEGORIAS_BLOQUES,
  BLOCK_CONFIGS,
  BLOCK_NAMES,
  TEMAS_POR_TIPO,
  COLOR_FIELDS,
  FONT_FIELDS,
  extractInvitacionColors,
  extractInvitacionFonts,
  buildInvitacionThemePayload,
} from '../config';
import { useInvitacionEditorContent } from '../hooks/useInvitacionEditorContent';
import { UnsplashModal } from '@/components/shared/media/UnsplashPicker';

/**
 * DrawersContainer - Drawers móviles para el editor de invitaciones
 */
function DrawersContainer() {
  const {
    evento,
    tema,
    bloqueSeleccionadoCompleto,
    handleAgregarBloque,
    handleActualizarBloque,
    handleActualizarPlantilla,
    deseleccionarBloque,
    modoPreview,
  } = useInvitacionEditor();

  const { closeDrawer } = useEditorLayoutContext();

  // ========== EDITOR CONTENT (shared hook) ==========
  const {
    unsplashState,
    closeUnsplash,
    handleUnsplashSelect,
    editorProps,
    EditorComponent,
    handleChange,
  } = useInvitacionEditorContent();

  // ========== THEME SAVE ==========
  const { currentColors, currentFonts, handleSaveTema } = useThemeSave({
    source: evento?.plantilla,
    extractColors: extractInvitacionColors,
    extractFonts: extractInvitacionFonts,
    buildPayload: buildInvitacionThemePayload(evento?.plantilla),
    saveMutation: handleActualizarPlantilla,
  });

  // Ocultar en modo preview
  if (modoPreview) return null;

  return (
    <>
      {/* Drawer: Bloques */}
      <EditorDrawer
        panelType="bloques"
        title="Agregar bloque"
        subtitle="Toca para agregar al final"
      >
        <BlockPalette
          bloques={BLOQUES_INVITACION}
          categorias={CATEGORIAS_BLOQUES}
          onAgregarBloque={(tipo) => {
            handleAgregarBloque(tipo);
            closeDrawer();
          }}
          variant="grid"
          isInDrawer
          colorConfig={{ mode: 'uniform' }}
          showHeader={false}
          draggablePrefix="drawer-palette"
        />
      </EditorDrawer>

      {/* Drawer: Colores */}
      <EditorDrawer
        panelType="tema"
        title="Colores"
        subtitle="Personaliza los colores"
      >
        <ThemeEditorPanel
          colorFields={COLOR_FIELDS}
          currentColors={currentColors}
          fontFields={FONT_FIELDS}
          currentFonts={currentFonts}
          presetThemes={TEMAS_POR_TIPO[evento?.tipo] || TEMAS_POR_TIPO.otro}
          onSave={handleSaveTema}
          title="Colores y Tipografía"
          subtitle="Personaliza colores y fuentes de tu invitación"
        />
      </EditorDrawer>

      {/* Drawer: Propiedades */}
      <EditorDrawer
        panelType="propiedades"
        title={BLOCK_NAMES[bloqueSeleccionadoCompleto?.tipo] || 'Propiedades'}
        subtitle="Edita las propiedades del bloque"
        showCloseButton
        onClose={deseleccionarBloque}
      >
        {bloqueSeleccionadoCompleto && (
          EditorComponent ? (
            <EditorComponent
              contenido={{
                ...bloqueSeleccionadoCompleto.contenido,
                _bloqueId: bloqueSeleccionadoCompleto.id,
              }}
              estilos={bloqueSeleccionadoCompleto.estilos || {}}
              onChange={handleChange}
              {...editorProps}
            />
          ) : (
            <PropertiesPanel
              bloque={bloqueSeleccionadoCompleto}
              onSave={handleChange}
              blockConfigs={BLOCK_CONFIGS}
            />
          )
        )}
      </EditorDrawer>

      {/* Unsplash Modal */}
      <UnsplashModal
        isOpen={unsplashState.isOpen}
        onClose={closeUnsplash}
        onSelect={handleUnsplashSelect}
        industria="eventos"
      />
    </>
  );
}

export default memo(DrawersContainer);

/**
 * ====================================================================
 * USE INVITACION EDITOR CONTENT
 * ====================================================================
 * Centraliza la lógica compartida entre PropertiesContainer y DrawersContainer:
 * - useImageHandlers con config de eventos-digitales
 * - editorProps (tema, evento, ubicaciones, galeria, mesaRegalos, callbacks)
 * - EditorComponent lookup
 * - handleChange callback
 *
 * @version 1.0.0
 * @since 2026-02-06
 */

import { useMemo } from 'react';
import { useImageHandlers } from '@/components/editor-framework';
import { useEditor as useInvitacionEditor } from '@/components/editor-framework';
import { EDITORES_BLOQUE } from '../components/blocks';

/**
 * @returns {Object} Estado y callbacks compartidos para edición de bloques
 */
export function useInvitacionEditorContent() {
  const {
    evento,
    bloqueSeleccionadoCompleto,
    tema,
    handleActualizarBloque,
    handleActualizarPlantilla,
  } = useInvitacionEditor();

  // ========== IMAGE HANDLERS (Unsplash + Upload) ==========
  const {
    unsplashState,
    openUnsplash,
    closeUnsplash,
    handleUnsplashSelect,
    handleUploadImage,
  } = useImageHandlers({
    entity: bloqueSeleccionadoCompleto,
    onUpdate: handleActualizarBloque,
    uploadConfig: {
      folder: 'eventos-digitales/imagenes',
      entidadTipo: 'evento_digital',
      entidadId: evento?.id,
    },
  });

  // Props para editores específicos
  const editorProps = useMemo(
    () => ({
      tema,
      evento,
      ubicaciones: evento?.ubicaciones || [],
      galeria: evento?.galeria || [],
      mesaRegalos: evento?.mesa_regalos
        ? { tiendas: Array.isArray(evento.mesa_regalos) ? evento.mesa_regalos : evento.mesa_regalos.tiendas || [] }
        : null,
      onOpenUnsplash: openUnsplash,
      onUploadImage: handleUploadImage,
      onUpdatePlantilla: handleActualizarPlantilla,
    }),
    [tema, evento, openUnsplash, handleUploadImage, handleActualizarPlantilla]
  );

  // Editor específico
  const EditorComponent = bloqueSeleccionadoCompleto
    ? EDITORES_BLOQUE[bloqueSeleccionadoCompleto.tipo]
    : null;

  // Handler de cambios
  const handleChange = (cambios) => {
    if (bloqueSeleccionadoCompleto) {
      handleActualizarBloque(bloqueSeleccionadoCompleto.id, cambios);
    }
  };

  return {
    unsplashState,
    openUnsplash,
    closeUnsplash,
    handleUnsplashSelect,
    handleUploadImage,
    editorProps,
    EditorComponent,
    handleChange,
  };
}

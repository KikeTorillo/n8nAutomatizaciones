/**
 * ====================================================================
 * DRAWERS CONTAINER - INVITACIONES
 * ====================================================================
 * Container para los drawers móviles del editor de invitaciones.
 *
 * @version 1.3.0 - Agregado Upload de imágenes
 * @since 2026-02-04
 * @updated 2026-02-05
 */

import { memo, useMemo, useState, useCallback } from 'react';
import {
  EditorDrawer,
  PropertiesPanel,
  useEditorLayoutContext,
  BlockPalette,
} from '@/components/editor-framework';
import { useInvitacionEditor } from '../context';
import { BLOQUES_INVITACION, CATEGORIAS_BLOQUES, BLOCK_CONFIGS, BLOCK_NAMES } from '../config';
import { EDITORES_BLOQUE } from '../components/blocks';
import InvitacionThemeEditor from '../components/InvitacionThemeEditor';
import UnsplashModal from '@/pages/website/components/UnsplashPicker/UnsplashModal';
import { useUploadArchivo } from '@/hooks/utils';
import { useToast } from '@/hooks/utils';

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
    estaActualizandoPlantilla,
    deseleccionarBloque,
    modoPreview,
  } = useInvitacionEditor();

  const { closeDrawer } = useEditorLayoutContext();

  // ========== UPLOAD STATE ==========
  const uploadArchivo = useUploadArchivo();
  const toast = useToast();

  // ========== UNSPLASH STATE ==========
  const [unsplashState, setUnsplashState] = useState({
    isOpen: false,
    fieldKey: null,
  });

  const openUnsplash = useCallback((fieldKey) => {
    setUnsplashState({ isOpen: true, fieldKey });
  }, []);

  const closeUnsplash = useCallback(() => {
    setUnsplashState({ isOpen: false, fieldKey: null });
  }, []);

  const handleUnsplashSelect = useCallback(
    (url) => {
      if (bloqueSeleccionadoCompleto && unsplashState.fieldKey) {
        // Si es para galería, agregar al array
        if (unsplashState.fieldKey === 'galeria_nueva') {
          const currentImages = bloqueSeleccionadoCompleto?.contenido?.imagenes || [];
          handleActualizarBloque(bloqueSeleccionadoCompleto.id, {
            imagenes: [...currentImages, { url, alt: '' }],
          });
        } else {
          handleActualizarBloque(bloqueSeleccionadoCompleto.id, {
            [unsplashState.fieldKey]: url,
          });
        }
      }
      closeUnsplash();
    },
    [bloqueSeleccionadoCompleto, unsplashState.fieldKey, handleActualizarBloque, closeUnsplash]
  );

  // ========== UPLOAD HANDLER ==========
  const handleUploadImage = useCallback(
    async (file, fieldKey) => {
      if (!bloqueSeleccionadoCompleto) return;

      try {
        const resultado = await uploadArchivo.mutateAsync({
          file,
          folder: 'eventos-digitales/imagenes',
          isPublic: true,
          entidadTipo: 'evento_digital',
          entidadId: evento?.id,
        });

        // Si es para galería, agregar al array
        if (fieldKey === 'galeria_nueva') {
          const currentImages = bloqueSeleccionadoCompleto?.contenido?.imagenes || [];
          handleActualizarBloque(bloqueSeleccionadoCompleto.id, {
            imagenes: [...currentImages, { url: resultado.url, alt: '' }],
          });
        } else {
          // Para Hero u otros campos individuales
          handleActualizarBloque(bloqueSeleccionadoCompleto.id, {
            [fieldKey]: resultado.url,
          });
        }

        toast.success('Imagen subida correctamente');
      } catch {
        // El error ya se maneja en el hook
      }
    },
    [bloqueSeleccionadoCompleto, evento?.id, handleActualizarBloque, uploadArchivo, toast]
  );

  // Props para editores (tema viene del contexto con fuente_titulos y fuente_cuerpo)
  const editorProps = useMemo(
    () => ({
      tema,
      evento,
      ubicaciones: evento?.ubicaciones || [],
      galeria: evento?.galeria || [],
      mesaRegalos: evento?.mesa_regalos || null,
      onOpenUnsplash: openUnsplash,
      onUploadImage: handleUploadImage,
    }),
    [tema, evento, openUnsplash, handleUploadImage]
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
        <InvitacionThemeEditor
          evento={evento}
          onActualizar={handleActualizarPlantilla}
          isLoading={estaActualizandoPlantilla}
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

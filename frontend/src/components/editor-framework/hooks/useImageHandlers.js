/**
 * ====================================================================
 * USE IMAGE HANDLERS
 * ====================================================================
 * Hook reutilizable para manejo de imágenes (Unsplash + Upload).
 * Centraliza lógica duplicada entre DrawersContainer y PropertiesContainer
 * del editor de invitaciones.
 *
 * @since 2026-02-06
 */

import { useState, useCallback } from 'react';
import { useUploadArchivo, useToast } from '@/hooks/utils';

/**
 * @param {Object} options
 * @param {Object} options.entity - Entidad actual (bloque seleccionado)
 * @param {Function} options.onUpdate - Callback para actualizar el bloque (id, cambios)
 * @param {Object} options.uploadConfig - Config de upload { folder, entidadTipo, entidadId }
 */
export function useImageHandlers({ entity, onUpdate, uploadConfig }) {
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
      if (entity && unsplashState.fieldKey) {
        if (unsplashState.fieldKey === 'galeria_nueva') {
          const currentImages = entity?.contenido?.imagenes || [];
          onUpdate(entity.id, {
            imagenes: [...currentImages, { url, alt: '' }],
          });
        } else {
          onUpdate(entity.id, {
            [unsplashState.fieldKey]: url,
          });
        }
      }
      closeUnsplash();
    },
    [entity, unsplashState.fieldKey, onUpdate, closeUnsplash]
  );

  // ========== UPLOAD HANDLER ==========
  const handleUploadImage = useCallback(
    async (file, fieldKey) => {
      if (!entity) return;

      try {
        const resultado = await uploadArchivo.mutateAsync({
          file,
          folder: uploadConfig.folder,
          isPublic: true,
          entidadTipo: uploadConfig.entidadTipo,
          entidadId: uploadConfig.entidadId,
        });

        if (fieldKey === 'galeria_nueva') {
          const currentImages = entity?.contenido?.imagenes || [];
          onUpdate(entity.id, {
            imagenes: [...currentImages, { url: resultado.url, alt: '' }],
          });
        } else {
          onUpdate(entity.id, {
            [fieldKey]: resultado.url,
          });
        }

        toast.success('Imagen subida correctamente');
      } catch {
        // El error ya se maneja en useUploadArchivo
      }
    },
    [entity, uploadConfig, onUpdate, uploadArchivo, toast]
  );

  return {
    unsplashState,
    openUnsplash,
    closeUnsplash,
    handleUnsplashSelect,
    handleUploadImage,
    isUploading: uploadArchivo.isPending,
  };
}

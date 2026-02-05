/**
 * ====================================================================
 * GALERIA EDITOR (INVITACIONES) - ADAPTER
 * ====================================================================
 * Adapter que usa el GaleriaEditor común del framework con configuración
 * específica para invitaciones.
 *
 * @version 3.0.0
 * @since 2026-02-04 - Convertido a adapter de common block
 */

import { memo } from 'react';
import {
  GaleriaEditor as CommonGaleriaEditor,
  GALERIA_CONFIG_INVITACIONES,
} from '@/components/editor-framework/common-blocks';

/**
 * GaleriaEditor - Editor del bloque de galería para invitaciones
 * Wrapper del componente común con configuración específica.
 *
 * @param {Array} galeria - Galería del evento (desde el backend)
 * @param {Function} onOpenUnsplash - Callback para abrir Unsplash
 * @param {Function} onUploadImage - Callback para subir imagen
 */
function GaleriaEditor({
  contenido,
  estilos,
  onChange,
  tema,
  galeria = [],
  onOpenUnsplash,
  onUploadImage,
}) {
  return (
    <CommonGaleriaEditor
      contenido={contenido}
      estilos={estilos}
      onChange={onChange}
      tema={tema}
      galeria={galeria}
      config={GALERIA_CONFIG_INVITACIONES}
      onOpenUnsplash={onOpenUnsplash}
      onUploadImage={onUploadImage}
    />
  );
}

export default memo(GaleriaEditor);

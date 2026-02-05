/**
 * ====================================================================
 * VIDEO EDITOR (WEBSITE) - ADAPTER
 * ====================================================================
 * Adapter que usa el VideoEditor común del framework con configuración
 * específica para website.
 *
 * @version 3.0.0
 * @since 2026-02-04 - Convertido a adapter de common block
 */

import { memo } from 'react';
import {
  VideoEditor as CommonVideoEditor,
  VIDEO_CONFIG_FULL,
} from '@/components/editor-framework/common-blocks';

/**
 * VideoEditor - Editor del bloque de video para website
 * Wrapper del componente común con configuración específica.
 */
function VideoEditor({ contenido, onGuardar, tema, isSaving }) {
  return (
    <CommonVideoEditor
      contenido={contenido}
      onGuardar={onGuardar}
      tema={tema}
      isSaving={isSaving}
      config={VIDEO_CONFIG_FULL}
    />
  );
}

export default memo(VideoEditor);

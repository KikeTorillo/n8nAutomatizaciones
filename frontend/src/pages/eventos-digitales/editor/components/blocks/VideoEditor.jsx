/**
 * ====================================================================
 * VIDEO EDITOR (INVITACIONES) - ADAPTER
 * ====================================================================
 * Adapter que usa el VideoEditor común del framework con configuración
 * específica para invitaciones.
 *
 * @version 3.0.0
 * @since 2026-02-04 - Convertido a adapter de common block
 */

import { memo } from 'react';
import {
  VideoEditor as CommonVideoEditor,
  VIDEO_CONFIG_MINIMAL,
} from '@/components/editor-framework/common-blocks';

/**
 * VideoEditor - Editor del bloque de video para invitaciones
 * Wrapper del componente común con configuración específica.
 */
function VideoEditor({ contenido, estilos, onChange, tema }) {
  return (
    <CommonVideoEditor
      contenido={contenido}
      estilos={estilos}
      onChange={onChange}
      tema={tema}
      config={VIDEO_CONFIG_MINIMAL}
    />
  );
}

export default memo(VideoEditor);

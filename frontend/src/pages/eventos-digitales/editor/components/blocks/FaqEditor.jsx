/**
 * ====================================================================
 * FAQ EDITOR (INVITACIONES) - ADAPTER
 * ====================================================================
 * Adapter que usa el FaqEditor común del framework con configuración
 * específica para invitaciones.
 *
 * @version 3.0.0
 * @since 2026-02-04 - Convertido a adapter de common block
 */

import { memo } from 'react';
import {
  FaqEditor as CommonFaqEditor,
  FAQ_CONFIG_INVITACIONES,
} from '@/components/editor-framework/common-blocks';

/**
 * FaqEditor - Editor del bloque de FAQ para invitaciones
 * Wrapper del componente común con configuración específica.
 */
function FaqEditor({ contenido, estilos, onChange, tema }) {
  return (
    <CommonFaqEditor
      contenido={contenido}
      estilos={estilos}
      onChange={onChange}
      tema={tema}
      config={FAQ_CONFIG_INVITACIONES}
    />
  );
}

export default memo(FaqEditor);

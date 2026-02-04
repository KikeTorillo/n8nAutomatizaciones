/**
 * ====================================================================
 * COUNTDOWN EDITOR (INVITACIONES) - ADAPTER
 * ====================================================================
 * Adapter que usa el CountdownEditor común del framework con configuración
 * específica para invitaciones.
 *
 * @version 3.0.0
 * @since 2026-02-04 - Convertido a adapter de common block
 */

import { memo } from 'react';
import {
  CountdownEditor as CommonCountdownEditor,
  COUNTDOWN_CONFIG_INVITACIONES,
} from '@/components/editor-framework/common-blocks';

/**
 * CountdownEditor - Editor del bloque de cuenta regresiva para invitaciones
 * Wrapper del componente común con configuración específica.
 *
 * @param {Object} evento - Datos del evento para fallback de fecha
 */
function CountdownEditor({ contenido, estilos, onChange, tema, evento }) {
  return (
    <CommonCountdownEditor
      contenido={contenido}
      estilos={estilos}
      onChange={onChange}
      tema={tema}
      evento={evento}
      config={COUNTDOWN_CONFIG_INVITACIONES}
    />
  );
}

export default memo(CountdownEditor);

/**
 * ====================================================================
 * GALERIA EDITOR (WEBSITE) - ADAPTER
 * ====================================================================
 * Adapter que usa el GaleriaEditor común del framework con configuración
 * específica para website.
 *
 * @version 3.0.0
 * @since 2026-02-04 - Convertido a adapter de common block
 */

import { memo } from 'react';
import {
  GaleriaEditor as CommonGaleriaEditor,
  GALERIA_CONFIG_FULL,
} from '@/components/editor-framework/common-blocks';
import { ArrayItemsEditor } from './fields';

/**
 * GaleriaEditor - Editor del bloque de galería para website
 * Wrapper del componente común con configuración específica.
 */
function GaleriaEditor({ contenido, onGuardar, tema, isSaving }) {
  return (
    <CommonGaleriaEditor
      contenido={contenido}
      onGuardar={onGuardar}
      tema={tema}
      isSaving={isSaving}
      config={GALERIA_CONFIG_FULL}
      ArrayItemsEditorComponent={ArrayItemsEditor}
    />
  );
}

export default memo(GaleriaEditor);

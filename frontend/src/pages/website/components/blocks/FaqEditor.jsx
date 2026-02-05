/**
 * ====================================================================
 * FAQ EDITOR (WEBSITE) - ADAPTER
 * ====================================================================
 * Adapter que usa el FaqEditor común del framework con configuración
 * específica para website, incluyendo componentes de IA.
 *
 * @version 3.0.0
 * @since 2026-02-04 - Convertido a adapter de common block
 */

import { memo } from 'react';
import {
  FaqEditor as CommonFaqEditor,
  FAQ_CONFIG_FULL,
} from '@/components/editor-framework/common-blocks';
import { AIGenerateButton, AISuggestionBanner } from '../AIGenerator';
import { SectionTitleField, ArrayItemsEditor } from './fields';

/**
 * FaqEditor - Editor del bloque de FAQ para website
 * Wrapper del componente común con configuración específica y slots de IA.
 */
function FaqEditor({ contenido, onGuardar, tema, isSaving, industria = 'default' }) {
  return (
    <CommonFaqEditor
      contenido={contenido}
      onGuardar={onGuardar}
      tema={tema}
      isSaving={isSaving}
      industria={industria}
      config={FAQ_CONFIG_FULL}
      AIBannerComponent={AISuggestionBanner}
      AIGenerateButtonComponent={AIGenerateButton}
      SectionTitleFieldComponent={SectionTitleField}
      ArrayItemsEditorComponent={ArrayItemsEditor}
    />
  );
}

export default memo(FaqEditor);

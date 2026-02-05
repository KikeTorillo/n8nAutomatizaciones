/**
 * ====================================================================
 * COUNTDOWN EDITOR (WEBSITE) - ADAPTER
 * ====================================================================
 * Adapter que usa el CountdownEditor común del framework con configuración
 * específica para website, incluyendo componentes de IA.
 *
 * @version 3.0.0
 * @since 2026-02-04 - Convertido a adapter de common block
 */

import { memo } from 'react';
import {
  CountdownEditor as CommonCountdownEditor,
  COUNTDOWN_CONFIG_FULL,
} from '@/components/editor-framework/common-blocks';
import { AIGenerateButton, AISuggestionBanner } from '../AIGenerator';

/**
 * CountdownEditor - Editor del bloque de cuenta regresiva para website
 * Wrapper del componente común con configuración específica y slots de IA.
 */
function CountdownEditor({ contenido, onGuardar, tema, isSaving, industria = 'default' }) {
  return (
    <CommonCountdownEditor
      contenido={contenido}
      onGuardar={onGuardar}
      tema={tema}
      isSaving={isSaving}
      industria={industria}
      config={COUNTDOWN_CONFIG_FULL}
      AIBannerComponent={AISuggestionBanner}
      AIGenerateButtonComponent={AIGenerateButton}
    />
  );
}

export default memo(CountdownEditor);

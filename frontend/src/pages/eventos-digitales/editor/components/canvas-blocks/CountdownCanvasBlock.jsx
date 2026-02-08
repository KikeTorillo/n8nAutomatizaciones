/**
 * Countdown Canvas Block — Invitaciones wrapper
 */

import { memo } from 'react';
import { CountdownCanvasBlock as SharedCountdownCanvasBlock } from '@/components/editor-framework';

function CountdownCanvasBlock({ bloque, tema, evento, isEditing, onContentChange }) {
  return (
    <SharedCountdownCanvasBlock
      bloque={bloque}
      tema={tema}
      isEditing={isEditing}
      onContentChange={onContentChange}
      fallbackContext="invitacion"
      fechaObjetivo={evento?.fecha_evento}
      horaObjetivo={evento?.hora_evento}
    />
  );
}

export default memo(CountdownCanvasBlock);

/**
 * Texto Canvas Block — Invitaciones wrapper
 */

import { memo } from 'react';
import { TextoCanvasBlock as SharedTextoCanvasBlock } from '@/components/editor-framework';

function TextoCanvasBlock(props) {
  return (
    <SharedTextoCanvasBlock
      {...props}
      fallbackContext="invitacion"
      mode="plain"
      contentField="contenido"
      showFontSize
    />
  );
}

export default memo(TextoCanvasBlock);

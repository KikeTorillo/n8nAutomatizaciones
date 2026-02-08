/**
 * Separador Canvas Block — Invitaciones wrapper
 */

import { memo } from 'react';
import { SeparadorCanvasBlock as SharedSeparadorCanvasBlock } from '@/components/editor-framework';

function SeparadorCanvasBlock(props) {
  return (
    <SharedSeparadorCanvasBlock
      {...props}
      fallbackContext="invitacion"
      estiloOndas="stroke"
    />
  );
}

export default memo(SeparadorCanvasBlock);

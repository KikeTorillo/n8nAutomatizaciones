/**
 * Separador Canvas Block — Website wrapper
 */

import { memo } from 'react';
import { SeparadorCanvasBlock as SharedSeparadorCanvasBlock } from '@/components/editor-framework';

function SeparadorCanvasBlock(props) {
  return (
    <SharedSeparadorCanvasBlock
      {...props}
      fallbackContext="website"
      estiloOndas="fill"
    />
  );
}

export default memo(SeparadorCanvasBlock);

/**
 * Texto Canvas Block — Website wrapper
 */

import { memo } from 'react';
import { TextoCanvasBlock as SharedTextoCanvasBlock } from '@/components/editor-framework';

function TextoCanvasBlock(props) {
  return (
    <SharedTextoCanvasBlock
      {...props}
      fallbackContext="website"
      mode="rich"
      contentField="html"
    />
  );
}

export default memo(TextoCanvasBlock);

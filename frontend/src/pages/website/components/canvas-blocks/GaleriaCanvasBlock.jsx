/**
 * Galería Canvas Block — Website wrapper
 */

import { memo } from 'react';
import { GaleriaCanvasBlock as SharedGaleriaCanvasBlock } from '@/components/editor-framework';

function GaleriaCanvasBlock(props) {
  return (
    <SharedGaleriaCanvasBlock
      {...props}
      fallbackContext="website"
      showCaptions
      emptyPlaceholders={6}
    />
  );
}

export default memo(GaleriaCanvasBlock);

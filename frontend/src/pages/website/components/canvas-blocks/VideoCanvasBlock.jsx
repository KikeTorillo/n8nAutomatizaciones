/**
 * Video Canvas Block — Website wrapper
 */

import { memo } from 'react';
import { VideoCanvasBlock as SharedVideoCanvasBlock } from '@/components/editor-framework';

function VideoCanvasBlock(props) {
  return (
    <SharedVideoCanvasBlock
      {...props}
      fallbackContext="website"
    />
  );
}

export default memo(VideoCanvasBlock);

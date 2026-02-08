/**
 * Video Canvas Block — Invitaciones wrapper
 */

import { memo } from 'react';
import { VideoCanvasBlock as SharedVideoCanvasBlock } from '@/components/editor-framework';

function VideoCanvasBlock(props) {
  return (
    <SharedVideoCanvasBlock
      {...props}
      fallbackContext="invitacion"
      fieldMapping={{ url: 'video_url', tipo: 'video_tipo' }}
      showSubtitle
      muteOnAutoplay
    />
  );
}

export default memo(VideoCanvasBlock);

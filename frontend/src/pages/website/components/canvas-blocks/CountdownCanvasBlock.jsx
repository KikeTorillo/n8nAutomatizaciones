/**
 * Countdown Canvas Block — Website wrapper
 */

import { memo } from 'react';
import { CountdownCanvasBlock as SharedCountdownCanvasBlock } from '@/components/editor-framework';

function CountdownCanvasBlock(props) {
  return (
    <SharedCountdownCanvasBlock
      {...props}
      fallbackContext="website"
      variant="boxes-shadow"
      showBackground
      showButton
      showIcon
    />
  );
}

export default memo(CountdownCanvasBlock);

import { memo, forwardRef } from 'react';
import { cn } from '../lib/cn';
import { SEMANTIC_COLORS } from '../constants';

const DIVIDER_COLORS = {
  horizontal: `border-t ${SEMANTIC_COLORS.neutral.border}`,
  vertical: `w-px self-stretch bg-gray-200 dark:bg-gray-700`,
} as const;

export interface DividerProps {
  /** Orientación del separador */
  orientation?: 'horizontal' | 'vertical';
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Divider - Separador visual horizontal o vertical
 */
const Divider = memo(
  forwardRef<HTMLHRElement | HTMLDivElement, DividerProps>(function Divider(
    { orientation = 'horizontal', className },
    ref
  ) {
    if (orientation === 'vertical') {
      return (
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          role="separator"
          aria-orientation="vertical"
          className={cn(DIVIDER_COLORS.vertical, className)}
        />
      );
    }

    return (
      <hr
        ref={ref as React.Ref<HTMLHRElement>}
        role="separator"
        aria-orientation="horizontal"
        className={cn(DIVIDER_COLORS.horizontal, className)}
      />
    );
  })
);

Divider.displayName = 'Divider';

export { Divider };

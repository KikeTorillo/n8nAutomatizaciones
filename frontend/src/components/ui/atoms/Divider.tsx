import { memo, forwardRef } from 'react';
import { cn } from '@/lib/utils';

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
  forwardRef<HTMLElement, DividerProps>(function Divider(
    {
      orientation = 'horizontal',
      className,
    },
    ref
  ) {
    if (orientation === 'vertical') {
      return (
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          role="separator"
          aria-orientation="vertical"
          className={cn('w-px self-stretch bg-gray-200 dark:bg-gray-700', className)}
        />
      );
    }

    return (
      <hr
        ref={ref as React.Ref<HTMLHRElement>}
        role="separator"
        aria-orientation="horizontal"
        className={cn('border-t border-gray-200 dark:border-gray-700', className)}
      />
    );
  })
);

Divider.displayName = 'Divider';

export { Divider };

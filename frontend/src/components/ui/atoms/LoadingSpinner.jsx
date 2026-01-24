import { memo } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SPINNER_SIZES, SEMANTIC_COLORS } from '@/lib/uiConstants';

/**
 * Componente Loading Spinner
 * @param {Object} props
 * @param {string} props.size - sm | md | lg | xl
 * @param {string} props.className
 * @param {string} props.text - Texto opcional
 */
const LoadingSpinner = memo(function LoadingSpinner({ size = 'md', className, text }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2
        className={cn(
          'animate-spin',
          SEMANTIC_COLORS.primary.text,
          SPINNER_SIZES[size] || SPINNER_SIZES.md,
          className
        )}
      />
      {text && (
        <p className={cn('text-sm', SEMANTIC_COLORS.neutral.text)}>{text}</p>
      )}
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export { LoadingSpinner };
export default LoadingSpinner;

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Componente Loading Spinner
 * @param {Object} props
 * @param {string} props.size - sm | md | lg | xl
 * @param {string} props.className
 * @param {string} props.text - Texto opcional
 */
function LoadingSpinner({ size = 'md', className, text }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2
        className={cn(
          'animate-spin text-primary-600',
          sizes[size],
          className
        )}
      />
      {text && (
        <p className="text-sm text-gray-600">{text}</p>
      )}
    </div>
  );
}

export default LoadingSpinner;

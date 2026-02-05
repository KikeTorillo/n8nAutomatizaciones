import { memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RecordNavigationSize } from '@/types/ui';

export interface RecordNavigationProps {
  /** Índice actual (0-based) */
  currentIndex?: number;
  /** Total de registros */
  totalRecords?: number;
  /** Handler para ir al anterior */
  onPrevious?: () => void;
  /** Handler para ir al siguiente */
  onNext?: () => void;
  /** Mostrar "X de Y" */
  showIndicator?: boolean;
  /** Tamaño: sm, md */
  size?: RecordNavigationSize;
  /** Clases adicionales */
  className?: string;
}

const sizeClasses: Record<RecordNavigationSize, { button: string; icon: string; text: string }> = {
  sm: {
    button: 'p-1.5 min-w-[36px] min-h-[36px]',
    icon: 'w-4 h-4',
    text: 'text-xs',
  },
  md: {
    button: 'p-2 min-w-[44px] min-h-[44px]',
    icon: 'w-5 h-5',
    text: 'text-sm',
  },
};

/**
 * RecordNavigation - Navegación entre registros (anterior/siguiente)
 * Para usar en headers de Modales/Drawers de detalle
 */
export const RecordNavigation = memo(function RecordNavigation({
  currentIndex = 0,
  totalRecords = 0,
  onPrevious,
  onNext,
  showIndicator = true,
  size = 'md',
  className,
}: RecordNavigationProps) {
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < totalRecords - 1;
  const styles = sizeClasses[size] || sizeClasses.md;

  // No mostrar si solo hay un registro o ninguno
  if (totalRecords <= 1) return null;

  return (
    <div className={cn(
      'flex items-center justify-center gap-2',
      className
    )}>
      <button
        onClick={onPrevious}
        disabled={!hasPrev}
        className={cn(
          'flex items-center justify-center rounded-lg',
          'bg-gray-100 dark:bg-gray-700',
          'hover:bg-gray-200 dark:hover:bg-gray-600',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary-500',
          styles.button
        )}
        aria-label="Registro anterior"
      >
        <ChevronLeft className={styles.icon} />
      </button>

      {showIndicator && (
        <span className={cn(
          'font-medium text-gray-600 dark:text-gray-400 tabular-nums min-w-[60px] text-center',
          styles.text
        )}>
          {currentIndex + 1} de {totalRecords}
        </span>
      )}

      <button
        onClick={onNext}
        disabled={!hasNext}
        className={cn(
          'flex items-center justify-center rounded-lg',
          'bg-gray-100 dark:bg-gray-700',
          'hover:bg-gray-200 dark:hover:bg-gray-600',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary-500',
          styles.button
        )}
        aria-label="Siguiente registro"
      >
        <ChevronRight className={styles.icon} />
      </button>
    </div>
  );
});

RecordNavigation.displayName = 'RecordNavigation';

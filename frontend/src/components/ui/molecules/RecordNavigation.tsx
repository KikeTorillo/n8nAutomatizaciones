import { memo, forwardRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from '../atoms/IconButton';
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

const sizeClasses: Record<RecordNavigationSize, { text: string }> = {
  sm: { text: 'text-xs' },
  md: { text: 'text-sm' },
};

/**
 * RecordNavigation - Navegación entre registros (anterior/siguiente)
 * Para usar en headers de Modales/Drawers de detalle
 */
export const RecordNavigation = memo(
  forwardRef<HTMLDivElement, RecordNavigationProps>(function RecordNavigation({
  currentIndex = 0,
  totalRecords = 0,
  onPrevious,
  onNext,
  showIndicator = true,
  size = 'md',
  className,
}, ref) {
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < totalRecords - 1;
  const styles = sizeClasses[size] || sizeClasses.md;

  // No mostrar si solo hay un registro o ninguno
  if (totalRecords <= 1) return null;

  return (
    <div ref={ref} className={cn(
      'flex items-center justify-center gap-2',
      className
    )}>
      <IconButton
        icon={ChevronLeft}
        label="Registro anterior"
        variant="ghost"
        size={size}
        onClick={onPrevious}
        disabled={!hasPrev}
        className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
      />

      {showIndicator && (
        <span className={cn(
          'font-medium text-gray-600 dark:text-gray-400 tabular-nums min-w-[60px] text-center',
          styles.text
        )}>
          {currentIndex + 1} de {totalRecords}
        </span>
      )}

      <IconButton
        icon={ChevronRight}
        label="Siguiente registro"
        variant="ghost"
        size={size}
        onClick={onNext}
        disabled={!hasNext}
        className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
      />
    </div>
  );
}));

RecordNavigation.displayName = 'RecordNavigation';

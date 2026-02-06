import { memo, type CSSProperties } from 'react';
import { SkeletonTable, SkeletonCard, SkeletonList } from './SkeletonTable';
import type { SkeletonColumnWidth } from '@/types/ui';

export interface SkeletonProps {
  /** Variante del skeleton */
  variant: 'table' | 'card' | 'list';
  /** Número de filas (table) o cards (list) */
  count?: number;
  /** Número de columnas (solo table) */
  columns?: number;
  /** Mostrar header (solo table) */
  showHeader?: boolean;
  /** Anchos de columnas (solo table) */
  columnWidths?: SkeletonColumnWidth[];
  /** Clases adicionales */
  className?: string;
  /** Estilos inline (solo card) */
  style?: CSSProperties;
}

/**
 * Skeleton - Componente unificado de skeleton loading
 *
 * Wrapper que selecciona SkeletonTable, SkeletonCard o SkeletonList
 * según la prop `variant`.
 */
const Skeleton = memo(function Skeleton({
  variant,
  count = 5,
  columns = 4,
  showHeader = true,
  columnWidths,
  className,
  style,
}: SkeletonProps) {
  switch (variant) {
    case 'table':
      return (
        <SkeletonTable
          rows={count}
          columns={columns}
          showHeader={showHeader}
          columnWidths={columnWidths}
          className={className}
        />
      );
    case 'card':
      return <SkeletonCard className={className} style={style} />;
    case 'list':
      return <SkeletonList count={count} className={className} />;
  }
});

Skeleton.displayName = 'Skeleton';

export { Skeleton };

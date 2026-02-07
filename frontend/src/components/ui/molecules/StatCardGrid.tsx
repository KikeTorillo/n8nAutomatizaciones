import { memo, forwardRef, type ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { StatCard } from './StatCard';
import type { StatCardTrend } from '@/types/ui';

/** Colores disponibles para StatCard */
export type StatCardColor = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'primary';

/**
 * Configuración individual de una stat card
 */
export interface StatConfig {
  /** Icono de lucide-react */
  icon: ComponentType<{ className?: string }>;
  /** Etiqueta descriptiva */
  label: string;
  /** Valor a mostrar */
  value: number | string;
  /** Color de la card */
  color: StatCardColor;
  /** Tendencia opcional */
  trend?: StatCardTrend;
  /** Texto secundario opcional */
  subtext?: string;
  /** Key única para la card */
  key?: string | number;
}

/** Número de columnas disponibles */
export type StatCardGridColumns = 2 | 3 | 4;

/**
 * Props del componente StatCardGrid
 */
export interface StatCardGridProps {
  /** Array de configuración de cards */
  stats: StatConfig[];
  /** Número de columnas en desktop */
  columns?: StatCardGridColumns;
  /** Clases adicionales para el grid */
  className?: string;
}

/**
 * StatCardGrid - Grid responsivo de StatCards
 */
export const StatCardGrid = memo(
  forwardRef<HTMLDivElement, StatCardGridProps>(function StatCardGrid({
  stats,
  columns = 4,
  className,
}, ref) {
  const columnClasses: Record<StatCardGridColumns, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'grid gap-3 sm:gap-4 mb-6',
        columnClasses[columns] || columnClasses[4],
        className
      )}
    >
      {stats.map((stat, index) => (
        <StatCard
          key={stat.key ?? index}
          icon={stat.icon}
          label={stat.label}
          value={stat.value}
          color={stat.color}
          trend={stat.trend}
          subtext={stat.subtext}
        />
      ))}
    </div>
  );
  })
);

StatCardGrid.displayName = 'StatCardGrid';

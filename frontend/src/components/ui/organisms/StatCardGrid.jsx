import { memo } from 'react';
import { cn } from '@/lib/utils';
import { StatCard } from '../molecules/StatCard';

/**
 * StatCardGrid - Grid responsivo de StatCards
 *
 * @param {Object} props
 * @param {Array<Object>} props.stats - Array de configuración de cards
 * @param {React.ComponentType} props.stats[].icon - Icono de lucide-react
 * @param {string} props.stats[].label - Etiqueta descriptiva
 * @param {number|string} props.stats[].value - Valor a mostrar
 * @param {'blue'|'green'|'yellow'|'red'|'purple'|'primary'} props.stats[].color - Color
 * @param {Object} [props.stats[].trend] - Tendencia opcional
 * @param {string} [props.stats[].subtext] - Texto secundario opcional
 * @param {2|3|4} [props.columns] - Número de columnas en desktop (default: 4)
 * @param {string} [props.className] - Clases adicionales para el grid
 */
export const StatCardGrid = memo(function StatCardGrid({ stats, columns = 4, className }) {
  const columnClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  };

  return (
    <div
      className={cn(
        'grid gap-3 sm:gap-4 mb-6',
        columnClasses[columns] || columnClasses[4],
        className
      )}
    >
      {stats.map((stat, index) => (
        <StatCard
          key={stat.key || index}
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
});

StatCardGrid.displayName = 'StatCardGrid';

export default StatCardGrid;

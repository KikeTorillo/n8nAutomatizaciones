import { memo, type ReactNode, type ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { FILTER_SECTION_TITLE } from '@/lib/uiConstants';

// Re-exportar componentes unificados para compatibilidad
export { FilterField } from '../FilterField';
export { CheckboxField as FilterCheckbox } from '../../molecules/CheckboxField';

/**
 * Props del componente FilterSection
 */
export interface FilterSectionProps {
  /** Título de la sección */
  title?: string;
  /** Contenido de la sección */
  children?: ReactNode;
  /** Icono del título */
  icon?: ComponentType<{ className?: string }>;
  /** Clases adicionales */
  className?: string;
}

/**
 * FilterSection - Sección de filtros con título y contenido
 * Usado dentro de AdvancedFilterPanel para organizar filtros
 */
export const FilterSection = memo(function FilterSection({
  title,
  children,
  icon: Icon,
  className,
}: FilterSectionProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {title && (
        <h4 className={FILTER_SECTION_TITLE}>
          {Icon && <Icon className="h-4 w-4" />}
          {title}
        </h4>
      )}
      <div className="space-y-2">{children}</div>
    </div>
  );
});

FilterSection.displayName = 'FilterSection';

export default FilterSection;

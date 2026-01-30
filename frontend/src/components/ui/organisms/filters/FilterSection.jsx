import { memo } from 'react';
import { cn } from '@/lib/utils';
import { FILTER_SECTION_TITLE } from '@/lib/uiConstants';

// Re-exportar componentes unificados para compatibilidad
export { FilterField } from '../FilterField';
export { CheckboxField as FilterCheckbox } from '../../molecules/CheckboxField';

/**
 * FilterSection - Sección de filtros con título y contenido
 * Usado dentro de AdvancedFilterPanel para organizar filtros
 *
 * @param {string} title - Título de la sección
 * @param {React.ReactNode} children - Contenido de la sección
 * @param {React.ComponentType} icon - Icono del título (opcional)
 * @param {string} className - Clases adicionales
 */
export const FilterSection = memo(function FilterSection({ title, children, icon: Icon, className }) {
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

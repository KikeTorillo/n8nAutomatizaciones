/**
 * FilterPanelBase - Base compartida para paneles de filtros
 * Fase 2 del Plan de Mejoras Frontend - Enero 2026
 *
 * Proporciona:
 * - Estilos comunes para inputs de filtros
 * - Función de renderizado por tipo
 * - Cálculo de filtros activos
 * - Layout de grid responsivo
 */
import { useMemo, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import { FilterSelectField } from '../../molecules/FilterSelectField';
import { FilterDateField } from '../../molecules/FilterDateField';
import { FilterTextField } from '../../molecules/FilterTextField';
import { CheckboxField } from '../../molecules/CheckboxField';

// ============================================
// ESTILOS COMPARTIDOS
// ============================================

export const filterInputStyles = cn(
  'w-full px-3 py-2 rounded-lg border transition-colors',
  'bg-white dark:bg-gray-800',
  'text-gray-900 dark:text-gray-100',
  'border-gray-300 dark:border-gray-600',
  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
  'text-sm'
);

export const filterLabelStyles = cn(
  'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
);

export const filterCheckboxStyles = cn(
  'w-4 h-4 rounded border-gray-300 dark:border-gray-600',
  'text-primary-600 focus:ring-primary-500'
);

export const filterPanelContainerStyles = cn(
  'bg-white dark:bg-gray-800 rounded-lg shadow-sm',
  'border border-gray-200 dark:border-gray-700 p-4'
);

export const filterGridStyles = cn(
  'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
);

// ============================================
// HELPERS
// ============================================

/**
 * Calcula el número de filtros activos
 * @param {Object} filters - Objeto con valores de filtros
 * @param {Array} filterConfig - Configuración de filtros
 * @param {string} searchKey - Key del campo de búsqueda
 * @returns {number}
 */
export function countActiveFilters(filters, filterConfig = [], searchKey = 'busqueda') {
  let count = 0;

  filterConfig.forEach(config => {
    const value = filters[config.key || config.id];
    if (value !== undefined && value !== '' && value !== null && value !== false) {
      count++;
    }
  });

  // Incluir búsqueda si tiene valor
  if (filters[searchKey] && String(filters[searchKey]).trim() !== '') {
    count++;
  }

  return count;
}

/**
 * Hook para manejar filtros activos
 */
export function useActiveFilters(filters, filterConfig, searchKey = 'busqueda') {
  return useMemo(
    () => countActiveFilters(filters, filterConfig, searchKey),
    [filters, filterConfig, searchKey]
  );
}

// ============================================
// RE-EXPORT DE COMPONENTES UNIFICADOS
// ============================================

// Re-exportar desde molecules para compatibilidad con código existente
export { FilterTextField as FilterInput } from '../../molecules/FilterTextField';
export { FilterSelectField as FilterSelectInput } from '../../molecules/FilterSelectField';
export { FilterDateField as FilterDateInput } from '../../molecules/FilterDateField';
export { CheckboxField as FilterCheckboxInput } from '../../molecules/CheckboxField';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

/**
 * FilterPanelBase - Componente base para paneles de filtros
 *
 * @param {Object} filters - Valores actuales de filtros
 * @param {Function} onFilterChange - Callback (key, value)
 * @param {Array} filterConfig - Configuración de filtros
 * @param {React.ReactNode} children - Contenido adicional
 * @param {string} className - Clases adicionales
 */
export const FilterPanelBase = memo(function FilterPanelBase({
  filters = {},
  onFilterChange,
  filterConfig = [],
  children,
  className,
}) {
  const handleChange = useCallback((key, value) => {
    onFilterChange?.(key, value);
  }, [onFilterChange]);

  const renderFilter = (config) => {
    const key = config.key || config.id;
    const value = filters[key];

    switch (config.type) {
      case 'select':
        return (
          <div key={key}>
            <FilterSelectField
              label={config.label}
              value={value}
              onChange={(v) => handleChange(key, v)}
              options={config.options}
            />
          </div>
        );

      case 'date':
        return (
          <div key={key}>
            <FilterDateField
              label={config.label}
              value={value}
              onChange={(v) => handleChange(key, v)}
            />
          </div>
        );

      case 'checkbox':
        return (
          <div key={key}>
            <CheckboxField
              checked={!!value}
              onChange={(e) => handleChange(key, e.target?.checked ?? e)}
              label={config.checkboxLabel || config.label}
            />
          </div>
        );

      case 'text':
      default:
        return (
          <div key={key}>
            <FilterTextField
              label={config.label}
              value={value}
              onChange={(v) => handleChange(key, v)}
              placeholder={config.placeholder}
            />
          </div>
        );
    }
  };

  return (
    <div className={cn(filterPanelContainerStyles, className)}>
      <div className={filterGridStyles}>
        {filterConfig.map(renderFilter)}
      </div>
      {children}
    </div>
  );
});

FilterPanelBase.displayName = 'FilterPanelBase';

export default FilterPanelBase;

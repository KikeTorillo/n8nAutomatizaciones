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
import { FilterField } from '../../molecules/FilterField';
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

// Re-exportar FilterField unificado para compatibilidad con código existente
export { FilterField } from '../../molecules/FilterField';
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
    const value = filters[key] ?? (config.type === 'checkbox' ? false : '');

    return (
      <div key={key}>
        <FilterField
          type={config.type || 'text'}
          label={config.type === 'checkbox' ? (config.checkboxLabel || config.label) : config.label}
          value={value}
          onChange={(v) => handleChange(key, v)}
          options={config.options}
          placeholder={config.placeholder}
          icon={config.icon}
          min={config.min}
          max={config.max}
        />
      </div>
    );
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

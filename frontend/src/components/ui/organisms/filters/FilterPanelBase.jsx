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
// COMPONENTES DE FILTRO INDIVIDUALES
// ============================================

/**
 * FilterInput - Input de texto para filtros
 */
export const FilterInput = memo(function FilterInput({ value, onChange, placeholder, className }) {
  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(filterInputStyles, className)}
    />
  );
});

FilterInput.displayName = 'FilterInput';

/**
 * FilterSelect - Select para filtros
 */
export const FilterSelectInput = memo(function FilterSelectInput({ value, onChange, options = [], className }) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className={cn(filterInputStyles, className)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
});

FilterSelectInput.displayName = 'FilterSelectInput';

/**
 * FilterDate - Input de fecha para filtros
 */
export const FilterDateInput = memo(function FilterDateInput({ value, onChange, className }) {
  return (
    <input
      type="date"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className={cn(filterInputStyles, className)}
    />
  );
});

FilterDateInput.displayName = 'FilterDateInput';

/**
 * FilterCheckboxInput - Checkbox para filtros
 */
export const FilterCheckboxInput = memo(function FilterCheckboxInput({ checked, onChange, label, className }) {
  return (
    <label className={cn('flex items-center gap-2 cursor-pointer', className)}>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className={filterCheckboxStyles}
      />
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {label}
      </span>
    </label>
  );
});

FilterCheckboxInput.displayName = 'FilterCheckboxInput';

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
            <label className={filterLabelStyles}>{config.label}</label>
            <FilterSelectInput
              value={value}
              onChange={(v) => handleChange(key, v)}
              options={config.options}
            />
          </div>
        );

      case 'date':
        return (
          <div key={key}>
            <label className={filterLabelStyles}>{config.label}</label>
            <FilterDateInput
              value={value}
              onChange={(v) => handleChange(key, v)}
            />
          </div>
        );

      case 'checkbox':
        return (
          <div key={key}>
            <FilterCheckboxInput
              checked={value}
              onChange={(v) => handleChange(key, v)}
              label={config.checkboxLabel || config.label}
            />
          </div>
        );

      case 'text':
      default:
        return (
          <div key={key}>
            <label className={filterLabelStyles}>{config.label}</label>
            <FilterInput
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

import { useState, useMemo, useCallback, memo } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '../atoms/Button';
import SearchInput from '../molecules/SearchInput';

/**
 * Estilos compartidos para inputs de filtros
 * Ene 2026 - Refactorización FilterPanel
 */
const FILTER_INPUT_STYLES = cn(
  'w-full px-3 py-2 rounded-lg border transition-colors text-sm',
  'bg-white dark:bg-gray-800',
  'text-gray-900 dark:text-gray-100',
  'border-gray-300 dark:border-gray-600',
  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
);

const CHECKBOX_STYLES = cn(
  'w-4 h-4 rounded border-gray-300 dark:border-gray-600',
  'text-primary-600 focus:ring-primary-500'
);

/**
 * Componentes internos memorizados
 */
const FilterSelect = memo(function FilterSelect({ value, options, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={FILTER_INPUT_STYLES}
    >
      {options?.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
});

const FilterDate = memo(function FilterDate({ value, onChange }) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={FILTER_INPUT_STYLES}
    />
  );
});

const FilterText = memo(function FilterText({ value, placeholder, onChange }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={FILTER_INPUT_STYLES}
    />
  );
});

const FilterCheckbox = memo(function FilterCheckbox({ checked, label, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className={CHECKBOX_STYLES}
      />
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    </label>
  );
});

/**
 * FilterPanel - Panel de filtros reutilizable con búsqueda y filtros expandibles
 *
 * @example
 * const filterConfig = [
 *   { key: 'estado', label: 'Estado', type: 'select', options: [...] },
 *   { key: 'fecha_desde', label: 'Desde', type: 'date' },
 *   { key: 'activo', label: 'Solo activos', type: 'checkbox' }
 * ];
 *
 * <FilterPanel
 *   filters={filtros}
 *   onFilterChange={(key, value) => setFiltro(key, value)}
 *   onClearFilters={limpiarFiltros}
 *   filterConfig={filterConfig}
 *   searchPlaceholder="Buscar por nombre..."
 * />
 */
export function FilterPanel({
  filters = {},
  onFilterChange,
  onClearFilters,
  filterConfig = [],
  searchKey = 'busqueda',
  searchPlaceholder = 'Buscar...',
  showSearch = true,
  expandable = true,
  defaultExpanded = false,
  className,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Contar filtros activos
  const activeFilterCount = useMemo(() => {
    let count = 0;
    filterConfig.forEach(config => {
      const value = filters[config.key];
      if (value !== undefined && value !== '' && value !== null && value !== false) {
        count++;
      }
    });
    if (filters[searchKey]?.trim()) count++;
    return count;
  }, [filters, filterConfig, searchKey]);

  const handleSearchChange = useCallback((e) => {
    onFilterChange(searchKey, e.target.value);
  }, [onFilterChange, searchKey]);

  const handleFilterChange = useCallback((key) => (value) => {
    onFilterChange(key, value);
  }, [onFilterChange]);

  const renderFilterInput = useCallback((config) => {
    const value = filters[config.key] ?? '';
    const onChange = handleFilterChange(config.key);

    switch (config.type) {
      case 'select':
        return <FilterSelect value={value} options={config.options} onChange={onChange} />;
      case 'date':
        return <FilterDate value={value} onChange={onChange} />;
      case 'checkbox':
        return <FilterCheckbox checked={value} label={config.checkboxLabel || config.label} onChange={onChange} />;
      case 'text':
      default:
        return <FilterText value={value} placeholder={config.placeholder} onChange={onChange} />;
    }
  }, [filters, handleFilterChange]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Barra superior: Búsqueda + Toggle filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        {showSearch && (
          <div className="flex-1">
            <SearchInput
              value={filters[searchKey] || ''}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              size="md"
            />
          </div>
        )}

        {expandable && filterConfig.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full">
                {activeFilterCount}
              </span>
            )}
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        )}

        {activeFilterCount > 0 && onClearFilters && (
          <Button
            variant="ghost"
            onClick={onClearFilters}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Panel de filtros expandible */}
      {isExpanded && filterConfig.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filterConfig.map((config) => (
              <div key={config.key}>
                {config.type !== 'checkbox' && (
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {config.label}
                  </label>
                )}
                {renderFilterInput(config)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * FilterChips - Muestra los filtros activos como chips removibles
 */
export function FilterChips({
  filters,
  filterConfig,
  onRemoveFilter,
  searchKey = 'busqueda',
  className,
}) {
  const activeFilters = useMemo(() => {
    const active = [];

    if (filters[searchKey]?.trim()) {
      active.push({
        key: searchKey,
        label: 'Búsqueda',
        displayValue: `"${filters[searchKey]}"`,
      });
    }

    filterConfig.forEach(config => {
      const value = filters[config.key];
      if (value !== undefined && value !== '' && value !== null && value !== false) {
        let displayValue = value;
        if (config.type === 'select' && config.options) {
          displayValue = config.options.find(opt => opt.value === value)?.label || value;
        }
        if (config.type === 'checkbox') displayValue = 'Sí';

        active.push({ key: config.key, label: config.label, displayValue });
      }
    });

    return active;
  }, [filters, filterConfig, searchKey]);

  if (activeFilters.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {activeFilters.map((filter) => (
        <span
          key={filter.key}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300"
        >
          <span className="font-medium">{filter.label}:</span>
          <span>{filter.displayValue}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter(filter.key)}
            className="ml-1 hover:text-primary-900 dark:hover:text-primary-100"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

/**
 * FilterChip individual - Componente standalone para un chip de filtro
 */
export const FilterChip = memo(function FilterChip({ label, value, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
      <span className="font-medium">{label}</span>
      {value && <span>: {value}</span>}
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 hover:text-primary-900 dark:hover:text-primary-100"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
});

export default FilterPanel;

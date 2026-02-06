import { useState, useCallback, memo, useMemo, forwardRef, type ChangeEvent, type ComponentType } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../atoms/Button';
import { SearchInput } from './SearchInput';
import { FilterField } from './FilterField';
import { useActiveFilters, type FilterConfigItem } from './filters/FilterPanelBase';
import type { SelectOption } from '@/types/ui';

/**
 * Props del componente FilterPanel
 */
export interface FilterPanelProps {
  /** Valores actuales de filtros */
  filters?: Record<string, unknown>;
  /** Callback cuando cambia un filtro */
  onFilterChange: (key: string, value: unknown) => void;
  /** Callback para limpiar filtros */
  onClearFilters?: () => void;
  /** Configuración de filtros */
  filterConfig?: FilterConfigItem[];
  /** Key del campo de búsqueda */
  searchKey?: string;
  /** Placeholder de búsqueda */
  searchPlaceholder?: string;
  /** Mostrar campo de búsqueda */
  showSearch?: boolean;
  /** Si los filtros son expandibles */
  expandable?: boolean;
  /** Si está expandido por defecto */
  defaultExpanded?: boolean;
  /** Clases adicionales */
  className?: string;
}

/**
 * FilterPanel - Panel de filtros reutilizable con búsqueda y filtros expandibles
 */
export const FilterPanel = memo(
  forwardRef<HTMLDivElement, FilterPanelProps>(function FilterPanel({
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
}, ref) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Usar hook centralizado para contar filtros activos
  const activeFilterCount = useActiveFilters(filters, filterConfig, searchKey);

  const handleSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement> | { target: { value: string } }) => {
      onFilterChange(searchKey, e.target.value);
    },
    [onFilterChange, searchKey]
  );

  const handleFilterChange = useCallback(
    (key: string) => (value: unknown) => {
      onFilterChange(key, value);
    },
    [onFilterChange]
  );

  const renderFilterInput = useCallback(
    (config: FilterConfigItem) => {
      const key = config.key || config.id || '';
      const value = filters[key] ?? (config.type === 'checkbox' ? false : '');
      const onChange = handleFilterChange(key);

      return (
        <FilterField
          type={config.type || 'text'}
          label={config.type === 'checkbox' ? config.checkboxLabel || config.label : config.label}
          value={value as string | boolean | number}
          onChange={onChange}
          options={config.options}
          placeholder={config.placeholder}
          icon={config.icon}
          min={config.min}
          max={config.max}
        />
      );
    },
    [filters, handleFilterChange]
  );

  return (
    <div ref={ref} className={cn('space-y-4', className)}>
      {/* Barra superior: Búsqueda + Toggle filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        {showSearch && (
          <div className="flex-1">
            <SearchInput
              value={(filters[searchKey] as string) || ''}
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
              <div key={config.key || config.id}>{renderFilterInput(config)}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
  })
);

FilterPanel.displayName = 'FilterPanel';

/**
 * Filtro activo para mostrar en chips
 */
interface ActiveFilter {
  key: string;
  label: string;
  displayValue: string;
}

/**
 * Props del componente FilterChips
 */
export interface FilterChipsProps {
  /** Valores actuales de filtros */
  filters: Record<string, unknown>;
  /** Configuración de filtros */
  filterConfig: FilterConfigItem[];
  /** Callback para remover un filtro */
  onRemoveFilter: (key: string) => void;
  /** Key del campo de búsqueda */
  searchKey?: string;
  /** Clases adicionales */
  className?: string;
}

/**
 * FilterChips - Muestra los filtros activos como chips removibles
 */
export const FilterChips = memo(function FilterChips({
  filters,
  filterConfig,
  onRemoveFilter,
  searchKey = 'busqueda',
  className,
}: FilterChipsProps) {
  const activeFilters = useMemo(() => {
    const active: ActiveFilter[] = [];
    const searchValue = filters[searchKey];

    if (searchValue && typeof searchValue === 'string' && searchValue.trim()) {
      active.push({
        key: searchKey,
        label: 'Búsqueda',
        displayValue: `"${searchValue}"`,
      });
    }

    filterConfig.forEach((config) => {
      const key = config.key || config.id || '';
      const value = filters[key];
      if (value !== undefined && value !== '' && value !== null && value !== false) {
        let displayValue = String(value);
        if (config.type === 'select' && config.options) {
          displayValue =
            config.options.find((opt) => opt.value === value)?.label || displayValue;
        }
        if (config.type === 'checkbox') displayValue = 'Sí';

        active.push({ key, label: config.label || key, displayValue });
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
});

FilterChips.displayName = 'FilterChips';

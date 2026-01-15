import { useState, useMemo } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from './Button';
import SearchInput from './SearchInput';

/**
 * FilterPanel - Panel de filtros reutilizable con búsqueda y filtros expandibles
 *
 * @param {Object} props
 * @param {Object} props.filters - Valores actuales de los filtros
 * @param {Function} props.onFilterChange - Callback cuando cambia un filtro (key, value)
 * @param {Function} props.onClearFilters - Callback para limpiar todos los filtros
 * @param {Array<Object>} props.filterConfig - Configuración de filtros
 * @param {string} props.filterConfig[].key - Key del filtro
 * @param {string} props.filterConfig[].label - Label del filtro
 * @param {'select'|'text'|'date'|'dateRange'|'checkbox'} props.filterConfig[].type - Tipo de filtro
 * @param {Array<{value: string, label: string}>} [props.filterConfig[].options] - Opciones para select
 * @param {string} [props.filterConfig[].placeholder] - Placeholder
 * @param {boolean} [props.filterConfig[].defaultVisible] - Visible por defecto (no expandible)
 *
 * @param {string} [props.searchKey] - Key del filtro de búsqueda (default: 'busqueda')
 * @param {string} [props.searchPlaceholder] - Placeholder del buscador
 * @param {boolean} [props.showSearch] - Mostrar campo de búsqueda (default: true)
 * @param {boolean} [props.expandable] - Permitir expandir/colapsar filtros (default: true)
 * @param {boolean} [props.defaultExpanded] - Expandido por defecto (default: false)
 * @param {string} [props.className] - Clases adicionales
 *
 * @example
 * const filterConfig = [
 *   {
 *     key: 'estado',
 *     label: 'Estado',
 *     type: 'select',
 *     options: [
 *       { value: '', label: 'Todos' },
 *       { value: 'activo', label: 'Activo' },
 *       { value: 'inactivo', label: 'Inactivo' },
 *     ]
 *   },
 *   {
 *     key: 'categoria_id',
 *     label: 'Categoría',
 *     type: 'select',
 *     options: categorias.map(c => ({ value: c.id, label: c.nombre }))
 *   },
 *   {
 *     key: 'fecha_desde',
 *     label: 'Desde',
 *     type: 'date'
 *   }
 * ];
 *
 * <FilterPanel
 *   filters={filtros}
 *   onFilterChange={(key, value) => setFiltro(key, value)}
 *   onClearFilters={limpiarFiltros}
 *   filterConfig={filterConfig}
 *   searchPlaceholder="Buscar por nombre o SKU..."
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

  // Contar filtros activos (excluyendo búsqueda y valores vacíos/default)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    filterConfig.forEach(config => {
      const value = filters[config.key];
      if (value !== undefined && value !== '' && value !== null && value !== false) {
        count++;
      }
    });
    // Incluir búsqueda si tiene valor
    if (filters[searchKey] && filters[searchKey].trim() !== '') {
      count++;
    }
    return count;
  }, [filters, filterConfig, searchKey]);

  const handleSearchChange = (e) => {
    onFilterChange(searchKey, e.target.value);
  };

  const handleFilterChange = (key, value) => {
    onFilterChange(key, value);
  };

  const renderFilterInput = (config) => {
    const value = filters[config.key] ?? '';

    switch (config.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFilterChange(config.key, e.target.value)}
            className={cn(
              'w-full px-3 py-2 rounded-lg border transition-colors',
              'bg-white dark:bg-gray-800',
              'text-gray-900 dark:text-gray-100',
              'border-gray-300 dark:border-gray-600',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'text-sm'
            )}
          >
            {config.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFilterChange(config.key, e.target.value)}
            className={cn(
              'w-full px-3 py-2 rounded-lg border transition-colors',
              'bg-white dark:bg-gray-800',
              'text-gray-900 dark:text-gray-100',
              'border-gray-300 dark:border-gray-600',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'text-sm'
            )}
          />
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleFilterChange(config.key, e.target.checked)}
              className={cn(
                'w-4 h-4 rounded border-gray-300 dark:border-gray-600',
                'text-primary-600 focus:ring-primary-500'
              )}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {config.checkboxLabel || config.label}
            </span>
          </label>
        );

      case 'text':
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFilterChange(config.key, e.target.value)}
            placeholder={config.placeholder}
            className={cn(
              'w-full px-3 py-2 rounded-lg border transition-colors',
              'bg-white dark:bg-gray-800',
              'text-gray-900 dark:text-gray-100',
              'border-gray-300 dark:border-gray-600',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'text-sm'
            )}
          />
        );
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Barra superior: Búsqueda + Toggle filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Búsqueda */}
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

        {/* Botón toggle filtros */}
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
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        )}

        {/* Botón limpiar (visible si hay filtros activos) */}
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

    // Agregar búsqueda si existe
    if (filters[searchKey] && filters[searchKey].trim() !== '') {
      active.push({
        key: searchKey,
        label: 'Búsqueda',
        value: filters[searchKey],
        displayValue: `"${filters[searchKey]}"`,
      });
    }

    // Agregar filtros configurados
    filterConfig.forEach(config => {
      const value = filters[config.key];
      if (value !== undefined && value !== '' && value !== null && value !== false) {
        let displayValue = value;

        // Para selects, buscar el label de la opción
        if (config.type === 'select' && config.options) {
          const option = config.options.find(opt => opt.value === value);
          displayValue = option?.label || value;
        }

        // Para checkboxes, mostrar "Sí"
        if (config.type === 'checkbox') {
          displayValue = 'Sí';
        }

        active.push({
          key: config.key,
          label: config.label,
          value,
          displayValue,
        });
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
          className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs',
            'bg-primary-100 dark:bg-primary-900/40',
            'text-primary-700 dark:text-primary-300'
          )}
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

export default FilterPanel;

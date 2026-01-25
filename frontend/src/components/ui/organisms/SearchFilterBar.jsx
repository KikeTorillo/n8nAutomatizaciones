import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchInput } from '../molecules/SearchInput';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';

/**
 * SearchFilterBar - Barra combinada de búsqueda y filtros
 *
 * Ene 2026: Componente reutilizable que combina SearchInput con
 * toggle de filtros y chips de filtros activos.
 * Movido a organisms/ por componer múltiples molecules y manejar lógica compleja.
 *
 * @param {string} searchValue - Valor actual de búsqueda
 * @param {function} onSearchChange - Callback cuando cambia búsqueda
 * @param {function} onFiltersToggle - Callback para mostrar/ocultar panel de filtros
 * @param {boolean} showFilters - Estado del panel de filtros
 * @param {number} filtrosActivos - Número de filtros activos
 * @param {function} onClearFilters - Callback para limpiar todos los filtros
 * @param {string} placeholder - Placeholder del input de búsqueda
 * @param {ReactNode} actions - Acciones adicionales a la derecha (botones)
 * @param {string} className - Clases adicionales para el contenedor
 *
 * @example
 * <SearchFilterBar
 *   searchValue={search}
 *   onSearchChange={(e) => setSearch(e.target.value)}
 *   onFiltersToggle={() => setShowFilters(!showFilters)}
 *   showFilters={showFilters}
 *   filtrosActivos={3}
 *   onClearFilters={() => clearAllFilters()}
 *   placeholder="Buscar productos..."
 *   actions={<Button onClick={handleNew}>Nuevo</Button>}
 * />
 */
function SearchFilterBar({
  searchValue = '',
  onSearchChange,
  onFiltersToggle,
  showFilters = false,
  filtrosActivos = 0,
  onClearFilters,
  placeholder = 'Buscar...',
  actions,
  className,
  // Props adicionales para SearchInput
  debounceMs = 300,
  onSearch,
  size = 'md',
}) {
  // Memoizar el botón de filtros para evitar re-renders
  const filterButton = useMemo(() => (
    <Button
      variant={showFilters ? 'secondary' : 'outline'}
      size="sm"
      onClick={onFiltersToggle}
      className="relative"
    >
      <Filter className="w-4 h-4 mr-2" />
      Filtros
      {filtrosActivos > 0 && (
        <Badge
          variant="primary"
          size="sm"
          className="ml-2"
        >
          {filtrosActivos}
        </Badge>
      )}
    </Button>
  ), [showFilters, onFiltersToggle, filtrosActivos]);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Barra principal */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Búsqueda */}
        <div className="flex-1">
          <SearchInput
            value={searchValue}
            onChange={onSearchChange}
            onSearch={onSearch}
            debounceMs={debounceMs}
            placeholder={placeholder}
            size={size}
          />
        </div>

        {/* Botón de filtros y acciones */}
        <div className="flex items-center gap-2">
          {onFiltersToggle && filterButton}

          {/* Botón limpiar filtros (solo si hay filtros activos) */}
          {filtrosActivos > 0 && onClearFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4 mr-1" />
              Limpiar
            </Button>
          )}

          {/* Acciones adicionales */}
          {actions}
        </div>
      </div>
    </div>
  );
}

SearchFilterBar.displayName = 'SearchFilterBar';

SearchFilterBar.propTypes = {
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  onFiltersToggle: PropTypes.func,
  showFilters: PropTypes.bool,
  filtrosActivos: PropTypes.number,
  onClearFilters: PropTypes.func,
  placeholder: PropTypes.string,
  actions: PropTypes.node,
  className: PropTypes.string,
  debounceMs: PropTypes.number,
  onSearch: PropTypes.func,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
};

const MemoizedSearchFilterBar = memo(SearchFilterBar);
export { MemoizedSearchFilterBar as SearchFilterBar };
export default MemoizedSearchFilterBar;

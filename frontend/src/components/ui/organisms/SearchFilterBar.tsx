import { memo, useMemo, type ReactNode, type ChangeEvent } from 'react';
import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchInput } from '../molecules/SearchInput';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import type { Size } from '@/types/ui';

/**
 * Props del componente SearchFilterBar
 */
export interface SearchFilterBarProps {
  /** Valor actual de búsqueda */
  searchValue?: string;
  /** Callback cuando cambia búsqueda */
  onSearchChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  /** Callback para mostrar/ocultar panel de filtros */
  onFiltersToggle?: () => void;
  /** Estado del panel de filtros */
  showFilters?: boolean;
  /** Número de filtros activos */
  filtrosActivos?: number;
  /** Callback para limpiar todos los filtros */
  onClearFilters?: () => void;
  /** Placeholder del input de búsqueda */
  placeholder?: string;
  /** Acciones adicionales a la derecha (botones) */
  actions?: ReactNode;
  /** Clases adicionales para el contenedor */
  className?: string;
  /** Debounce para búsqueda */
  debounceMs?: number;
  /** Callback para búsqueda submit */
  onSearch?: (value: string) => void;
  /** Tamaño del input */
  size?: Size;
}

/**
 * SearchFilterBar - Barra combinada de búsqueda y filtros
 *
 * Ene 2026: Componente reutilizable que combina SearchInput con
 * toggle de filtros y chips de filtros activos.
 * Movido a organisms/ por componer múltiples molecules y manejar lógica compleja.
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
}: SearchFilterBarProps) {
  // Memoizar el botón de filtros para evitar re-renders
  const filterButton = useMemo(
    () => (
      <Button
        variant={showFilters ? 'secondary' : 'outline'}
        size="sm"
        onClick={onFiltersToggle}
        className="relative"
      >
        <Filter className="w-4 h-4 mr-2" />
        Filtros
        {filtrosActivos > 0 && (
          <Badge variant="primary" size="sm" className="ml-2">
            {filtrosActivos}
          </Badge>
        )}
      </Button>
    ),
    [showFilters, onFiltersToggle, filtrosActivos]
  );

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

const MemoizedSearchFilterBar = memo(SearchFilterBar);
export { MemoizedSearchFilterBar as SearchFilterBar };

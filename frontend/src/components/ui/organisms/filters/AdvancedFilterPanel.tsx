import { useState, memo, type ReactNode, type ComponentType } from 'react';
import { ChevronDown, Filter, Star, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FILTER_PANEL_CONTAINER,
  FILTER_PANEL_HEADER,
  FILTER_PANEL_CONTENT,
  FILTER_COUNT_BADGE,
  FILTER_GRID_LAYOUTS,
  getFilterToggleStyles,
} from '@/lib/uiConstants';
import { FilterSection, FilterCheckbox } from './FilterSection';
import { FilterField } from '../FilterField';
import { SavedSearchList, type SavedSearch } from './SavedSearchList';
import type { SelectOption } from '@/types/ui';

/**
 * Opción para checkbox-group
 */
interface CheckboxGroupOption {
  field?: string;
  value?: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  disabled?: boolean;
}

/**
 * Configuración de un filtro individual
 */
export interface AdvancedFilterConfig {
  /** ID único del filtro */
  id: string;
  /** Tipo de filtro */
  type: 'checkbox' | 'checkbox-group' | 'select';
  /** Label del filtro */
  label?: string;
  /** Sección donde se agrupa */
  section?: string;
  /** Opciones (para select y checkbox-group) */
  options?: SelectOption[] | CheckboxGroupOption[];
  /** Placeholder (para select) */
  placeholder?: string;
  /** Icono */
  icon?: ComponentType<{ className?: string }>;
  /** Si está deshabilitado */
  disabled?: boolean;
}

/**
 * Props del componente AdvancedFilterPanel
 */
export interface AdvancedFilterPanelProps {
  /** Estado actual de filtros */
  filtros: Record<string, unknown>;
  /** Callback cuando cambian filtros */
  onFiltrosChange?: (filtros: Record<string, unknown>) => void;
  /** Callback para limpiar todos */
  onLimpiarFiltros?: () => void;
  /** Configuración de filtros predefinidos */
  filterConfig?: AdvancedFilterConfig[];
  /** Identificador del módulo */
  moduloId?: string;
  /** Si el panel inicia abierto */
  defaultOpen?: boolean;
  /** Barra de búsqueda personalizada */
  searchBar?: ReactNode;
  /** Lista de búsquedas guardadas */
  busquedasGuardadas?: SavedSearch[];
  /** Callback al aplicar búsqueda guardada */
  onAplicarBusqueda?: (busqueda: SavedSearch) => void;
  /** Callback al eliminar búsqueda */
  onEliminarBusqueda?: (busqueda: SavedSearch) => void;
  /** Callback para abrir modal de guardar */
  onGuardarBusqueda?: () => void;
  /** Callback para toggle default */
  onToggleDefault?: (busqueda: SavedSearch) => void;
  /** Número de filtros activos */
  filtrosActivos?: number;
  /** Clases adicionales */
  className?: string;
}

/**
 * AdvancedFilterPanel - Panel de filtros avanzados
 * Panel colapsable con secciones: Filtros predefinidos y Favoritos
 */
const AdvancedFilterPanel = memo(function AdvancedFilterPanel({
  filtros,
  onFiltrosChange,
  onLimpiarFiltros,
  filterConfig = [],
  defaultOpen = false,
  searchBar,
  busquedasGuardadas = [],
  onAplicarBusqueda,
  onEliminarBusqueda,
  onGuardarBusqueda,
  onToggleDefault,
  filtrosActivos = 0,
  className,
}: AdvancedFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Manejar cambio de filtro individual
  const handleFilterChange = (filterId: string, value: unknown) => {
    onFiltrosChange?.({ ...filtros, [filterId]: value });
  };

  // Renderizar filtro según su tipo
  const renderFilter = (config: AdvancedFilterConfig) => {
    switch (config.type) {
      case 'checkbox':
        return (
          <FilterCheckbox
            key={config.id}
            id={config.id}
            label={config.label || ''}
            checked={!!filtros[config.id]}
            onChange={(checked) => handleFilterChange(config.id, checked)}
            icon={config.icon}
            disabled={config.disabled}
          />
        );

      case 'checkbox-group':
        return (
          <div key={config.id} className="space-y-1">
            {(config.options as CheckboxGroupOption[] | undefined)?.map((opt) => (
              <FilterCheckbox
                key={opt.field || opt.value}
                id={opt.field || opt.value || ''}
                label={opt.label}
                checked={!!filtros[opt.field || opt.value || '']}
                onChange={(checked) =>
                  handleFilterChange(opt.field || opt.value || '', checked)
                }
                icon={opt.icon}
                disabled={opt.disabled}
              />
            ))}
          </div>
        );

      case 'select':
        return (
          <FilterField
            key={config.id}
            type="select"
            label={config.label}
            value={(filtros[config.id] as string) || ''}
            onChange={(value) => handleFilterChange(config.id, value)}
            options={config.options as SelectOption[]}
            placeholder={config.placeholder}
            icon={config.icon}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn(FILTER_PANEL_CONTAINER, className)}>
      {/* Header con barra de búsqueda y botón expandir */}
      <div className={FILTER_PANEL_HEADER}>
        {/* Barra de búsqueda personalizada */}
        {searchBar && <div className="flex-1">{searchBar}</div>}

        {/* Botones de acción */}
        <div className="flex items-center gap-2">
          {/* Botón Filtros */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={getFilterToggleStyles(isOpen)}
            aria-expanded={isOpen}
            aria-controls="filter-panel-content"
          >
            <Filter className="h-4 w-4" />
            <span>Filtros</span>
            {filtrosActivos > 0 && (
              <span className={FILTER_COUNT_BADGE}>{filtrosActivos}</span>
            )}
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
            />
          </button>

          {/* Botón Limpiar (solo si hay filtros activos) */}
          {filtrosActivos > 0 && (
            <button
              type="button"
              onClick={onLimpiarFiltros}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors min-h-[40px]',
                'text-gray-600 dark:text-gray-400',
                'hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
              aria-label="Limpiar todos los filtros"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Panel expandible */}
      {isOpen && (
        <div id="filter-panel-content" className={FILTER_PANEL_CONTENT}>
          <div className={FILTER_GRID_LAYOUTS.default}>
            {/* Columna 1: Checkboxes y checkbox-groups */}
            <div className="space-y-4">
              <FilterSection title="Filtros" icon={Filter}>
                {filterConfig
                  .filter((c) => c.type === 'checkbox' || c.type === 'checkbox-group')
                  .map(renderFilter)}
              </FilterSection>
            </div>

            {/* Columna 2: Selects */}
            <div className="space-y-4">
              {filterConfig
                .filter((c) => c.type === 'select')
                .map((config) => renderFilter(config))}
            </div>

            {/* Columna 3: Favoritos (Búsquedas guardadas) */}
            <div className="space-y-4">
              <FilterSection title="Favoritos" icon={Star}>
                <SavedSearchList
                  busquedas={busquedasGuardadas}
                  onSelect={onAplicarBusqueda}
                  onDelete={onEliminarBusqueda}
                  onToggleDefault={onToggleDefault}
                  compact
                />

                {/* Botón guardar búsqueda */}
                {onGuardarBusqueda && filtrosActivos > 0 && (
                  <button
                    type="button"
                    onClick={onGuardarBusqueda}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 px-3 py-2 mt-2',
                      'text-sm font-medium rounded-lg transition-colors',
                      'border border-dashed border-gray-300 dark:border-gray-600',
                      'text-gray-600 dark:text-gray-400',
                      'hover:border-primary-400 hover:text-primary-600',
                      'dark:hover:border-primary-500 dark:hover:text-primary-400'
                    )}
                  >
                    <Star className="h-4 w-4" />
                    Guardar búsqueda actual
                  </button>
                )}
              </FilterSection>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

AdvancedFilterPanel.displayName = 'AdvancedFilterPanel';

export { AdvancedFilterPanel };
export default AdvancedFilterPanel;

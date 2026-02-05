/**
 * Exportaciones centralizadas de componentes de filtros avanzados
 */
export { AdvancedFilterPanel } from './AdvancedFilterPanel';
export type { AdvancedFilterPanelProps, AdvancedFilterConfig } from './AdvancedFilterPanel';
// NOTA: FilterChip está en molecules/FilterChip - importar desde allí directamente
export { FilterSection, FilterCheckbox, FilterField } from './FilterSection';
export type { FilterSectionProps } from './FilterSection';
export { SavedSearchList } from './SavedSearchList';
export type { SavedSearchListProps, SavedSearch } from './SavedSearchList';
export { SavedSearchModal } from './SavedSearchModal';
export type { SavedSearchModalProps } from './SavedSearchModal';

// FilterPanelBase - Componentes base y utilidades (Fase 2 Ene 2026)
export {
  FilterPanelBase,
  filterInputStyles,
  filterLabelStyles,
  filterCheckboxStyles,
  filterPanelContainerStyles,
  filterGridStyles,
  countActiveFilters,
  useActiveFilters,
  FilterCheckboxInput,
} from './FilterPanelBase';
export type { FilterConfigItem, FilterPanelBaseProps } from './FilterPanelBase';

/**
 * Exportaciones centralizadas de componentes de filtros avanzados
 */
export { default as AdvancedFilterPanel } from './AdvancedFilterPanel';
// NOTA: FilterChip está en molecules/FilterChip - importar desde allí directamente
export { default as FilterSection, FilterCheckbox, FilterField } from './FilterSection';
export { default as SavedSearchList } from './SavedSearchList';
export { default as SavedSearchModal } from './SavedSearchModal';

// FilterPanelBase - Componentes base y utilidades (Fase 2 Ene 2026)
export {
  default as FilterPanelBase,
  filterInputStyles,
  filterLabelStyles,
  filterCheckboxStyles,
  filterPanelContainerStyles,
  filterGridStyles,
  countActiveFilters,
  useActiveFilters,
  FilterCheckboxInput,
} from './FilterPanelBase';

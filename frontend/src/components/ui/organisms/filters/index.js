/**
 * Exportaciones centralizadas de componentes de filtros avanzados
 */
export { default as AdvancedFilterPanel } from './AdvancedFilterPanel';
// Ene 2026: FilterChip movido a molecules, re-exportar para compatibilidad
export { default as FilterChip } from '../../molecules/FilterChip';
export { default as FilterSection, FilterCheckbox, FilterSelect } from './FilterSection';
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
  FilterInput,
  FilterSelectInput,
  FilterDateInput,
  FilterCheckboxInput,
} from './FilterPanelBase';

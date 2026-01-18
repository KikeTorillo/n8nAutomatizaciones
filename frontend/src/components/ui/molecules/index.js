/**
 * UI Molecules
 * Componentes que combinan átomos para formar unidades funcionales
 */

export { default as SearchInput } from './SearchInput';
export { Pagination } from './Pagination';
export { default as StatCard } from './StatCard';
export { EmptyState } from './EmptyState';
export { ViewTabs } from './ViewTabs';
export { default as Breadcrumb } from './Breadcrumb';
export { default as NavDropdown } from './NavDropdown';
export { default as RecordNavigation } from './RecordNavigation';
export { SkeletonTable, SkeletonCard, SkeletonList } from './SkeletonTable';
export { default as Toast } from './Toast';
export { default as BackButton } from './BackButton';
export { default as ThemeToggle } from './ThemeToggle';

// Movidos desde atoms/ (Ene 2026) - componentes con lógica compleja
// NOTA: MultiSelect e IconPicker movidos a organisms/ por complejidad (Ene 2026)
export { ProgressBar, LimitProgressBar } from './ProgressBar';

// Nuevos (Ene 2026) - Fase 2 mejoras UI
export { default as FormGroup } from './FormGroup';

// Nuevos (Ene 2026) - Optimización arquitectónica
export { default as FilterChip } from './FilterChip';
export { default as SearchFilterBar } from './SearchFilterBar';
export { default as SmartButtons } from './SmartButtons';
export { default as CheckboxGroup } from './CheckboxGroup';
export { default as CheckboxField } from './CheckboxField';

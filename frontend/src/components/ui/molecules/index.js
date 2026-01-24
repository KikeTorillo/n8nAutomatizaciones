/**
 * UI Molecules
 * Componentes que combinan átomos para formar unidades funcionales
 */

export { SearchInput } from './SearchInput';
export { Pagination } from './Pagination';
export { StatCard } from './StatCard';
export { EmptyState } from './EmptyState';
export { ViewTabs } from './ViewTabs';
export { Breadcrumb } from './Breadcrumb';
export { RecordNavigation } from './RecordNavigation';
export { SkeletonTable, SkeletonCard, SkeletonList } from './SkeletonTable';
export { Toast } from './Toast';
export { BackButton } from './BackButton';
export { ThemeToggle } from './ThemeToggle';

// Movidos desde atoms/ (Ene 2026) - componentes con lógica compleja
// NOTA: MultiSelect e IconPicker movidos a organisms/ por complejidad (Ene 2026)
export { ProgressBar, LimitProgressBar } from './ProgressBar';

// Nuevos (Ene 2026) - Fase 2 mejoras UI
export { FormGroup } from './FormGroup';
export { Alert } from './Alert';

// Nuevos (Ene 2026) - Optimización arquitectónica
export { FilterChip } from './FilterChip';
export { SearchFilterBar } from './SearchFilterBar';
export { default as CheckboxGroup } from './CheckboxGroup';
export { CheckboxField } from './CheckboxField';
export { DropdownMenu } from './DropdownMenu';
// NOTA: SmartButtons movido a organisms/ (Ene 2026)

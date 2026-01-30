/**
 * UI Molecules
 * Componentes que combinan átomos para formar unidades funcionales
 */

// Movido desde atoms/ (Ene 2026) - componente con lógica compleja
export { ToggleSwitch } from './ToggleSwitch';

export { SearchInput } from './SearchInput';
export { StatCard } from './StatCard';
export { SkeletonStatCard } from './SkeletonStatCard';
export { EmptyState } from './EmptyState';
export { ViewTabs } from './ViewTabs';
export { Breadcrumb } from './Breadcrumb';
export { RecordNavigation } from './RecordNavigation';
export { SkeletonTable, SkeletonCard, SkeletonList } from './SkeletonTable';
export { Toast } from './Toast';
export { BackButton } from './BackButton';
// NOTA: ThemeToggle movido a organisms/ (Ene 2026) - accede a store global

// Movidos desde atoms/ (Ene 2026) - componentes con lógica compleja
// NOTA: MultiSelect e IconPicker movidos a organisms/ por complejidad (Ene 2026)
export { ProgressBar, LimitProgressBar } from './ProgressBar';

// Nuevos (Ene 2026) - Fase 2 mejoras UI
export { FormGroup } from './FormGroup';
export { Alert } from './Alert';

// Nuevos (Ene 2026) - Optimización arquitectónica
export { FilterChip } from './FilterChip';
// NOTA: SearchFilterBar movido a organisms/ (Ene 2026) - compone múltiples molecules
// NOTA: CheckboxGroup movido a organisms/ (Ene 2026) - compone CheckboxField (molecule)
export { CheckboxField } from './CheckboxField';
export { DropdownMenu } from './DropdownMenu';
// NOTA: SmartButtons movido a organisms/ (Ene 2026)

// NOTA: FilterField movido a organisms/ por complejidad multi-tipo (Ene 2026)
// Importar desde '@/components/ui/organisms' o '@/components/ui'

// Headers extraídos (Ene 2026)
export { ModalHeader } from './ModalHeader';
export { DrawerHeader } from './DrawerHeader';

// Permisos granulares (Ene 2026) - FIX RBAC
// DECISIÓN: Mantener en molecules - es wrapper composable similar a FormGroup, no HOC
export { ConPermiso } from './ConPermiso';

// Card genérico (Ene 2026)
export { Card } from './Card';

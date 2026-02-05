/**
 * UI Molecules
 * Componentes que combinan átomos para formar unidades funcionales
 */

// Movido desde atoms/ (Ene 2026) - componente con lógica compleja
export { ToggleSwitch } from './ToggleSwitch';
export type { ToggleSwitchProps } from './ToggleSwitch';

export { SearchInput } from './SearchInput';
export type { SearchInputProps } from './SearchInput';

export { StatCard } from './StatCard';
export type { StatCardProps } from './StatCard';

export { SkeletonStatCard } from './SkeletonStatCard';
export type { SkeletonStatCardProps } from './SkeletonStatCard';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export { ViewTabs } from './ViewTabs';
export type { ViewTabsProps } from './ViewTabs';

export { Breadcrumb } from './Breadcrumb';
export type { BreadcrumbProps } from './Breadcrumb';

export { RecordNavigation } from './RecordNavigation';
export type { RecordNavigationProps } from './RecordNavigation';

export { SkeletonTable, SkeletonCard, SkeletonList } from './SkeletonTable';
export type { SkeletonTableProps, SkeletonCardProps, SkeletonListProps } from './SkeletonTable';

export { Toast } from './Toast';
export type { ToastProps } from './Toast';

export { BackButton } from './BackButton';
export type { BackButtonProps } from './BackButton';

// NOTA: ThemeToggle movido a organisms/ (Ene 2026) - accede a store global

// Movidos desde atoms/ (Ene 2026) - componentes con lógica compleja
// NOTA: MultiSelect e IconPicker movidos a organisms/ por complejidad (Ene 2026)
export { ProgressBar, LimitProgressBar } from './ProgressBar';
export type { ProgressBarProps, LimitProgressBarProps } from './ProgressBar';

// Nuevos (Ene 2026) - Fase 2 mejoras UI
export { FormGroup } from './FormGroup';
export type { FormGroupProps } from './FormGroup';

export { Alert } from './Alert';
export type { AlertProps } from './Alert';

// Nuevos (Ene 2026) - Optimización arquitectónica
export { FilterChip } from './FilterChip';
export type { FilterChipProps } from './FilterChip';

// NOTA: SearchFilterBar movido a organisms/ (Ene 2026) - compone múltiples molecules
// NOTA: CheckboxGroup movido a organisms/ (Ene 2026) - compone CheckboxField (molecule)
export { CheckboxField } from './CheckboxField';
export type { CheckboxFieldProps } from './CheckboxField';

export { DropdownMenu } from './DropdownMenu';
export type { DropdownMenuProps } from './DropdownMenu';

// NOTA: SmartButtons movido a organisms/ (Ene 2026)

// NOTA: FilterField movido a organisms/ por complejidad multi-tipo (Ene 2026)
// Importar desde '@/components/ui/organisms' o '@/components/ui'

// Headers extraídos (Ene 2026)
export { ModalHeader } from './ModalHeader';
export type { ModalHeaderProps } from './ModalHeader';

export { DrawerHeader } from './DrawerHeader';
export type { DrawerHeaderProps } from './DrawerHeader';

// Permisos granulares (Ene 2026) - FIX RBAC
// DECISIÓN: Mantener en molecules - es wrapper composable similar a FormGroup, no HOC
export { ConPermiso } from './ConPermiso';
export type { ConPermisoProps } from './ConPermiso';

// Card genérico (Ene 2026)
export { Card } from './Card';
export type { CardProps } from './Card';

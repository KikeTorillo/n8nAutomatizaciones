/**
 * UI Molecules
 * Componentes que combinan átomos para formar unidades funcionales
 */

// Movido desde atoms/ (Ene 2026) - componente con lógica compleja
export { ToggleSwitch } from './ToggleSwitch';
export type { ToggleSwitchProps } from './ToggleSwitch';

// NOTA: SearchInput movido a organisms/ (Feb 2026) - complejidad de lógica + debounce

export { StatCard } from './StatCard';
export type { StatCardProps } from './StatCard';

export { SkeletonStatCard } from './SkeletonStatCard';
export type { SkeletonStatCardProps } from './SkeletonStatCard';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

// NOTA: ViewTabs movido a organisms/ (Feb 2026) - keyboard navigation + ARIA tablist

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

// NOTA: DropdownMenu movido a organisms/ (Feb 2026) - gestión estado + keyboard nav + portal

// NOTA: SmartButtons movido a organisms/ (Ene 2026)

// NOTA: FilterField movido a organisms/ por complejidad multi-tipo (Ene 2026)
// Importar desde '@/components/ui/organisms' o '@/components/ui'

// Header unificado para overlays (Feb 2026) — reemplaza ModalHeader + DrawerHeader (dead code eliminado)
export { OverlayHeader } from './OverlayHeader';
export type { OverlayHeaderProps } from './OverlayHeader';

// NOTA: ConPermiso movido a features/auth/components/ (Feb 2026) - depende de lógica RBAC

// NOTA: Card movido a atoms/ (Feb 2026) - contenedor genérico sin lógica compuesta

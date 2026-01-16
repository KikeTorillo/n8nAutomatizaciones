/**
 * Exportaciones centralizadas de componentes UI
 *
 * Organización Atomic Design:
 * - atoms/     - Elementos básicos (Button, Input, Select, etc.)
 * - molecules/ - Combinaciones de átomos (SearchInput, Pagination, etc.)
 * - organisms/ - Componentes complejos (Modal, DataTable, etc.)
 * - templates/ - Layouts de página (BasePageLayout, ModuleGuard)
 *
 * Los imports existentes siguen funcionando:
 *   import Button from '@/components/ui/Button'
 *   import { Button, Input } from '@/components/ui'
 */

// ========== ATOMS ==========
export { default as Button } from './atoms/Button';
export { default as Input } from './atoms/Input';
export { default as Select } from './atoms/Select';
export { default as Textarea } from './atoms/Textarea';
export { default as Checkbox } from './atoms/Checkbox';
export { default as MultiSelect } from './atoms/MultiSelect';
export { default as IconPicker } from './atoms/IconPicker';
export { default as Alert } from './atoms/Alert';
export { default as Badge } from './atoms/Badge';
export { ProgressBar, LimitProgressBar } from './atoms/ProgressBar';

// ========== MOLECULES ==========
export { default as SearchInput } from './molecules/SearchInput';
export { Pagination } from './molecules/Pagination';
export { default as StatCard } from './molecules/StatCard';
export { EmptyState } from './molecules/EmptyState';
export { ViewTabs } from './molecules/ViewTabs';
export { default as Breadcrumb } from './molecules/Breadcrumb';
export { default as NavDropdown } from './molecules/NavDropdown';
export { default as RecordNavigation } from './molecules/RecordNavigation';
export { SkeletonTable, SkeletonCard, SkeletonList } from './molecules/SkeletonTable';
export { default as Toast } from './molecules/Toast';
export { default as BackButton } from './molecules/BackButton';
export { default as ThemeToggle } from './molecules/ThemeToggle';

// ========== ORGANISMS ==========
export { default as Modal } from './organisms/Modal';
export { default as Drawer } from './organisms/Drawer';
export { default as ConfirmDialog } from './organisms/ConfirmDialog';
export { DataTable, DataTableActions, DataTableActionButton } from './organisms/DataTable';
export { FilterPanel, FilterChips } from './organisms/FilterPanel';
export { default as StatCardGrid } from './organisms/StatCardGrid';
export { default as ExpandableCrudSection } from './organisms/ExpandableCrudSection';
export { default as GenericNavTabs } from './organisms/GenericNavTabs';
export { default as SmartButtons } from './organisms/SmartButtons';
export { TreeView, useTreeExpansion } from './organisms/TreeNode';
export { default as MobileNavSelector } from './organisms/MobileNavSelector';

// Filters (organisms)
export {
  AdvancedFilterPanel,
  FilterChip,
  FilterSection,
  FilterCheckbox,
  FilterSelect,
  SavedSearchList,
  SavedSearchModal,
} from './organisms/filters';

// ========== TEMPLATES ==========
export { default as BasePageLayout } from './templates/BasePageLayout';
export { default as ModuleGuard } from './templates/ModuleGuard';

// ========== EXTERNOS ==========
export { default as LoadingSpinner } from '../common/LoadingSpinner';

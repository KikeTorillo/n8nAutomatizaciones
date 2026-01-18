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
export { default as Badge } from './atoms/Badge';
export { default as LoadingSpinner } from './atoms/LoadingSpinner';
export { default as Label } from './atoms/Label';

// ========== MOLECULES ==========
export { default as Alert } from './molecules/Alert';
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
// Componentes con lógica compleja (movidos desde atoms/ Ene 2026)
export { ProgressBar, LimitProgressBar } from './molecules/ProgressBar';
// Nuevos (Ene 2026) - Fase 2 mejoras UI
export { default as FormGroup } from './molecules/FormGroup';
// Nuevos (Ene 2026) - Optimización arquitectónica
export { default as SearchFilterBar } from './molecules/SearchFilterBar';
export { default as CheckboxGroup } from './molecules/CheckboxGroup';

// ========== ORGANISMS ==========
export { default as Modal } from './organisms/Modal';
export { default as Drawer } from './organisms/Drawer';
export { default as IconPicker } from './organisms/IconPicker'; // Ene 2026: Movido desde molecules
export { default as MultiSelect } from './organisms/MultiSelect'; // Ene 2026: Movido desde molecules
export { default as BarcodeScanner } from './organisms/BarcodeScanner';
export { default as ConfirmDialog } from './organisms/ConfirmDialog';
export { DataTable, DataTableActions, DataTableActionButton } from './organisms/DataTable';
export { FilterPanel, FilterChips } from './organisms/FilterPanel';
export { default as StatCardGrid } from './organisms/StatCardGrid';
export { default as ExpandableCrudSection } from './organisms/ExpandableCrudSection';
export { default as GenericNavTabs } from './organisms/GenericNavTabs';
export { default as SmartButtons } from './molecules/SmartButtons';
export { TreeView, useTreeExpansion } from './organisms/TreeNode';
export { default as MobileNavSelector } from './organisms/MobileNavSelector';
export { default as ToastContainer } from './organisms/ToastContainer';
export { default as StateNavTabs } from './organisms/StateNavTabs';

// Filters (organisms)
export {
  AdvancedFilterPanel,
  FilterChip,
  FilterSection,
  FilterCheckbox,
  FilterSelect,
  SavedSearchList,
  SavedSearchModal,
  // FilterPanelBase y utilidades (Fase 2 Ene 2026)
  FilterPanelBase,
  filterInputStyles,
  filterLabelStyles,
  countActiveFilters,
  useActiveFilters,
} from './organisms/filters';

// ========== TEMPLATES ==========
export { default as BasePageLayout } from './templates/BasePageLayout';
export { default as ModuleGuard } from './templates/ModuleGuard';
export { default as ListadoCRUDPage } from './templates/ListadoCRUDPage';

// ========== EXTERNOS ==========
export { default as ChunkErrorBoundary } from '../common/ChunkErrorBoundary';
export { default as GlobalErrorBoundary } from '../common/GlobalErrorBoundary';

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
export { Button } from './atoms/Button';
export { Input } from './atoms/Input';
export { Select } from './atoms/Select';
export { Textarea } from './atoms/Textarea';
export { Checkbox } from './atoms/Checkbox';
export { Badge } from './atoms/Badge';
export { LoadingSpinner } from './atoms/LoadingSpinner';
export { Label } from './atoms/Label';
export { ToggleSwitch } from './molecules/ToggleSwitch';

// ========== MOLECULES ==========
export { Alert } from './molecules/Alert';
export { SearchInput } from './molecules/SearchInput';
export { Pagination } from './organisms/Pagination';
export { StatCard } from './molecules/StatCard';
export { SkeletonStatCard } from './molecules/SkeletonStatCard';
export { EmptyState } from './molecules/EmptyState';
export { ViewTabs } from './molecules/ViewTabs';
export { Breadcrumb } from './molecules/Breadcrumb';
export { RecordNavigation } from './molecules/RecordNavigation';
export { SkeletonTable, SkeletonCard, SkeletonList } from './molecules/SkeletonTable';
export { Toast } from './molecules/Toast';
export { BackButton } from './molecules/BackButton';
// Componentes con lógica compleja (movidos desde atoms/ Ene 2026)
export { ProgressBar, LimitProgressBar } from './molecules/ProgressBar';
// Nuevos (Ene 2026) - Fase 2 mejoras UI
export { FormGroup } from './molecules/FormGroup';
// Nuevos (Ene 2026) - Optimización arquitectónica
export { SearchFilterBar } from './organisms/SearchFilterBar';
export { default as CheckboxGroup } from './molecules/CheckboxGroup';
export { CheckboxField } from './molecules/CheckboxField';
export { DropdownMenu } from './molecules/DropdownMenu';

// ========== ORGANISMS ==========
export { Modal } from './organisms/Modal';
export { Drawer } from './organisms/Drawer';
export { default as IconPicker, ICONOS_MAP, CATEGORIAS_ICONOS, IconButton } from './organisms/icon-picker';
export { MultiSelect } from './organisms/MultiSelect';
export { BarcodeScanner } from './organisms/BarcodeScanner';
export { ConfirmDialog } from './organisms/ConfirmDialog';
export { DataTable, DataTableActions, DataTableActionButton } from './organisms/DataTable';
export { FilterPanel, FilterChips } from './organisms/FilterPanel';
export { StatCardGrid } from './organisms/StatCardGrid';
export { ExpandableCrudSection } from './organisms/ExpandableCrudSection';
export { GenericNavTabs } from './organisms/GenericNavTabs';
export { default as NavDropdown } from './organisms/NavDropdown';
export { default as SmartButtons } from './organisms/SmartButtons';
export { ThemeToggle } from './organisms/ThemeToggle';
export { TreeView, useTreeExpansion } from './organisms/TreeNode';
export { MobileNavSelector } from './organisms/MobileNavSelector';
export { ToastContainer } from './organisms/ToastContainer';
export { default as StateNavTabs, TabDropdown, MobileTabSelector } from './organisms/state-nav-tabs';

// Filters (organisms)
export {
  AdvancedFilterPanel,
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
// FilterChip está en molecules (Ene 2026)
export { FilterChip } from './molecules/FilterChip';

// Campos de filtro (Ene 2026)
export { FilterSelectField } from './molecules/FilterSelectField';
export { FilterDateField } from './molecules/FilterDateField';
export { FilterTextField } from './molecules/FilterTextField';
export { FilterField } from './molecules/FilterField';

// Headers extraídos (Ene 2026)
export { ModalHeader } from './molecules/ModalHeader';
export { DrawerHeader } from './molecules/DrawerHeader';

// Permisos granulares (Ene 2026) - FIX RBAC
export { ConPermiso } from './molecules/ConPermiso';

// Componentes estándar (Ene 2026)
export { StandardRowActions } from './organisms/StandardRowActions';
export { StandardFilterGrid } from './organisms/StandardFilterGrid';

// ========== TEMPLATES ==========
export { BasePageLayout } from './templates/BasePageLayout';
export { ModuleGuard, ModuleVisible, ModuleHidden } from './templates/ModuleGuard';
export { ListadoCRUDPage } from './templates/ListadoCRUDPage';

// Nuevos templates (Ene 2026)
export { BaseDetailLayout, DetailHeader, DetailLoadingState, DetailNotFoundState } from './templates/BaseDetailLayout';
export { BaseFormLayout, FormHeader, FormWizardStepper, FormFooter } from './templates/BaseFormLayout';

// ========== EXTERNOS ==========
export { default as ChunkErrorBoundary } from '../common/ChunkErrorBoundary';
export { default as GlobalErrorBoundary } from '../common/GlobalErrorBoundary';

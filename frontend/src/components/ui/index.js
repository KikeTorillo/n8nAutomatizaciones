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
export { Divider } from './atoms/Divider';
export { Radio } from './atoms/Radio';
export { RadioGroup } from './atoms/RadioGroup';
export { Tooltip } from './atoms/Tooltip';
export { Avatar } from './atoms/Avatar';
export { Text } from './atoms/Text';
// NOTA: ToggleSwitch movido a molecules/ por complejidad (Ene 2026) - ver sección MOLECULES

// ========== MOLECULES ==========
export { Alert } from './molecules/Alert';
export { SearchInput } from './organisms/SearchInput';
export { Pagination } from './organisms/Pagination';
export { StatCard } from './molecules/StatCard';
export { SkeletonStatCard } from './molecules/SkeletonStatCard';
export { EmptyState } from './molecules/EmptyState';
export { ViewTabs } from './organisms/ViewTabs';
export { Breadcrumb } from './molecules/Breadcrumb';
export { RecordNavigation } from './molecules/RecordNavigation';
export { SkeletonTable, SkeletonCard, SkeletonList } from './molecules/SkeletonTable';
export { Skeleton } from './molecules/Skeleton';
export { Toast } from './molecules/Toast';
export { BackButton } from './molecules/BackButton';
// Componentes con lógica compleja (movidos desde atoms/ Ene 2026)
export { ProgressBar, LimitProgressBar } from './molecules/ProgressBar';
// Nuevos (Ene 2026) - Fase 2 mejoras UI
export { FormGroup } from './molecules/FormGroup';
// Nuevos (Ene 2026) - Optimización arquitectónica
export { SearchFilterBar } from './organisms/SearchFilterBar';
export { CheckboxGroup } from './organisms/CheckboxGroup';
export { CheckboxField } from './molecules/CheckboxField';
export { DropdownMenu } from './organisms/DropdownMenu';
export { ToggleSwitch } from './molecules/ToggleSwitch';
export { Card } from './molecules/Card';

// ========== ORGANISMS ==========
export { Modal } from './organisms/Modal';
export { Drawer } from './organisms/Drawer';
export { FormDrawer } from './organisms/FormDrawer';
export { default as IconPicker, IconPickerCompact, ICONOS_MAP, CATEGORIAS_ICONOS, IconButton } from './organisms/icon-picker';
export { MultiSelect } from './organisms/MultiSelect';
export { BarcodeScanner } from './organisms/BarcodeScanner';
export { ConfirmDialog } from './organisms/ConfirmDialog';
export { DeleteConfirmDialog } from './organisms/DeleteConfirmDialog';
export { DataTable, DataTableActions, DataTableActionButton } from './organisms/DataTable';
export { FilterPanel, FilterChips } from './organisms/FilterPanel';
export { StatCardGrid } from './organisms/StatCardGrid';
export { ExpandableCrudSection } from './organisms/ExpandableCrudSection';
export { GenericNavTabs } from './organisms/GenericNavTabs';
export { NavDropdown } from './organisms/NavDropdown';
export { SmartButtons } from './organisms/SmartButtons';
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

// Campo de filtro unificado (movido a organisms/ Ene 2026)
// NOTA: FilterSelectField, FilterDateField, FilterTextField eliminados - usar FilterField
export { FilterField } from './organisms/FilterField';

// Header unificado para overlays (Feb 2026)
export { OverlayHeader } from './molecules/OverlayHeader';

// Permisos granulares - Re-export desde features/auth para no romper imports existentes
export { ConPermiso } from '@/features/auth/components/ConPermiso';

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
export { AsyncBoundary } from './templates/AsyncBoundary';
export { PageHeader } from './templates/PageHeader';

// ========== EXTERNOS ==========
export { default as ChunkErrorBoundary } from '../common/ChunkErrorBoundary';
export { default as GlobalErrorBoundary } from '../common/GlobalErrorBoundary';

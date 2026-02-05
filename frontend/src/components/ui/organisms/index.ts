/**
 * UI Organisms
 * Componentes complejos que combinan moléculas y átomos
 */

// Componentes base
export { Modal } from './Modal';
export type { ModalProps } from './Modal';

export { Drawer } from './Drawer';
export type { DrawerProps, DrawerSize } from './Drawer';

export { ConfirmDialog } from './ConfirmDialog';
export type { ConfirmDialogProps } from './ConfirmDialog';

export { FormDrawer } from './FormDrawer';
export type { FormDrawerProps } from './FormDrawer';

export { DeleteConfirmDialog } from './DeleteConfirmDialog';
export type { DeleteConfirmDialogProps } from './DeleteConfirmDialog';

export { Pagination } from './Pagination';
export type { PaginationProps } from './Pagination';

// DataTable
export { DataTable, DataTableActions, DataTableActionButton } from './DataTable';
export type {
  DataTableProps,
  DataTableColumn,
  DataTableEmptyState,
  DataTableActionsProps,
  DataTableActionButtonProps,
  TableColumnAlign,
  TableColumnWidth,
  DataTableActionVariant,
} from './DataTable';

// Filtros
export { FilterPanel, FilterChips } from './FilterPanel';
export type { FilterPanelProps, FilterChipsProps } from './FilterPanel';

export { FilterField } from './FilterField';
export type { FilterFieldProps } from './FilterField';

export { StandardFilterGrid } from './StandardFilterGrid';
export type { StandardFilterGridProps, FilterFieldConfig, FilterGridLayout } from './StandardFilterGrid';

// Grid y stats
export { StatCardGrid } from './StatCardGrid';
export type { StatCardGridProps } from './StatCardGrid';

// CRUD y secciones
export { ExpandableCrudSection } from './ExpandableCrudSection';
export type {
  ExpandableCrudSectionProps,
  DeleteConfig,
  ItemActions,
  ListActions,
  DrawerComponentProps,
} from './ExpandableCrudSection';

// Navegación
export { GenericNavTabs } from './GenericNavTabs';
export type { GenericNavTabsProps } from './GenericNavTabs';

export { MobileNavSelector } from './MobileNavSelector';
export type { MobileNavSelectorProps, NavItem, NavGroup } from './MobileNavSelector';

export { NavDropdown } from './NavDropdown';
export type { NavDropdownProps } from './NavDropdown';

// Árbol
export { TreeView, TreeNode, useTreeExpansion } from './TreeNode';
export type {
  TreeNodeProps,
  TreeViewProps,
  TreeRenderContext,
  TreeExpandedState,
  UseTreeExpansionResult,
} from './TreeNode';

// Scanner
export { BarcodeScanner } from './BarcodeScanner';
export type { BarcodeScannerProps, BarcodeFormatPreset } from './BarcodeScanner';

// Toast
export { ToastContainer } from './ToastContainer';
export type { ToastContainerProps } from './ToastContainer';

// State nav tabs
export { StateNavTabs, TabDropdown, MobileTabSelector } from './state-nav-tabs';
export type {
  StateNavTabsProps,
  TabDropdownProps,
  MobileTabSelectorProps,
} from './state-nav-tabs';

// Filters (subdirectory)
export {
  AdvancedFilterPanel,
  SavedSearchModal,
  SavedSearchList,
  FilterSection,
  FilterCheckbox,
  FilterCheckboxInput,
  filterInputStyles,
  filterLabelStyles,
  filterCheckboxStyles,
  filterPanelContainerStyles,
  filterGridStyles,
  countActiveFilters,
  useActiveFilters,
} from './filters';
export type {
  AdvancedFilterPanelProps,
  AdvancedFilterConfig,
  SavedSearchModalProps,
  SavedSearchListProps,
  SavedSearch,
  FilterSectionProps,
  FilterConfigItem,
} from './filters';

// Selects y checkboxes
export { MultiSelect } from './MultiSelect';
export type { MultiSelectProps, MultiSelectOption } from './MultiSelect';

export { CheckboxGroup } from './CheckboxGroup';
export type { CheckboxGroupProps } from './CheckboxGroup';

// Icon picker
export { IconPicker, IconPickerCompact, ICONOS_MAP, CATEGORIAS_ICONOS, IconButton } from './icon-picker';
export type { IconPickerProps, IconPickerCompactProps, IconButtonProps } from './icon-picker';

// Botones inteligentes
export { SmartButtons } from './SmartButtons';
export type { SmartButtonsProps } from './SmartButtons';

// Theme
export { ThemeToggle } from './ThemeToggle';
export type { ThemeToggleProps } from './ThemeToggle';

// Búsqueda
export { SearchFilterBar } from './SearchFilterBar';
export type { SearchFilterBarProps } from './SearchFilterBar';

// Acciones de fila
export { StandardRowActions } from './StandardRowActions';
export type { StandardRowActionsProps, ExtraAction } from './StandardRowActions';

// Re-export tipos globales de organisms.d.ts
export type {
  ModalSize,
  ConfirmDialogVariant,
  PaginationInfo,
} from '@/types/organisms';

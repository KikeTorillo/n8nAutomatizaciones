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

// NOTA: DeleteConfirmDialog movido a molecules/ (Feb 2026) - wrapper simple sobre ConfirmDialog

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

// NOTA: StatCardGrid movido a molecules/ (Feb 2026) - grid simple de StatCard molecules

// CRUD y secciones
export { ExpandableSection } from './ExpandableSection';
export type { ExpandableSectionProps } from './ExpandableSection';

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

// NOTA: SmartButtons movido a molecules/ (Feb 2026) - grid presentacional

// Theme
export { ThemeToggle } from './ThemeToggle';
export type { ThemeToggleProps } from './ThemeToggle';

// Búsqueda
export { SearchFilterBar } from './SearchFilterBar';
export type { SearchFilterBarProps } from './SearchFilterBar';

// Acciones de fila
export { StandardRowActions } from './StandardRowActions';
export type { StandardRowActionsProps, ExtraAction } from './StandardRowActions';

// Movidos desde molecules/ (Feb 2026) - complejidad justifica clasificación organism
export { DropdownMenu } from './DropdownMenu';
export type { DropdownMenuProps } from './DropdownMenu';

export { SearchInput } from './SearchInput';
export type { SearchInputProps } from './SearchInput';

export { ViewTabs } from './ViewTabs';
export type { ViewTabsProps } from './ViewTabs';

// Re-export tipos globales de organisms.d.ts
export type {
  ModalSize,
  ConfirmDialogVariant,
  PaginationInfo,
} from '@/types/organisms';

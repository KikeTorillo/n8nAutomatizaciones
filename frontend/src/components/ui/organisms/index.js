/**
 * UI Organisms
 * Componentes complejos que combinan moléculas y átomos
 */

export { Modal } from './Modal';
export { Drawer } from './Drawer';
export { ConfirmDialog } from './ConfirmDialog';
export { Pagination } from './Pagination';
export { DataTable, DataTableActions, DataTableActionButton } from './DataTable';
export { FilterPanel } from './FilterPanel';
export { StatCardGrid } from './StatCardGrid';
export { ExpandableCrudSection } from './ExpandableCrudSection';
export { GenericNavTabs } from './GenericNavTabs';
export { TreeView, useTreeExpansion } from './TreeNode';
export { MobileNavSelector } from './MobileNavSelector';
export { BarcodeScanner } from './BarcodeScanner';
export { ToastContainer } from './ToastContainer';
export { StateNavTabs, TabDropdown, MobileTabSelector } from './state-nav-tabs';

// Filters
// NOTA: FilterChip está en molecules - importar desde '@/components/ui/molecules'
export { AdvancedFilterPanel, SavedSearchModal, SavedSearchList, FilterSection } from './filters';

// Movidos desde molecules/ (Ene 2026) - demasiado complejos para molecule
export { MultiSelect } from './MultiSelect';
export { CheckboxGroup } from './CheckboxGroup';
export { IconPicker, ICONOS_MAP, CATEGORIAS_ICONOS, IconButton } from './icon-picker';
export { SmartButtons } from './SmartButtons';
export { NavDropdown } from './NavDropdown';
export { ThemeToggle } from './ThemeToggle';
export { SearchFilterBar } from './SearchFilterBar';

// Componentes estándar (Ene 2026) - Reducen código duplicado
export { StandardRowActions } from './StandardRowActions';
export { StandardFilterGrid } from './StandardFilterGrid';

// Componente de filtro unificado (movido desde molecules/ Ene 2026)
export { FilterField } from './FilterField';

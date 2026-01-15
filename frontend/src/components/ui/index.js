/**
 * Exportaciones centralizadas de componentes UI
 *
 * Guía de uso:
 * - Componentes de entrada: Button, Input, Select, Textarea, Checkbox, MultiSelect
 * - Componentes de feedback: Modal, Drawer, ConfirmDialog, Alert, Toast, Badge
 * - Componentes de datos: StatCard, StatCardGrid, ProgressBar, Pagination
 * - Componentes de estado: EmptyState, SkeletonTable, SkeletonCard, SkeletonList, LoadingSpinner
 * - Componentes de navegación: Breadcrumb, ViewTabs, RecordNavigation, NavDropdown
 */

// Entrada
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as Select } from './Select';
export { default as Textarea } from './Textarea';
export { default as Checkbox } from './Checkbox';
export { default as MultiSelect } from './MultiSelect';
export { default as IconPicker } from './IconPicker';
export { default as SearchInput } from './SearchInput';

// Feedback
export { default as Modal } from './Modal';
export { default as Drawer } from './Drawer';
export { default as ConfirmDialog } from './ConfirmDialog';
export { default as Alert } from './Alert';
export { default as Toast } from './Toast';
export { default as Badge } from './Badge';

// Datos y métricas
export { StatCard } from './StatCard';
export { default as StatCardGrid } from './StatCardGrid';
export { ProgressBar, LimitProgressBar } from './ProgressBar';
export { default as Pagination } from './Pagination';
export { DataTable, DataTableActions, DataTableActionButton } from './DataTable';
export { FilterPanel, FilterChips } from './FilterPanel';

// Estados de carga y vacíos
export { default as EmptyState } from './EmptyState';
export { SkeletonTable, SkeletonCard, SkeletonList } from './SkeletonTable';
export { default as LoadingSpinner } from '../common/LoadingSpinner';

// Navegación
export { default as Breadcrumb } from './Breadcrumb';
export { default as ViewTabs } from './ViewTabs';
export { default as RecordNavigation } from './RecordNavigation';
export { default as NavDropdown } from './NavDropdown';
export { default as BackButton } from './BackButton';

// Utilidades
export { default as SmartButtons } from './SmartButtons';
export { default as ModuleGuard } from './ModuleGuard';
export { default as ThemeToggle } from './ThemeToggle';
export { default as ExpandableCrudSection } from './ExpandableCrudSection';

// Filters
export {
  AdvancedFilterPanel,
  FilterChip,
  FilterSection,
  FilterCheckbox,
  FilterSelect,
  SavedSearchList,
  SavedSearchModal,
} from './filters';
